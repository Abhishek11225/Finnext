import { Schema, model, models, Document } from "mongoose";

export interface IMentorshipRequest extends Document {
  studentId: string;
  professionalId: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  demoSessionLink?: string;
  completedAt?: Date;
  growwCouponCode?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
  {
    studentId: { type: String, required: true, index: true },
    professionalId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    demoSessionLink: { type: String },
    completedAt: { type: Date },
    growwCouponCode: { type: String },
    feedbackRating: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String },
    feedbackSubmittedAt: { type: Date },
  },
  { collection: "mentorship_requests", timestamps: true }
);

// Ensure a student can only have one active request per professional
MentorshipRequestSchema.index({ studentId: 1, professionalId: 1 }, { unique: true });

export const MentorshipRequest =
  models.MentorshipRequest || model<IMentorshipRequest>("MentorshipRequest", MentorshipRequestSchema);
