import { motion } from "motion/react";

import type { ScanResult } from "@/lib/cbom/types";
import { Counter, Reveal, StatusDot, useSectionInView } from "./primitives";

interface Tile {
  key: string;
  label: string;
  value: number;
  hint: string;
  color: string;
  tone: "cyan" | "orange" | "red" | "amber" | "green";
  signal: number[];
}

export function CBOMOverview({ result }: { result: ScanResult }) {
  const { ref, inView } = useSectionInView<HTMLDivElement>("-20% 0px -20% 0px");
  const s = result.summary;

  const tiles: Tile[] = [
    {
      key: "total",
      label: "Total assets",
      value: s.totalAssets,
      hint: `across ${s.filesScanned} files`,
      color: "var(--cyan)",
      tone: "cyan",
      signal: [3, 6, 4, 8, 7, 11, 9, 14],
    },
    {
      key: "qv",
      label: "Quantum vulnerable",
      value: s.quantumVulnerable,
      hint: "broken by Shor's algorithm",
      color: "var(--orange)",
      tone: "orange",
      signal: [2, 4, 3, 7, 6, 9, 8, 12],
    },
    {
      key: "critical",
      label: "Critical",
      value: result.riskBreakdown.critical,
      hint: "immediate remediation",
      color: "var(--red)",
      tone: "red",
      signal: [1, 3, 2, 5, 4, 7, 6, 9],
    },
    {
      key: "high",
      label: "High risk",
      value: result.riskBreakdown.high,
      hint: "schedule this quarter",
      color: "var(--amber)",
      tone: "amber",
      signal: [2, 3, 5, 4, 6, 5, 8, 7],
    },
    {
      key: "safe",
      label: "Safe / PQC ready",
      value: result.riskBreakdown.safe + result.riskBreakdown.low,
      hint: "retain, no migration",
      color: "var(--green)",
      tone: "green",
      signal: [4, 5, 7, 6, 9, 8, 11, 13],
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((t, i) => (
        <Reveal key={t.key} delay={i * 0.07}>
          <MetricTile tile={t} active={inView} />
        </Reveal>
      ))}
    </div>
  );
}

function MetricTile({ tile, active }: { tile: Tile; active: boolean }) {
  const max = Math.max(...tile.signal);
  return (
    <div className="panel panel-hover group relative h-full overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-32 w-32 rounded-full opacity-45 transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${tile.color} 40%, transparent), transparent 70%)`,
          filter: "blur(26px)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <span className="tech-label">{tile.label}</span>
        <StatusDot tone={tile.tone} />
      </div>
      <div className="relative mt-3 flex items-end gap-2">
        <Counter
          value={tile.value}
          active={active}
          className="font-mono text-[2.1rem] leading-none font-semibold"
        />
        <span
          className="mb-1 h-4 w-[3px] rounded-full"
          style={{ background: tile.color, boxShadow: `0 0 10px ${tile.color}` }}
        />
      </div>
      <p className="relative mt-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/85 uppercase">
        {tile.hint}
      </p>

      {/* micro sparkline */}
      <div className="relative mt-3 flex h-6 items-end gap-[3px]">
        {tile.signal.map((v, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-sm"
            style={{ background: `color-mix(in oklab, ${tile.color} ${28 + (v / max) * 55}%, transparent)` }}
            initial={{ height: 2 }}
            animate={active ? { height: `${(v / max) * 100}%` } : { height: 2 }}
            transition={{ duration: 0.7, delay: 0.25 + i * 0.05, ease: [0.16, 0.8, 0.24, 1] }}
          />
        ))}
      </div>
    </div>
  );
}
