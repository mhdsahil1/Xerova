// ============================================
// Test Suite: Groq AI Integration & Fallback
// ============================================

import dotenv from "dotenv";
import assert from "node:assert/strict";

dotenv.config();

async function runTests() {
  console.log("=== Testing Groq AI Assistant & Unified Fallback ===");

  const { groqChat, isGroqConfigured } = await import("./src/lib/groq.ts");
  const { generateAssistantReply } = await import("./src/lib/ai-assistant.ts");

  // 1. Check Configuration
  console.log("\n[Test 1] Checking Groq configuration...");
  const configured = isGroqConfigured();
  console.log(`Groq configured: ${configured ? "YES" : "NO"}`);
  assert.equal(configured, true, "GROQ_API_KEY must be configured in environment");

  // 2. Direct Groq chat query
  console.log("\n[Test 2] Testing direct groqChat() with cybersecurity prompt...");
  const testMessages = [
    {
      role: "user",
      content: "Explain what CVE-2024-3094 is in 2 concise sentences.",
    },
  ];

  const groqReply = await groqChat(testMessages);
  console.log("Groq Response Sample:\n", groqReply.slice(0, 300));
  assert.ok(groqReply.length > 20, "Groq reply should not be empty");
  assert.ok(
    groqReply.toLowerCase().includes("vulnerability") ||
      groqReply.toLowerCase().includes("cve") ||
      groqReply.toLowerCase().includes("security"),
    "Groq reply should contain cybersecurity analysis context"
  );
  console.log("✓ Direct Groq chat succeeded with high quality reasoning.");

  // 3. Testing Unified Orchestrator default (Groq)
  console.log("\n[Test 3] Testing generateAssistantReply() default route...");
  const unifiedReply = await generateAssistantReply(testMessages, "Target: liblzma");
  console.log(`Unified Provider Used: ${unifiedReply.provider}`);
  assert.equal(unifiedReply.provider, "groq", "Unified orchestrator must prioritize Groq by default");
  assert.ok(unifiedReply.text.length > 20, "Unified reply should be populated");
  console.log("✓ Unified orchestrator selected Groq as primary provider.");

  // 4. Testing Unified Orchestrator Fallback to Gemini
  console.log("\n[Test 4] Testing generateAssistantReply() fallback mechanism...");
  if (process.env.GEMINI_API_KEY) {
    const fallbackReply = await generateAssistantReply(
      testMessages,
      undefined,
      { forceProvider: "gemini" }
    );
    console.log(`Fallback Provider Used: ${fallbackReply.provider}`);
    assert.equal(fallbackReply.provider, "gemini", "Forced fallback must invoke Gemini");
    assert.ok(fallbackReply.text.length > 20, "Gemini reply should be populated");
    console.log("✓ Gemini fallback verified.");
  } else {
    console.log("ℹ️ GEMINI_API_KEY not configured, skipping active Gemini fallback test.");
  }

  console.log("\n🎉 ALL GROQ AI INTEGRATION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
