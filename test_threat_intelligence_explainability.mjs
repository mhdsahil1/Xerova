// ============================================================
// Test Suite: Explainable Per-Engine Threat Intelligence Invariants
// ============================================================

import assert from "node:assert/strict";

async function runTests() {
  console.log("=== Testing XEROVA Explainable Threat Intelligence System ===");

  const {
    parseURL,
    performLocalURLAnalysis,
    classifyTarget,
    aggregateProviderRisk,
    normalizeProviderResults,
    calculateUnifiedRiskScore,
  } = await import("./src/lib/url-analyzer.ts");

  // 1. Target Classification Tests
  console.log("\n[Test 1] Target Classification Routing...");
  const urlParsed = parseURL("https://secure-login.example.com/account/auth?token=123");
  assert.equal(classifyTarget(urlParsed), "url", "Full URL with path/query must be classified as 'url'");

  const domainParsed = parseURL("https://example.com");
  assert.equal(classifyTarget(domainParsed), "domain", "Domain without deep path must be classified as 'domain'");

  const ipParsed = parseURL("http://192.168.1.1:8080/admin");
  assert.equal(classifyTarget(ipParsed), "ip", "Direct IP target must be classified as 'ip'");
  console.log("✓ Target Classification passes for URL, Domain, and IP targets.");

  // 2. Score Contribution Invariant Tests
  console.log("\n[Test 2] Mathematical Score Contribution Invariant...");
  // Test that only status === "threat" contributes risk
  assert.equal(
    aggregateProviderRisk({ provider: "VT", status: "threat", scoreContribution: 50 }),
    50,
    "Threat status must contribute its positive score"
  );
  assert.equal(
    aggregateProviderRisk({ provider: "OTX", status: "clean", scoreContribution: 50 }),
    0,
    "Clean status MUST contribute 0 pts regardless of scoreContribution"
  );
  assert.equal(
    aggregateProviderRisk({ provider: "Cloudmersive", status: "error", scoreContribution: 80 }),
    0,
    "Error status MUST contribute 0 pts (isolated)"
  );
  assert.equal(
    aggregateProviderRisk({ provider: "URLScan", status: "timeout", scoreContribution: 75 }),
    0,
    "Timeout status MUST contribute 0 pts (isolated)"
  );
  assert.equal(
    aggregateProviderRisk({ provider: "Shodan", status: "unavailable", scoreContribution: 60 }),
    0,
    "Unavailable status MUST contribute 0 pts (unconfigured)"
  );
  assert.equal(
    aggregateProviderRisk({ provider: "CheckPhish", status: "unknown", scoreContribution: 40 }),
    0,
    "Unknown status MUST contribute 0 pts"
  );
  console.log("✓ Mathematical invariant verified: clean/error/timeout/unavailable/unknown strictly contribute 0 pts.");

  // 3. Normalization with Curated Details (No Raw JSON Dumps)
  console.log("\n[Test 3] Provider Normalization & Telemetry Details...");
  const mockIntel = {
    virusTotal: {
      reputation: -30,
      maliciousEngines: 5,
      suspiciousEngines: 2,
      harmlessEngines: 70,
      undetectedEngines: 10,
      lastAnalysisDate: "2026-08-24T12:00:00Z",
      categories: {},
    },
    otx: {
      pulseCount: 3,
      sourceType: "url",
      pulses: [
        { id: "p1", name: "Phishing Campaign Alpha", author: "AlienVault", tags: ["phish", "credential-harvesting"] },
      ],
    },
    cloudmersive: {
      cleanResult: false,
      websiteThreatType: "Malware",
      foundViruses: [{ fileName: "payload.exe", virusName: "Trojan.Generic" }],
    },
    urlscan: {
      score: 85,
      malicious: true,
      categories: ["phishing"],
      technologies: ["WordPress", "PHP"],
      screenshotUrl: "https://urlscan.io/screenshots/123.png",
      reportUrl: "https://urlscan.io/result/123",
    },
    abuseScore: 0,
    isKnownMalicious: true,
    suspiciousReports: 10,
  };

  const normalized = normalizeProviderResults(mockIntel);
  assert.equal(normalized["VirusTotal"].status, "threat");
  assert.equal(normalized["VirusTotal"].scoreContribution > 0, true);
  assert.equal(typeof normalized["VirusTotal"].details, "object");
  assert.equal(normalized["VirusTotal"].details.malicious, 5);

  assert.equal(normalized["AlienVault OTX"].status, "threat");
  assert.equal(normalized["AlienVault OTX"].relevance, "exact");
  assert.equal(normalized["AlienVault OTX"].details.pulseCount, 3);

  assert.equal(normalized["Cloudmersive"].status, "threat");
  assert.equal(normalized["Cloudmersive"].details.foundViruses.length, 1);

  assert.equal(normalized["urlscan.io"].status, "threat");
  assert.equal(normalized["urlscan.io"].details.score, 85);
  assert.equal(normalized["urlscan.io"].details.screenshotUrl, "https://urlscan.io/screenshots/123.png");
  console.log("✓ Provider normalization creates typed, curated details without raw dumps.");

  // 4. Intelligence Coverage Computation
  console.log("\n[Test 4] Intelligence Coverage Computation...");
  const localAnalysis = performLocalURLAnalysis(urlParsed);
  const explicitProviders = {
    VirusTotal: { provider: "VirusTotal", status: "threat", evidence: ["Malicious"], scoreContribution: 50 },
    "AlienVault OTX": { provider: "AlienVault OTX", status: "clean", evidence: ["Clean"], scoreContribution: 0 },
    Cloudmersive: { provider: "Cloudmersive", status: "timeout", error: "Timed out", evidence: [], scoreContribution: 0 },
    CheckPhish: { provider: "CheckPhish", status: "unavailable", error: "Key missing", evidence: [], scoreContribution: 0 },
  };

  const scoreResult = calculateUnifiedRiskScore(localAnalysis, mockIntel, explicitProviders);
  assert.ok(scoreResult.coverage, "Coverage object must be present in scoreResult");
  assert.equal(scoreResult.coverage.totalRelevant, 4);
  assert.equal(scoreResult.coverage.threats, 1);
  assert.equal(scoreResult.coverage.clean, 1);
  assert.equal(scoreResult.coverage.timeouts, 1);
  assert.equal(scoreResult.coverage.unavailable, 1);
  assert.equal(scoreResult.coverage.responded, 2); // threats + clean
  assert.equal(scoreResult.coverage.percentage, 50); // 2 / 4 = 50%
  console.log("✓ Intelligence Coverage metric correctly computed (2/4 = 50%).");

  // 5. Clean Target Scenario
  console.log("\n[Test 5] Clean Target Scenario...");
  const cleanParsed = parseURL("https://example.org");
  const cleanLocal = performLocalURLAnalysis(cleanParsed);
  const cleanProviders = {
    VirusTotal: { provider: "VirusTotal", status: "clean", evidence: ["0/94 vendors"], scoreContribution: 0 },
    "AlienVault OTX": { provider: "AlienVault OTX", status: "clean", evidence: ["0 pulses"], scoreContribution: 0 },
    Cloudmersive: { provider: "Cloudmersive", status: "clean", evidence: ["0 viruses"], scoreContribution: 0 },
    CheckPhish: { provider: "CheckPhish", status: "clean", evidence: ["Clean disposition"], scoreContribution: 0 },
  };

  const cleanScore = calculateUnifiedRiskScore(cleanLocal, { abuseScore: null, isKnownMalicious: false, suspiciousReports: 0 }, cleanProviders);
  assert.equal(cleanScore.verdict, "SAFE");
  assert.equal(cleanScore.threatLevel, "LOW");
  assert.equal(cleanScore.coverage.percentage, 100);
  assert.equal(cleanScore.coverage.threats, 0);
  assert.equal(cleanScore.coverage.clean, 4);
  console.log("✓ Clean target evaluates to SAFE verdict with 100% coverage.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
