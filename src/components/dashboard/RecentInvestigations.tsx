"use client";

import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/lib/utils";

export interface RecentInvestigationsProps {
  data: {
    id: string;
    query: string;
    type: string;
    severity: string;
    date: string;
  }[];
}

const typeLabels: Record<string, string> = {
  ip: "IP",
  domain: "Domain",
  hash: "Hash",
  url: "URL",
  cve: "CVE",
};

export function RecentInvestigations({ data }: RecentInvestigationsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No recent investigations found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Badge
              variant="outline"
              className="text-[10px] shrink-0 uppercase font-mono"
            >
              {typeLabels[inv.type]}
            </Badge>
            <span className="text-sm font-mono truncate group-hover:text-primary transition-colors">
              {inv.query}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge
              className={`text-[10px] capitalize border ${getSeverityColor(inv.severity)}`}
              variant="outline"
            >
              {inv.severity}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {inv.date}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
