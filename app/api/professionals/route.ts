import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/User";
import { getAuth } from "@/lib/better-auth/auth";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Find all users with role 'professional' and approved status
    const professionals = await User.find({
      role: "professional",
      "professionalProfile.verificationStatus": "approved",
    }).select("name email professionalProfile");

    return NextResponse.json(professionals);
  } catch (error: any) {
    console.error("Failed to fetch professionals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { experience, tradingStyle, brokerName, portfolioUrl, portfolioValue, bio } = body;

    // Basic Validation
    if (!experience || !tradingStyle || !brokerName || !portfolioValue || !bio) {
      return NextResponse.json({ error: "Missing required onboarding fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Professionals are auto-approved for the MVP/hackathon flow.
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        role: "professional",
        professionalProfile: {
          experience: Number(experience),
          tradingStyle,
          brokerName,
          portfolioUrl: portfolioUrl || "",
          portfolioValue: Number(portfolioValue),
          bio,
          verificationStatus: "approved",
          rating: 5.0,
          studentsCount: 0,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Professional onboarding completed. Your profile is approved and active.",
      user: {
        role: updatedUser.role,
        professionalProfile: updatedUser.professionalProfile,
      },
    });
  } catch (error: any) {
    console.error("Failed professional onboarding:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
