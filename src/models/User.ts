import mongoose, { Schema, type Document } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: "credentials" | "google";
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

// Index for faster lookups
UserSchema.index({ email: 1 });

const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
