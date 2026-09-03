// ============================================
// XEROVA — Groq AI Client
// ============================================
// Uses the Groq REST API (OpenAI-compatible) directly.
// Ultra-fast LLM inference using Groq LPU technology.
// Provides cybersecurity-focused AI chat for the assistant.

const getGroqApiKey = () => process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
].filter(Boolean) as string[];

export const SYSTEM_PROMPT = `You are XEROVA AI — a senior cybersecurity analyst assistant embedded in a threat intelligence platform called XEROVA.

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

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey().trim());
}

/**
 * Send a chat conversation to Groq and get a response.
 * Tries candidate models in order if a specific model ID is retired or not enabled.
 */
export async function groqChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  context?: string
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const systemContext = context
    ? `${SYSTEM_PROMPT}\n\nCurrent context from the platform:\n${context}`
    : SYSTEM_PROMPT;

  const payloadMessages: ChatMessage[] = [
    { role: "system", content: systemContext },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature: 0.6,
          max_completion_tokens: 2048,
          top_p: 0.95,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        // If model not found or forbidden, try next candidate model
        if (res.status === 404 || res.status === 400 && errText.includes("model")) {
          console.warn(`[Groq] Model ${model} not available (${res.status}), trying next candidate...`);
          lastError = new Error(`Groq model ${model} unavailable: ${errText}`);
          continue;
        }
        throw new Error(`Groq API returned HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;

      if (!text || typeof text !== "string") {
        throw new Error("Empty or invalid response structure returned from Groq.");
      }

      return text.trim();
    } catch (e) {
      clearTimeout(timer);
      const error = e as Error;
      if (error.name === "AbortError") {
        console.error(`[Groq] Request timed out after 30s for model ${model}`);
        lastError = new Error("Groq request timed out after 30s");
        continue;
      }
      lastError = error;
      // If it's a network error or other non-model error, continue or throw
      if (!error.message.includes("unavailable")) {
        throw error;
      }
    }
  }

  throw lastError || new Error("All candidate Groq models failed.");
}
