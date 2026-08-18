// ============================================
// URL Analysis Result Component
// ============================================

"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Shield, TrendingUp } from "lucide-react";

interface URLAnalysisResult {
  url: string;
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  riskScore: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  
  structural: {
    protocol: "http" | "https" | "unknown";
    domain: string;
    hostname: string;
    port: number | null;
    path: string;
    query: string;
    urlLength: number;
    subdominCount: number;
    isIPBased: boolean;
    ipAddress: string | null;
  };
  
  urlCharacteristics: {
    usesHTTPS: boolean;
    hasExcessiveLength: boolean;
    hasMultipleSubdomains: boolean;
    hasIPAddress: boolean;
    hasSuspiciousPort: boolean;
    hasURLEncoding: boolean;
    hasObfuscatedCharacters: boolean;
    hasExcessiveRedirects: boolean;
    redirectionChain: string[];
    issues: string[];
  };
  
  domainCharacteristics: {
    hasPunycode: boolean;
    hasSuspiciousTLD: boolean;
    hasExcessiveHyphens: boolean;
    lookalikeDomains: string[];
    brandImpersonationDetected: boolean;
    suspiciousKeywords: string[];
    domainAge: number | null;
    issues: string[];
  };
  
  threatIntelligence: {
    virusTotal: {
      reputation: number;
      maliciousEngines: number;
      suspiciousEngines: number;
      harmlessEngines: number;
      undetectedEngines: number;
      lastAnalysisDate: string | null;
      categories: Record<string, string>;
    } | null;
    abuseScore: number | null;
    isKnownMalicious: boolean;
    suspiciousReports: number;
  };
  
  riskBreakdown: {
    urlStructuralRisk: number;
    domainCharacteristicRisk: number;
    threatIntelligenceRisk: number;
    totalRisk: number;
  };
  
  findings: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
  }>;
}

interface URLAnalysisComponentProps {
  analysis: URLAnalysisResult;
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 border-red-300 text-red-800",
  HIGH: "bg-orange-100 border-orange-300 text-orange-800",
  MEDIUM: "bg-yellow-100 border-yellow-300 text-yellow-800",
  LOW: "bg-blue-100 border-blue-300 text-blue-800",
};

const severityBadgeColors: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-yellow-600 text-white",
  LOW: "bg-blue-600 text-white",
};

const VerdictIcon = ({ verdict }: { verdict: string }) => {
  switch (verdict) {
    case "SAFE":
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    case "SUSPICIOUS":
      return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    case "MALICIOUS":
      return <AlertCircle className="w-8 h-8 text-red-600" />;
    default:
      return <Shield className="w-8 h-8 text-gray-600" />;
  }
};

