import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Profile } from "@/database/models/Profile";
import { User } from "@/database/models/User";
import { getAuth } from "@/lib/better-auth/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  let profile = await Profile.findOne({ userId: session.user.id });
  if (!profile) {
    profile = await Profile.create({ userId: session.user.id });
  }
  const user = await User.findById(session.user.id);
  
  return NextResponse.json({
    ...profile.toObject(),
    role: user?.role || "user",
    professionalProfile: user?.professionalProfile || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { riskTolerance, investmentGoals, preferredSectors } = body;

    await connectToDatabase();
    let profile = await Profile.findOne({ userId: session.user.id });
    
    if (!profile) {
      profile = await Profile.create({ 
        userId: session.user.id,
        riskTolerance: riskTolerance || 'MEDIUM',
        investmentGoals: investmentGoals || 'GROWTH',
        preferredSectors: preferredSectors || [],
      });
    } else {
      if (riskTolerance) profile.riskTolerance = riskTolerance;
      if (investmentGoals) profile.investmentGoals = investmentGoals;
      if (preferredSectors) profile.preferredSectors = preferredSectors;
      await profile.save();
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
