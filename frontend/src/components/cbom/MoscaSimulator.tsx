import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cbomApi, computeMosca } from "@/lib/cbom/api";
import type { MoscaResult } from "@/lib/cbom/types";
import { TrackingNumber, useSectionInView } from "./primitives";

const DEFAULTS = { shelfLife: 10, migrationTime: 4, qDay: 10 };

const LEVEL_COLOR: Record<MoscaResult["riskLevel"], string> = {
  low: "var(--green)",
  medium: "var(--amber)",
  high: "var(--orange)",
  critical: "var(--red)",
};

export function MoscaSimulator() {
  const { ref, inView } = useSectionInView<HTMLDivElement>("-20% 0px -20% 0px");
  const reduce = useReducedMotion();

  const [input, setInput] = useState(DEFAULTS);
  const [result, setResult] = useState<MoscaResult>(() => computeMosca(DEFAULTS));

  // Values render from 0 and animate to their configured targets on reveal.
  const shown = useMemo(
    () => (inView ? input : { shelfLife: 0, migrationTime: 0, qDay: 0 }),
    [inView, input],
  );

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setResult(computeMosca(input));
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      cbomApi
        .mosca(input)
        .then(setResult)
        .catch(() => {
          /* authoritative local fallback already applied */
        });
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [input]);

  const ratio = inView ? result.threatRatio : 0;
  const color = LEVEL_COLOR[result.riskLevel];

  return (
    <div ref={ref} className="space-y-5">
      {/* formula */}
      <div className="panel flex flex-col items-center gap-4 p-6 text-center">
        <motion.div
          className="font-mono text-4xl font-semibold tracking-[0.08em] sm:text-5xl"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 0.8, 0.24, 1] }}
        >
          <span className="text-cyan">x</span>
          <span className="text-muted-foreground"> + </span>
          <span className="text-violet">y</span>
          <span className="text-muted-foreground"> &gt; </span>
          <span className="text-orange">z</span>
        </motion.div>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["x", "Data shelf life", "How long the data must stay secret", "var(--cyan)"],
            ["y", "Migration time", "How long PQC rollout will take", "var(--violet)"],
            ["z", "Q-Day timeline", "When a quantum attacker becomes real", "var(--orange)"],
          ].map(([sym, label, hint, c], i) => (
            <motion.div
              key={sym}
              className="rounded-xl border border-border bg-[oklch(0.14_0.02_264)] p-3 text-left"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 + i * 0.09 }}
            >
              <span className="font-mono text-sm" style={{ color: c }}>
                {sym}
              </span>
              <p className="mt-1 font-mono text-[10.5px] tracking-[0.12em] text-foreground/90 uppercase">
                {label}
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{hint}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* controls */}
        <div className="panel p-5">
          <span className="tech-label">Threat parameters</span>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <ArcControl
              label="Data shelf life"
              symbol="x"
              value={shown.shelfLife}
              target={input.shelfLife}
              color="var(--cyan)"
              max={30}
              onChange={(v) => setInput((s) => ({ ...s, shelfLife: v }))}
            />
            <ArcControl
              label="Migration time"
              symbol="y"
              value={shown.migrationTime}
              target={input.migrationTime}
              color="var(--violet)"
              max={15}
              onChange={(v) => setInput((s) => ({ ...s, migrationTime: v }))}
            />
            <ArcControl
              label="Q-Day timeline"
              symbol="z"
              value={shown.qDay}
              target={input.qDay}
              color="var(--orange)"
              max={30}
              onChange={(v) => setInput((s) => ({ ...s, qDay: v }))}
            />
          </div>

          <div className="hairline my-5" />

          <ThreatTimeline
            x={shown.shelfLife}
            y={shown.migrationTime}
            z={shown.qDay}
            atRisk={result.atRisk}
          />
        </div>

        {/* gauge + verdict */}
        <div className="panel flex flex-col p-5">
          <span className="tech-label">Threat ratio (x + y) / z</span>
          <div className="mt-2 flex flex-1 flex-col items-center justify-center">
            <MoscaGauge ratio={ratio} color={color} active={inView} critical={result.atRisk} />
            <motion.div
              className="mt-4 text-center"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.15 }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase"
                style={{
                  color,
                  borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
                  background: `color-mix(in oklab, ${color} 12%, transparent)`,
                }}
              >
                {result.riskLevel} · {result.verdict}
              </span>
              <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
                {result.recommendation}
              </p>
              <p className="mt-3 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground/70 uppercase">
                {result.source === "api" ? "Backend risk engine" : "Local engine · backend offline"}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- arc control ------------------------------ */

