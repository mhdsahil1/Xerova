"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  FileJson,
  Printer,
  Edit,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Tag,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRiskColor, getRiskLabel, getSeverityColor } from "@/lib/utils";

interface ReportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report: any | null;
  onEdit?: () => void;
  onStatusChange?: () => void;
  onLookupIOC?: (ioc: { type: string; value: string }) => void;
}

export function ReportViewDialog({
  open,
  onOpenChange,
  report,
  onEdit,
  onStatusChange,
  onLookupIOC,
}: ReportViewDialogProps) {
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedIOC, setCopiedIOC] = useState<string | null>(null);
  const [iocSearch, setIocSearch] = useState("");
  // Mirror prop into local state so we can update status immediately after toggle
  const [localStatus, setLocalStatus] = useState<"draft" | "finalized">(report?.status || "draft");

  // Sync localStatus when report prop changes (e.g. opening a different report)
  useEffect(() => {
    if (report?.status) setLocalStatus(report.status);
    setIocSearch("");
  }, [report?._id, report?.status]);

  const handleExport = (format: "md" | "json") => {
    if (!report?._id) return;
    window.open(`/api/reports/${report._id}/export?format=${format}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyIOC = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIOC(val);
    setTimeout(() => setCopiedIOC(null), 1500);
  };

  const handleToggleStatus = async () => {
    if (!report?._id) return;
    const nextStatus = localStatus === "finalized" ? "draft" : "finalized";
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/reports/${report._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setLocalStatus(nextStatus);
        if (onStatusChange) onStatusChange();
      }
    } catch {
      // Ignore
    } finally {
      setTogglingStatus(false);
    }
  };

  if (!report) return null;

  const filteredIOCs = (report.iocs || []).filter((ioc: { type?: string; value?: string; context?: string }) => {
    if (!iocSearch.trim()) return true;
    const q = iocSearch.toLowerCase();
    return (
      (ioc.value && ioc.value.toLowerCase().includes(q)) ||
      (ioc.type && ioc.type.toLowerCase().includes(q)) ||
      (ioc.context && ioc.context.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card border-border print:max-w-none print:m-0 print:border-none print:shadow-none print:bg-white print:text-black transition-all duration-200 flex flex-col p-0 overflow-hidden ${
          isFullscreen
            ? "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen sm:max-w-none h-screen max-h-none rounded-none z-50"
            : "w-[96vw] sm:max-w-[96vw] md:max-w-[94vw] lg:max-w-[1380px] h-[92vh] max-h-[92vh] rounded-lg"
        }`}
      >
        {/* Sticky Executive Header Bar */}
        <div className="border-b border-border bg-card/95 px-6 py-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-black">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-mono">
                {report.type?.replace("_", " ")}
              </Badge>
              <Badge
                variant={localStatus === "finalized" ? "default" : "secondary"}
                className={`uppercase text-[10px] font-mono ${
                  localStatus === "finalized"
                    ? "bg-status-success/15 text-status-success border-status-success/30"
                    : "bg-status-warning/15 text-status-warning border-status-warning/30"
                }`}
              >
                {localStatus === "finalized" ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <Clock className="w-3 h-3 mr-1" />
                )}
                {localStatus}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono truncate">
                REF: {report._id}
              </span>
            </div>

            <DialogTitle className="text-lg md:text-xl font-bold tracking-tight text-foreground print:text-black truncate">
              {report.title}
            </DialogTitle>

            <p className="text-xs text-muted-foreground print:text-gray-600 flex items-center gap-2 flex-wrap">
              <span>Generated {new Date(report.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3 text-primary" /> XEROVA Intelligence Workstation
              </span>
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden pr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="h-8 text-xs font-medium"
            >
              {localStatus === "finalized" ? "Mark as Draft" : "Mark as Finalized"}
            </Button>

            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleExport("md")}>
              <Download className="w-3.5 h-3.5 mr-1" />
              Markdown
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleExport("json")}>
              <FileJson className="w-3.5 h-3.5 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print
            </Button>
            {onEdit && (
              <Button size="sm" onClick={onEdit} className="h-8 text-xs bg-primary text-primary-foreground">
                <Edit className="w-3.5 h-3.5 mr-1" />
                Edit Report
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Executive Overview Scorecard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Risk Score */}
            <Card className="bg-card border-border md:col-span-2">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Overall Risk Rating
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl md:text-4xl font-extrabold font-mono ${getRiskColor(report.riskScore || 0)}`}>
                      {report.riskScore || 0}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                    <Badge variant="outline" className={`ml-2 text-xs font-semibold uppercase ${getRiskColor(report.riskScore || 0)}`}>
                      {getRiskLabel(report.riskScore || 0)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Aggregated threat score computed across all evaluated indicators.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Indicators */}
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Indicators (IOCs)
                </span>
                <p className="text-3xl font-bold font-mono text-foreground">
                  {report.iocs?.length || 0}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Extracted IPs, domains, hashes, and URLs.
                </p>
              </CardContent>
            </Card>

            {/* Findings & Evidence */}
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-severity-high" /> Findings &amp; Evidence
                </span>
                <p className="text-3xl font-bold font-mono text-foreground">
                  {(report.findings?.length || 0) + (report.threatEvidence?.length || 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {report.findings?.length || 0} technical findings, {report.threatEvidence?.length || 0} telemetry feeds.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          {report.summary && (
            <Card className="bg-card border-border">
              <CardHeader className="py-3.5 px-5 border-b border-border">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {report.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Extracted IOCs Table */}
          {report.iocs && report.iocs.length > 0 && (
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Indicators of Compromise (IOCs) [{report.iocs.length}]
                </CardTitle>
                <div className="relative w-full sm:w-64 print:hidden">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter indicators..."
                    value={iocSearch}
                    onChange={(e) => setIocSearch(e.target.value)}
                    className="w-full h-7 pl-8 pr-3 text-xs rounded-md bg-background/60 border border-border focus:border-primary/60 outline-none"
                  />
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4 w-28">Type</th>
                      <th className="py-2.5 px-4">Indicator Value</th>
                      <th className="py-2.5 px-4">Context / Description</th>
                      <th className="py-2.5 px-4 text-right print:hidden w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {filteredIOCs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground font-sans">
                          No indicators match your filter query.
                        </td>
                      </tr>
                    ) : (
                      filteredIOCs.map((ioc: { type?: string; value?: string; context?: string }, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/40 transition-colors">
                          <td className="py-2.5 px-4 font-semibold uppercase">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {ioc.type || "IOC"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-foreground break-all">
                            {ioc.value}
                          </td>
                          <td className="py-2.5 px-4 font-sans text-muted-foreground text-xs">
                            {ioc.context || "Identified during investigation"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-sans print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleCopyIOC(ioc.value || "")}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                title="Copy IOC"
                              >
                                {copiedIOC === ioc.value ? (
                                  <Check className="w-3 h-3 text-status-success" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              {onLookupIOC && ioc.value && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => onLookupIOC({ type: ioc.type || "domain", value: ioc.value || "" })}
                                  className="h-6 px-2 text-[11px] text-primary hover:bg-primary/10"
                                >
                                  <Search className="w-3 h-3 mr-1" />
                                  Pivot Lookup
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Detailed Findings */}
          {report.findings && report.findings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Detailed Technical Findings [{report.findings.length}]
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {report.findings.map((f: { title: string; description: string; severity: string; evidence?: string }, idx: number) => (
                  <Card key={idx} className="bg-card border-border">
                    <CardHeader className="py-3 px-5 flex flex-row items-center justify-between border-b border-border">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs">#{idx + 1}</span>
                        <span>{f.title}</span>
                      </CardTitle>
                      <Badge
                        className={`text-[10px] capitalize border ${getSeverityColor(f.severity)}`}
                        variant="outline"
                      >
                        {f.severity}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                        {f.description}
                      </p>

                      {f.evidence && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Technical Evidence / Payload
                          </span>
                          <pre className="p-3.5 rounded-md bg-background/80 border border-border text-[11px] font-mono overflow-x-auto text-primary leading-normal">
                            {f.evidence}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Threat Intelligence Telemetry Feeds */}
          {report.threatEvidence && report.threatEvidence.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                External Threat Intelligence Telemetry [{report.threatEvidence.length}]
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.threatEvidence.map((ev: { source: string; description: string; severity: string; date?: string }, idx: number) => (
                  <Card key={idx} className="bg-card border-border p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {ev.source}
                        </span>
                        <Badge
                          className={`text-[10px] capitalize border ${getSeverityColor(ev.severity)}`}
                          variant="outline"
                        >
                          {ev.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                    </div>
                    {ev.date && (
                      <span className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/40">
                        Observed: {ev.date}
                      </span>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
