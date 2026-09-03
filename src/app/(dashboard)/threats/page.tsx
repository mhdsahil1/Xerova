"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Hash,
  Link2,
  ShieldAlert,
  Loader2,
  Clock,
  Wifi,
  MapPin,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  FileSearch,
  PlusCircle,
  Trash2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Compass,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getRiskColor, getRiskLabel, getSeverityColor } from "@/lib/utils";
import { IOCExtractionPanel } from "@/components/shared/IOCExtractionPanel";
import { CreateReportDialog } from "@/components/reports/CreateReportDialog";
import type { ExtractedIOC } from "@/lib/ioc-extractor";
import { KineticTextLoader } from "@/components/ui/kinetic-text-loader";
import { URLAnalysisComponent } from "@/components/url-analysis/URLAnalysisComponent";

// --- API Error Handling ---
function ApiErrorAlert({ error }: { error: string }) {
  return (
    <div className="bg-status-error/10 border border-status-error/20 text-status-error p-4 rounded-lg flex items-start gap-3" role="alert">
      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-sm">Lookup Failed</h4>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );
}

export default function ThreatsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]" role="status" aria-label="Loading threat intelligence">
        <div className="scale-75 md:scale-90 mb-4 opacity-80">
          <KineticTextLoader />
        </div>
        <p className="text-muted-foreground text-sm font-mono tracking-wide mt-8 animate-pulse">
          Loading threat intelligence...
        </p>
      </div>
    }>
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

  // Auto-lookup from URL params (e.g., navigating from Reports page)
  useEffect(() => {
    const urlQuery = searchParams.get("query");
    const urlType = searchParams.get("type");
    if (urlQuery) {
      executeLookup(urlQuery, urlType || undefined);
    }
    // Only run on mount
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
    } catch {
      // Ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/threats/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item._id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear all investigation history?")) return;
    try {
      const res = await fetch("/api/threats/history", { method: "DELETE" });
      if (res.ok) {
        setHistoryItems([]);
      }
    } catch {
      // Ignore
    }
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
      if (!res.ok) {
        throw new Error(data.error || "Lookup failed");
      }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Threat Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Investigate indicators across multiple intelligence sources.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedInvForReport(null);
            setCreateReportOpen(true);
          }}
          className="bg-primary text-primary-foreground shrink-0 font-semibold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#12141a] border border-white/[0.08] p-1 rounded-xl">
          <TabsTrigger value="lookup" className="text-xs md:text-sm flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black font-semibold">
            <Search className="w-4 h-4" />
            Threat Lookup
          </TabsTrigger>
          <TabsTrigger value="extractor" className="text-xs md:text-sm flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black font-semibold">
            <FileSearch className="w-4 h-4" />
            IOC Extractor
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs md:text-sm flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black font-semibold">
            <History className="w-4 h-4" />
            Investigation History
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THREAT LOOKUP */}
        <TabsContent value="lookup" className="space-y-6 pt-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter IP, domain, hash, URL, or CVE ID..."
                      className="pl-11 h-12 text-base bg-card border-border/50 focus:border-primary/60 font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-7 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    disabled={isSearching || !query.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                    ) : (
                      "Analyze Target"
                    )}
                  </Button>
                </div>

                {/* Type Selector */}
                <Tabs
                  value={searchType}
                  onValueChange={setSearchType}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-6 bg-card">
                    <TabsTrigger value="auto" className="text-xs">
                      Auto
                    </TabsTrigger>
                    <TabsTrigger value="ip" className="text-xs">
                      <Wifi className="w-3 h-3 mr-1" />
                      IP
                    </TabsTrigger>
                    <TabsTrigger value="domain" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Domain
                    </TabsTrigger>
                    <TabsTrigger value="hash" className="text-xs">
                      <Hash className="w-3 h-3 mr-1" />
                      Hash
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs">
                      <Link2 className="w-3 h-3 mr-1" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="cve" className="text-xs">
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      CVE
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </form>
            </CardContent>
          </Card>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ApiErrorAlert error={error} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="scale-75 md:scale-90 mb-4 opacity-80">
                  <KineticTextLoader />
                </div>
                <p className="text-muted-foreground text-sm font-mono tracking-wide mt-8 animate-pulse">
                  Analyzing threat data across global sources...
                </p>
              </motion.div>
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
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleGenerateReportFromInv({
                        query,
                        type: resultType,
                        riskScore: resultData.riskScore || 0,
                        severity: resultData.severity || "info",
                        results: resultData,
                      })
                    }
                    className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Save Investigation to Report
                  </Button>
                </div>

                {resultData.error ? (
                  <ApiErrorAlert error={resultData.error} />
                ) : resultData.status === "queued" ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 p-4 rounded-lg flex items-start gap-3">
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
              <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Enter a query to begin
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Search for an IP address, domain, file hash, URL, or CVE ID
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["8.8.8.8", "example.com", "CVE-2024-3094"].map((example) => (
                  <Badge
                    key={example}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent/50 transition-colors font-mono"
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
          <Card className="bg-card border-border">
            <CardHeader className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Investigation Search & Filter History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => fetchHistory(historyPage)} disabled={historyLoading}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${historyLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  {historyItems.length > 0 && (
                    <Button variant="ghost" size="xs" onClick={handleClearAllHistory} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Clear History
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search past queries..."
                    className="pl-9 h-9 text-xs bg-card border-border/50"
                  />
                </div>

                <select
                  value={historyType}
                  onChange={(e) => setHistoryType(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md bg-card border border-border focus:border-primary uppercase"
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
                  className="h-9 px-3 text-xs rounded-md bg-card border border-border focus:border-primary capitalize"
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
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border">
                  No matching investigation history found.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-all gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono shrink-0"
                        >
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
                          Risk: {item.riskScore}/100
                        </Badge>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => executeLookup(item.query, item.type)}
                          className="text-xs text-primary hover:bg-primary/10"
                        >
                          Re-Analyze
                        </Button>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleGenerateReportFromInv(item)}
                          className="text-xs text-green-400 hover:bg-green-400/10"
                        >
                          + Report
                        </Button>

                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => handleDeleteHistoryItem(item._id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Showing page {historyPage} of {historyTotalPages} &middot; {historyTotal} total
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => fetchHistory(historyPage - 1)}
                          disabled={historyPage <= 1 || historyLoading}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                          const start = Math.max(1, historyPage - 2);
                          const page = start + i;
                          if (page > historyTotalPages) return null;
                          return (
                            <Button
                              key={page}
                              size="xs"
                              variant={page === historyPage ? "default" : "outline"}
                              onClick={() => fetchHistory(page)}
                              disabled={historyLoading}
                              className="h-7 w-7 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => fetchHistory(historyPage + 1)}
                          disabled={historyPage >= historyTotalPages || historyLoading}
                          className="h-7 w-7 p-0"
                        >
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
        onSuccess={() => {
          // Success callback
        }}
      />
    </motion.div>
  );
}

// ==========================================
// Sub-components
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

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl font-mono font-bold">{title}</span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
                variant="outline"
              >
                Risk: {data.riskScore}/100
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem
                icon={MapPin}
                label="Location"
                value={
                  data.country
                    ? `${data.city ? data.city + ", " : ""}${data.country}`
                    : "Unknown"
                }
              />
              {isIP && (
                <InfoItem icon={Server} label="ISP" value={data.isp || "N/A"} />
              )}
              {isIP && (
                <InfoItem icon={Globe} label="ASN" value={data.asn || "N/A"} />
              )}
              {!isIP && (
                <InfoItem
                  icon={Server}
                  label="Registrar"
                  value={data.registrar || "N/A"}
                />
              )}
              {isIP && (
                <InfoItem
                  icon={AlertTriangle}
                  label="Abuse Reports"
                  value={data.abuseReports?.toString() || "0"}
                />
              )}
              {!isIP && data.resolvedIP && (
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase">Resolved IP</p>
                    <button
                      onClick={() => onLookupIOC?.({ type: "ip", value: data.resolvedIP })}
                      className="text-sm font-medium truncate font-mono text-primary hover:underline block text-left"
                    >
                      {data.resolvedIP}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-muted/50 border-t md:border-t-0 md:border-l border-border">
            <span
              className={`text-5xl font-bold ${getRiskColor(data.riskScore || 0)}`}
            >
              {data.riskScore || 0}
            </span>
            <span
              className={`text-sm font-medium mt-1 ${getRiskColor(data.riskScore || 0)}`}
            >
              {getRiskLabel(data.riskScore || 0)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        {data.sources?.map((s: string) => (
          <Badge key={s} variant="secondary" className="text-[10px]">
            Source: {s}
          </Badge>
        ))}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flags */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Detection Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FlagItem label="VPN" detected={data.isVPN || false} />
            <FlagItem label="Tor Exit Node" detected={data.isTor || false} />
            <FlagItem label="Proxy" detected={data.isProxy || false} />
            {isIP && <FlagItem label="Known Bot" detected={data.isBot || false} />}
          </CardContent>
        </Card>

        {/* Open Ports */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Open Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.ports?.length > 0 ? (
                data.ports.map((port: number) => (
                  <Badge key={port} variant="secondary" className="font-mono">
                    {port}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None detected</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* alphaMountain.ai Telemetry */}
        {data.alphaMountain && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-cyan-400">αM</span> alphaMountain.ai AI Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">AI Threat Score</span>
                <span className="text-sm font-mono font-bold text-primary">
                  {Number(data.alphaMountain.threatScore).toFixed(2)} / 5.0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Calculated Risk</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {data.alphaMountain.riskScore}% Risk
                </Badge>
              </div>
              {data.alphaMountain.confidence && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Classification Confidence</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(Number(data.alphaMountain.confidence) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        {/* IP2Location Geolocation & Network Telemetry */}
        {data.ip2location && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  IP2Location Geolocation & Network Intelligence
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  IP2Location Verified
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Location</p>
                <p className="text-xs font-semibold mt-1">
                  {[data.ip2location.cityName, data.ip2location.regionName, data.ip2location.countryName]
                    .filter(Boolean)
                    .join(", ") || "Unknown"}
                  {data.ip2location.countryCode && (
                    <span className="text-muted-foreground ml-1 font-mono">({data.ip2location.countryCode})</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Coordinates</p>
                {data.ip2location.latitude !== 0 || data.ip2location.longitude !== 0 ? (
                  <a
                    href={`https://www.google.com/maps?q=${data.ip2location.latitude},${data.ip2location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    {data.ip2location.latitude.toFixed(4)}, {data.ip2location.longitude.toFixed(4)}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">N/A</p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Postal / Timezone</p>
                <p className="text-xs font-mono font-semibold mt-1">
                  {data.ip2location.zipCode || "N/A"}{" "}
                  {data.ip2location.timeZone ? `(${data.ip2location.timeZone})` : ""}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Autonomous System (AS)</p>
                <p className="text-xs font-mono font-semibold truncate mt-1" title={data.ip2location.asName}>
                  {data.ip2location.asn ? `${data.ip2location.asn} - ` : ""}
                  {data.ip2location.asName || "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* IP2WHOIS Hosted Domains (Reverse IP) */}
        {data.hostedDomains && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  IP2WHOIS Hosted Domains (Reverse IP)
                </span>
                <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-400/30">
                  {data.hostedDomains.totalDomains} Total Domain{data.hostedDomains.totalDomains !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Domains identified co-hosted on this IP infrastructure. Click any domain for 1-click intelligence lookup:
              </p>
              {data.hostedDomains.domains?.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.hostedDomains.domains.map((dom: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors font-mono text-xs py-1 px-2.5 flex items-center gap-1.5"
                      onClick={() => onLookupIOC?.({ type: "domain", value: dom })}
                      title={`Analyze domain ${dom}`}
                    >
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      {dom}
                    </Badge>
                  ))}
                  {data.hostedDomains.totalDomains > data.hostedDomains.domains.length && (
                    <span className="text-xs text-muted-foreground self-center font-mono pl-1">
                      + {data.hostedDomains.totalDomains - data.hostedDomains.domains.length} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-mono">No domains currently listed on this IP.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* IP2WHOIS Domain Intelligence */}
        {data.ip2whois && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  IP2WHOIS Structured Domain Intelligence
                </span>
                <div className="flex items-center gap-2">
                  {typeof data.ip2whois.domainAge === "number" && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        data.ip2whois.domainAge < 30
                          ? "text-destructive border-destructive/40 bg-destructive/10"
                          : data.ip2whois.domainAge < 90
                            ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                            : "text-muted-foreground"
                      }`}
                    >
                      {data.ip2whois.domainAge < 30 ? "⚠️ NRD: " : ""}
                      {data.ip2whois.domainAge.toLocaleString()} days old
                    </Badge>
                  )}
                  {data.ip2whois.status && (
                    <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                      {data.ip2whois.status}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Registrar</p>
                  <p className="text-xs font-semibold mt-1 truncate" title={data.ip2whois.registrar?.name}>
                    {data.ip2whois.registrar?.name || data.registrar || "Unknown"}
                  </p>
                  {data.ip2whois.registrar?.ianaId && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      IANA ID: {data.ip2whois.registrar.ianaId}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Registration Date</p>
                  <p className="text-xs font-mono font-semibold mt-1">
                    {data.ip2whois.createDate ? data.ip2whois.createDate.slice(0, 10) : data.registeredDate || "N/A"}
                  </p>
                  {data.ip2whois.updateDate && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Updated: {data.ip2whois.updateDate.slice(0, 10)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Registry Expiry</p>
                  <p className="text-xs font-mono font-semibold mt-1">
                    {data.ip2whois.expireDate ? data.ip2whois.expireDate.slice(0, 10) : data.expiryDate || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Registrant Organization</p>
                  <p className="text-xs font-semibold mt-1 truncate" title={data.ip2whois.registrant?.organization}>
                    {data.ip2whois.registrant?.organization || "Redacted / Private"}
                  </p>
                  {data.ip2whois.registrant?.country && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Country: {data.ip2whois.registrant.country}
                    </p>
                  )}
                </div>
              </div>

              {data.ip2whois.nameservers && data.ip2whois.nameservers.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mb-2">Authoritative Nameservers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.ip2whois.nameservers.map((ns: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border"
                      >
                        {ns}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* IPStack Geolocation & Security Telemetry */}
        {data.ipstack && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  IPStack Network & Security Modules
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  IPStack Verified
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Location</p>
                <p className="text-xs font-semibold mt-1">
                  {[data.ipstack.city, data.ipstack.regionName, data.ipstack.countryName].filter(Boolean).join(", ") || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">ASN / ISP</p>
                <p className="text-xs font-mono font-semibold mt-1 truncate" title={data.ipstack.isp || data.ipstack.asn}>
                  {data.ipstack.asn ? `${data.ipstack.asn} ` : ""}{data.ipstack.isp || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Proxy / Tor Detection</p>
                <p className="text-xs font-mono font-semibold mt-1">
                  {data.ipstack.security?.isProxy ? `Proxy (${data.ipstack.security.proxyType || "Active"})` : data.ipstack.security?.isTor ? "Tor Node" : "Clean Host"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Threat Level</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-mono mt-1 ${
                    data.ipstack.security?.threatLevel === "high" || data.ipstack.security?.threatLevel === "critical"
                      ? "text-destructive border-destructive/40 bg-destructive/10"
                      : "text-muted-foreground"
                  }`}
                >
                  {data.ipstack.security?.threatLevel || "Low"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* urlscan.io Automated Sandbox Telemetry */}
        {data.urlscan && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-orange-400" />
                  urlscan.io Web Sandbox &amp; DOM Intelligence
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono ${
                      data.urlscan.malicious
                        ? "text-destructive border-destructive/40 bg-destructive/10"
                        : "text-status-success border-status-success/30"
                    }`}
                  >
                    {data.urlscan.malicious ? "🚨 Malicious" : "Clean Sandbox Verdict"}
                  </Badge>
                  {data.urlscan.reportUrl && (
                    <a
                      href={data.urlscan.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                    >
                      Full Report <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Verdict Score</p>
                  <p className="text-xs font-mono font-semibold mt-1">{data.urlscan.score} / 100</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Server / ASN</p>
                  <p className="text-xs font-mono font-semibold mt-1 truncate">{data.urlscan.server || data.urlscan.asn || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">IP Address</p>
                  <p className="text-xs font-mono font-semibold mt-1">{data.urlscan.ip || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Page Title</p>
                  <p className="text-xs font-semibold mt-1 truncate" title={data.urlscan.title}>{data.urlscan.title || "N/A"}</p>
                </div>
              </div>
              {data.urlscan.technologies?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mb-1.5">Detected Stack / Technologies</p>
                  <div className="flex flex-wrap gap-1">
                    {data.urlscan.technologies.slice(0, 8).map((tech: string, i: number) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PhishStats Threat Signals */}
        {data.phishstats && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  PhishStats Real-Time Phishing Intelligence
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-mono ${
                    data.phishstats.score >= 7
                      ? "text-destructive border-destructive/40 bg-destructive/10"
                      : data.phishstats.score >= 4
                        ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                        : "text-muted-foreground"
                  }`}
                >
                  Score: {data.phishstats.score.toFixed(1)} / 10.0
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Target Brand</p>
                <p className="text-xs font-semibold mt-1 text-primary">{data.phishstats.targetBrand || "Generic Impersonation"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Threat Classification</p>
                <p className="text-xs font-mono font-semibold mt-1">{data.phishstats.threatType || "Phishing"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Tags</p>
                <p className="text-xs font-mono mt-1 text-muted-foreground truncate">{data.phishstats.tags?.join(", ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Indexed Date</p>
                <p className="text-xs font-mono mt-1">{data.phishstats.date?.slice(0, 10) || "Recent"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cloudmersive Security Status */}
        {data.cloudmersive && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Cloudmersive Security &amp; Anti-Malware Verification
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-mono ${
                    data.cloudmersive.cleanResult && !data.cloudmersive.isThreat
                      ? "text-status-success border-status-success/30"
                      : "text-destructive border-destructive/40 bg-destructive/10"
                  }`}
                >
                  {data.cloudmersive.cleanResult && !data.cloudmersive.isThreat ? "Clean Verification" : "Threat Flagged"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Threat Status: <span className="font-semibold text-foreground">{data.cloudmersive.threatType || data.cloudmersive.websiteThreatType || "None Detected"}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Threats */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Threat History & Vendor Detections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.threats?.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.threats.map((threat: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-[10px] capitalize border ${getSeverityColor(threat.severity)}`}
                      variant="outline"
                    >
                      {threat.severity}
                    </Badge>
                    <div>
                      <p className="text-sm">{threat.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {threat.source}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {threat.date}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No recent threat history found.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CVEResultView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl font-mono font-bold text-primary">
                {data.id}
              </span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity)}`}
                variant="outline"
              >
                {data.severity}
              </Badge>
              {data.exploitAvailable && (
                <Badge variant="destructive" className="text-[10px]">
                  Exploit Available
                </Badge>
              )}
              {data.patchAvailable && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-status-success border-status-success/30"
                >
                  Patch Available
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.description}
            </p>
          </div>
          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-muted/50 border-t md:border-t-0 md:border-l border-border">
            <span
              className={`text-5xl font-bold ${getRiskColor(data.cvssScore * 10)}`}
            >
              {data.cvssScore}
            </span>
            <span className="text-xs text-muted-foreground mt-1 font-mono">
              CVSS
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HashResultView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl font-mono font-bold truncate max-w-[300px]">
              {data.meaningfulName || "File Hash Analysis"}
            </span>
            <Badge
              className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
              variant="outline"
            >
              Risk: {data.riskScore}/100
            </Badge>
            {data.otx?.adversary && (
              <Badge variant="destructive" className="text-[10px] uppercase">
                Adversary: {data.otx.adversary}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SHA-256</p>
              <p className="text-xs font-mono break-all">{data.sha256 || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Vendor Detection Rate</p>
              <p className="text-sm font-semibold font-mono">{data.detectionRate}</p>
            </div>
            {data.fileType && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Type</p>
                <p className="text-xs font-mono">{data.fileType}</p>
              </div>
            )}
          </div>

          {data.tags && data.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Threat Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function URLResultView({ data }: { data: any }) {
  if (data?.providerResults || data?.riskBreakdown || data?.structural) {
    return <URLAnalysisComponent analysis={data} />;
  }

  const riskFactors = data.riskFactors || [];
  const findings = data.findings || [];
  const structural = data.structural || {};
  const sources = data.sources || [];

  return (
    <div className="space-y-6">
      {/* Main Overview Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-lg font-mono font-bold truncate max-w-md text-foreground" title={data.url}>
                {data.url}
              </span>
              <Badge
                className={`capitalize border ${getSeverityColor(data.severity || "info")}`}
                variant="outline"
              >
                {data.severity || "info"}
              </Badge>
              {data.verdict && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase ${
                    data.verdict === "SAFE"
                      ? "text-status-success border-status-success/30"
                      : data.verdict === "SUSPICIOUS"
                        ? "text-status-warning border-status-warning/30"
                        : "text-destructive border-destructive/30"
                  }`}
                >
                  {data.verdict}
                </Badge>
              )}
            </div>

            {sources.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Sources:</span>
                {sources.map((src: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                    {src}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-muted/50 border-t md:border-t-0 md:border-l border-border">
            <span className={`text-4xl font-bold font-mono ${getRiskColor(data.riskScore || 0)}`}>
              {data.riskScore ?? 0}
            </span>
            <span className="text-xs text-muted-foreground mt-1 font-mono">
              Risk Score / 100
            </span>
          </div>
        </div>
      </Card>

      {/* Identified Risk Factors */}
      {riskFactors.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Identified Risk Factors ({riskFactors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {riskFactors.map((rf: any, i: number) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 rounded-lg bg-card border border-border gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Badge
                    className={`text-[10px] uppercase shrink-0 mt-0.5 border ${getSeverityColor(rf.severity?.toLowerCase() || "info")}`}
                    variant="outline"
                  >
                    {rf.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{rf.reason}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Source: {rf.source}
                    </p>
                  </div>
                </div>
                {rf.scoreContribution && (
                  <span className="text-xs font-mono font-bold text-primary shrink-0">
                    +{rf.scoreContribution} pts
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Structural Telemetry */}
      {structural.domain && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-mono">Domain</p>
            <p className="text-xs font-mono font-semibold truncate mt-1">{structural.domain}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-mono">Protocol</p>
            <p className="text-xs font-mono font-semibold uppercase mt-1">{structural.protocol}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-mono">Length / Entropy</p>
            <p className="text-xs font-mono font-semibold mt-1">
              {structural.urlLength}c / {structural.entropy ?? "N/A"}
            </p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase font-mono">Host Type</p>
            <p className="text-xs font-mono font-semibold mt-1">
              {structural.isIPBased ? "Direct IP Host" : "Standard Domain"}
            </p>
          </Card>
        </div>
      )}

      {/* Telemetry Findings */}
      {findings.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-primary" />
              Detailed Telemetry Findings ({findings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {findings.map((finding: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-card border border-border space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-[10px] uppercase border ${getSeverityColor(finding.severity?.toLowerCase() || "info")}`}
                    variant="outline"
                  >
                    {finding.severity}
                  </Badge>
                  <span className="text-xs font-semibold">{finding.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{finding.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
}) {
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

function FlagItem({
  label,
  detected,
}: {
  label: string;
  detected: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-card">
      <span className="text-sm">{label}</span>
      {detected ? (
        <div className="flex items-center gap-1 text-severity-critical">
          <XCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Detected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-status-success">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium">Clean</span>
        </div>
      )}
    </div>
  );
}
