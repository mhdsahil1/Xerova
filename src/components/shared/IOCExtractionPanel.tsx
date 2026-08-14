"use client";

import { useState } from "react";
import {
  FileSearch,
  Search,
  Copy,
  Check,
  Globe,
  Wifi,
  Hash,
  Link2,
  ShieldAlert,
  Mail,
  Filter,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { extractIOCs, type ExtractedIOC, type IOCType } from "@/lib/ioc-extractor";

interface IOCExtractionPanelProps {
  initialText?: string;
  onLookupIOC?: (ioc: ExtractedIOC) => void;
  onAddToReport?: (iocs: ExtractedIOC[]) => void;
}

const typeIcons: Record<IOCType, React.ComponentType<{ className?: string }>> = {
  ip: Wifi,
  domain: Globe,
  hash: Hash,
  url: Link2,
  cve: ShieldAlert,
  email: Mail,
};

const typeColors: Record<IOCType, string> = {
  ip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  domain: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  hash: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  url: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cve: "bg-red-500/10 text-red-400 border-red-500/20",
  email: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function IOCExtractionPanel({
  initialText = "",
  onLookupIOC,
  onAddToReport,
}: IOCExtractionPanelProps) {
  const [inputText, setInputText] = useState(initialText);
  const [extracted, setExtracted] = useState<ExtractedIOC[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);

  const handleExtract = () => {
    if (!inputText.trim()) return;
    const iocs = extractIOCs(inputText);
    setExtracted(iocs);
    setHasExtracted(true);
  };

  const filteredIOCs =
    selectedType === "all"
      ? extracted
      : extracted.filter((ioc) => ioc.type === selectedType);

  const handleCopyAll = () => {
    const text = extracted.map((i) => `[${i.type.toUpperCase()}] ${i.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOne = (value: string, idx: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-primary" />
          Automated IOC Extractor
        </CardTitle>
        <CardDescription>
          Paste security logs, phishing emails, malware notes, or raw headers to automatically detect IPs, domains, hashes, URLs, CVEs, and emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw log data, email header, or report text here..."
            className="min-h-[120px] font-mono text-sm bg-background/50 border-border/50 focus:border-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {inputText.length} characters
            </span>
            <Button
              onClick={handleExtract}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-cyber-cyan to-cyber-blue text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Extract IOCs
            </Button>
          </div>
        </div>

        {hasExtracted && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter ({extracted.length} total):
                </span>
                <Badge
                  variant={selectedType === "all" ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedType("all")}
                >
                  All ({extracted.length})
                </Badge>
                {["ip", "domain", "hash", "url", "cve", "email"].map((type) => {
                  const count = extracted.filter((i) => i.type === type).length;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      className="cursor-pointer text-xs uppercase"
                      onClick={() => setSelectedType(type)}
                    >
                      {type} ({count})
                    </Badge>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  disabled={extracted.length === 0}
                  className="text-xs"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 mr-1 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy All"}
                </Button>
                {onAddToReport && extracted.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => onAddToReport(extracted)}
                    className="text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                  >
                    Add to Report
                  </Button>
                )}
              </div>
            </div>

            {filteredIOCs.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground bg-background/30 rounded-lg border border-border/30">
                {extracted.length === 0
                  ? "No IOCs detected in the text. Try pasting logs, headers, or threat reports."
                  : "No IOCs match the selected filter."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredIOCs.map((ioc, idx) => {
                  const Icon = typeIcons[ioc.type] || Search;
                  const colorClass = typeColors[ioc.type] || "bg-secondary text-secondary-foreground";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/40 hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] uppercase border ${colorClass} flex items-center gap-1`}
                        >
                          <Icon className="w-3 h-3" />
                          {ioc.type}
                        </Badge>
                        <span
                          className="text-xs font-mono truncate text-foreground group-hover:text-primary transition-colors"
                          title={ioc.value}
                        >
                          {ioc.value}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopyOne(ioc.value, idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-background/80"
                          title="Copy value"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        {onLookupIOC && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onLookupIOC(ioc)}
                            className="h-7 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Search className="w-3 h-3 mr-1" />
                            Lookup
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
