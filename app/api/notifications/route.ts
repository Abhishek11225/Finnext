import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Notification } from "@/database/models/Notification";
import { getAuth } from "@/lib/better-auth/auth";
import { emitToUser } from "@/lib/socket-server";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const notifications = await Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { notificationId, all } = body;

    await connectToDatabase();

    if (all) {
      // Mark all as read for the recipient
      await Notification.updateMany({ recipientId: session.user.id, isRead: false }, { isRead: true });
      emitToUser(session.user.id, "notification:read", { all: true });
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await Notification.findOne({ _id: notificationId, recipientId: session.user.id });
      if (notification) {
        notification.isRead = true;
        await notification.save();
        emitToUser(session.user.id, "notification:read", { notificationId });
      }
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update notification status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
