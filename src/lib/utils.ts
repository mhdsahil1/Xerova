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
  if (score >= 1) return "text-severity-critical";
  return "text-status-success";
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "Critical Danger";
  if (score >= 60) return "High Danger";
  if (score >= 40) return "Medium Danger";
  if (score >= 1) return "Danger";
  return "Clean";
}

export function getRiskBgColor(score: number): string {
  if (score >= 1) return "bg-severity-critical/10 border-severity-critical/20";
  return "bg-status-success/10 border-status-success/20";
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
  switch (severity?.toLowerCase()) {
    case "danger":
    case "critical":
      return "text-severity-critical bg-severity-critical/10";
    case "high":
      return "text-severity-high bg-severity-high/10";
    case "medium":
      return "text-severity-medium bg-severity-medium/10";
    case "low":
      return "text-severity-low bg-severity-low/10";
    case "info":
    default:
      return "text-severity-info bg-severity-info/10";
  }
}

