import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState } from "../context/AppContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { CBOMReport, Finding, RiskLevel } from "../types";

// ─── CycloneDX v1.6 builder ───────────────────────────────────────────────────

function buildCycloneDX(report: CBOMReport): object {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    serialNumber: `urn:uuid:cbom-${Date.now()}`,
    metadata: {
      timestamp: report.scan_timestamp ?? new Date().toISOString(),
      tools: [{ vendor: "CBOM Sentinel", name: "cbom-sentinel", version: "1.0" }],
      component: { type: "library", name: report.project_name },
    },
    components: report.findings.map((f, i) => ({
      type: "cryptographic-asset",
      "bom-ref": `crypto-${i}`,
      name: f.algorithm,
      cryptoProperties: {
        assetType: "algorithm",
        algorithmProperties: {
          primitive: f.pqc_category ?? "unknown",
          executionEnvironment: "software",
          implementationPlatform: f.language,
          certificationLevel: f.risk_level === "Safe" ? ["fips140-3"] : [],
          mode: f.operation ?? "unknown",
          padding: "unknown",
          cryptoFunctions: f.operation ? [f.operation] : [],
          classicalSecurityLevel: f.classical_security_bits ?? 0,
          nistQuantumSecurityLevel: f.quantum_vulnerable ? 0 : 1,
        },
      },
      evidence: {
        occurrences: [{ location: `${f.file_path}:${f.line_number}` }],
      },
      properties: [
        { name: "cbom:riskLevel", value: f.risk_level },
        { name: "cbom:quantumImpact", value: f.quantum_impact },
        { name: "cbom:recommendedPQC", value: f.recommended_pqc },
      ],
    })),
    vulnerabilities: report.findings
      .filter((f) => f.quantum_vulnerable)
      .map((f, i) => ({
        id: `CBOM-QUANTUM-${i}`,
        source: { name: "CBOM Sentinel Quantum Analysis" },
        ratings: [
          {
            severity: f.risk_level.toLowerCase(),
            method: "CBOMv1",
            vector: `QV:${f.quantum_impact}`,
          },
        ],
        description: f.notes ?? `${f.algorithm} is vulnerable to quantum attack (${f.quantum_impact})`,
        recommendation: f.recommended_pqc,
        affects: [{ ref: `crypto-${report.findings.indexOf(f)}` }],
      })),
  };
}

// ─── HTML report builder ──────────────────────────────────────────────────────

