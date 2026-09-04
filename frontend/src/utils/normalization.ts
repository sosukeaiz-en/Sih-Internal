import type { CBOMReport, CBOMSummary, Finding, RiskLevel, QuantumImpact } from "../types";

function safeString(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}
function safeNumber(val: unknown, fallback: number | null = null): number | null {
  return typeof val === "number" ? val : fallback;
}
function safeBool(val: unknown, fallback = false): boolean {
  return typeof val === "boolean" ? val : fallback;
}

const VALID_RISK: RiskLevel[] = ["Critical", "High", "Medium", "Low", "Safe"];

function normalizeRisk(val: unknown): RiskLevel {
  const s = String(val ?? "Low");
  const found = VALID_RISK.find((r) => r.toLowerCase() === s.toLowerCase());
  return found ?? "Low";
}

function normalizeFinding(raw: unknown): Finding {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    file_path: safeString(r.file_path, "unknown"),
    line_number: typeof r.line_number === "number" ? r.line_number : 0,
    language: safeString(r.language, "unknown"),
    algorithm: safeString(r.algorithm, "Unknown"),
    key_size: safeNumber(r.key_size),
    operation: r.operation ? safeString(r.operation) : null,
    code_snippet: safeString(r.code_snippet, ""),
    quantum_vulnerable: safeBool(r.quantum_vulnerable),
    quantum_impact: safeString(r.quantum_impact, "Unknown") as QuantumImpact,
    classical_security_bits: safeNumber(r.classical_security_bits),
    risk_level: normalizeRisk(r.risk_level),
    recommended_pqc: safeString(r.recommended_pqc, "Review required"),
    pqc_category: safeString(r.pqc_category, "Unknown"),
    notes: r.notes ? safeString(r.notes) : null,
  };
}

function buildSummary(findings: Finding[]): CBOMSummary {
  const counts: CBOMSummary = {
    total_artifacts: findings.length,
    vulnerable_count: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    safe_count: 0,
  };
  for (const f of findings) {
    if (f.quantum_vulnerable) counts.vulnerable_count++;
    if (f.risk_level === "Critical") counts.critical_count++;
    else if (f.risk_level === "High") counts.high_count++;
    else if (f.risk_level === "Medium") counts.medium_count++;
    else if (f.risk_level === "Low") counts.low_count++;
    else if (f.risk_level === "Safe") counts.safe_count++;
  }
  return counts;
}

export function normalizeCBOMReport(raw: unknown): CBOMReport {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawFindings = Array.isArray(r.findings) ? r.findings : [];
  const findings: Finding[] = rawFindings.map(normalizeFinding);

  // Recompute summary from actual findings for consistency
  const summary = buildSummary(findings);

  // Override with backend summary values if they exist (trust backend's counts
  // for total, but use ours for consistency in the UI)
  if (r.summary && typeof r.summary === "object") {
    const bs = r.summary as Record<string, unknown>;
    if (typeof bs.total_artifacts === "number") {
      summary.total_artifacts = bs.total_artifacts;
    }
  }

  return {
    project_name: safeString(r.project_name, "Unknown Project"),
    scan_timestamp: safeString(r.scan_timestamp, new Date().toISOString()),
    summary,
    findings,
  };
}