export function URLAnalysisComponent({ analysis }: URLAnalysisComponentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    structural: true,
    findings: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getRiskColor = (score: number) => {
    if (score < 25) return "text-green-600";
    if (score < 50) return "text-yellow-600";
    if (score < 75) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <VerdictIcon verdict={analysis.verdict} />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">URL Analysis</h1>
              <p className="text-slate-600 break-all">{analysis.url}</p>
            </div>
          </div>
        </div>

        {/* Risk Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Verdict */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-600 mb-2">Verdict</div>
            <div className={`text-2xl font-bold ${
              analysis.verdict === "SAFE" ? "text-green-600" :
              analysis.verdict === "SUSPICIOUS" ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {analysis.verdict}
            </div>
            <div className="text-xs text-slate-500 mt-1">{analysis.threatLevel} Threat Level</div>
          </div>

          {/* Risk Score */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-600 mb-2">Risk Score</div>
            <div className={`text-3xl font-bold ${getRiskColor(analysis.riskScore)}`}>
              {analysis.riskScore}/100
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full transition-all ${
                  analysis.riskScore < 25 ? "bg-green-600" :
                  analysis.riskScore < 50 ? "bg-yellow-600" :
                  analysis.riskScore < 75 ? "bg-orange-600" :
                  "bg-red-600"
                }`}
                style={{ width: `${analysis.riskScore}%` }}
              />
            </div>
          </div>

          {/* Risk Breakdown */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-600 mb-2">Risk Breakdown</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Structural:</span>
                <span className="font-semibold">{analysis.riskBreakdown.urlStructuralRisk}/25</span>
              </div>
              <div className="flex justify-between">
                <span>Domain:</span>
                <span className="font-semibold">{analysis.riskBreakdown.domainCharacteristicRisk}/35</span>
              </div>
              <div className="flex justify-between">
                <span>Threat Intel:</span>
                <span className="font-semibold">{analysis.riskBreakdown.threatIntelligenceRisk}/40</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structural Analysis */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("structural")}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Structural Analysis</h2>
          </div>
          <span className={`transition-transform ${expandedSections.structural ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {expandedSections.structural && (
          <div className="px-6 py-4 space-y-3 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600">Protocol</div>
                <div className="font-semibold text-slate-900 uppercase">{analysis.structural.protocol}</div>
                {analysis.structural.protocol === "http" && (
                  <div className="text-xs text-orange-600 mt-1">⚠️ Unencrypted</div>
                )}
              </div>
              <div>
                <div className="text-sm text-slate-600">Domain</div>
                <div className="font-semibold text-slate-900">{analysis.structural.domain}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Hostname</div>
                <div className="font-semibold text-slate-900 break-all">{analysis.structural.hostname}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Port</div>
                <div className="font-semibold text-slate-900">
                  {analysis.structural.port || "default"}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">URL Length</div>
                <div className="font-semibold text-slate-900">{analysis.structural.urlLength} chars</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Subdomains</div>
                <div className="font-semibold text-slate-900">{analysis.structural.subdominCount}</div>
              </div>
            </div>

            {analysis.structural.isIPBased && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-4">
                <div className="text-sm font-semibold text-orange-800">
                  ⚠️ IP-Based URL: {analysis.structural.ipAddress}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* URL Characteristics */}
      {analysis.urlCharacteristics.issues.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("urlChar")}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-900">URL Issues</h2>
            <span className={`transition-transform ${expandedSections["urlChar"] ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {expandedSections["urlChar"] !== false && (
            <div className="px-6 py-4 space-y-2 border-t border-slate-200">
              {analysis.urlCharacteristics.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-orange-600 font-bold mt-1">⚠️</span>
                  <span className="text-slate-700">{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Domain Characteristics */}
      {analysis.domainCharacteristics.issues.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("domainChar")}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-900">Domain Issues</h2>
            <span className={`transition-transform ${expandedSections["domainChar"] ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {expandedSections["domainChar"] !== false && (
            <div className="px-6 py-4 space-y-2 border-t border-slate-200">
              {analysis.domainCharacteristics.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-orange-600 font-bold mt-1">⚠️</span>
                  <span className="text-slate-700">{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Threat Intelligence */}
      {analysis.threatIntelligence.virusTotal && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("threatIntel")}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-900">VirusTotal Analysis</h2>
            <span className={`transition-transform ${expandedSections["threatIntel"] ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {expandedSections["threatIntel"] !== false && (
            <div className="px-6 py-4 space-y-3 border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 rounded p-3">
                  <div className="text-sm text-slate-600">Malicious</div>
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.threatIntelligence.virusTotal.maliciousEngines}
                  </div>
                </div>
                <div className="bg-orange-50 rounded p-3">
                  <div className="text-sm text-slate-600">Suspicious</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {analysis.threatIntelligence.virusTotal.suspiciousEngines}
                  </div>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <div className="text-sm text-slate-600">Harmless</div>
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.threatIntelligence.virusTotal.harmlessEngines}
                  </div>
                </div>
                <div className="bg-slate-100 rounded p-3">
                  <div className="text-sm text-slate-600">Undetected</div>
                  <div className="text-2xl font-bold text-slate-600">
                    {analysis.threatIntelligence.virusTotal.undetectedEngines}
                  </div>
                </div>
              </div>
              {analysis.threatIntelligence.virusTotal.lastAnalysisDate && (
                <div className="text-sm text-slate-600">
                  Last Analysis: {new Date(analysis.threatIntelligence.virusTotal.lastAnalysisDate).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Findings */}
      {analysis.findings.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("findings")}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Findings ({analysis.findings.length})
            </h2>
            <span className={`transition-transform ${expandedSections.findings ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {expandedSections.findings && (
            <div className="px-6 py-4 space-y-4 border-t border-slate-200">
              {analysis.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 pl-4 py-3 rounded ${severityColors[finding.severity]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${severityBadgeColors[finding.severity]}`}>
                          {finding.severity}
                        </span>
                        <span className="font-semibold">{finding.category}</span>
                      </div>
                      <p className="mt-2 text-sm">{finding.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      <div className={`rounded-lg p-6 border-2 ${
        analysis.verdict === "SAFE" ? "bg-green-50 border-green-200" :
        analysis.verdict === "SUSPICIOUS" ? "bg-yellow-50 border-yellow-200" :
        "bg-red-50 border-red-200"
      }`}>
        <h3 className="font-bold text-lg mb-2">
          {analysis.verdict === "SAFE" ? "✅ Safe to Visit" :
           analysis.verdict === "SUSPICIOUS" ? "⚠️ Use Caution" :
           "🚨 Do Not Visit"}
        </h3>
        <p className={
          analysis.verdict === "SAFE" ? "text-green-800" :
          analysis.verdict === "SUSPICIOUS" ? "text-yellow-800" :
          "text-red-800"
        }>
          {analysis.verdict === "SAFE" ? 
            "This URL appears to be safe. You can visit it with normal security practices." :
           analysis.verdict === "SUSPICIOUS" ?
            "This URL has some suspicious characteristics. Verify the domain and avoid entering sensitive information until you're confident it's legitimate." :
            "This URL is flagged as potentially malicious. Avoid visiting it and do not enter any personal or financial information."}
        </p>
      </div>
    </div>
  );
}
