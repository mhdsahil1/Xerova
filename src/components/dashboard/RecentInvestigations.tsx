"use client";

import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/lib/utils";
import { ArrowUpRight, Play, Search, ShieldAlert, Wifi, Globe, Hash, Link2 } from "lucide-react";
import Link from "next/link";

export interface RecentInvestigationsProps {
  data: {
    id: string;
    query: string;
    type: string;
    severity: string;
    date: string;
  }[];
}

const typeIcons: Record<string, React.ElementType> = {
  ip: Wifi,
  domain: Globe,
  hash: Hash,
  url: Link2,
  cve: ShieldAlert,
};

export function RecentInvestigations({ data }: RecentInvestigationsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#8a8f9d] font-mono bg-white/[0.02] rounded-xl border border-white/[0.06]">
        No recent investigation queries logged yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs">
        <colgroup>
          <col className="w-auto" />
          <col className="w-28" />
          <col className="w-36 hidden sm:table-column" />
          <col className="w-32 text-right" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <th className="pb-3 px-2 font-normal">Target / Indicator</th>
            <th className="pb-3 px-2 font-normal">Severity</th>
            <th className="pb-3 px-2 font-normal hidden sm:table-cell">Timestamp</th>
            <th className="pb-3 px-2 text-right font-normal">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {data.slice(0, 5).map((inv) => {
            const Icon = typeIcons[inv.type] || Search;
            return (
              <tr
                key={inv.id}
                className="group hover:bg-white/[0.06] focus-within:bg-white/[0.06] transition-colors duration-150"
              >
                {/* Target & Type */}
                <td className="py-3 px-2 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/threats?query=${encodeURIComponent(inv.query)}&type=${inv.type}`}
                        className="font-mono text-xs font-semibold text-white group-hover:text-primary transition-colors truncate block max-w-[240px] sm:max-w-[320px] lg:max-w-md"
                        title={inv.query}
                        aria-label={`Indicator: ${inv.query}`}
                      >
                        {inv.query}
                      </Link>
                      <span className="text-xs uppercase font-mono text-muted-foreground tracking-wider">
                        {inv.type}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Severity Status Pill */}
                <td className="py-3 px-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono capitalize px-2.5 py-0.5 rounded-full border ${getSeverityColor(
                      inv.severity
                    )}`}
                  >
                    {inv.severity}
                  </Badge>
                </td>

                {/* Date */}
                <td className="py-3 px-2 text-muted-foreground text-xs font-mono hidden sm:table-cell whitespace-nowrap">
                  {inv.date}
                </td>

                {/* Action Trigger */}
                <td className="py-3 px-2 text-right whitespace-nowrap">
                  <Link
                    href={`/threats?query=${encodeURIComponent(inv.query)}&type=${inv.type}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-primary hover:text-black text-white text-xs font-medium transition-all shadow-sm"
                    title={`Investigate ${inv.query}`}
                    aria-label={`Investigate ${inv.query}`}
                  >
                    <span>Investigate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RecentInvestigations;
