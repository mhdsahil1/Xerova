import dotenv from "dotenv";
dotenv.config();

async function verifyAll() {
  console.log("=== STARTING IP2LOCATION / IP2WHOIS INTEGRATION VERIFICATION ===");

  const {
    ip2LocationLookup,
    ip2WhoisLookup,
    ip2WhoisHostedDomains,
    enrichedIPLookup,
    enrichedDomainLookup,
    enrichedURLLookup,
  } = await import("./src/lib/ip2-intelligence.ts");

  // 1. Direct IP2Location lookup
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

  // 2. Direct IP2WHOIS domain lookup
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

  // 3. Direct Hosted Domain / Reverse IP lookup
  console.log("\n3. Testing ip2WhoisHostedDomains('8.8.8.8')...");
  try {
    const hostedRes = await ip2WhoisHostedDomains("8.8.8.8");
    console.log("Hosted Domains Data:", {
      ip: hostedRes?.ip,
      totalDomains: hostedRes?.totalDomains,
      domainsSample: hostedRes?.domains?.slice(0, 3),
    });
  } catch (e) {
    console.error("Hosted-domain lookup error:", e);
  }

  // 4. Enriched IP aggregation
  console.log("\n4. Testing enrichedIPLookup('161.248.22.174')...");
  try {
    const ipRes = await enrichedIPLookup("161.248.22.174");
    console.log("IP Result Sources:", ipRes.sources);
    console.log("IP Country:", ipRes.country);
    console.log("IP City/Region:", `${ipRes.city}, ${ipRes.region}`);
    console.log("IP Coords:", `${ipRes.latitude}, ${ipRes.longitude}`);
    console.log("IP2Location Attached:", !!ipRes.ip2location);
    console.log("Hosted Domains Attached:", !!ipRes.hostedDomains);
  } catch (e) {
    console.error("Enriched IP lookup error:", e);
  }

  // 5. Enriched domain aggregation + NRD signal
  console.log("\n5. Testing enrichedDomainLookup('example.com')...");
  try {
    const domainRes = await enrichedDomainLookup("example.com");
    console.log("Domain Result Sources:", domainRes.sources);
    console.log("Domain Registrar:", domainRes.registrar);
    console.log("Domain Age:", domainRes.domainAge);
    console.log("IP2WHOIS Attached:", !!domainRes.ip2whois);
  } catch (e) {
    console.error("Enriched domain lookup error:", e);
  }

  // 6. URL analysis + IP2WHOIS domain-age enrichment
  console.log("\n6. Testing enrichedURLLookup('https://example.com')...");
  try {
    const urlRes = await enrichedURLLookup("https://example.com");
    console.log("URL Verdict:", urlRes.verdict);
    console.log("URL Risk Score:", urlRes.riskScore);
    console.log("URL Sources:", urlRes.sources);
    console.log("URL Domain Age:", urlRes.domainCharacteristics?.domainAge);
  } catch (e) {
    console.error("Enriched URL lookup error:", e);
  }

  console.log("\n=== IP2LOCATION / IP2WHOIS VERIFICATION COMPLETE ===");
}

verifyAll();
