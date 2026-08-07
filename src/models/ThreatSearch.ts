import mongoose, { Schema, type Document } from "mongoose";

export interface IThreatSearchDocument extends Document {
  userId: mongoose.Types.ObjectId;
  query: string;
  type: "ip" | "domain" | "hash" | "url" | "cve";
  results: Record<string, unknown>;
  riskScore: number;
  severity: "critical" | "high" | "medium" | "low" | "info";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ThreatSearchSchema = new Schema<IThreatSearchDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: [true, "Search query is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["ip", "domain", "hash", "url", "cve"],
      required: true,
    },
    results: {
      type: Schema.Types.Mixed,
      default: {},
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      default: "info",
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound index for user's search history
ThreatSearchSchema.index({ userId: 1, createdAt: -1 });
ThreatSearchSchema.index({ query: 1, type: 1 });

const ThreatSearch =
  mongoose.models.ThreatSearch ||
  mongoose.model<IThreatSearchDocument>("ThreatSearch", ThreatSearchSchema);

export default ThreatSearch;