function ArcControl({
  label,
  symbol,
  value,
  target,
  color,
  max,
  onChange,
}: {
  label: string;
  symbol: string;
  value: number;
  target: number;
  color: string;
  max: number;
  onChange: (v: number) => void;
}) {
  const size = 104;
  const r = 42;
  const circ = Math.PI * r; // half circle
  const pct = Math.min(1, value / max);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.66 }}>
        <svg width={size} height={size * 0.66} viewBox={`0 0 ${size} ${size * 0.66}`}>
          <path
            d={`M 10 ${size * 0.6} A ${r} ${r} 0 0 1 ${size - 10} ${size * 0.6}`}
            fill="none"
            stroke="oklch(0.24 0.03 264)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <motion.path
            d={`M 10 ${size * 0.6} A ${r} ${r} 0 0 1 ${size - 10} ${size * 0.6}`}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <span className="font-mono text-xl font-semibold" style={{ color }}>
            <TrackingNumber value={value} />
          </span>
          <span className="ml-1 font-mono text-[10px] text-muted-foreground">yr</span>
        </div>
      </div>
      <label className="mt-2 w-full text-center">
        <span className="block font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
          <span style={{ color }}>{symbol}</span> · {label}
        </span>
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={target}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${label} in years`}
          className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0"
          style={{
            background: `linear-gradient(90deg, ${color} ${(target / max) * 100}%, oklch(0.24 0.03 264) ${(target / max) * 100}%)`,
            accentColor: color,
          }}
        />
      </label>
    </div>
  );
}

/* --------------------------------- gauge --------------------------------- */

function MoscaGauge({
  ratio,
  color,
  active,
  critical,
}: {
  ratio: number;
  color: string;
  active: boolean;
  critical: boolean;
}) {
  const size = 240;
  const r = 96;
  const circ = Math.PI * r * 1.5; // 270deg arc
  const pct = Math.min(1, ratio / 2);

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={
        critical && active
          ? { boxShadow: [`0 0 0 0 transparent`, `0 0 60px -12px ${color}`, `0 0 0 0 transparent`] }
          : {}
      }
      transition={{ duration: 1.6, delay: 1.2 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Threat ratio ${ratio}`}>
        <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="oklch(0.22 0.028 264)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${2 * Math.PI * r}`}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${2 * Math.PI * r}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ type: "spring", stiffness: 60, damping: 18, delay: active ? 0.25 : 0 }}
            style={{ filter: `drop-shadow(0 0 12px ${color})` }}
          />
          {/* threshold marker at ratio = 1 */}
          <motion.line
            x1={size / 2 + r - 14}
            y1={size / 2}
            x2={size / 2 + r + 14}
            y2={size / 2}
            stroke="var(--foreground)"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 0.75 } : {}}
            transition={{ delay: 0.9, duration: 0.4 }}
            transform={`rotate(${0.5 * 270} ${size / 2} ${size / 2})`}
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="tech-label">Threat ratio</span>
          <div className="mt-1 font-mono text-[2.6rem] leading-none font-semibold" style={{ color }}>
            <TrackingNumber value={ratio} decimals={2} />
          </div>
          <span className="mt-1 block font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            threshold 1.00
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------- timeline ------------------------------- */

function ThreatTimeline({
  x,
  y,
  z,
  atRisk,
}: {
  x: number;
  y: number;
  z: number;
  atRisk: boolean;
}) {
  const span = Math.max(x + y, z, 1);
  const bars = [
    { label: "Data shelf life", value: x, color: "var(--cyan)", offset: 0 },
    { label: "Migration window", value: y, color: "var(--violet)", offset: x },
    { label: "Q-Day horizon", value: z, color: "var(--orange)", offset: 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="tech-label">Exposure timeline</span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          0 — {span.toFixed(0)} years
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.1em] uppercase">
              <span style={{ color: b.color }}>{b.label}</span>
              <span className="text-muted-foreground">
                <TrackingNumber value={b.value} />y
              </span>
            </div>
            <div className="relative mt-1 h-[10px] overflow-hidden rounded-full bg-[oklch(0.2_0.025_264)]">
              <motion.div
                className="absolute inset-y-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, color-mix(in oklab, ${b.color} 45%, transparent), ${b.color})`,
                }}
                animate={{
                  left: `${(b.offset / span) * 100}%`,
                  width: `${(b.value / span) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* threat marker */}
      <div className="relative mt-3 h-8">
        <motion.div
          className="absolute top-0 bottom-0 w-px"
          style={{ background: "var(--orange)", boxShadow: "0 0 10px var(--orange)" }}
          animate={{ left: `${(z / span) * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
        <motion.div
          className="absolute top-0 bottom-0 w-px"
          style={{ background: "var(--cyan)" }}
          animate={{ left: `${((x + y) / span) * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
        {atRisk && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 bottom-0 rounded-md border px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] uppercase"
            style={{
              color: "var(--red)",
              borderColor: "color-mix(in oklab, var(--red) 40%, transparent)",
              background: "color-mix(in oklab, var(--red) 12%, transparent)",
            }}
          >
            Threat exists now — x + y overruns z
          </motion.span>
        )}
      </div>
    </div>
  );
}
