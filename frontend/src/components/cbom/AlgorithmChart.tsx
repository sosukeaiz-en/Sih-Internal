import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { QUANTUM_IMPACT_LABEL, RISK_META } from "@/lib/cbom/pqc";
import type { ScanResult } from "@/lib/cbom/types";
import { useSectionInView } from "./primitives";

export function AlgorithmChart({ result }: { result: ScanResult }) {
  const { ref, inView } = useSectionInView<HTMLDivElement>("-15% 0px -15% 0px");
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  const data = result.algorithms.slice(0, 12);
  const max = Math.max(1, ...data.map((d) => d.count));
  const vulnerable = data.filter((d) => d.quantumVulnerable).reduce((a, d) => a + d.count, 0);

  return (
    <div ref={ref} className="panel h-full p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="tech-label">Algorithms discovered</span>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Occurrence count per primitive, ranked by prevalence
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: "var(--red)" }} />
            quantum vulnerable
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: "var(--green)" }} />
            resistant
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {data.map((d, i) => {
          const color = d.quantumVulnerable ? RISK_META[d.risk].color : "var(--green)";
          const isHover = hover === d.algorithm;
          return (
            <li
              key={d.algorithm}
              onMouseEnter={() => setHover(d.algorithm)}
              onMouseLeave={() => setHover(null)}
              className="relative"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  className="w-[124px] shrink-0 truncate font-mono text-[11.5px] text-foreground/90"
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                >
                  {d.algorithm}
                </motion.span>

                <div className="relative h-[18px] flex-1 overflow-hidden rounded-md bg-[oklch(0.2_0.025_264)]">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-md"
                    style={{
                      background: `linear-gradient(90deg, color-mix(in oklab, ${color} 55%, transparent), ${color})`,
                      boxShadow: isHover ? `0 0 14px ${color}` : undefined,
                    }}
                    initial={reduce ? { width: `${(d.count / max) * 100}%` } : { width: 0 }}
                    animate={inView ? { width: `${(d.count / max) * 100}%` } : {}}
                    transition={{
                      duration: 0.85,
                      delay: 0.2 + i * 0.06,
                      ease: [0.16, 0.8, 0.24, 1],
                    }}
                  />
                  {/* tick grid */}
                  <div className="pointer-events-none absolute inset-0 flex">
                    {Array.from({ length: 6 }).map((_, k) => (
                      <span key={k} className="flex-1 border-r border-[oklch(1_0_0_/_0.05)] last:border-0" />
                    ))}
                  </div>
                </div>

                <motion.span
                  className="w-6 shrink-0 text-right font-mono text-[11.5px]"
                  style={{ color }}
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.05 }}
                >
                  {d.count}
                </motion.span>
              </div>

              {isHover && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 z-20 mt-1 w-[248px] rounded-lg border border-border-strong bg-[oklch(0.17_0.024_264)] p-3 shadow-2xl"
                >
                  <p className="font-mono text-[12px] text-foreground">{d.algorithm}</p>
                  <dl className="mt-2 space-y-1 font-mono text-[10.5px]">
                    <Row label="Risk" value={RISK_META[d.risk].label} color={RISK_META[d.risk].color} />
                    <Row
                      label="Quantum"
                      value={QUANTUM_IMPACT_LABEL[d.quantumImpact] ?? d.quantumImpact}
                      color={d.quantumVulnerable ? "var(--red)" : "var(--green)"}
                    />
                    <Row label="Migrate to" value={d.recommendedPqc} color="var(--cyan)" />
                    <Row label="Occurrences" value={String(d.count)} color="var(--foreground)" />
                  </dl>
                </motion.div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hairline mt-5" />
      <motion.p
        className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        {vulnerable} of {result.findings.length} occurrences fall to Shor&apos;s algorithm
      </motion.p>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="tracking-[0.1em] text-muted-foreground uppercase">{label}</dt>
      <dd className="text-right" style={{ color }}>
        {value}
      </dd>
    </div>
  );
}
