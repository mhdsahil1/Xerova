"use client";

import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export interface LatestCVEsProps {
  data: {
    id: string;
    title: string;
    severity: string;
    cvss: number;
    published: string;
    description: string;
  }[];
}

export function LatestCVEs({ data }: LatestCVEsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No recent CVEs found from NVD.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((cve) => (
        <div
          key={cve.id}
          className="p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-sm font-mono font-semibold text-primary group-hover:text-cyber-cyan transition-colors">
                {cve.id}
              </span>
              <h4 className="text-sm font-medium mt-0.5">{cve.title}</h4>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {cve.description}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-[10px] capitalize border ${getSeverityColor(cve.severity)}`}
              variant="outline"
            >
              {cve.severity}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono">
              CVSS {cve.cvss}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {cve.published}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
