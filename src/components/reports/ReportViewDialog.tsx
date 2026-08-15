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
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  // Mirror prop into local state so we can update status immediately after toggle
  const [localStatus, setLocalStatus] = useState<"draft" | "finalized">(report?.status || "draft");

  // Sync localStatus when report prop changes (e.g. opening a different report)
  useEffect(() => {
    if (report?.status) setLocalStatus(report.status);
  }, [report?._id, report?.status]);

  const handleExport = (format: "md" | "json") => {
    window.open(`/api/reports/${report._id}/export?format=${format}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleStatus = async () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border print:max-w-none print:m-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Printable Styling Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4 print:border-black">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-mono">
                {report.type?.replace("_", " ")}
              </Badge>
              <Badge
                variant={localStatus === "finalized" ? "default" : "secondary"}
                className={`uppercase text-[10px] ${
                  localStatus === "finalized"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}
              >
                {localStatus === "finalized" ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <Clock className="w-3 h-3 mr-1" />
                )}
                {localStatus}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {report._id}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground print:text-black mt-1">
              {report.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground print:text-gray-600 flex items-center gap-2">
              <span>Generated on {new Date(report.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-primary" /> XEROVA Intelligence Platform
              </span>
            </p>
          </div>

          {/* Actions Bar (Hidden during print) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
              <Button
                variant="outline"
                size="xs"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className="text-xs"
              >
                {localStatus === "finalized" ? "Mark as Draft" : "Mark as Finalized"}
              </Button>

            <Button variant="outline" size="xs" onClick={() => handleExport("md")}>
              <Download className="w-3.5 h-3.5 mr-1" />
              MD
            </Button>
            <Button variant="outline" size="xs" onClick={() => handleExport("json")}>
              <FileJson className="w-3.5 h-3.5 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="xs" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print
            </Button>
            {onEdit && (
              <Button size="xs" onClick={onEdit} className="bg-primary text-primary-foreground">
                <Edit className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Executive Presentation Body */}
        <div className="space-y-6 pt-2">
          {/* Top Score Banner */}
          <Card className="bg-card/60 border-border/50 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-semibold flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="w-5 h-5 text-primary" />
                  Overall Risk Score Assessment
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Calculated using aggregated threat intelligence sources, detection rates, and vulnerability severity.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-background/50 px-6 py-4 rounded-xl border border-border/50 shrink-0">
                <div className="text-center">
                  <span className={`text-4xl font-extrabold font-mono ${getRiskColor(report.riskScore || 0)}`}>
                    {report.riskScore || 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground block uppercase">/ 100</span>
                </div>
                <div className="h-10 w-px bg-border/60" />
                <div>
                  <span className={`text-sm font-bold uppercase block ${getRiskColor(report.riskScore || 0)}`}>
                    {getRiskLabel(report.riskScore || 0)} Risk
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {report.iocs?.length || 0} IOCs • {report.findings?.length || 0} Findings
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Executive Summary */}
          {report.summary && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Executive Summary
              </h4>
              <div className="p-4 rounded-lg bg-background/40 border border-border/50 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                {report.summary}
              </div>
            </div>
          )}

          {/* Extracted IOCs */}
          {report.iocs && report.iocs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Extracted Indicators of Compromise (IOCs) [{report.iocs.length}]
              </h4>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-background/80 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/50">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Indicator Value</th>
                      <th className="py-2.5 px-3">Context / Description</th>
                      <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 bg-background/30 font-mono">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {report.iocs.map((ioc: any, idx: number) => (
                      <tr key={idx} className="hover:bg-background/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold uppercase">
                          <Badge variant="outline" className="text-[10px]">
                            {ioc.type}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-primary font-bold break-all">
                          {ioc.value}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-muted-foreground">
                          {ioc.context || "No context provided"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans print:hidden">
                          {onLookupIOC && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => onLookupIOC(ioc)}
                              className="text-primary hover:bg-primary/10 text-[11px]"
                            >
                              <Search className="w-3 h-3 mr-1" />
                              Lookup
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Threat Intelligence Evidence */}
          {report.threatEvidence && report.threatEvidence.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Threat Intelligence Evidence
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {report.threatEvidence.map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-background/40 border border-border/40 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
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
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                    </div>
                    {ev.date && (
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {ev.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Findings */}
          {report.findings && report.findings.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Detailed Findings & Technical Evidence
              </h4>
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {report.findings.map((f: any, idx: number) => (
                  <Card key={idx} className="bg-card/40 border-border/50">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <span>{idx + 1}. {f.title}</span>
                      </CardTitle>
                      <Badge
                        className={`text-[10px] capitalize border ${getSeverityColor(f.severity)}`}
                        variant="outline"
                      >
                        {f.severity}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {f.description}
                      </p>

                      {f.evidence && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Technical Evidence Payload
                          </span>
                          <pre className="p-3 rounded bg-background/80 border border-border/50 text-[11px] font-mono overflow-x-auto text-emerald-400">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
