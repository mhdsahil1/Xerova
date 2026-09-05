// ============================================
// XEROVA — Gemini AI Client
// ============================================
// Uses the Gemini REST API directly (no SDK dependency).
// Provides cybersecurity-focused AI chat for the assistant.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are XEROVA AI — a senior cybersecurity analyst assistant embedded in a threat intelligence platform called XEROVA.

Your capabilities:
- Analyze indicators of compromise (IOCs): IP addresses, domains, URLs, file hashes, CVEs
- Explain threat intelligence findings in plain language
- Provide remediation and mitigation guidance
- Help write incident response playbooks
- Identify attack patterns, TTPs, and threat actor behaviors
- Summarize security reports and advisories

Guidelines:
- Be precise and actionable — analysts depend on your accuracy
- When analyzing IOCs, mention what each indicator tells you about the threat
- Use MITRE ATT&CK framework references when relevant
- Flag critical findings prominently
- If you detect IOCs in user messages (IPs, domains, hashes, CVEs), call them out and suggest analysis
- Keep responses focused and professional — avoid unnecessary verbosity
- Use markdown formatting for readability (headers, bullet points, code blocks)
- If uncertain, say so clearly rather than guessing`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Send a chat conversation to Gemini and get a response.
 */
export async function geminiChat(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "⚠️ Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables to enable AI-powered analysis.";
  }

  // Build the conversation contents for Gemini
  const contents: GeminiContent[] = [];

  // Add system context as the first user message if this is a new conversation
  const systemContext = context
    ? `${SYSTEM_PROMPT}\n\nCurrent context from the platform:\n${context}`
    : SYSTEM_PROMPT;

  // Gemini uses "user" and "model" roles
  // System prompt goes as the first user turn, with a model acknowledgment
  contents.push({
    role: "user",
    parts: [{ text: systemContext }],
  });
  contents.push({
    role: "model",
    parts: [
      {
        text: "Understood. I'm XEROVA AI, ready to assist with cybersecurity analysis and threat intelligence. How can I help?",
      },
    ],
  });

  // Add conversation history
  for (const msg of messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error(`[Gemini] API error ${res.status}:`, errText);
      return `⚠️ AI service returned an error (${res.status}). Please try again in a moment.`;
    }

    const json = await res.json();
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't generate a response. Please try rephrasing your question.";

    return text;
  } catch (e) {
    const error = e as Error;
    if (error.name === "AbortError") {
      console.error("[Gemini] Request timed out");
      return "⚠️ The AI request timed out. Please try again with a simpler query.";
    }
    console.error("[Gemini] Chat failed:", error.message);
    return "⚠️ Failed to connect to AI service. Please check your connection and try again.";
  }
}
