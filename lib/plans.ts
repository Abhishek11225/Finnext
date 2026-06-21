export type PlanType = "student" | "professional";

export type PlanKey =
  | "beginner"
  | "student-pro"
  | "professional-starter"
  | "professional-premium";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  type: PlanType;
  amount: number;
  features: string[];
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  beginner: {
    key: "beginner",
    name: "Beginner Plan",
    type: "student",
    amount: 0,
    features: ["Academy", "AI Assistant", "Watchlist", "Sandbox"],
  },
  "student-pro": {
    key: "student-pro",
    name: "Beginner Pro Plan",
    type: "student",
    amount: 499,
    features: ["Academy", "AI Assistant", "Watchlist", "Sandbox", "Learn With Professionals"],
  },
  "professional-starter": {
    key: "professional-starter",
    name: "Professional Starter",
    type: "professional",
    amount: 0,
    features: ["Professional Profile", "Marketplace Listing", "Beginner Requests"],
  },
  "professional-premium": {
    key: "professional-premium",
    name: "Professional Premium",
    type: "professional",
    amount: 999,
    features: [
      "Professional Profile",
      "Marketplace Listing",
      "Beginner Requests",
      "Featured Placement",
      "Analytics",
      "Earnings Dashboard",
    ],
  },
};

export const isPlanKey = (value: unknown): value is PlanKey =>
  typeof value === "string" && value in PLAN_DEFINITIONS;
