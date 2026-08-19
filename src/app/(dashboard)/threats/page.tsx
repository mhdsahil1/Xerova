"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Hash,
  Link2,
  ShieldAlert,
  Clock,
  Wifi,
  MapPin,
  Server,
  AlertTriangle,
  History,
  FileSearch,
  PlusCircle,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Bot,
  VenetianMask,
  Shield,
  Network,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRiskColor, getRiskLabel, getSeverityColor } from "@/lib/utils";
import { IOCExtractionPanel } from "@/components/shared/IOCExtractionPanel";
import { CreateReportDialog } from "@/components/reports/CreateReportDialog";
import { RiskScoreDisplay } from "@/components/shared/RiskScoreDisplay";
import { ScanningAnimation } from "@/components/shared/ScanningAnimation";
import { ThreatIndicatorCard } from "@/components/shared/ThreatIndicatorCard";
import { ThreatSourceCard } from "@/components/shared/ThreatSourceCard";
import type { ExtractedIOC } from "@/lib/ioc-extractor";

// --- Cycling placeholder examples ---
const PLACEHOLDER_EXAMPLES = [
  "Try: 8.8.8.8",
  "Try: suspicious-domain.ru",
  "Try: https://phishing-site.xyz/login",
  "Try: CVE-2024-3094",
  "Try: d41d8cd98f00b204e9800998ecf8427e",
];

// --- API Error ---
function ApiErrorAlert({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-severity-critical/10 border border-severity-critical/25 text-severity-critical p-4 rounded-xl flex items-start gap-3"
      role="alert"
    >
      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-sm">Lookup Failed</h4>
        <p className="text-sm mt-1 text-severity-critical/80">{error}</p>
      </div>
    </motion.div>
  );
}

// --- Scan type config ---
const SCAN_TYPES = [
  { value: "auto", label: "Auto-Detect", icon: Shield, tip: "Automatically detects the input type" },
  { value: "ip", label: "IP Address", icon: Wifi, tip: "Analyze an IPv4/IPv6 address" },
  { value: "domain", label: "Domain", icon: Globe, tip: "Investigate a domain name" },
  { value: "hash", label: "File Hash", icon: Hash, tip: "Check an MD5, SHA1, or SHA256 hash" },
  { value: "url", label: "URL", icon: Link2, tip: "Scan a full URL for phishing/malware" },
  { value: "cve", label: "CVE", icon: ShieldAlert, tip: "Look up a vulnerability by CVE ID" },
];

export default function ThreatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16" role="status">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <ShieldAlert className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground mt-4 text-sm">Loading threat intelligence...</p>
        </div>
      }
    >
      <ThreatsPageInner />
    </Suspense>
  );
}

function ThreatsPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("lookup");
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<string>("auto");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [resultType, setResultType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultData, setResultData] = useState<any>(null);

  // Animated placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const placeholderTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // History State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("all");
  const [historySeverity, setHistorySeverity] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Create Report Dialog State
  const [createReportOpen, setCreateReportOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedInvForReport, setSelectedInvForReport] = useState<any>(null);

  // Cycle placeholder text
  useEffect(() => {
    placeholderTimer.current = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 2800);
    return () => {
      if (placeholderTimer.current) clearInterval(placeholderTimer.current);
    };
  }, []);

  // Auto-lookup from URL params
  useEffect(() => {
    const urlQuery = searchParams.get("query");
    const urlType = searchParams.get("type");
    if (urlQuery) {
      executeLookup(urlQuery, urlType || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(1);
    }
  }, [activeTab, historySearch, historyType, historySeverity]);

  async function fetchHistory(page = historyPage) {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historySearch) params.set("search", historySearch);
      if (historyType !== "all") params.set("type", historyType);
      if (historySeverity !== "all") params.set("severity", historySeverity);
      params.set("page", String(page));
      params.set("limit", "15");
      const res = await fetch(`/api/threats/history?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistoryItems(data.items || []);
        setHistoryTotal(data.pagination?.total || 0);
        setHistoryTotalPages(data.pagination?.totalPages || 1);
        setHistoryPage(page);
      }
    } catch { /* Ignore */ } finally {
      setHistoryLoading(false);
    }
  }

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/threats/history/${id}`, { method: "DELETE" });
      if (res.ok) setHistoryItems((prev) => prev.filter((item) => item._id !== id));
    } catch { /* Ignore */ }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear all investigation history?")) return;
    try {
      const res = await fetch("/api/threats/history", { method: "DELETE" });
      if (res.ok) setHistoryItems([]);
    } catch { /* Ignore */ }
  };

  const executeLookup = async (searchQuery: string, typeToUse?: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    if (typeToUse) setSearchType(typeToUse);
    setIsSearching(true);
    setError(null);
    setHasResults(false);
    setResultData(null);
    setActiveTab("lookup");

    try {
      const type = typeToUse || (searchType === "auto" ? undefined : searchType);
      const res = await fetch("/api/threats/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResultType(data.type);
      setResultData(data.results);
      setHasResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(query);
  };

  const handleOneClickIOCLookup = (ioc: ExtractedIOC | { type: string; value: string }) => {
    executeLookup(ioc.value, ioc.type);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGenerateReportFromInv = (inv: any) => {
    setSelectedInvForReport(inv);
    setCreateReportOpen(true);
  };

  const activeScanType = SCAN_TYPES.find((t) => t.value === searchType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-cyber-blue/10 border border-primary/20">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            Threat Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Investigate IPs, domains, URLs, file hashes, and CVEs using global threat intelligence sources.
          </p>
        </div>
        <Button
          onClick={() => { setSelectedInvForReport(null); setCreateReportOpen(true); }}
          className="bg-gradient-to-r from-cyber-cyan to-cyber-blue text-white shrink-0 font-semibold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background/50 border border-border/50">
          <TabsTrigger value="lookup" className="text-xs md:text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden xs:inline">Threat</span> Lookup
          </TabsTrigger>
          <TabsTrigger value="extractor" className="text-xs md:text-sm flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-primary" />
            <span className="hidden xs:inline">IOC</span> Extractor
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs md:text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-cyber-cyan" />
            History
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THREAT LOOKUP */}
        <TabsContent value="lookup" className="space-y-6 pt-4">
          {/* Hero Scan Input */}
          <Card className="bg-card/60 border-border/50 overflow-hidden relative">
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
            <CardContent className="pt-6 pb-5 relative">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Main input */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={placeholderIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none"
                      />
                    </AnimatePresence>
                    <Input
                      id="threat-lookup-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
                      className="pl-12 h-13 text-base bg-background/60 border-border/60 focus:border-primary font-mono rounded-xl"
                      autoComplete="off"
                      aria-label="Enter IP, domain, hash, URL, or CVE ID to investigate"
                    />
                  </div>
                  <Button
                    type="submit"
                    id="threat-lookup-submit"
                    className="h-13 px-8 bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                    disabled={isSearching || !query.trim()}
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden sm:inline">Scanning...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Analyze
                      </span>
                    )}
                  </Button>
                </div>

                {/* Scan Type Pills */}
                <div className="flex flex-wrap gap-2">
                  {SCAN_TYPES.map((t) => {
                    const isActive = searchType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSearchType(t.value)}
                        title={t.tip}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isActive
                            ? "bg-primary/15 border-primary/50 text-primary"
                            : "bg-background/40 border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tip text */}
                {activeScanType && (
                  <p className="text-[11px] text-muted-foreground/70 font-mono">
                    Mode: <span className="text-primary">{activeScanType.label}</span> — {activeScanType.tip}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Error State */}
          <AnimatePresence>
            {error && <ApiErrorAlert error={error} />}
          </AnimatePresence>

          {/* Scanning Animation */}
          <AnimatePresence mode="wait">
            {isSearching && (
              <Card className="bg-card/50 border-border/50">
                <ScanningAnimation query={query} type={searchType !== "auto" ? searchType : undefined} />
              </Card>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {hasResults && !isSearching && resultData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {resultType}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                      {query}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReportFromInv({
                      query,
                      type: resultType,
                      riskScore: resultData.riskScore || 0,
                      severity: resultData.severity || "info",
                      results: resultData,
                    })}
                    className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Save to Report
                  </Button>
                </div>

                {resultData.error ? (
                  <ApiErrorAlert error={resultData.error} />
                ) : resultData.status === "queued" ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl flex items-start gap-3">
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Analysis Queued</h4>
                      <p className="text-sm mt-1">{resultData.message}</p>
                    </div>
                  </div>
                ) : resultType === "ip" || resultType === "domain" ? (
                  <IPDomainResultView data={resultData} type={resultType} onLookupIOC={handleOneClickIOCLookup} />
                ) : resultType === "cve" ? (
                  <CVEResultView data={resultData} />
                ) : resultType === "hash" ? (
                  <HashResultView data={resultData} />
                ) : resultType === "url" ? (
                  <URLResultView data={resultData} />
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!hasResults && !isSearching && !error && (
            <div className="text-center py-16">
              <div className="relative inline-flex mb-6">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-primary/20"
                    style={{ width: 60 * i, height: 60 * i, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                  />
                ))}
                <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-primary/50" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Ready to Investigate</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Enter any IP address, domain, file hash, URL, or CVE ID above to begin threat analysis.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {["8.8.8.8", "example.com", "CVE-2024-3094", "https://phishing.example.com"].map((example) => (
                  <Badge
                    key={example}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all font-mono text-xs py-1.5 px-3"
                    onClick={() => executeLookup(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: IOC EXTRACTOR */}
        <TabsContent value="extractor" className="pt-4 space-y-6">
          <IOCExtractionPanel
            onLookupIOC={handleOneClickIOCLookup}
            onAddToReport={(iocs) => {
              setSelectedInvForReport({
                query: "Extracted IOC Batch",
                type: "investigation",
                riskScore: 60,
                severity: "medium",
                results: { iocs },
              });
              setCreateReportOpen(true);
            }}
          />
        </TabsContent>

        {/* TAB 3: INVESTIGATION HISTORY */}
        <TabsContent value="history" className="pt-4 space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-cyber-cyan" />
                  Investigation History
                  {historyTotal > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">{historyTotal}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => fetchHistory(historyPage)} disabled={historyLoading}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${historyLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  {historyItems.length > 0 && (
                    <Button variant="ghost" size="xs" onClick={handleClearAllHistory} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search past queries..."
                    className="pl-9 h-9 text-xs bg-background/50 border-border/50"
                  />
                </div>
                <select
                  value={historyType}
                  onChange={(e) => setHistoryType(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md bg-background/50 border border-border/50 focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="ip">IP</option>
                  <option value="domain">Domain</option>
                  <option value="hash">Hash</option>
                  <option value="url">URL</option>
                  <option value="cve">CVE</option>
                </select>
                <select
                  value={historySeverity}
                  onChange={(e) => setHistorySeverity(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md bg-background/50 border border-border/50 focus:border-primary"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground bg-background/30 rounded-xl border border-border/30">
                  <History className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                  No matching investigation history found.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-background/40 border border-border/40 hover:border-primary/30 transition-all gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                          {item.type}
                        </Badge>
                        <span
                          className="text-xs font-mono font-bold truncate group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => executeLookup(item.query, item.type)}
                          title={item.query}
                        >
                          {item.query}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`text-[10px] capitalize border ${getSeverityColor(item.severity)}`}
                          variant="outline"
                        >
                          <span className={getRiskColor(item.riskScore)}>
                            {item.riskScore}
                          </span>
                          /100
                        </Badge>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        <Button size="xs" variant="ghost" onClick={() => executeLookup(item.query, item.type)} className="text-xs text-primary hover:bg-primary/10">
                          Re-Analyze
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleGenerateReportFromInv(item)} className="text-xs text-status-success hover:bg-status-success/10">
                          + Report
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => handleDeleteHistoryItem(item._id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        Page {historyPage} of {historyTotalPages} &middot; {historyTotal} total
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="outline" onClick={() => fetchHistory(historyPage - 1)} disabled={historyPage <= 1 || historyLoading} className="h-7 w-7 p-0">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                          const start = Math.max(1, historyPage - 2);
                          const page = start + i;
                          if (page > historyTotalPages) return null;
                          return (
                            <Button key={page} size="xs" variant={page === historyPage ? "default" : "outline"} onClick={() => fetchHistory(page)} disabled={historyLoading} className="h-7 w-7 p-0 text-xs">
                              {page}
                            </Button>
                          );
                        })}
                        <Button size="xs" variant="outline" onClick={() => fetchHistory(historyPage + 1)} disabled={historyPage >= historyTotalPages || historyLoading} className="h-7 w-7 p-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <CreateReportDialog
        open={createReportOpen}
        onOpenChange={setCreateReportOpen}
        initialInvestigation={selectedInvForReport}
        onSuccess={() => {}}
      />
    </motion.div>
  );
}

// ==========================================
// IP / Domain Result View
// ==========================================
function IPDomainResultView({
  data,
  type,
  onLookupIOC,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  type: string;
  onLookupIOC?: (ioc: { type: string; value: string }) => void;
}) {
  const isIP = type === "ip";
  const title = isIP ? data.ip : data.domain;
  const riskScore = data.riskScore || 0;

  // Determine VirusTotal verdict
  function vtVerdict() {
    const mal = data.virusTotal?.maliciousEngines ?? 0;
    if (mal > 5) return "malicious";
    if (mal > 0) return "suspicious";
    return "clean";
  }

  // Determine AbuseIPDB verdict
  function abuseVerdict() {
    const reports = data.abuseReports ?? 0;
    if (reports > 20) return "malicious";
    if (reports > 0) return "suspicious";
    return "clean";
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Hero */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left: details */}
          <div className="flex-1 p-6 space-y-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="text-xl font-mono font-bold">{title}</span>
                <Badge className={`capitalize border ${getSeverityColor(data.severity || "info")}`} variant="outline">
                  {getRiskLabel(riskScore)}
                </Badge>
              </div>
              {data.sources && data.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-muted-foreground">Sources:</span>
                  {data.sources.map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem icon={MapPin} label="Location" value={data.country ? `${data.city ? data.city + ", " : ""}${data.country}` : "Unknown"} />
              {isIP && <InfoItem icon={Server} label="ISP / Provider" value={data.isp || "N/A"} />}
              {isIP && <InfoItem icon={Globe} label="ASN" value={data.asn || "N/A"} />}
              {!isIP && <InfoItem icon={Server} label="Registrar" value={data.registrar || "N/A"} />}
              {isIP && <InfoItem icon={AlertTriangle} label="Abuse Reports" value={data.abuseReports?.toString() || "0"} />}
              {!isIP && data.resolvedIP && (
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">Resolved IP</p>
                    <button
                      onClick={() => onLookupIOC?.({ type: "ip", value: data.resolvedIP })}
                      className="text-sm font-medium font-mono text-primary hover:underline block text-left"
                    >
                      {data.resolvedIP}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Risk Score */}
          <div className="w-full md:w-52 p-6 flex items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <RiskScoreDisplay score={riskScore} size="lg" showBar showLabel showExplanation />
          </div>
        </div>
      </Card>

      {/* Intelligence Sources */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <Globe className="w-4 h-4" /> Intelligence Sources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.virusTotal && (
            <ThreatSourceCard
              name="VirusTotal"
              verdict={vtVerdict()}
              stat={`${data.virusTotal.maliciousEngines ?? 0}/${(data.virusTotal.maliciousEngines ?? 0) + (data.virusTotal.harmlessEngines ?? 0) + (data.virusTotal.suspiciousEngines ?? 0) + (data.virusTotal.undetectedEngines ?? 0)}`}
              statLabel="engines flagged"
              index={0}
            />
          )}
          {isIP && data.abuseReports !== undefined && (
            <ThreatSourceCard
              name="AbuseIPDB"
              verdict={abuseVerdict()}
              stat={String(data.abuseReports)}
              statLabel="community abuse reports"
              index={1}
            />
          )}
          {data.ports && data.ports.length > 0 && (
            <ThreatSourceCard
              name="Shodan"
              verdict={data.ports.length > 5 ? "suspicious" : "clean"}
              stat={String(data.ports.length)}
              statLabel={`open port${data.ports.length !== 1 ? "s" : ""} detected`}
              detail={`Ports: ${data.ports.slice(0, 6).join(", ")}${data.ports.length > 6 ? "..." : ""}`}
              index={2}
            />
          )}
        </div>
      </div>

      {/* Detection Flags */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <Shield className="w-4 h-4" /> Detection Flags
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ThreatIndicatorCard
            label="VPN / Anonymizer"
            detected={data.isVPN || false}
            icon={VenetianMask}
            description="Connection appears to be from a standard location."
            detectedDescription="Traffic is routing through a VPN or anonymizing service."
            index={0}
          />
          <ThreatIndicatorCard
            label="Tor Exit Node"
            detected={data.isTor || false}
            icon={Network}
            description="Not associated with the Tor anonymity network."
            detectedDescription="This IP is a known Tor exit node — used for anonymous browsing."
            index={1}
          />
          <ThreatIndicatorCard
            label="Open Proxy"
            detected={data.isProxy || false}
            icon={Globe}
            description="Not known to be a proxy server."
            detectedDescription="This host is acting as an open proxy, often used to hide malicious origin."
            index={2}
          />
          {isIP && (
            <ThreatIndicatorCard
              label="Automated Bot"
              detected={data.isBot || false}
              icon={Bot}
              description="No bot-like behavior detected."
              detectedDescription="Traffic patterns suggest automated bot activity."
              index={3}
            />
          )}
        </div>
      </div>

      {/* Threat History */}
      {data.threats && data.threats.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-severity-high" />
              Known Threat History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.threats.map((threat: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <Badge className={`text-[10px] capitalize border ${getSeverityColor(threat.severity)}`} variant="outline">
                    {threat.severity}
                  </Badge>
                  <div>
                    <p className="text-sm">{threat.description}</p>
                    <p className="text-xs text-muted-foreground">{threat.source}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {threat.date}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// URL Result View
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function URLResultView({ data }: { data: any }) {
  const riskFactors = data.riskFactors || [];
  const findings = data.findings || [];
  const structural = data.structural || {};
  const sources = data.sources || [];
  const riskScore = data.riskScore ?? 0;
  const vt = data.threatIntelligence?.virusTotal;

  function vtVerdict() {
    const mal = vt?.maliciousEngines ?? 0;
    if (mal > 5) return "malicious";
    if (mal > 0) return "suspicious";
    if (vt) return "clean";
    return "unknown";
  }

  return (
    <div className="space-y-6">
      {/* Hero Overview */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 space-y-3">
            {/* Verdict badge + URL */}
            <div className="flex items-start gap-3 flex-wrap">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                data.verdict === "SAFE" ? "bg-status-success/15" :
                data.verdict === "SUSPICIOUS" ? "bg-severity-medium/15" :
                "bg-severity-critical/15"
              }`}>
                {data.verdict === "SAFE" ? (
                  <Shield className={`w-5 h-5 text-status-success`} />
                ) : data.verdict === "SUSPICIOUS" ? (
                  <AlertTriangle className={`w-5 h-5 text-severity-medium`} />
                ) : (
                  <XCircle className={`w-5 h-5 text-severity-critical`} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-sm font-bold uppercase tracking-wide ${
                    data.verdict === "SAFE" ? "text-status-success" :
                    data.verdict === "SUSPICIOUS" ? "text-severity-medium" :
                    "text-severity-critical"
                  }`}>
                    {data.verdict || "Unknown"}
                  </span>
                  <Badge className={`capitalize border ${getSeverityColor(data.severity || "info")}`} variant="outline">
                    {data.severity || "info"}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all" title={data.url}>
                  {data.url}
                </p>
              </div>
            </div>

            {sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-muted-foreground">Sources:</span>
                {sources.map((src: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-mono">{src}</Badge>
                ))}
              </div>
            )}

            {/* Structural mini-stats */}
            {structural.domain && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <MiniStat label="Protocol" value={(structural.protocol || "?").toUpperCase()} highlight={structural.protocol !== "https"} />
                <MiniStat label="Domain" value={structural.domain} />
                <MiniStat label="URL Length" value={`${structural.urlLength} chars`} highlight={structural.urlLength > 100} />
                <MiniStat label="Host Type" value={structural.isIPBased ? "Direct IP" : "Domain"} highlight={structural.isIPBased} />
              </div>
            )}
          </div>

          {/* Risk Score */}
          <div className="w-full md:w-52 p-6 flex items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <RiskScoreDisplay score={riskScore} size="lg" showBar showLabel showExplanation />
          </div>
        </div>
      </Card>

      {/* Intelligence Sources */}
      {vt && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Intelligence Sources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ThreatSourceCard
              name="VirusTotal"
              verdict={vtVerdict()}
              stat={`${vt.maliciousEngines ?? 0}`}
              statLabel={`of ${(vt.maliciousEngines ?? 0) + (vt.harmlessEngines ?? 0) + (vt.suspiciousEngines ?? 0) + (vt.undetectedEngines ?? 0)} engines flagged malicious`}
              index={0}
            />
            {vt.suspiciousEngines > 0 && (
              <ThreatSourceCard
                name="VirusTotal"
                verdict="suspicious"
                stat={`${vt.suspiciousEngines}`}
                statLabel="engines flagged suspicious"
                index={1}
              />
            )}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-severity-high" />
              Identified Risk Factors
              <Badge variant="secondary" className="ml-1 text-xs">{riskFactors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {riskFactors.map((rf: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start justify-between p-3 rounded-xl bg-background/40 border border-border/30 gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Badge className={`text-[10px] uppercase shrink-0 mt-0.5 border ${getSeverityColor(rf.severity?.toLowerCase() || "info")}`} variant="outline">
                    {rf.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{rf.reason}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Source: {rf.source}{rf.category ? ` · ${rf.category}` : ""}
                    </p>
                  </div>
                </div>
                {rf.scoreContribution > 0 && (
                  <span className="text-xs font-mono font-bold text-severity-high shrink-0">+{rf.scoreContribution}</span>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Telemetry Findings */}
      {findings.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-primary" />
              Detailed Findings
              <Badge variant="secondary" className="ml-1 text-xs">{findings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {findings.map((finding: any, i: number) => (
              <div key={i} className={`border-l-4 pl-4 py-3 rounded-r-xl border bg-background/30 ${
                finding.severity === "CRITICAL" ? "border-severity-critical" :
                finding.severity === "HIGH" ? "border-severity-high" :
                finding.severity === "MEDIUM" ? "border-severity-medium" :
                "border-severity-low"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] uppercase border ${getSeverityColor(finding.severity?.toLowerCase() || "info")}`} variant="outline">
                    {finding.severity}
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wide">{finding.category}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{finding.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security Recommendation */}
      <div className={`rounded-xl p-5 border ${
        data.verdict === "SAFE"
          ? "bg-status-success/5 border-status-success/25 text-status-success"
          : data.verdict === "SUSPICIOUS"
          ? "bg-severity-medium/5 border-severity-medium/25 text-severity-medium"
          : "bg-severity-critical/5 border-severity-critical/25 text-severity-critical"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${
            data.verdict === "SAFE" ? "bg-status-success/10" :
            data.verdict === "SUSPICIOUS" ? "bg-severity-medium/10" :
            "bg-severity-critical/10"
          }`}>
            {data.verdict === "SAFE" ? <Shield className="w-5 h-5" /> :
             data.verdict === "SUSPICIOUS" ? <AlertTriangle className="w-5 h-5" /> :
             <XCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {data.verdict === "SAFE" ? "Recommendation: Low Risk — Safe to Proceed" :
               data.verdict === "SUSPICIOUS" ? "Recommendation: Exercise Caution" :
               "Recommendation: High Threat — Block This URL"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {data.verdict === "SAFE"
                ? "This URL shows no high-confidence indicators of malicious behavior. Standard browsing caution applies."
                : data.verdict === "SUSPICIOUS"
                ? "Suspicious patterns detected. Avoid submitting passwords or personal information on this page."
                : "High confidence of malicious intent detected. Block this URL across all endpoints immediately."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CVE Result View
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CVEResultView({ data }: { data: any }) {
  const cvssScore = data.cvssScore || 0;
  const riskScore = cvssScore * 10;

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-mono font-bold text-primary">{data.id}</span>
              <Badge className={`capitalize border ${getSeverityColor(data.severity)}`} variant="outline">
                {data.severity}
              </Badge>
              {data.exploitAvailable && (
                <Badge variant="destructive" className="text-[10px]">Exploit Available</Badge>
              )}
              {data.patchAvailable && (
                <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30">
                  Patch Available
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
          </div>
          <div className="w-full md:w-52 p-6 flex flex-col items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <RiskScoreDisplay score={riskScore} size="md" showBar showLabel />
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">CVSS {cvssScore}/10</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Hash Result View
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HashResultView({ data }: { data: any }) {
  const riskScore = data.riskScore || 0;

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-mono font-bold truncate max-w-sm">
                {data.meaningfulName || "File Hash Analysis"}
              </span>
              <Badge className={`capitalize border ${getSeverityColor(data.severity || "info")}`} variant="outline">
                {data.severity || "info"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">SHA-256</p>
                <p className="text-xs font-mono break-all mt-1 text-foreground">{data.sha256 || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Detection Rate</p>
                <p className="text-sm font-bold mt-1 text-foreground">{data.detectionRate || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-52 p-6 flex items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <RiskScoreDisplay score={riskScore} size="lg" showBar showLabel showExplanation />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Reusable helpers
// ==========================================
function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
      <p className="text-[10px] uppercase font-mono text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${highlight ? "text-severity-medium" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
