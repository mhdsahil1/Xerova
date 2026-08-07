import mongoose, { Schema, type Document } from "mongoose";

export interface IConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }[];
  relatedThreats: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
      trim: true,
      maxlength: 200,
    },
    messages: [MessageSchema],
    relatedThreats: [
      {
        type: Schema.Types.ObjectId,
        ref: "ThreatSearch",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>("Conversation", ConversationSchema);

export default Conversation;
