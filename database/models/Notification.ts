import { Schema, model, models, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: string;
  type: "new_request" | "accepted_request" | "rejected_request" | "general";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["new_request", "accepted_request", "rejected_request", "general"],
      default: "general",
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { collection: "notifications", timestamps: true }
);

export const Notification =
  models.Notification || model<INotification>("Notification", NotificationSchema);
