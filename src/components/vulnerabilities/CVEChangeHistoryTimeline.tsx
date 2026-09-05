"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  History,
  GitCommit,
  Tag,
  ShieldAlert,
  FileEdit,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CVEChangeEvent } from "@/lib/nvd";

interface CVEChangeHistoryTimelineProps {
  cveId: string;
  history: CVEChangeEvent[];
  isLoading?: boolean;
}

function getEventBadgeStyle(eventName: string): { bg: string; text: string; border: string } {
  const name = eventName.toLowerCase();
  if (name.includes("cisa") || name.includes("kev")) {
    return { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" };
  }
  if (name.includes("new") || name.includes("received")) {
    return { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" };
  }
  if (name.includes("initial") || name.includes("reanalysis")) {
    return { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" };
  }
  if (name.includes("cwe") || name.includes("cpe")) {
    return { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" };
  }
  if (name.includes("reference") || name.includes("vendor")) {
    return { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" };
  }
  if (name.includes("rejected")) {
    return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40" };
  }
  return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" };
}

function getActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case "added":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "modified":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "removed":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-muted-foreground bg-white/[0.04] border-white/[0.08]";
  }
}

export function CVEChangeHistoryTimeline({
  cveId,
  history,
  isLoading = false,
}: CVEChangeHistoryTimelineProps) {
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("ALL");
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    history.forEach((_, idx) => {
      allExpanded[`event-${idx}`] = true;
    });
    setExpandedEvents(allExpanded);
  };

  const collapseAll = () => {
    setExpandedEvents({});
  };

  // Distinct event names for filter
  const eventTypes = ["ALL", ...Array.from(new Set(history.map((h) => h.eventName)))];

  const filteredHistory =
    selectedEventFilter === "ALL"
      ? history
      : history.filter((h) => h.eventName === selectedEventFilter);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin mb-3" />
        <p className="text-xs font-mono text-muted-foreground">
          Fetching NVD Change History timeline for {cveId}...
        </p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] p-8 text-center">
        <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white">No Change History Recorded</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          The National Vulnerability Database has not published incremental change events for {cveId}, or this CVE is in an unmodified state.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0c0d12] border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">
            NVD Change History ({history.length} events)
          </span>
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            API 2.0
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground mr-1">Filter:</span>
            {eventTypes.slice(0, 5).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedEventFilter(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  selectedEventFilter === type
                    ? "bg-primary text-black font-bold"
                    : "bg-white/[0.04] text-muted-foreground hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-white"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-white"
            >
              Collapse
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-cyan-500/40 before:via-purple-500/30 before:to-transparent">
        {filteredHistory.map((item, idx) => {
          const eventId = `event-${idx}`;
          const isExpanded = expandedEvents[eventId] ?? (idx === 0); // Expand first item by default
          const badgeStyle = getEventBadgeStyle(item.eventName);

          let formattedDate = item.created;
          try {
            formattedDate = format(new Date(item.created), "MMM dd, yyyy · HH:mm:ss 'UTC'");
          } catch {
            // fallback
          }

          return (
            <div key={item.cveChangeId || idx} className="relative group">
              {/* Timeline node marker */}
              <div className="absolute -left-[27px] top-3.5 w-3 h-3 rounded-full bg-[#0a0b0e] border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] group-hover:scale-125 transition-transform" />

              <div className="rounded-xl border border-white/[0.08] bg-[#0c0d12] hover:border-white/[0.14] transition-all overflow-hidden">
                {/* Event Summary Bar */}
                <div
                  onClick={() => toggleExpand(eventId)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                    >
                      {item.eventName}
                    </span>

                    <span className="text-xs font-mono text-muted-foreground">
                      {formattedDate}
                    </span>

                    <span className="text-[11px] font-mono text-[#8a8f9d] hidden sm:inline">
                      Source: <span className="text-white">{item.sourceIdentifier}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.details.length} change{item.details.length === 1 ? "" : "s"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Event Details Panel */}
                {isExpanded && item.details.length > 0 && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-white/[0.04] space-y-2.5 bg-black/20">
                    {item.details.map((detail, dIdx) => (
                      <div
                        key={dIdx}
                        className="rounded-lg border border-white/[0.04] bg-[#090a0d] p-2.5 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getActionColor(
                                detail.action
                              )}`}
                            >
                              {detail.action}
                            </span>
                            <span className="text-white font-semibold">{detail.type}</span>
                          </div>
                        </div>

                        {detail.oldValue && (
                          <div className="text-[11px] text-rose-400/80 bg-rose-950/20 p-2 rounded border border-rose-500/10 break-all">
                            <span className="font-bold text-rose-300 block mb-0.5 text-[9px] uppercase">
                              - Previous:
                            </span>
                            {detail.oldValue}
                          </div>
                        )}

                        {detail.newValue && (
                          <div className="text-[11px] text-emerald-400/90 bg-emerald-950/20 p-2 rounded border border-emerald-500/10 break-all">
                            <span className="font-bold text-emerald-300 block mb-0.5 text-[9px] uppercase">
                              + New:
                            </span>
                            {detail.newValue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
