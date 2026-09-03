// ============================================
// XEROVA — Unified AI Assistant Orchestrator
// ============================================
// Default: Groq AI (Llama 3.3 70B Versatile) for ultra-fast, high-accuracy reasoning.
// Fallback: Google Gemini (gemini-2.5-flash).
// Ensures zero-downtime cybersecurity analyst chat.

import { groqChat, isGroqConfigured } from "./groq";
import { geminiChat } from "./gemini";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantOptions {
  context?: string;
  forceProvider?: "groq" | "gemini";
}

/**
 * Generate AI assistant reply with Groq as default and Gemini as fallback.
 */
export async function generateAssistantReply(
  messages: AssistantMessage[],
  context?: string,
  options?: { forceProvider?: "groq" | "gemini" }
): Promise<{ text: string; provider: "groq" | "gemini" | "none" }> {
  const forceProvider = options?.forceProvider;

  // 1. If Groq is forced or available by default
  if (forceProvider !== "gemini" && isGroqConfigured()) {
    try {
      const response = await groqChat(messages, context);
      return { text: response, provider: "groq" };
    } catch (groqError) {
      console.warn(
        "[AI Assistant] Groq request failed, falling back to Gemini:",
        (groqError as Error)?.message
      );
      // Fall through to Gemini fallback
    }
  }

  // 2. Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await geminiChat(messages, context);
      return { text: response, provider: "gemini" };
    } catch (geminiError) {
      console.error(
        "[AI Assistant] Gemini fallback also failed:",
        (geminiError as Error)?.message
      );
    }
  }

  // 3. Neither provider succeeded or both are unconfigured
  if (!isGroqConfigured() && !process.env.GEMINI_API_KEY) {
    return {
      text: "⚠️ No AI API key is configured. Please add GROQ_API_KEY (or GEMINI_API_KEY) to your environment variables to enable AI-powered analysis.",
      provider: "none",
    };
  }

  return {
    text: "⚠️ The AI service encountered a temporary error. Please try again in a few moments.",
    provider: "none",
  };
}
