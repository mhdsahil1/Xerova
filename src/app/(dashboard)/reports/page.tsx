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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            Intelligence Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, present, and export security & threat investigation reports.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-cyber-cyan to-cyber-blue text-white shrink-0 font-semibold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports by title, summary, IOC, or finding..."
                className="pl-9 h-10 text-sm bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md bg-background/50 border border-border/50 focus:border-primary"
            >
              <option value="all">All Report Types</option>
              <option value="investigation">Investigation</option>
              <option value="threat_analysis">Threat Analysis</option>
              <option value="incident">Incident Response</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md bg-background/50 border border-border/50 focus:border-primary"
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
          <div className="bg-status-error/10 border border-status-error/20 text-status-error p-4 rounded-lg flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Failed to Load Reports</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Reports List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16" role="status" aria-label="Loading reports">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-4">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-card/30 border border-border/50 rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No reports found</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            You haven&apos;t generated any intelligence reports yet or none match your search filter.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4" variant="outline">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create First Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <Card
              key={report._id}
              className="bg-card/50 border-border/50 hover:border-primary/40 transition-all group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => handleOpenView(report)}
                        className="text-lg font-bold hover:text-primary cursor-pointer transition-colors truncate"
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
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
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

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.summary || "No summary provided."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono text-primary font-semibold">{report.iocs?.length || 0} IOCs</span>
                      <span>•</span>
                      <span>{report.findings?.length || 0} Findings</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenView(report)}
                      className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(report)}
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report._id, "md")}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      MD
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(report._id, "json")}
                    >
                      <FileJson className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReport(report._id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
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
