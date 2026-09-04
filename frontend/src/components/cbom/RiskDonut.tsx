import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { RISK_META, RISK_ORDER } from "@/lib/cbom/pqc";
import type { RiskLevel, ScanResult } from "@/lib/cbom/types";
import { Counter, useSectionInView } from "./primitives";

const SIZE = 260;
const R = 96;
const STROKE = 22;
const C = 2 * Math.PI * R;

export function RiskDonut({ result }: { result: ScanResult }) {
  const { ref, inView } = useSectionInView<HTMLDivElement>("-15% 0px -15% 0px");
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<RiskLevel | null>(null);

  const total = result.findings.length || 1;
  const segments = RISK_ORDER.map((risk) => ({
    risk,
    count: result.riskBreakdown[risk] ?? 0,
  })).filter((s) => s.count > 0);

  let offsetAcc = 0;
  const arcs = segments.map((s) => {
    const fraction = s.count / total;
    const arc = { ...s, fraction, dash: C * fraction, offset: offsetAcc };
    offsetAcc += C * fraction;
    return arc;
  });

  const active = hover ? arcs.find((a) => a.risk === hover) : null;

  return (
    <div ref={ref} className="panel h-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="tech-label">Risk level breakdown</span>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Distribution of every catalogued artifact
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70 uppercase">
          n = {total}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <motion.div
          className="relative shrink-0"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.85 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 0.8, 0.24, 1] }}
          style={{ width: SIZE, height: SIZE }}
        >
          <svg width={SIZE} height={SIZE} role="img" aria-label="Risk level distribution donut chart">
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="oklch(0.24 0.03 264)"
                strokeWidth={STROKE}
              />
              {arcs.map((a, i) => {
                const meta = RISK_META[a.risk];
                const isHover = hover === a.risk;
                return (
                  <motion.circle
                    key={a.risk}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth={isHover ? STROKE + 7 : STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${a.dash} ${C - a.dash}`}
                    initial={reduce ? false : { strokeDashoffset: -C }}
                    animate={
                      inView
                        ? { strokeDashoffset: -a.offset, opacity: hover && !isHover ? 0.35 : 1 }
                        : {}
                    }
                    transition={{
                      strokeDashoffset: {
                        duration: 1.05,
                        delay: 0.2 + i * 0.13,
                        ease: [0.16, 0.8, 0.24, 1],
                      },
                      strokeWidth: { duration: 0.2 },
                      opacity: { duration: 0.2 },
                    }}
                    style={{ filter: isHover ? `drop-shadow(0 0 10px ${meta.color})` : undefined }}
                    onMouseEnter={() => setHover(a.risk)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <span className="tech-label">{active ? RISK_META[active.risk].label : "Risk"}</span>
              <div
                className="mt-1 font-mono text-[2.4rem] leading-none font-semibold"
                style={{ color: active ? RISK_META[active.risk].color : "var(--foreground)" }}
              >
                <Counter value={active ? active.count : total} active={inView} duration={900} />
              </div>
              <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {active ? `${(active.fraction * 100).toFixed(1)}%` : "artifacts"}
              </span>
            </div>
          </div>
        </motion.div>

        <ul className="w-full space-y-1.5">
          {RISK_ORDER.map((risk, i) => {
            const count = result.riskBreakdown[risk] ?? 0;
            const meta = RISK_META[risk];
            return (
              <motion.li
                key={risk}
                initial={reduce ? { opacity: 1 } : { opacity: 0, x: 12 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.75 + i * 0.09 }}
                onMouseEnter={() => setHover(risk)}
                onMouseLeave={() => setHover(null)}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-[color-mix(in_oklab,var(--cyan)_6%,transparent)]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                />
                <span className="font-mono text-[11.5px] tracking-[0.08em] text-foreground/90 uppercase">
                  {meta.label}
                </span>
                <span className="ml-auto font-mono text-[12px] text-foreground">{count}</span>
                <span className="w-11 text-right font-mono text-[10.5px] text-muted-foreground">
                  {((count / total) * 100).toFixed(0)}%
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
