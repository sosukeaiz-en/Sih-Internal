import type { RiskLevel } from "../types";

export const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; bg: string; border: string; label: string }
> = {
  Critical: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    label: "CRITICAL",
  },
  High: {
    color: "#F97316",
    bg: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.35)",
    label: "HIGH",
  },
  Medium: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    label: "MEDIUM",
  },
  Low: {
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.35)",
    label: "LOW",
  },
  Safe: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    label: "SAFE",
  },
};

export function quantumImpactIcon(impact: string): {
  symbol: string;
  color: string;
  label: string;
} {
  if (impact.includes("Shor"))
    return { symbol: "◈", color: "#EF4444", label: "Broken by Shor" };
  if (impact.includes("Grover"))
    return { symbol: "◇", color: "#F59E0B", label: "Weakened by Grover" };
  if (impact.toLowerCase().includes("safe") || impact.toLowerCase().includes("pqc"))
    return { symbol: "◆", color: "#10B981", label: "Quantum Safe" };
  return { symbol: "○", color: "#94A3B8", label: impact };
}

export function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const LANG_COLORS: Record<string, string> = {
  python: "#3776AB",
  typescript: "#3178C6",
  javascript: "#F7DF1E",
  java: "#ED8B00",
  go: "#00ADD8",
};
