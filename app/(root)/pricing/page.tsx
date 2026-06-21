'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Check, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { PLAN_DEFINITIONS, type PlanKey } from "@/lib/plans";

const studentPlans: PlanKey[] = ["beginner", "student-pro"];
const professionalPlans: PlanKey[] = ["professional-starter", "professional-premium"];

export default function PricingPage() {
  const router = useRouter();
  const [purchasing, setPurchasing] = useState<PlanKey | null>(null);

  const purchasePlan = async (planKey: PlanKey) => {
    setPurchasing(planKey);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate subscription");

      const plan = PLAN_DEFINITIONS[planKey];
      alert(`${plan.name} activated successfully.`);
      router.push(planKey === "student-pro" ? "/mentor-marketplace" : plan.type === "professional" ? "/profile" : "/");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setPurchasing(null);
    }
  };

  const renderPlan = (planKey: PlanKey) => {
    const plan = PLAN_DEFINITIONS[planKey];
    const highlighted = planKey === "student-pro" || planKey === "professional-premium";

    return (
      <div
        key={plan.key}
        style={{
          position: "relative",
          background: highlighted ? "#10130F" : "#0B0D10",
          border: highlighted ? "1px solid rgba(253,212,88,0.55)" : "1px solid #1E2229",
          borderRadius: 8,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {highlighted && (
          <span style={{ position: "absolute", top: 14, right: 14, color: "#FDD458" }}>
            <Sparkles size={18} />
          </span>
        )}
        <div>
          <h3 style={{ color: "#f5f5f5", fontSize: 20, fontWeight: 800 }}>{plan.name}</h3>
          <p style={{ color: "#9095A1", fontSize: 13, marginTop: 6, textTransform: "capitalize" }}>
            {plan.type} plan
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ color: "#f5f5f5", fontSize: 36, fontWeight: 900 }}>
            {plan.amount === 0 ? "Free" : `Rs. ${plan.amount}`}
          </span>
          {plan.amount > 0 && <span style={{ color: "#9095A1", fontSize: 13 }}>/ MVP</span>}
        </div>

        <ul style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
          {plan.features.map((feature) => (
            <li key={feature} style={{ display: "flex", gap: 9, alignItems: "center", color: "#CCDADC", fontSize: 14 }}>
              <Check size={16} style={{ color: "#0FEDBE", flex: "0 0 auto" }} />
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={() => purchasePlan(plan.key)}
          disabled={purchasing !== null}
          style={{
            width: "100%",
            minHeight: 42,
            borderRadius: 8,
            border: highlighted ? "none" : "1px solid #30333A",
            background: highlighted ? "#FDD458" : "#040507",
            color: highlighted ? "#0A0A0A" : "#CCDADC",
            fontWeight: 800,
            cursor: purchasing ? "not-allowed" : "pointer",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          {purchasing === plan.key ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
          Purchase Plan
        </button>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div style={{ marginBottom: 28 }}>
        <h1 className="profile-header-title">FinNext Plans</h1>
        <p style={{ color: "#9095A1", fontSize: 14, marginTop: 6 }}>
          MVP checkout activates subscriptions instantly. No payment gateway is used.
        </p>
      </div>

      <section style={{ marginBottom: 34 }}>
        <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <GraduationCap size={19} style={{ color: "#FDD458" }} /> Beginner Plans
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {studentPlans.map(renderPlan)}
        </div>
      </section>

      <section>
        <h2 style={{ color: "#f5f5f5", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <BriefcaseBusiness size={19} style={{ color: "#0FEDBE" }} /> Professional Plans
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {professionalPlans.map(renderPlan)}
        </div>
      </section>
    </div>
  );
}
