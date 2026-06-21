import { Schema, model, models, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  plan: string;
  planKey: string;
  planType: "student" | "professional";
  amount: number;
  status: "active" | "cancelled" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true, index: true },
    plan: { type: String, required: true },
    planKey: { type: String, required: true, index: true },
    planType: { type: String, enum: ["student", "professional"], required: true, index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "cancelled", "pending"],
      default: "pending",
    },
  },
  { collection: "subscriptions", timestamps: true }
);

export const Subscription =
  models.Subscription || model<ISubscription>("Subscription", SubscriptionSchema);
