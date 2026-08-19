import dotenv from "dotenv";
dotenv.config();

async function verifyAll() {
  console.log("=== STARTING FULL INTEGRATION VERIFICATION ===");

  const {
    mergedIPLookup,
    mergedDomainLookup,
    mergedURLLookup,
    mergedHashLookup,
    otxGetLivePulses,
  } = await import("./src/lib/threat-apis.ts");

  const { geminiChat } = await import("./src/lib/gemini.ts");

  // 1. Verify IP Lookup
  console.log("\n1. Testing mergedIPLookup('8.8.8.8')...");
  try {
    const ipRes = await mergedIPLookup("8.8.8.8");
    console.log("IP Result Sources:", ipRes.sources);
    console.log("IP Country:", ipRes.country);
    console.log("IP OTX Attached:", !!ipRes.otx);
    console.log("IP Threat Count:", ipRes.threats.length);
  } catch (e) {
    console.error("IP lookup error:", e);
  }

  // 2. Verify Domain Lookup
  console.log("\n2. Testing mergedDomainLookup('google.com')...");
  try {
    const domainRes = await mergedDomainLookup("google.com");
    console.log("Domain Result Sources:", domainRes.sources);
    console.log("Domain alphaMountain Attached:", !!domainRes.alphaMountain);
    console.log("Domain OTX Attached:", !!domainRes.otx);
    console.log("Domain URLQuery Attached:", !!domainRes.urlquery);
  } catch (e) {
    console.error("Domain lookup error:", e);
  }

  // 3. Verify Hash Lookup
  console.log("\n3. Testing mergedHashLookup('44d88612fea8a8f36de82e1278abb02f')...");
  try {
    const hashRes = await mergedHashLookup("44d88612fea8a8f36de82e1278abb02f");
    console.log("Hash Sources:", hashRes.sources);
    console.log("Hash Risk Score:", hashRes.riskScore);
    console.log("Hash Tags Count:", hashRes.tags?.length);
  } catch (e) {
    console.error("Hash lookup error:", e);
  }

  // 4. Verify Live Threat Pulses
  console.log("\n4. Testing otxGetLivePulses(5)...");
  try {
    const pulses = await otxGetLivePulses(5);
    console.log("Pulses retrieved count:", pulses.length);
    if (pulses.length > 0) {
      console.log("Sample Pulse:", {
        id: pulses[0].id,
        name: pulses[0].name,
        author: pulses[0].author,
        tags: pulses[0].tags,
      });
    }
  } catch (e) {
    console.error("Pulses error:", e);
  }

  // 5. Verify URL Analysis
  console.log("\n5. Testing mergedURLLookup('https://google.com')...");
  try {
    const urlRes = await mergedURLLookup("https://google.com");
    console.log("URL Verdict:", urlRes.verdict);
    console.log("URL Risk Score:", urlRes.riskScore);
    console.log("URL Sources:", urlRes.sources);
  } catch (e) {
    console.error("URL analysis error:", e);
  }

  // 6. Verify Gemini AI Assistant
  console.log("\n6. Testing Gemini AI Assistant...");
  try {
    const aiResp = await geminiChat([
      { role: "user", content: "Briefly explain what an IOC is in one sentence." },
    ]);
    console.log("Gemini Response:", aiResp.slice(0, 150));
  } catch (e) {
    console.error("Gemini error:", e);
  }

  console.log("\n=== INTEGRATION VERIFICATION COMPLETE ===");
}

verifyAll();