function buildHTMLReport(report: CBOMReport): string {
  const riskColor: Record<RiskLevel, string> = {
    Critical: "#EF4444",
    High: "#F97316",
    Medium: "#F59E0B",
    Low: "#3B82F6",
    Safe: "#10B981",
  };

  const rows = report.findings
    .map(
      (f) => `
    <tr>
      <td>${escapeHtml(f.file_path)}:${f.line_number}</td>
      <td>${escapeHtml(f.algorithm)}</td>
      <td>${f.key_size ?? "—"}</td>
      <td>${escapeHtml(f.language)}</td>
      <td style="color:${riskColor[f.risk_level as RiskLevel] ?? "#fff"}">${f.risk_level}</td>
      <td>${escapeHtml(f.quantum_impact)}</td>
      <td>${escapeHtml(f.recommended_pqc)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CBOM Report — ${escapeHtml(report.project_name)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#070B14;color:#E2E8F0;padding:40px 24px}
  h1{font-size:1.8rem;color:#22D3EE;margin-bottom:4px}
  .sub{color:#64748B;font-size:0.9rem;margin-bottom:32px}
  .stats{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:40px}
  .stat{background:#0F1B2D;border:1px solid #1E3A5F;border-radius:12px;padding:16px 24px;min-width:120px;text-align:center}
  .stat-val{font-size:2rem;font-weight:700;color:#22D3EE}
  .stat-label{font-size:0.75rem;color:#64748B;margin-top:4px;text-transform:uppercase;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;font-size:0.82rem}
  th{background:#0F1B2D;padding:10px 12px;text-align:left;color:#64748B;text-transform:uppercase;letter-spacing:.05em;font-size:.72rem;border-bottom:1px solid #1E3A5F}
  td{padding:10px 12px;border-bottom:1px solid #0F1B2D;font-family:monospace}
  tr:hover td{background:#0F1B2D}
  footer{margin-top:40px;color:#334155;font-size:0.75rem;text-align:center}
</style>
</head>
<body>
<h1>CBOM Sentinel — Cryptographic Analysis Report</h1>
<p class="sub">Project: ${escapeHtml(report.project_name)} &nbsp;•&nbsp; Scanned: ${new Date(report.scan_timestamp).toLocaleString()}</p>
<div class="stats">
  <div class="stat"><div class="stat-val">${report.summary.total_artifacts}</div><div class="stat-label">Total Artifacts</div></div>
  <div class="stat"><div class="stat-val" style="color:#EF4444">${report.summary.critical_count}</div><div class="stat-label">Critical</div></div>
  <div class="stat"><div class="stat-val" style="color:#F97316">${report.summary.high_count}</div><div class="stat-label">High</div></div>
  <div class="stat"><div class="stat-val" style="color:#F59E0B">${report.summary.medium_count}</div><div class="stat-label">Medium</div></div>
  <div class="stat"><div class="stat-val" style="color:#10B981">${report.summary.safe_count}</div><div class="stat-label">Safe</div></div>
  <div class="stat"><div class="stat-val" style="color:#8B5CF6">${report.summary.vulnerable_count}</div><div class="stat-label">Quantum Vulnerable</div></div>
</div>
<table>
<thead><tr><th>Location</th><th>Algorithm</th><th>Key Size</th><th>Language</th><th>Risk</th><th>Quantum Impact</th><th>Recommended PQC</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<footer>Generated by CBOM Sentinel &nbsp;•&nbsp; ${new Date().toUTCString()}</footer>
</body></html>`;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── CSV builder ──────────────────────────────────────────────────────────────

function buildCSV(report: CBOMReport): string {
  const header = ["file_path", "line_number", "algorithm", "key_size", "language", "operation", "risk_level", "quantum_vulnerable", "quantum_impact", "recommended_pqc", "classical_security_bits", "notes"].join(",");
  const rows = report.findings.map((f: Finding) =>
    [
      csvCell(f.file_path), f.line_number, csvCell(f.algorithm), f.key_size ?? "",
      csvCell(f.language), csvCell(f.operation ?? ""), csvCell(f.risk_level),
      f.quantum_vulnerable, csvCell(f.quantum_impact), csvCell(f.recommended_pqc),
      f.classical_security_bits ?? "", csvCell(f.notes ?? ""),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function csvCell(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ─── Download helper ──────────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Export card ──────────────────────────────────────────────────────────────

type ExportStatus = "idle" | "exporting" | "done";

function ExportCard({
  id, title, subtitle, description, color, badge, icon, onExport, disabled,
}: {
  id: string; title: string; subtitle: string; description: string;
  color: string; badge: string; icon: React.ReactNode;
  onExport: () => Promise<void>; disabled: boolean;
}) {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const handleClick = useCallback(async () => {
    if (status !== "idle" || disabled) return;
    setStatus("exporting");
    try {
      await onExport();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }, [status, disabled, onExport]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="panel p-5 flex flex-col gap-4"
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}12`, color }}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{title}</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}>
              {badge}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>{subtitle}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.6)" }}>{description}</p>
      <button
        onClick={handleClick}
        disabled={disabled || status === "exporting"}
        className="w-full py-2 rounded-xl font-mono text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: status === "done" ? "rgba(16,185,129,0.15)" : `${color}12`,
          border: `1px solid ${status === "done" ? "rgba(16,185,129,0.4)" : `${color}28`}`,
          color: status === "done" ? "#10B981" : color,
          cursor: disabled || status === "exporting" ? "not-allowed" : "pointer",
        }}
        aria-label={`Export ${title}`}
        aria-busy={status === "exporting"}
      >
        {status === "exporting" && (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        )}
        {status === "done" ? "✓ DOWNLOADED" : status === "exporting" ? "GENERATING…" : `EXPORT ${badge}`}
      </button>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function ExportPanel() {
  const { state } = useAppState();
  const reduced = useReducedMotion();
  const report = state.report;

  const projectName = report?.project_name ?? "cbom-report";
  const safeFilename = projectName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = new Date().toISOString().slice(0, 10);

  const exports = [
    {
      id: "cyclonedx",
      title: "CycloneDX v1.6 JSON",
      subtitle: "Industry-standard SBOM format",
      description: "Machine-readable CBOM in CycloneDX v1.6 schema. Compatible with OWASP Dependency-Track and enterprise security platforms.",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
      color: "#22D3EE",
      badge: "STANDARD",
      onExport: async () => {
        if (!report) return;
        const data = JSON.stringify(buildCycloneDX(report), null, 2);
        triggerDownload(data, `${safeFilename}-${ts}-cyclonedx.json`, "application/json");
      },
    },
    {
      id: "raw",
      title: "Raw CBOM JSON",
      subtitle: "Complete artifact manifest",
      description: "Full CBOM data with all cryptographic findings, risk classifications, and PQC recommendations.",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      color: "#8B5CF6",
      badge: "JSON",
      onExport: async () => {
        if (!report) return;
        triggerDownload(JSON.stringify(report, null, 2), `${safeFilename}-${ts}-raw.json`, "application/json");
      },
    },
    {
      id: "csv",
      title: "CSV Findings",
      subtitle: "Spreadsheet-compatible format",
      description: "All findings in CSV format. Import into Excel, Google Sheets, or any BI tool for custom reporting.",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>,
      color: "#10B981",
      badge: "CSV",
      onExport: async () => {
        if (!report) return;
        triggerDownload(buildCSV(report), `${safeFilename}-${ts}.csv`, "text/csv");
      },
    },
    {
      id: "html",
      title: "HTML Report",
      subtitle: "Shareable visual report",
      description: "Self-contained HTML page with summary stats, full findings table, and risk highlights. Email or upload to any platform.",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      color: "#F59E0B",
      badge: "HTML",
      onExport: async () => {
        if (!report) return;
        triggerDownload(buildHTMLReport(report), `${safeFilename}-${ts}-report.html`, "text/html");
      },
    },
  ];

  return (
    <section id="export" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="h-px w-full mb-10" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="font-mono text-xs tracking-widest mb-1" style={{ color: "rgba(139,92,246,0.7)" }}>EXPORT</h2>
        <p className="text-2xl font-semibold text-white">Download Your CBOM Report</p>

        {!report && (
          <p className="mt-1 text-sm" style={{ color: "rgba(148,163,184,0.5)" }}>
            Scan a repository first to enable exports.
          </p>
        )}

        {report && (
          <p className="mt-1 text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
            {report.summary.total_artifacts} artifacts across {report.project_name}
            {state.demoMode && (
              <span className="ml-2 px-2 py-0.5 rounded font-mono text-xs" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                DEMO DATA
              </span>
            )}
          </p>
        )}
      </motion.div>

      {/* Stats bar */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total Artifacts", value: report.summary.total_artifacts, color: "#22D3EE" },
                { label: "Critical", value: report.summary.critical_count, color: "#EF4444" },
                { label: "Quantum Vulnerable", value: report.summary.vulnerable_count, color: "#8B5CF6" },
                { label: "Safe", value: report.summary.safe_count, color: "#10B981" },
              ].map((s) => (
                <div key={s.label} className="panel p-4 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {exports.map((exp) => (
          <ExportCard
            key={exp.id}
            {...exp}
            disabled={!report}
          />
        ))}
      </div>

      <div className="mt-8 text-center font-mono text-xs" style={{ color: "rgba(100,116,139,0.4)" }}>
        All exports are generated locally in your browser — no data leaves your machine.
      </div>
    </section>
  );
}
