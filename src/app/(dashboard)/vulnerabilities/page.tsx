"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Layers,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VulnerabilityCard } from "@/components/vulnerabilities/VulnerabilityCard";
import { VulnerabilityDetailDialog } from "@/components/vulnerabilities/VulnerabilityDetailDialog";
import type { DetailedCVE } from "@/lib/nvd";

export default function VulnerabilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-7 h-7 text-primary animate-spin mb-3" />
          <p className="text-xs font-mono text-muted-foreground">Connecting NVD CVE intelligence stream...</p>
        </div>
      }
    >
      <VulnerabilitiesPageContent />
    </Suspense>
  );
}

function VulnerabilitiesPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("cveId") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSeverity, setActiveSeverity] = useState<string>("ALL");
  const [daysBack, setDaysBack] = useState<number>(60);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const [vulnerabilities, setVulnerabilities] = useState<DetailedCVE[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCVE, setSelectedCVE] = useState<DetailedCVE | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  const loadVulnerabilities = useCallback(
    async (queryStr: string, severity: string, days: number, page: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const startIndex = (page - 1) * pageSize;
        const params = new URLSearchParams();
        if (queryStr.trim()) {
          params.set("query", queryStr.trim());
        }
        if (severity !== "ALL") {
          params.set("severity", severity);
        }
        params.set("daysBack", String(days));
        params.set("startIndex", String(startIndex));
        params.set("limit", String(pageSize));
        params.set("includeHistory", "true");

        const res = await fetch(`/api/vulnerabilities?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `NVD API request failed (${res.status})`);
        }

        const data = await res.json();

        if (data.isSingle && data.cve) {
          setVulnerabilities([data.cve]);
          setTotalResults(1);
          setSelectedCVE(data.cve);
          setDetailOpen(true);
        } else {
          setVulnerabilities(data.vulnerabilities || []);
          setTotalResults(data.totalResults || 0);
        }
      } catch (err) {
        console.error("[Vulnerabilities Page] Fetch error:", err);
        setError((err as Error).message || "Failed to load vulnerabilities from NVD.");
        setVulnerabilities([]);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    loadVulnerabilities(searchQuery, activeSeverity, daysBack, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeverity, daysBack, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadVulnerabilities(searchQuery, activeSeverity, daysBack, 1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveSeverity("ALL");
    setDaysBack(60);
    setCurrentPage(1);
    loadVulnerabilities("", "ALL", 60, 1);
  };

  const handleOpenDetail = (cve: DetailedCVE) => {
    setSelectedCVE(cve);
    setDetailOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Vulnerability Intelligence Center
              </h1>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-mono">
              Live National Vulnerability Database (NVD) CVE stream, CVSS v3.1 score breakdowns, and Change History event timelines.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-xs font-mono py-1 px-2.5 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NVD 2.0 Authenticated Feed
            </Badge>
          </div>
        </div>

        {/* Ambient Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-4.5 space-y-4 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by CVE ID (e.g. CVE-2024-3094), software name, vendor, or keyword..."
              className="pl-10 h-11 text-xs sm:text-sm bg-black/40 border-white/[0.08] focus:border-cyan-400/50 font-mono text-white placeholder:text-muted-foreground/60 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 px-6 bg-white hover:bg-white/90 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer shrink-0"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : "Query NVD"}
          </Button>
        </form>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground mr-1">Severity:</span>
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => {
                  setActiveSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all capitalize cursor-pointer ${
                  activeSeverity === sev
                    ? "bg-white text-black font-bold shadow-sm"
                    : "bg-white/[0.04] text-muted-foreground hover:text-white border border-white/[0.04]"
                }`}
              >
                {sev.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Timeframe selector & total count */}
          <div className="flex items-center gap-3 ml-auto text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px]">Timeframe:</span>
              {[30, 60, 120].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    setDaysBack(days);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                    daysBack === days
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold"
                      : "bg-white/[0.03] text-muted-foreground hover:text-white"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            <span className="text-muted-foreground text-[11px] pl-2 border-l border-white/[0.06]">
              {totalResults.toLocaleString()} CVEs found
            </span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-center justify-between gap-3 text-rose-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="h-7 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* Loading Skeleton / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/[0.06] bg-[#0c0d12] p-5 h-56 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-white/[0.06] rounded w-1/3" />
                <div className="h-3 bg-white/[0.04] rounded w-full" />
                <div className="h-3 bg-white/[0.04] rounded w-5/6" />
              </div>
              <div className="h-8 bg-white/[0.04] rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : vulnerabilities.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vulnerabilities.map((cve) => (
              <VulnerabilityCard key={cve.id} cve={cve} onSelect={handleOpenDetail} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalResults > pageSize && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#0c0d12] text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">
                Showing page {currentPage} of {totalPages} ({totalResults.toLocaleString()} total CVEs)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 border-white/[0.08] hover:bg-white/[0.04] text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-8 px-3 border-white/[0.08] hover:bg-white/[0.04] text-white cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Vulnerabilities Matching Filters</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto font-mono">
            No CVEs were returned by the NVD API for the selected keyword or severity criteria within the {daysBack}-day window.
          </p>
          <Button
            size="sm"
            onClick={handleResetFilters}
            className="mt-2 bg-white/[0.08] hover:bg-white/[0.14] text-white font-mono text-xs cursor-pointer"
          >
            Clear Filters & Search All
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <VulnerabilityDetailDialog
        cve={selectedCVE}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
