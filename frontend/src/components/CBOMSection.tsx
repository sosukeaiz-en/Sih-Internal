import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAppState } from "../context/AppContext";
import { useCountUp } from "../hooks/useCountUp";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  getSeverityDistribution,
  getAlgorithmStats,
  safePercent,
  RISK_ORDER,
} from "../utils/calculations";
import { RISK_CONFIG, quantumImpactIcon, LANG_COLORS } from "../utils/formatting";
import type { Finding, RiskLevel } from "../types";

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, color,
}: {
  label: string; value: number; sub: string; color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const count = useCountUp(value, inView, reduced ? 0 : 900);
  return (
    <div
      ref={ref}
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: "rgba(11,18,32,0.8)", border: `1px solid ${color}20` }}
    >
      <div className="absolute top-0 right-0 w-14 h-14 rounded-full opacity-10" style={{ background: color, filter: "blur(22px)", transform: "translate(30%,-30%)" }} />
      <div className="relative">
        <div className="font-mono text-2xl font-bold leading-none mb-1" style={{ color }}>
          {reduced ? value : count}
        </div>
        <div className="font-mono text-xs font-semibold tracking-wider" style={{ color: "rgba(226,232,240,0.8)" }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.45)" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  const c = RISK_CONFIG[level];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ finding, onClose, triggerRef }: {
  finding: Finding;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const rc = RISK_CONFIG[finding.risk_level];
  const qi = quantumImpactIcon(finding.quantum_impact);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [onClose, triggerRef]);

  const lines = finding.code_snippet.split("\n");

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Finding detail: ${finding.algorithm}`}
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 flex flex-col overflow-y-auto"
      style={{
        background: "rgba(7,11,20,0.97)",
        borderLeft: "1px solid rgba(34,211,238,0.14)",
        backdropFilter: "blur(20px)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(34,211,238,0.08)" }}>
        <div>
          <div className="font-mono text-xs tracking-widest mb-1" style={{ color: "rgba(34,211,238,0.5)" }}>FINDING DETAIL</div>
          <div className="font-mono text-lg font-bold text-white">{finding.algorithm}</div>
        </div>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close detail panel"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{ background: "rgba(148,163,184,0.08)", color: "rgba(148,163,184,0.6)" }}
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <RiskBadge level={finding.risk_level} />
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs"
            style={{ background: `${qi.color}12`, border: `1px solid ${qi.color}30`, color: qi.color }}
            aria-label={qi.label}
          >
            {qi.symbol} {qi.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "FILE", value: finding.file_path, mono: true },
            { label: "LINE", value: `L${finding.line_number}`, mono: true },
            { label: "LANGUAGE", value: finding.language },
            { label: "OPERATION", value: finding.operation ?? "—" },
            { label: "KEY SIZE", value: finding.key_size ? `${finding.key_size}-bit` : "—", mono: true },
            { label: "CLASSICAL BITS", value: finding.classical_security_bits ? `${finding.classical_security_bits}-bit` : "—", mono: true },
            { label: "PQC CATEGORY", value: finding.pqc_category },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(34,211,238,0.07)" }}>
              <div className="font-mono text-xs mb-1" style={{ color: "rgba(34,211,238,0.45)" }}>{item.label}</div>
              <div className={`text-sm truncate ${item.mono ? "font-mono" : ""}`} style={{ color: "#E2E8F0" }} title={String(item.value)}>{item.value}</div>
            </div>
          ))}
        </div>

        {finding.notes && (
          <div className="rounded-xl p-4" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(34,211,238,0.07)" }}>
            <div className="font-mono text-xs mb-2" style={{ color: "rgba(34,211,238,0.45)" }}>ANALYSIS NOTES</div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.8)" }}>{finding.notes}</p>
          </div>
        )}

        {/* Code viewer */}
        {finding.code_snippet && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,211,238,0.1)" }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: "rgba(7,11,20,0.85)", borderBottom: "1px solid rgba(34,211,238,0.07)" }}>
              <span className="font-mono text-xs" style={{ color: "rgba(34,211,238,0.5)" }}>CODE EVIDENCE</span>
              <span className="font-mono text-xs truncate ml-4" style={{ color: "rgba(148,163,184,0.35)" }}>
                {finding.file_path}:{finding.line_number}
              </span>
            </div>
            <div className="overflow-x-auto" style={{ background: "rgba(7,11,20,0.95)" }}>
              <pre className="font-mono text-xs leading-relaxed p-3" style={{ minWidth: "max-content" }}>
                {lines.map((line, i) => {
                  // Highlight the line that contains the vulnerable code marker
                  const isVulnLine = line.includes(`line ${finding.line_number}`) || (lines.length === 1);
                  return (
                    <div
                      key={i}
                      className="flex gap-3"
                      style={{
                        background: isVulnLine ? "rgba(239,68,68,0.08)" : "transparent",
                        borderLeft: isVulnLine ? "2px solid rgba(239,68,68,0.6)" : "2px solid transparent",
                        paddingLeft: "6px",
                      }}
                    >
                      <span className="select-none" style={{ color: "rgba(148,163,184,0.22)", minWidth: "20px" }}>
                        {finding.line_number + i - Math.max(0, lines.indexOf(lines[0]))}
                      </span>
                      <span style={{ color: "#94A3B8" }}>{line || " "}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}

        {/* Migration recommendation */}
        <div className="rounded-xl p-5" style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.12)" }}>
          <div className="font-mono text-xs font-semibold tracking-widest mb-4" style={{ color: "rgba(34,211,238,0.6)" }}>
            MIGRATION RECOMMENDATION
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-3 py-2 rounded-lg flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="font-mono text-sm font-semibold text-red-400">{finding.algorithm}</div>
              <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.4)" }}>LEGACY</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.4), rgba(34,211,238,0.4))" }} />
              <div className="font-mono text-xs" style={{ color: "rgba(34,211,238,0.4)" }}>MIGRATE TO</div>
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.4), rgba(34,211,238,0.4))" }} />
            </div>
            <div className="text-center px-3 py-2 rounded-lg flex-shrink-0" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.22)" }}>
              <div className="font-mono text-sm font-semibold text-cyan-400">{finding.recommended_pqc}</div>
              <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.4)" }}>PQC-READY</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Risk donut ───────────────────────────────────────────────────────────────

function RiskDonut({ findings }: { findings: Finding[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = findings.length;

  // Build a dummy report for getSeverityDistribution
  const data = useMemo(() => {
    const counts: Record<RiskLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0, Safe: 0 };
    for (const f of findings) counts[f.risk_level]++;
    const colors: Record<RiskLevel, string> = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#3B82F6", Safe: "#10B981" };
    return RISK_ORDER.filter((r) => counts[r] > 0).map((r) => ({ name: r, value: counts[r], color: colors[r] }));
  }, [findings]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; color: string } }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-xl px-3 py-2" style={{ background: "rgba(11,18,32,0.97)", border: `1px solid ${d.color}40` }}>
        <div className="font-mono text-sm font-semibold" style={{ color: d.color }}>{d.name}</div>
        <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
          {d.value} · {safePercent(d.value, total).toFixed(1)}%
        </div>
      </div>
    );
  };

  if (!total) return (
    <div className="panel p-5 flex items-center justify-center h-48" style={{ color: "rgba(148,163,184,0.35)" }}>
      <span className="font-mono text-xs">NO FINDINGS TO DISPLAY</span>
    </div>
  );

  return (
    <div ref={ref} className="panel p-5 space-y-4">
      <div>
        <div className="font-mono text-xs tracking-widest font-semibold mb-0.5" style={{ color: "rgba(34,211,238,0.6)" }}>
          RISK LEVEL BREAKDOWN
        </div>
        <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.45)" }}>n = {total}</div>
      </div>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={58} outerRadius={76}
              paddingAngle={2}
              dataKey="value"
              startAngle={90} endAngle={-270}
              isAnimationActive={inView && !reduced}
              animationBegin={0} animationDuration={900} animationEasing="ease-out"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  fillOpacity={activeIndex === null || activeIndex === i ? 0.85 : 0.3}
                  stroke={activeIndex === i ? entry.color : "transparent"}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-mono text-xl font-bold text-white">{total}</div>
          <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.45)" }}>artifacts</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} aria-hidden="true" />
              <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${safePercent(item.value, total)}%` : 0 }}
                  transition={{ duration: reduced ? 0 : 0.7, delay: i * 0.07 + 0.3 }}
                  style={{ background: item.color }}
                />
              </div>
              <span className="font-mono text-xs w-8 text-right" style={{ color: item.color }}>
                {safePercent(item.value, total).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Algorithm chart ──────────────────────────────────────────────────────────

function AlgoChart({ findings }: { findings: Finding[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // Build a minimal report-like structure for getAlgorithmStats
  const stats = useMemo(() => {
    const pseudoReport = { project_name: "", scan_timestamp: "", summary: { total_artifacts: 0, vulnerable_count: 0, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0, safe_count: 0 }, findings };
    return getAlgorithmStats(pseudoReport).slice(0, 12);
  }, [findings]);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const shorCount = findings.filter((f) => f.quantum_impact.includes("Shor")).length;

  const RISK_COLORS: Record<string, string> = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#3B82F6", Safe: "#10B981" };

  if (!stats.length) return (
    <div className="panel p-5 flex items-center justify-center h-48" style={{ color: "rgba(148,163,184,0.35)" }}>
      <span className="font-mono text-xs">NO ALGORITHMS FOUND</span>
    </div>
  );

  return (
    <div ref={ref} className="panel p-5 space-y-4">
      <div>
        <div className="font-mono text-xs tracking-widest font-semibold mb-0.5" style={{ color: "rgba(34,211,238,0.6)" }}>ALGORITHMS DISCOVERED</div>
      </div>
      <div className="space-y-2" role="list" aria-label="Algorithm frequency">
        {stats.map((algo, i) => {
          const barColor = algo.quantumVulnerable ? (RISK_COLORS[algo.topRisk] ?? "#EF4444") : "#10B981";
          const pct = safePercent(algo.count, maxCount);
          const isActive = hovered === algo.name || focused === algo.name;
          return (
            <div
              key={algo.name}
              role="listitem"
              tabIndex={0}
              onMouseEnter={() => setHovered(algo.name)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocused(algo.name)}
              onBlur={() => setFocused(null)}
              className="flex items-center gap-3 cursor-default focus:outline-none"
              aria-label={`${algo.name}: ${algo.count} occurrences, ${algo.quantumVulnerable ? "quantum vulnerable" : "quantum safe"}`}
            >
              <div className="w-20 sm:w-24 flex-shrink-0 text-right">
                <span className="font-mono text-xs" style={{ color: isActive ? "#E2E8F0" : "rgba(148,163,184,0.6)" }}>
                  {algo.name}
                </span>
              </div>
              <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: "rgba(148,163,184,0.05)" }}>
                <motion.div
                  className="h-full rounded"
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${pct}%` : 0 }}
                  transition={{ duration: reduced ? 0 : 0.75, delay: i * 0.05, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg, ${barColor}70, ${barColor}b0)`,
                    boxShadow: isActive ? `0 0 10px ${barColor}50` : "none",
                  }}
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center px-2" style={{ background: "rgba(7,11,20,0.7)" }}>
                    <span className="font-mono text-xs" style={{ color: barColor }}>
                      {algo.quantumVulnerable ? "⚠ QUANTUM VULNERABLE" : "✓ QUANTUM SAFE"} · {algo.recommendation}
                    </span>
                  </div>
                )}
              </div>
              <span className="font-mono text-xs w-4 text-right font-semibold" style={{ color: barColor }}>{algo.count}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-2" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
          <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>Quantum vulnerable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
          <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>Quantum safe</span>
        </div>
        {shorCount > 0 && (
          <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.35)" }}>
            {shorCount} of {findings.length} fall to Shor's algorithm
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main CBOM section ────────────────────────────────────────────────────────

export default function CBOMSection() {
  const { state, selectFinding } = useAppState();
  const report = state.report;
  const reduced = useReducedMotion();

  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [langFilter, setLangFilter] = useState<string>("All");
  const [qvOnly, setQvOnly] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const currentTriggerRef = useRef<HTMLElement | null>(null);

  const openFinding = useCallback((finding: Finding, key: string) => {
    currentTriggerRef.current = triggerRefs.current.get(key) ?? null;
    selectFinding(finding);
  }, [selectFinding]);

  const closeFinding = useCallback(() => {
    selectFinding(null);
  }, [selectFinding]);

  const languages = useMemo(() => {
    if (!report) return [];
    return [...new Set(report.findings.map((f) => f.language))].sort();
  }, [report]);

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.findings
      .filter((f) => riskFilter === "All" || f.risk_level === riskFilter)
      .filter((f) => langFilter === "All" || f.language === langFilter)
      .filter((f) => !qvOnly || f.quantum_vulnerable)
      .filter((f) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          f.algorithm.toLowerCase().includes(q) ||
          f.file_path.toLowerCase().includes(q) ||
          f.language.toLowerCase().includes(q) ||
          (f.operation ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => RISK_ORDER.indexOf(a.risk_level) - RISK_ORDER.indexOf(b.risk_level));
  }, [report, riskFilter, langFilter, qvOnly, search]);

  if (!report) return null;

  const fileCount = new Set(report.findings.map((f) => f.file_path)).size;
  const summary = report.summary;

  return (
    <section id="cbom" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="h-px w-full mb-10" style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)" }} />

      {/* Demo mode indicator */}
      {state.demoMode && (
        <div
          className="mb-6 px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-xs"
          style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", color: "rgba(245,158,11,0.7)" }}
          role="status"
        >
          <span>◉</span>
          <span>DEMO DATA — these findings are from a sample repository, not a real scan</span>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mb-7"
      >
        <h2 className="text-2xl font-semibold text-white mb-1">Cryptographic Bill of Materials</h2>
        <p className="text-sm mb-2" style={{ color: "rgba(148,163,184,0.6)" }}>
          Every cryptographic artifact ranked by quantum exposure and remediation urgency.
        </p>
        <div className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "rgba(34,211,238,0.5)" }}>
          <span>{report.project_name}</span>
          <span style={{ color: "rgba(148,163,184,0.3)" }}>·</span>
          <span>{fileCount} files</span>
          <span style={{ color: "rgba(148,163,184,0.3)" }}>·</span>
          <span>{new Date(report.scan_timestamp).toLocaleTimeString()}</span>
        </div>
      </motion.div>

      {/* Stat tiles */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7"
      >
        <StatTile label="Total assets" value={summary.total_artifacts} sub={`across ${fileCount} files`} color="#22D3EE" />
        <StatTile label="Quantum vulnerable" value={summary.vulnerable_count} sub="broken by Shor's / Grover's" color="#F97316" />
        <StatTile label="Critical" value={summary.critical_count} sub="immediate remediation" color="#EF4444" />
        <StatTile label="High risk" value={summary.high_count} sub="schedule this quarter" color="#F59E0B" />
        <StatTile label="Safe / PQC ready" value={summary.safe_count} sub="retain, no migration" color="#10B981" />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="flex flex-wrap gap-2 items-center mb-5"
      >
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(34,211,238,0.12)" }}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "rgba(34,211,238,0.4)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search algorithm, file, language…"
            className="bg-transparent outline-none flex-1 font-mono"
            style={{ fontSize: "12px", color: "#E2E8F0" }}
            aria-label="Filter findings"
          />
        </div>

        <label className="sr-only" htmlFor="risk-filter">Risk filter</label>
        <select
          id="risk-filter"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="font-mono text-xs px-3 py-2 rounded-xl outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(34,211,238,0.12)", color: "#E2E8F0" }}
          aria-label="Filter by risk"
        >
          <option value="All">All risks</option>
          {RISK_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <label className="sr-only" htmlFor="lang-filter">Language filter</label>
        <select
          id="lang-filter"
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="font-mono text-xs px-3 py-2 rounded-xl outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(34,211,238,0.12)", color: "#E2E8F0" }}
          aria-label="Filter by language"
        >
          <option value="All">All languages</option>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        <button
          onClick={() => setQvOnly(!qvOnly)}
          aria-pressed={qvOnly}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{
            background: qvOnly ? "rgba(239,68,68,0.1)" : "rgba(11,18,32,0.9)",
            border: qvOnly ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(34,211,238,0.12)",
            color: qvOnly ? "#EF4444" : "rgba(148,163,184,0.6)",
          }}
        >
          ◈ Quantum only
        </button>

        <div className="ml-auto font-mono text-xs" style={{ color: "rgba(34,211,238,0.5)" }} aria-live="polite" aria-atomic="true">
          {filtered.length} / {report.findings.length}
        </div>
      </motion.div>

      {/* Table — desktop */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl overflow-hidden mb-7 hidden md:block"
        style={{ background: "rgba(11,18,32,0.7)", border: "1px solid rgba(34,211,238,0.09)" }}
        role="table"
        aria-label="CBOM findings"
      >
        <div
          className="grid font-mono text-xs tracking-widest px-4 py-3"
          style={{
            gridTemplateColumns: "100px 130px 76px 1fr 52px 100px 64px 130px 1fr",
            background: "rgba(7,11,20,0.6)",
            borderBottom: "1px solid rgba(34,211,238,0.07)",
            color: "rgba(34,211,238,0.5)",
          }}
          role="row"
        >
          {["Risk", "Algorithm", "Lang", "File", "Line", "Operation", "Key", "Quantum impact", "Recommended PQC"].map((h) => (
            <div key={h} role="columnheader">{h}</div>
          ))}
        </div>

        <div role="rowgroup">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center" role="row">
              <div className="font-mono text-xs mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>NO MATCHING FINDINGS</div>
              <div className="text-xs" style={{ color: "rgba(148,163,184,0.3)" }}>Try changing or clearing your filters.</div>
            </div>
          )}
          {filtered.map((f, i) => {
            const rc = RISK_CONFIG[f.risk_level];
            const qi = quantumImpactIcon(f.quantum_impact);
            const rowKey = `${f.file_path}:${f.line_number}:${i}`;
            return (
              <button
                key={rowKey}
                ref={(el) => { if (el) triggerRefs.current.set(rowKey, el); }}
                onClick={() => openFinding(f, rowKey)}
                className="grid w-full text-left transition-colors duration-100 focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-cyan-400"
                style={{
                  gridTemplateColumns: "100px 130px 76px 1fr 52px 100px 64px 130px 1fr",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(34,211,238,0.05)",
                  alignItems: "center",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                role="row"
                aria-label={`${f.algorithm} in ${f.file_path}, ${f.risk_level} risk`}
              >
                <div><RiskBadge level={f.risk_level} /></div>
                <div className="font-mono text-sm font-semibold text-white truncate pr-2">{f.algorithm}</div>
                <div>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: `${LANG_COLORS[f.language] ?? "#94A3B8"}15`, border: `1px solid ${LANG_COLORS[f.language] ?? "#94A3B8"}30`, color: LANG_COLORS[f.language] ?? "#94A3B8" }}>
                    {f.language.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-xs truncate pr-2" style={{ color: "rgba(148,163,184,0.55)" }} title={f.file_path}>{f.file_path}</div>
                <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>:{f.line_number}</div>
                <div className="font-mono text-xs truncate pr-2" style={{ color: "rgba(148,163,184,0.6)" }}>{f.operation ?? "—"}</div>
                <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>{f.key_size ? `${f.key_size}b` : "—"}</div>
                <div>
                  <span
                    className="inline-flex items-center gap-1 font-mono text-xs"
                    style={{ color: qi.color }}
                    title={qi.label}
                    aria-label={qi.label}
                  >
                    {qi.symbol} <span className="hidden xl:inline">{qi.label}</span>
                  </span>
                </div>
                <div>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded truncate inline-block max-w-full"
                    style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.14)", color: "#22D3EE" }}
                    title={f.recommended_pqc}
                  >
                    {f.recommended_pqc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 mb-7">
        {filtered.length === 0 && (
          <div className="text-center py-8 font-mono text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
            NO MATCHING FINDINGS — try changing your filters.
          </div>
        )}
        {filtered.map((f, i) => {
          const rc = RISK_CONFIG[f.risk_level];
          const qi = quantumImpactIcon(f.quantum_impact);
          const rowKey = `mobile:${f.file_path}:${f.line_number}:${i}`;
          return (
            <button
              key={rowKey}
              ref={(el) => { if (el) triggerRefs.current.set(rowKey, el as HTMLButtonElement); }}
              onClick={() => openFinding(f, rowKey)}
              className="w-full text-left rounded-xl p-4 space-y-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              style={{ background: "rgba(11,18,32,0.8)", border: `1px solid ${rc.border}` }}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-white">{f.algorithm}</div>
                <RiskBadge level={f.risk_level} />
              </div>
              <div className="font-mono text-xs truncate" style={{ color: "rgba(148,163,184,0.5)" }}>{f.file_path}:{f.line_number}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: qi.color, fontSize: "11px" }} className="font-mono">{qi.symbol} {qi.label}</span>
              </div>
              <div className="font-mono text-xs" style={{ color: "#22D3EE" }}>→ {f.recommended_pqc}</div>
              <div className="font-mono text-xs text-right" style={{ color: "rgba(34,211,238,0.4)" }}>VIEW DETAILS →</div>
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <RiskDonut findings={filtered.length ? filtered : report.findings} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : 14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AlgoChart findings={filtered.length ? filtered : report.findings} />
        </motion.div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {state.selectedFinding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              onClick={closeFinding}
              aria-hidden="true"
            />
            <DetailDrawer
              finding={state.selectedFinding}
              onClose={closeFinding}
              triggerRef={currentTriggerRef}
            />
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
