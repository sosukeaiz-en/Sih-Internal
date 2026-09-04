import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { calculateMosca } from "../api";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { MOSCAResponse } from "../types";

// ─── Animated number ──────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (reduced) { setDisplay(value); prevRef.current = value; return; }
    const from = prevRef.current;
    prevRef.current = value;
    const controls = animate(from, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <>{display.toFixed(decimals)}</>;
}

// ─── Arc gauge ────────────────────────────────────────────────────────────────

function ArcGauge({
  value, max, color, label, unit, description, onChange,
}: {
  value: number; max: number; color: string; label: string;
  unit: string; description: string; onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 46;
  const startAngle = -210;
  const totalAngle = 240;
  const pct = Math.min(value / max, 1);
  const currentAngle = startAngle + pct * totalAngle;

  const polarToCart = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (from: number, to: number, rad: number) => {
    const s = polarToCart(from, rad);
    const e = polarToCart(to, rad);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const thumb = polarToCart(currentAngle, r);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <path d={arcPath(startAngle, startAngle + totalAngle, r)} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" strokeLinecap="round" />
          <motion.path
            d={arcPath(startAngle, currentAngle, r)}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
          {inView && (
            <circle cx={thumb.x} cy={thumb.y} r={5} fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
          )}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="16" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            <AnimatedNumber value={value} />
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="9" fontFamily="JetBrains Mono, monospace">
            {unit}
          </text>
        </svg>
      </div>
      <div className="font-mono text-xs font-semibold tracking-wider text-center" style={{ color }}>{label}</div>
      <div className="text-xs text-center" style={{ color: "rgba(148,163,184,0.5)", maxWidth: 120 }}>{description}</div>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28"
        style={{ accentColor: color }}
        aria-label={`${label}: ${value} ${unit}`}
      />
    </div>
  );
}

// ─── Threat gauge ─────────────────────────────────────────────────────────────

function ThreatGauge({
  ratio, riskLevel,
}: {
  ratio: number; riskLevel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  const color =
    riskLevel === "Critical" ? "#EF4444"
    : riskLevel === "High" ? "#F97316"
    : riskLevel === "Medium" ? "#F59E0B"
    : "#3B82F6";

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const startAngle = -220;
  const totalAngle = 260;
  const clampedRatio = Math.min(ratio / 2, 1); // map 0–2+ onto arc
  const currentAngle = startAngle + clampedRatio * totalAngle;

  const polarToCart = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (from: number, to: number) => {
    const s = polarToCart(from, r);
    const e = polarToCart(to, r);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const threshAngle = startAngle + 0.5 * totalAngle; // ratio = 1 threshold
  const threshPoint = polarToCart(threshAngle, r);

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="font-mono text-xs tracking-widest" style={{ color: "rgba(34,211,238,0.6)" }}>
        THREAT RATIO (x+y)/z
      </div>
      <div className="relative">
        <svg width={size} height={size} aria-label={`Threat ratio: ${ratio.toFixed(2)}`} role="img">
          <path d={arcPath(startAngle, startAngle + totalAngle)} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="10" strokeLinecap="round" />
          <circle cx={threshPoint.x} cy={threshPoint.y} r={5} fill="rgba(239,68,68,0.7)" style={{ filter: "drop-shadow(0 0 4px #EF4444)" }} aria-hidden="true" />
          <motion.path
            d={arcPath(startAngle, currentAngle)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 1.3, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
          <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="26" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            <AnimatedNumber value={ratio} decimals={2} />
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="10" fontFamily="JetBrains Mono, monospace">
            RATIO
          </text>
          <text x={cx} y={cy + 32} textAnchor="middle" fill={color} fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
            {riskLevel === "Critical" ? "CRITICAL RISK" : riskLevel === "High" ? "AT RISK NOW" : riskLevel === "Medium" ? "MODERATE RISK" : "WITHIN WINDOW"}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function ThreatTimeline({
  x, y, z, isAtRisk,
}: {
  x: number; y: number; z: number; isAtRisk: boolean;
}) {
  const reduced = useReducedMotion();
  const total = Math.max(x + y, z) + 4;

  const Bar = ({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) => (
    <div className="flex items-center gap-3">
      <div className="w-28 sm:w-36 font-mono text-xs text-right flex-shrink-0" style={{ color: "rgba(148,163,184,0.6)" }}>
        {label}
      </div>
      <div className="flex-1 h-6 rounded overflow-hidden relative" style={{ background: "rgba(148,163,184,0.06)" }}>
        <motion.div
          className="h-full rounded flex items-center px-2"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / total) * 100, 100)}%` }}
          transition={{ duration: reduced ? 0 : 0.8, delay, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${color}80, ${color}cc)`, boxShadow: `0 0 8px ${color}40` }}
        >
          <span className="font-mono text-xs text-white font-semibold whitespace-nowrap">{value}y</span>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="panel p-5 space-y-3">
      <div className="font-mono text-xs font-semibold tracking-widest mb-3" style={{ color: "rgba(34,211,238,0.6)" }}>
        THREAT TIMELINE
      </div>
      <Bar label="DATA SHELF LIFE" value={x} color="#22D3EE" delay={0} />
      <Bar label="MIGRATION WINDOW" value={y} color="#8B5CF6" delay={0.1} />
      <Bar label="Q-DAY ESTIMATE" value={z} color="#F97316" delay={0.2} />

      <AnimatePresence mode="wait">
        {isAtRisk ? (
          <motion.div
            key="risk"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl p-3 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.28)" }}
            role="alert"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
            <span className="font-mono text-xs text-red-400 font-semibold">
              THREAT EXISTS NOW — x+y ({x + y}y) exceeds Q-Day ({z}y)
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl p-3 flex items-center gap-3"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
            role="status"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="font-mono text-xs text-green-400">WITHIN SAFE WINDOW — migration completes before Q-Day</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function MoscaSection() {
  const [x, setX] = useState(10);
  const [y, setY] = useState(4);
  const [z, setZ] = useState(10);
  const [moscaResult, setMoscaResult] = useState<MOSCAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callMoscaAPI = useCallback(async (xv: number, yv: number, zv: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const result = await calculateMosca(
        { shelf_life_years: xv, migration_time_years: yv, qday_years: zv },
        abortRef.current.signal
      );
      setMoscaResult(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Fall back to client-side calculation
      const total = xv + yv;
      const ratio = zv > 0 ? total / zv : 999;
      setMoscaResult({
        is_at_risk_now: total > zv,
        urgency_gap_years: parseFloat((total - zv).toFixed(2)),
        threat_ratio: parseFloat(ratio.toFixed(2)),
        risk_level: total > zv ? (ratio >= 1.5 ? "Critical" : "High") : ratio >= 0.85 ? "Medium" : "Low",
        recommendation: total > zv
          ? "Immediate PQC migration required."
          : "Monitor and plan migration within the safe window.",
      });
      setError(`Backend unavailable — showing local calculation`);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleCall = useCallback(
    (xv: number, yv: number, zv: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => callMoscaAPI(xv, yv, zv), 400);
    },
    [callMoscaAPI]
  );

  useEffect(() => { scheduleCall(x, y, z); }, [x, y, z, scheduleCall]);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const ratio = moscaResult?.threat_ratio ?? (z > 0 ? (x + y) / z : 0);
  const riskLevel = moscaResult?.risk_level ?? "Low";
  const isAtRisk = moscaResult?.is_at_risk_now ?? (x + y > z);

  return (
    <section id="mosca" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="h-px w-full mb-10" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="font-mono text-xs tracking-widest mb-1" style={{ color: "rgba(139,92,246,0.7)" }}>
          QUANTUM THREAT ANALYSIS
        </h2>
        <p className="text-2xl font-semibold text-white">Mosca's Theorem</p>
        <p className="mt-1 text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
          Will your data outlive your migration window?
        </p>
        <div
          className="mt-5 inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <div className="font-mono text-2xl font-bold text-violet-400">x + y &gt; z</div>
          <div className="font-mono text-xs flex flex-wrap gap-3" style={{ color: "rgba(148,163,184,0.6)" }}>
            <span><span className="text-cyan-400">x</span> = Data Shelf Life</span>
            <span><span className="text-violet-400">y</span> = Migration Time</span>
            <span><span className="text-orange-400">z</span> = Q-Day Timeline</span>
          </div>
        </div>
        {error && (
          <div className="mt-3 font-mono text-xs px-3 py-1.5 rounded-lg inline-block" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "rgba(245,158,11,0.7)" }}>
            ⚠ {error}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="panel p-6"
        >
          <div className="font-mono text-xs tracking-widest mb-5" style={{ color: "rgba(34,211,238,0.6)" }}>SIMULATOR CONTROLS</div>
          <div className="space-y-7">
            <ArcGauge value={x} max={30} color="#22D3EE" label="DATA SHELF LIFE" unit="years" description="How long must your data remain secret?" onChange={(v) => { setX(v); }} />
            <ArcGauge value={y} max={20} color="#8B5CF6" label="MIGRATION TIME" unit="years" description="Time to complete PQC migration" onChange={(v) => { setY(v); }} />
            <ArcGauge value={z} max={30} color="#F97316" label="Q-DAY ESTIMATE" unit="years" description="Years until cryptographically-relevant quantum computer" onChange={(v) => { setZ(v); }} />
          </div>
        </motion.div>

        {/* Gauge + timeline */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="panel p-6">
            {loading && (
              <div className="flex items-center justify-center gap-2 mb-4 font-mono text-xs" style={{ color: "rgba(34,211,238,0.5)" }}>
                <span className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                CALCULATING…
              </div>
            )}
            <ThreatGauge ratio={ratio} riskLevel={riskLevel} />

            {moscaResult?.recommendation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl p-3"
                style={{ background: "rgba(11,18,32,0.6)", border: "1px solid rgba(34,211,238,0.07)" }}
              >
                <div className="font-mono text-xs mb-1" style={{ color: "rgba(34,211,238,0.45)" }}>RECOMMENDATION</div>
                <p className="text-sm" style={{ color: "rgba(148,163,184,0.8)" }}>{moscaResult.recommendation}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(34,211,238,0.07)" }}>
              {[
                { label: "x + y", value: `${x + y}y`, color: "#22D3EE" },
                { label: "vs", value: "vs", color: "rgba(148,163,184,0.4)" },
                { label: "Q-Day (z)", value: `${z}y`, color: "#F97316" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="font-mono text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <ThreatTimeline x={x} y={y} z={z} isAtRisk={isAtRisk} />
        </motion.div>
      </div>
    </section>
  );
}
