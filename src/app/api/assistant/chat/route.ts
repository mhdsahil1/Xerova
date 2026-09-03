// ============================================
// XEROVA — AI Assistant Chat API Route
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateAssistantReply } from "@/lib/ai-assistant";
import { connectDB } from "@/lib/db";
import Conversation from "@/models/Conversation";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — 20 messages per minute
    const rl = checkRateLimit(`chat:${session.user.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before sending more messages.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { messages, context, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Validate message format
    const validMessages = messages
      .filter(
        (m: { role?: string; content?: string }) =>
          m &&
          typeof m.content === "string" &&
          m.content.trim().length > 0 &&
          (m.role === "user" || m.role === "assistant")
      )
      .slice(-20) // Keep last 20 messages for context window
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 4000), // Cap individual message length
      }));

    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages provided" },
        { status: 400 }
      );
    }

    // Build context string from threat data if provided
    let contextStr: string | undefined;
    if (context && typeof context === "object") {
      const parts: string[] = [];
      if (context.threatData) {
        parts.push(
          `Active threat investigation data:\n${JSON.stringify(context.threatData, null, 2).slice(0, 2000)}`
        );
      }
      if (context.currentPage) {
        parts.push(`User is currently on: ${context.currentPage}`);
      }
      if (parts.length > 0) {
        contextStr = parts.join("\n\n");
      }
    }

    // Call AI Assistant (Groq default -> Gemini fallback)
    const { text: response, provider } = await generateAssistantReply(
      validMessages,
      contextStr
    );

    // Store conversation in DB (fire-and-forget)
    const userId = session.user.id;
    const lastUserMessage = validMessages[validMessages.length - 1];

    connectDB()
      .then(async () => {
        if (conversationId) {
          // Append to existing conversation
          await Conversation.findOneAndUpdate(
            { _id: conversationId, userId },
            {
              $push: {
                messages: {
                  $each: [
                    {
                      id: `msg-${Date.now()}`,
                      role: lastUserMessage.role,
                      content: lastUserMessage.content,
                      timestamp: new Date(),
                    },
                    {
                      id: `msg-${Date.now() + 1}`,
                      role: "assistant",
                      content: response,
                      timestamp: new Date(),
                    },
                  ],
                },
              },
              $set: { updatedAt: new Date() },
            }
          );
        } else {
          // Create new conversation
          const title =
            lastUserMessage.content.slice(0, 60) +
            (lastUserMessage.content.length > 60 ? "..." : "");
          const conv = await Conversation.create({
            userId,
            title,
            messages: [
              {
                id: `msg-${Date.now()}`,
                role: lastUserMessage.role,
                content: lastUserMessage.content,
                timestamp: new Date(),
              },
              {
                id: `msg-${Date.now() + 1}`,
                role: "assistant",
                content: response,
                timestamp: new Date(),
              },
            ],
          });
          // Return the conversation ID so the client can continue the conversation
          return conv._id;
        }
      })
      .catch((e) => console.error("Failed to store conversation:", e));

    return NextResponse.json({
      response,
      provider,
      conversationId: conversationId || undefined,
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[Assistant Chat Error]:", msg);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
