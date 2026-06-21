import mongoose, { Schema, Document } from "mongoose";

export interface IProfessionalProfile {
  experience?: number;
  tradingStyle?: "Intraday" | "Swing" | "Long Term";
  brokerName?: string;
  portfolioUrl?: string;
  portfolioValue?: number;
  bio?: string;
  verificationStatus: "pending" | "approved" | "rejected";
  rating: number;
  studentsCount: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  role: "user" | "professional";
  professionalProfile?: IProfessionalProfile;
  createdAt: Date;
  updatedAt: Date;
}

const ProfessionalProfileSchema = new Schema<IProfessionalProfile>({
  experience: { type: Number },
  tradingStyle: { type: String, enum: ["Intraday", "Swing", "Long Term"] },
  brokerName: { type: String },
  portfolioUrl: { type: String },
  portfolioValue: { type: Number },
  bio: { type: String },
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rating: { type: Number, default: 5.0 },
  studentsCount: { type: Number, default: 0 },
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "professional"], default: "user" },
    professionalProfile: { type: ProfessionalProfileSchema, default: null },
  },
  { collection: "user", timestamps: true } // Points to Better Auth's "user" collection
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
