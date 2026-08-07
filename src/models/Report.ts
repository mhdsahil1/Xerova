import mongoose, { Schema, type Document } from "mongoose";

export interface IReportDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: "investigation" | "threat_analysis" | "incident";
  summary: string;
  findings: {
    title: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    evidence: string;
  }[];
  iocs: {
    type: "ip" | "domain" | "hash" | "url" | "email" | "cve";
    value: string;
    context: string;
  }[];
  riskScore: number;
  relatedSearches: mongoose.Types.ObjectId[];
  relatedConversations: mongoose.Types.ObjectId[];
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      default: "info",
    },
    evidence: { type: String, default: "" },
  },
  { _id: false }
);

const IOCSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["ip", "domain", "hash", "url", "email", "cve"],
      required: true,
    },
    value: { type: String, required: true },
    context: { type: String, default: "" },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReportDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: ["investigation", "threat_analysis", "incident"],
      default: "investigation",
    },
    summary: {
      type: String,
      default: "",
    },
    findings: [FindingSchema],
    iocs: [IOCSchema],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    relatedSearches: [
      {
        type: Schema.Types.ObjectId,
        ref: "ThreatSearch",
      },
    ],
    relatedConversations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ userId: 1, createdAt: -1 });
ReportSchema.index({ status: 1 });

const Report =
  mongoose.models.Report ||
  mongoose.model<IReportDocument>("Report", ReportSchema);

export default Report;
