"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Shield,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { extractIOCs, type ExtractedIOC } from "@/lib/ioc-extractor";

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialInvestigation?: any;
}

export function CreateReportDialog({
  open,
  onOpenChange,
  onSuccess,
  initialInvestigation,
}: CreateReportDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"investigation" | "threat_analysis" | "incident">("investigation");
  const [status, setStatus] = useState<"draft" | "finalized">("draft");
  const [summary, setSummary] = useState("");
  const [riskScore, setRiskScore] = useState<number>(50);
  const [findings, setFindings] = useState<
    { title: string; description: string; severity: "critical" | "high" | "medium" | "low" | "info"; evidence: string }[]
  >([]);
  const [iocs, setIocs] = useState<
    { type: "ip" | "domain" | "hash" | "url" | "email" | "cve"; value: string; context: string }[]
  >([]);
  const [threatEvidence, setThreatEvidence] = useState<
    { source: string; description: string; severity: "critical" | "high" | "medium" | "low" | "info"; date?: string }[]
  >([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pastInvestigations, setPastInvestigations] = useState<any[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch past investigations for auto-populate dropdown
  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  // Pre-fill if initialInvestigation provided
  useEffect(() => {
    if (initialInvestigation) {
      applyInvestigationData(initialInvestigation);
    }
  }, [initialInvestigation]);

  async function fetchHistory() {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/threats/history?limit=30");
      const data = await res.json();
      if (res.ok) {
        setPastInvestigations(data.items || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyInvestigationData(inv: any) {
    setTitle(`Investigation Report: ${inv.query} (${inv.type.toUpperCase()})`);
    setType("investigation");
    setRiskScore(inv.riskScore || 0);

    const extracted = extractIOCs(JSON.stringify(inv.results || {}));
    const newIocs = extracted.map((i) => ({
      type: i.type,
      value: i.value,
      context: `Extracted from ${inv.query} lookup`,
    }));

    if (!newIocs.some((i) => i.value.toLowerCase() === inv.query.toLowerCase())) {
      newIocs.unshift({
        type: inv.type,
        value: inv.query,
        context: "Target query of investigation",
      });
    }
    setIocs(newIocs);

    // Build evidence & findings
    const evList: { source: string; description: string; severity: "critical" | "high" | "medium" | "low" | "info"; date?: string }[] = [];
    const findingsList: { title: string; description: string; severity: "critical" | "high" | "medium" | "low" | "info"; evidence: string }[] = [];

    if (inv.results?.threats && Array.isArray(inv.results.threats)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inv.results.threats.forEach((t: any) => {
        evList.push({
          source: t.source || "Threat Intelligence Feed",
          description: t.description || "Threat record detected",
          severity: t.severity || inv.severity || "medium",
          date: t.date || new Date().toISOString().slice(0, 10),
        });
      });
    } else if (inv.results?.sources && Array.isArray(inv.results.sources)) {
      inv.results.sources.forEach((s: string) => {
        evList.push({
          source: s,
          description: `Analysis completed via ${s}. Risk score: ${inv.riskScore}/100.`,
          severity: inv.severity || "info",
          date: new Date().toISOString().slice(0, 10),
        });
      });
    }

    setThreatEvidence(evList);

    findingsList.push({
      title: `High Risk Indicator Identified for ${inv.query}`,
      description: `Analysis of ${inv.type.toUpperCase()} target "${inv.query}" yielded a risk score of ${inv.riskScore}/100 with severity classification of ${inv.severity?.toUpperCase()}.`,
      severity: inv.severity || "medium",
      evidence: JSON.stringify(inv.results || {}, null, 2).slice(0, 500),
    });

    setFindings(findingsList);
    setSummary(
      `Security investigation conducted on ${inv.type.toUpperCase()} target "${inv.query}". Initial risk assessment returned a score of ${inv.riskScore}/100 (${inv.severity || "info"}). ${newIocs.length} Indicators of Compromise (IOCs) were extracted and recorded for further tracking.`
    );
  }

  const handleSelectInvestigation = (invId: string) => {
    setSelectedInvId(invId);
    const found = pastInvestigations.find((i) => i._id === invId);
    if (found) {
      applyInvestigationData(found);
    }
  };

  const handleAutoExtractIOCs = () => {
    const combinedText = `${summary}\n${findings.map((f) => `${f.title} ${f.description} ${f.evidence}`).join("\n")}`;
    const extracted = extractIOCs(combinedText);
    const formatted = extracted.map((i) => ({
      type: i.type,
      value: i.value,
      context: i.context || "Extracted from report text",
    }));

    // Merge without duplicates
    setIocs((prev) => {
      const existing = new Set(prev.map((p) => `${p.type}:${p.value.toLowerCase()}`));
      const fresh = formatted.filter((f) => !existing.has(`${f.type}:${f.value.toLowerCase()}`));
      return [...prev, ...fresh];
    });
  };

  const addFinding = () => {
    setFindings((prev) => [
      ...prev,
      { title: "", description: "", severity: "medium", evidence: "" },
    ]);
  };

  const removeFinding = (index: number) => {
    setFindings((prev) => prev.filter((_, i) => i !== index));
  };

  const addIOC = () => {
    setIocs((prev) => [...prev, { type: "ip", value: "", context: "" }]);
  };

  const removeIOC = (index: number) => {
    setIocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Report title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        type,
        status,
        summary: summary.trim(),
        riskScore,
        findings: findings.filter((f) => f.title.trim()),
        iocs: iocs.filter((i) => i.value.trim()),
        threatEvidence,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create report");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setSaving(false);
    }
  };

  function resetForm() {
    setTitle("");
    setType("investigation");
    setStatus("draft");
    setSummary("");
    setRiskScore(50);
    setFindings([]);
    setIocs([]);
    setThreatEvidence([]);
    setSelectedInvId("");
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-[94vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Create Intelligence Report
          </DialogTitle>
          <DialogDescription>
            Generate a security report from scratch or auto-populate from past investigation data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Import from Past Investigation */}
          <div className="p-3.5 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Auto-Populate from Investigation History
            </label>
            <select
              value={selectedInvId}
              onChange={(e) => handleSelectInvestigation(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-md bg-background border border-border focus:border-primary font-mono"
            >
              <option value="">-- Select past investigation to import --</option>
              {pastInvestigations.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  [{inv.type.toUpperCase()}] {inv.query} (Risk: {inv.riskScore}) - {new Date(inv.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Report Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Threat Analysis: Malicious IP 185.220.101.5"
                className="bg-background/50 border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Report Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-10 px-3 text-sm rounded-md bg-background border border-border focus:border-primary"
              >
                <option value="investigation">Investigation</option>
                <option value="threat_analysis">Threat Analysis</option>
                <option value="incident">Incident Response</option>
              </select>
            </div>
          </div>

          {/* Status & Risk Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 text-sm rounded-md bg-background border border-border focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="finalized">Finalized</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Risk Score (0 - 100)
                </label>
                <span className="text-xs font-mono font-bold text-primary">
                  {riskScore} / 100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Executive Summary
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="High-level summary of findings, threat actor motives, and key takeaways..."
              className="min-h-[90px] bg-background/50 border-border text-sm"
            />
          </div>

          {/* Extracted IOCs */}
          <div className="space-y-3 p-4 rounded-lg bg-background/30 border border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Indicators of Compromise (IOCs) [{iocs.length}]
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAutoExtractIOCs}
                  className="text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-Extract
                </Button>
                <Button type="button" variant="secondary" size="xs" onClick={addIOC}>
                  <Plus className="w-3 h-3 mr-1" /> Add IOC
                </Button>
              </div>
            </div>

            {iocs.map((ioc, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={ioc.type}
                  onChange={(e) => {
                    const next = [...iocs];
                    next[idx].type = e.target.value as any;
                    setIocs(next);
                  }}
                  className="h-9 px-2 text-xs rounded border border-border bg-background uppercase font-mono"
                >
                  <option value="ip">IP</option>
                  <option value="domain">Domain</option>
                  <option value="hash">Hash</option>
                  <option value="url">URL</option>
                  <option value="cve">CVE</option>
                  <option value="email">Email</option>
                </select>
                <Input
                  value={ioc.value}
                  onChange={(e) => {
                    const next = [...iocs];
                    next[idx].value = e.target.value;
                    setIocs(next);
                  }}
                  placeholder="Indicator value (e.g. 1.1.1.1 or mal.exe hash)"
                  className="h-9 text-xs font-mono bg-background"
                />
                <Input
                  value={ioc.context}
                  onChange={(e) => {
                    const next = [...iocs];
                    next[idx].context = e.target.value;
                    setIocs(next);
                  }}
                  placeholder="Context / Note"
                  className="h-9 text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeIOC(idx)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Detailed Findings */}
          <div className="space-y-3 p-4 rounded-lg bg-background/30 border border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Detailed Findings [{findings.length}]
              </label>
              <Button type="button" variant="secondary" size="xs" onClick={addFinding}>
                <Plus className="w-3 h-3 mr-1" /> Add Finding
              </Button>
            </div>

            {findings.map((f, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-background/60 border border-border space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={f.title}
                    onChange={(e) => {
                      const next = [...findings];
                      next[idx].title = e.target.value;
                      setFindings(next);
                    }}
                    placeholder="Finding title"
                    className="h-9 text-xs font-semibold bg-background"
                  />
                  <select
                    value={f.severity}
                    onChange={(e) => {
                      const next = [...findings];
                      next[idx].severity = e.target.value as any;
                      setFindings(next);
                    }}
                    className="h-9 px-2 text-xs rounded border border-border bg-background capitalize"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFinding(idx)}
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={f.description}
                  onChange={(e) => {
                    const next = [...findings];
                    next[idx].description = e.target.value;
                    setFindings(next);
                  }}
                  placeholder="Detailed description of finding & impact..."
                  className="min-h-[60px] text-xs bg-background"
                />
                <Textarea
                  value={f.evidence}
                  onChange={(e) => {
                    const next = [...findings];
                    next[idx].evidence = e.target.value;
                    setFindings(next);
                  }}
                  placeholder="Evidence / Raw log payload / Stacktrace..."
                  className="min-h-[50px] text-xs font-mono bg-background"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim()}
              className="bg-primary text-primary-foreground font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
