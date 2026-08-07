"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Loader2, FileJson, Trash2, PlusCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReports(data.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  const exportReport = async (id: string, format: "md" | "json") => {
    try {
      window.open(`/api/reports/${id}/export?format=${format}`, "_blank");
    } catch (e) {
      console.error(e);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      alert("Failed to delete report");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            Intelligence Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and export your threat investigation reports
          </p>
        </div>
        <Button className="bg-gradient-to-r from-cyber-cyan to-cyber-blue text-white" disabled>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Failed to Load</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-card/30 border border-border/50 rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No reports found</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            You haven't generated any intelligence reports yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <Card key={report._id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{report.title}</h3>
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {report.type.replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Risk: {report.riskScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.summary || "No summary provided."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>{report.iocs?.length || 0} IOCs</span>
                      <span>{report.findings?.length || 0} Findings</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:flex-col shrink-0">
                    <Button variant="outline" size="sm" onClick={() => exportReport(report._id, "md")} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportReport(report._id, "json")} className="w-full">
                      <FileJson className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteReport(report._id)} className="w-full text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
