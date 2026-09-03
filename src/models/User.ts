import mongoose, { Schema, type Document } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: "credentials" | "google";
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  role: "analyst" | "admin";
  apiKeys?: {
    virusTotal?: string;
    shodan?: string;
    abuseIPDB?: string;
  };
  preferences: {
    theme: "dark" | "light" | "system";
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    image: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ["analyst", "admin"],
      default: "analyst",
    },
    apiKeys: {
      virusTotal: { type: String, default: "" },
      shodan: { type: String, default: "" },
      abuseIPDB: { type: String, default: "" },
    },
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light", "system"],
        default: "dark",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for verification token lookup
UserSchema.index({ emailVerificationToken: 1, emailVerificationExpires: 1 });

const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
