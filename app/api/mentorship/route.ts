import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/User";
import { MentorshipRequest } from "@/database/models/MentorshipRequest";
import { Notification } from "@/database/models/Notification";
import { Subscription } from "@/database/models/Subscription";
import { getAuth } from "@/lib/better-auth/auth";
import { emitToUser } from "@/lib/socket-server";

const createDemoMeetLink = (requestId: string) => {
  const compactId = requestId.replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(10, "x");
  return `https://meet.google.com/${compactId.slice(0, 3)}-${compactId.slice(3, 7)}-${compactId.slice(7, 10)}`;
};

const createGrowwCouponCode = (requestId: string) => {
  const compactId = requestId.replace(/[^a-z0-9]/gi, "").toUpperCase().padEnd(8, "X");
  return `GROWW-${compactId.slice(-8)}`;
};

// GET requests: Students can check their requests, professionals can check incoming requests
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const url = new URL(req.url);
    const roleParam = url.searchParams.get("role"); // 'student' or 'professional'

    let requests;
    if (roleParam === "professional") {
      const professionalUser = await User.findById(session.user.id).select("role professionalProfile");
      if (
        professionalUser?.role !== "professional" ||
        professionalUser.professionalProfile?.verificationStatus !== "approved"
      ) {
        return NextResponse.json({ error: "Professional access required" }, { status: 403 });
      }

      requests = await MentorshipRequest.find({ professionalId: session.user.id })
        .populate({ path: "studentId", select: "name email", model: User })
        .sort({ createdAt: -1 });
    } else {
      requests = await MentorshipRequest.find({ studentId: session.user.id })
        .populate({ path: "professionalId", select: "name email professionalProfile", model: User })
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Failed to fetch mentorship requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST requests: Student requests mentorship from a professional
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { professionalId } = body;
    if (!professionalId) return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });

    await connectToDatabase();

    const currentUser = await User.findById(session.user.id).select("role");
    if (currentUser?.role === "professional") {
      return NextResponse.json({ error: "Professional accounts cannot request mentorship" }, { status: 403 });
    }

    const studentProSubscription = await Subscription.findOne({
      userId: session.user.id,
      planType: "student",
      planKey: "student-pro",
      status: "active",
    });

    if (!studentProSubscription) {
      return NextResponse.json({ error: "Beginner Pro Plan is required to request mentorship" }, { status: 402 });
    }

    // Check if professional exists and is approved
    const professional = await User.findOne({
      _id: professionalId,
      role: "professional",
      "professionalProfile.verificationStatus": "approved",
    });

    if (!professional) {
      return NextResponse.json({ error: "Professional trader not found or not approved" }, { status: 404 });
    }

    // Prevent requesting yourself
    if (session.user.id === professionalId) {
      return NextResponse.json({ error: "You cannot request mentorship from yourself" }, { status: 400 });
    }

    // Check for existing request
    const existing = await MentorshipRequest.findOne({
      studentId: session.user.id,
      professionalId,
    });

    if (existing) {
      return NextResponse.json({ error: "Request already exists for this professional" }, { status: 400 });
    }

    const request = await MentorshipRequest.create({
      studentId: session.user.id,
      professionalId,
      status: "pending",
    });

    // Create a Notification for the professional
    const notification = await Notification.create({
      recipientId: professionalId,
      type: "new_request",
      title: "New Mentorship Request",
      message: "New beginner mentorship request received.",
    });

    emitToUser(professionalId, "notification:new", notification);
    emitToUser(professionalId, "mentorship:created", request);

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("Failed to create mentorship request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT requests: Professionals manage requests; beginners submit feedback after completion.
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { requestId, action, feedbackRating, feedbackComment } = body;
    if (!requestId || !action || !["accept", "reject", "complete", "feedback"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await connectToDatabase();

    const request = await MentorshipRequest.findById(requestId);
    if (!request) return NextResponse.json({ error: "Mentorship request not found" }, { status: 404 });

    if (action === "feedback") {
      if (request.studentId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized feedback access" }, { status: 403 });
      }
      if (request.status !== "completed") {
        return NextResponse.json({ error: "Feedback is available after the session is completed" }, { status: 400 });
      }
      if (request.feedbackSubmittedAt) {
        return NextResponse.json({ error: "Feedback already submitted" }, { status: 400 });
      }

      const rating = Number(feedbackRating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Feedback rating must be between 1 and 5" }, { status: 400 });
      }

      request.feedbackRating = rating;
      request.feedbackComment = typeof feedbackComment === "string" ? feedbackComment.slice(0, 500) : "";
      request.feedbackSubmittedAt = new Date();
      await request.save();

      const notification = await Notification.create({
        recipientId: request.professionalId,
        type: "general",
        title: "Session Feedback Received",
        message: "A beginner submitted feedback for your completed demo session.",
      });

      emitToUser(request.professionalId, "notification:new", notification);
      emitToUser(request.professionalId, "mentorship:feedback", request);
      emitToUser(request.studentId, "mentorship:feedback", request);

      return NextResponse.json({ success: true, request });
    }

    if (request.professionalId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to request" }, { status: 403 });
    }

    if (action === "complete") {
      if (request.status !== "accepted") {
        return NextResponse.json({ error: "Only accepted sessions can be marked complete" }, { status: 400 });
      }

      request.status = "completed";
      request.completedAt = new Date();
      request.growwCouponCode = createGrowwCouponCode(request._id.toString());
      await request.save();

      const studentNotification = await Notification.create({
        recipientId: request.studentId,
        type: "general",
        title: "Demo Session Completed",
        message: "Your professional marked the demo session complete. Feedback is now available.",
      });

      const professionalNotification = await Notification.create({
        recipientId: session.user.id,
        type: "general",
        title: "Groww Coupon Generated",
        message: `Demo session completed. Coupon generated: ${request.growwCouponCode}`,
        isRead: true,
      });

      emitToUser(request.studentId, "notification:new", studentNotification);
      emitToUser(request.studentId, "mentorship:completed", request);
      emitToUser(session.user.id, "notification:new", professionalNotification);
      emitToUser(session.user.id, "mentorship:completed", request);

      return NextResponse.json({ success: true, request });
    }

    const statusValue = action === "accept" ? "accepted" : "rejected";
    request.status = statusValue;
    if (action === "accept") {
      request.demoSessionLink = createDemoMeetLink(request._id.toString());
    }
    await request.save();

    // Create a Notification for the student
    const studentNotification = await Notification.create({
      recipientId: request.studentId,
      type: action === "accept" ? "accepted_request" : "rejected_request",
      title: `Mentorship Request ${action === "accept" ? "Accepted" : "Rejected"}`,
      message:
        action === "accept"
          ? `${session.user.name || "A Professional Trader"} accepted your mentorship request. A demo session link is ready.`
          : `${session.user.name || "A Professional Trader"} rejected your mentorship request.`,
    });

    const professionalNotification = await Notification.create({
      recipientId: session.user.id,
      type: action === "accept" ? "accepted_request" : "rejected_request",
      title: `Beginner Request ${action === "accept" ? "Accepted" : "Rejected"}`,
      message: `You ${statusValue} a beginner mentorship request.`,
      isRead: true,
    });

    // If accepted, increment students count for the professional
    if (action === "accept") {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { "professionalProfile.studentsCount": 1 },
      });
    }

    emitToUser(request.studentId, "notification:new", studentNotification);
    emitToUser(request.studentId, `mentorship:${statusValue}`, request);
    emitToUser(session.user.id, "notification:new", professionalNotification);
    emitToUser(session.user.id, `mentorship:${statusValue}`, request);

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("Failed to update mentorship request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
