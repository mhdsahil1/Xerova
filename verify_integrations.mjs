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
    ip2LocationLookup,
    ip2WhoisLookup,
    ip2WhoisHostedDomains,
  } = await import("./src/lib/threat-apis.ts");

  const { geminiChat } = await import("./src/lib/gemini.ts");

  // 1. Verify Direct IP2Location Lookup
  console.log("\n1. Testing ip2LocationLookup('161.248.22.174')...");
  try {
    const locRes = await ip2LocationLookup("161.248.22.174");
    console.log("IP2Location Data:", {
      ip: locRes?.ip,
      country: locRes?.countryName,
      region: locRes?.regionName,
      city: locRes?.cityName,
      coords: `${locRes?.latitude}, ${locRes?.longitude}`,
      asn: locRes?.asn,
      asName: locRes?.asName,
      isProxy: locRes?.isProxy,
    });
  } catch (e) {
    console.error("IP2Location lookup error:", e);
  }

  // 2. Verify Direct IP2WHOIS Domain Lookup
  console.log("\n2. Testing ip2WhoisLookup('example.com')...");
  try {
    const whoisRes = await ip2WhoisLookup("example.com");
    console.log("IP2WHOIS Data:", {
      domain: whoisRes?.domain,
      status: whoisRes?.status,
      createDate: whoisRes?.createDate,
      domainAge: whoisRes?.domainAge,
      registrar: whoisRes?.registrar?.name,
      registrantOrg: whoisRes?.registrant?.organization,
      nameservers: whoisRes?.nameservers,
    });
  } catch (e) {
    console.error("IP2WHOIS lookup error:", e);
  }

  // 3. Verify Direct IP2WHOIS Hosted Domains (Reverse IP) Lookup
  console.log("\n3. Testing ip2WhoisHostedDomains('8.8.8.8')...");
  try {
    const hostedRes = await ip2WhoisHostedDomains("8.8.8.8");
    console.log("Hosted Domains Data:", {
      ip: hostedRes?.ip,
      totalDomains: hostedRes?.totalDomains,
      domainsSample: hostedRes?.domains?.slice(0, 3),
    });
  } catch (e) {
    console.error("IP2WHOIS hosted domains error:", e);
  }

  // 4. Verify Merged IP Lookup
  console.log("\n4. Testing mergedIPLookup('161.248.22.174')...");
  try {
    const ipRes = await mergedIPLookup("161.248.22.174");
    console.log("IP Result Sources:", ipRes.sources);
    console.log("IP Country:", ipRes.country);
    console.log("IP City/Region:", `${ipRes.city}, ${ipRes.region}`);
    console.log("IP Coords:", `${ipRes.latitude}, ${ipRes.longitude}`);
    console.log("IP2Location Attached:", !!ipRes.ip2location);
    console.log("Hosted Domains Attached:", !!ipRes.hostedDomains);
  } catch (e) {
    console.error("Merged IP lookup error:", e);
  }

  // 5. Verify Merged Domain Lookup
  console.log("\n5. Testing mergedDomainLookup('example.com')...");
  try {
    const domainRes = await mergedDomainLookup("example.com");
    console.log("Domain Result Sources:", domainRes.sources);
    console.log("Domain Registrar:", domainRes.registrar);
    console.log("Domain Age:", domainRes.domainAge);
    console.log("IP2WHOIS Attached:", !!domainRes.ip2whois);
  } catch (e) {
    console.error("Merged Domain lookup error:", e);
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
