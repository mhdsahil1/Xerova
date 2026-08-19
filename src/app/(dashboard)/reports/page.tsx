"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  FileJson,
  Trash2,
  PlusCircle,
  AlertCircle,
  Search,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRiskColor } from "@/lib/utils";
import { CreateReportDialog } from "@/components/reports/CreateReportDialog";
import { EditReportDialog } from "@/components/reports/EditReportDialog";
import { ReportViewDialog } from "@/components/reports/ReportViewDialog";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadReports();
  }, [search, typeFilter, statusFilter]);

  async function loadReports() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReports(data.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  const exportReport = (id: string, format: "md" | "json") => {
    window.open(`/api/reports/${id}/export?format=${format}`, "_blank");
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this intelligence report?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setReports((prev) => prev.filter((r) => r._id !== id));
      if (selectedReport?._id === id) {
        setViewOpen(false);
        setEditOpen(false);
      }
    } catch {
      alert("Failed to delete report");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenView = (report: any) => {
    setSelectedReport(report);
    setViewOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenEdit = (report: any) => {
    setSelectedReport(report);
    setEditOpen(true);
  };

  const handleLookupIOC = (ioc: { type: string; value: string }) => {
    router.push(`/threats?query=${encodeURIComponent(ioc.value)}&type=${ioc.type}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-primary" />
            Intelligence Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create, manage, and export security and threat investigation reports.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground shrink-0 font-medium"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports by title, summary, IOC, or finding..."
                className="pl-9 h-9 text-xs bg-card border-border focus:border-primary/60 font-sans"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md bg-card border border-border focus:border-primary/60 text-foreground"
            >
              <option value="all">All Report Types</option>
              <option value="investigation">Investigation</option>
              <option value="threat_analysis">Threat Analysis</option>
              <option value="incident">Incident Response</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-md bg-card border border-border focus:border-primary/60 text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <div className="bg-status-error/10 border border-status-error/20 text-status-error p-3.5 rounded-md flex items-start gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs">Failed to Load Reports</h4>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Reports List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Loading reports">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground mt-3 font-mono">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-14 bg-card border border-border rounded-lg">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground">No reports found</h3>
          <p className="text-xs text-muted-foreground/70 mt-1">
            You haven&apos;t generated any intelligence reports yet or none match your search filter.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-3.5 text-xs h-8" variant="outline">
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Create First Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reports.map((report) => (
            <Card
              key={report._id}
              className="bg-card border-border hover:border-border/80 transition-colors duration-150 group"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3.5">
                  <div className="flex-1 space-y-2.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => handleOpenView(report)}
                        className="text-base font-semibold hover:text-primary cursor-pointer transition-colors duration-150 truncate"
                      >
                        {report.title}
                      </h3>
                      <Badge variant="outline" className="uppercase text-[10px] shrink-0 font-mono">
                        {report.type.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant={report.status === "finalized" ? "default" : "secondary"}
                        className={`uppercase text-[10px] shrink-0 ${
                          report.status === "finalized"
                            ? "bg-status-success/15 text-status-success border-status-success/30"
                            : "bg-status-warning/15 text-status-warning border-status-warning/30"
                        }`}
                      >
                        {report.status === "finalized" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {report.status || "draft"}
                      </Badge>
                      <span className={`text-xs font-mono font-bold shrink-0 ${getRiskColor(report.riskScore || 0)}`}>
                        Risk: {report.riskScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {report.summary || "No summary provided."}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono text-primary font-medium">{report.iocs?.length || 0} IOCs</span>
                      <span>•</span>
                      <span>{report.findings?.length || 0} Findings</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenView(report)}
                      className="h-8 text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(report)}
                      className="h-8 text-xs"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report._id, "md")}
                      className="h-8 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      MD
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report._id, "json")}
                      className="h-8 text-xs"
                    >
                      <FileJson className="w-3.5 h-3.5 mr-1" />
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReport(report._id)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      aria-label="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Components */}
      <CreateReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadReports}
      />

      <EditReportDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        report={selectedReport}
        onSuccess={loadReports}
      />

      <ReportViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        report={selectedReport}
        onEdit={() => {
          setViewOpen(false);
          setEditOpen(true);
        }}
        onStatusChange={loadReports}
        onLookupIOC={handleLookupIOC}
      />
    </motion.div>
  );
}
