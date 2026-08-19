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
        <thead>
          <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-[#8a8f9d] font-medium">
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
                className="group hover:bg-white/[0.03] transition-colors duration-150"
              >
                {/* Target & Type */}
                <td className="py-3 px-2 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/threats?query=${encodeURIComponent(inv.query)}&type=${inv.type}`}
                        className="font-mono text-xs font-semibold text-white group-hover:text-primary transition-colors truncate block max-w-[180px] sm:max-w-[240px]"
                        title={inv.query}
                      >
                        {inv.query}
                      </Link>
                      <span className="text-[10px] uppercase font-mono text-[#8a8f9d] tracking-wider">
                        {inv.type}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Severity Status Pill */}
                <td className="py-3 px-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full border ${getSeverityColor(
                      inv.severity
                    )}`}
                  >
                    {inv.severity}
                  </Badge>
                </td>

                {/* Date */}
                <td className="py-3 px-2 text-[#8a8f9d] text-xs font-mono hidden sm:table-cell whitespace-nowrap">
                  {inv.date}
                </td>

                {/* Action Trigger */}
                <td className="py-3 px-2 text-right whitespace-nowrap">
                  <Link
                    href={`/threats?query=${encodeURIComponent(inv.query)}&type=${inv.type}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.06] hover:bg-primary hover:text-black text-white transition-all"
                    title="Pivot Investigation"
                  >
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
