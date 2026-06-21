import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Subscription } from "@/database/models/Subscription";
import { getAuth } from "@/lib/better-auth/auth";
import { isPlanKey, PLAN_DEFINITIONS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const planType = url.searchParams.get("planType");

    await connectToDatabase();
    const query: Record<string, string> = { userId: session.user.id, status: "active" };
    if (planType === "student" || planType === "professional") {
      query.planType = planType;
    }

    const subscriptions = await Subscription.find(query).sort({ createdAt: -1 });
    const subscription = subscriptions[0] || null;

    return NextResponse.json({
      active: !!subscription,
      subscription,
      subscriptions,
    });
  } catch (error: any) {
    console.error("Failed to fetch subscription status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planKey } = body;
    if (!isPlanKey(planKey)) {
      return NextResponse.json({ error: "A valid planKey is required" }, { status: 400 });
    }

    const plan = PLAN_DEFINITIONS[planKey];

    await connectToDatabase();

    await Subscription.updateMany(
      { userId: session.user.id, planType: plan.type, status: "active" },
      { status: "cancelled" }
    );

    const subscription = await Subscription.create({
      userId: session.user.id,
      plan: plan.name,
      planKey: plan.key,
      planType: plan.type,
      amount: plan.amount,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully.",
      subscription,
    });
  } catch (error: any) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
