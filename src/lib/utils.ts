import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 40) return "text-yellow-500";
  if (score >= 20) return "text-blue-500";
  return "text-green-500";
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  if (score >= 20) return "Low";
  return "Info";
}

export function getRiskBgColor(score: number): string {
  if (score >= 80) return "bg-red-500/10 border-red-500/20";
  if (score >= 60) return "bg-orange-500/10 border-orange-500/20";
  if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 20) return "bg-blue-500/10 border-blue-500/20";
  return "bg-green-500/10 border-green-500/20";
}

export function detectSearchType(
  query: string
): "ip" | "domain" | "hash" | "url" | "cve" {
  if (/^CVE-\d{4}-\d{4,}$/i.test(query)) return "cve";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(query)) return "ip";
  if (/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(query)) return "ip";
  if (/^https?:\/\//i.test(query)) return "url";
  if (/^[a-fA-F0-9]{32}$/.test(query)) return "hash";
  if (/^[a-fA-F0-9]{40}$/.test(query)) return "hash";
  if (/^[a-fA-F0-9]{64}$/.test(query)) return "hash";
  return "domain";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-500 bg-red-500/10";
    case "high":
      return "text-orange-500 bg-orange-500/10";
    case "medium":
      return "text-yellow-500 bg-yellow-500/10";
    case "low":
      return "text-blue-400 bg-blue-400/10";
    case "info":
    default:
      return "text-emerald-400 bg-emerald-400/10";
  }
}
