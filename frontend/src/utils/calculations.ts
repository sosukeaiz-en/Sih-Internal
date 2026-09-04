import type { CBOMReport, CBOMSummary, Finding, RiskLevel, AlgorithmStatistics } from "../types";

export const RISK_ORDER: RiskLevel[] = ["Critical", "High", "Medium", "Low", "Safe"];

export function getSummary(report: CBOMReport): CBOMSummary {
  return report.summary;
}

export function getFileCount(report: CBOMReport): number {
  return new Set(report.findings.map((f) => f.file_path)).size;
}

export function getQuantumVulnerabilityCount(report: CBOMReport): number {
  return report.findings.filter((f) => f.quantum_vulnerable).length;
}

export function getSeverityDistribution(
  report: CBOMReport
): { name: RiskLevel; value: number; color: string }[] {
  const COLORS: Record<RiskLevel, string> = {
    Critical: "#EF4444",
    High: "#F97316",
    Medium: "#F59E0B",
    Low: "#3B82F6",
    Safe: "#10B981",
  };
  const counts: Record<RiskLevel, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Safe: 0,
  };
  for (const f of report.findings) counts[f.risk_level]++;
  return RISK_ORDER.filter((r) => counts[r] > 0).map((r) => ({
    name: r,
    value: counts[r],
    color: COLORS[r],
  }));
}

export function getAlgorithmStats(report: CBOMReport): AlgorithmStatistics[] {
  const map = new Map<
    string,
    { count: number; quantumVulnerable: boolean; risks: RiskLevel[]; recommendations: string[] }
  >();

  for (const f of report.findings) {
    const name = f.algorithm;
    const entry = map.get(name) ?? {
      count: 0,
      quantumVulnerable: false,
      risks: [],
      recommendations: [],
    };
    entry.count++;
    if (f.quantum_vulnerable) entry.quantumVulnerable = true;
    entry.risks.push(f.risk_level);
    if (f.recommended_pqc) entry.recommendations.push(f.recommended_pqc);
    map.set(name, entry);
  }

  return Array.from(map.entries())
    .map(([name, { count, quantumVulnerable, risks, recommendations }]) => {
      const topRisk: RiskLevel =
        RISK_ORDER.find((r) => risks.includes(r)) ?? "Safe";
      const recommendation =
        recommendations.find(Boolean) ?? "Review required";
      return { name, count, quantumVulnerable, topRisk, recommendation };
    })
    .sort((a, b) => b.count - a.count);
}

export function getAffectedAlgorithmFamilies(report: CBOMReport): string[] {
  const families = new Set<string>();
  for (const f of report.findings) {
    const base = f.algorithm.split("-")[0].split(" ")[0];
    families.add(base);
  }
  return Array.from(families);
}

export function safePercent(value: number, total: number): number {
  if (!total || !Number.isFinite(total)) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || !Number.isFinite(denominator) || denominator === 0) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => RISK_ORDER.indexOf(a.risk_level) - RISK_ORDER.indexOf(b.risk_level)
  );
}
