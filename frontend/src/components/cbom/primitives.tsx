import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LANGUAGE_LABEL, QUANTUM_IMPACT_LABEL, RISK_META } from "@/lib/cbom/pqc";
import type { QuantumImpact, RiskLevel } from "@/lib/cbom/types";

/* ---------------- count up ---------------- */

export function useCountUp(target: number, active: boolean, duration = 1400) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, active, duration, reduce]);

  return value;
}

export function Counter({
  value,
  active,
  decimals = 0,
  duration = 1400,
  className,
}: {
  value: number;
  active: boolean;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const v = useCountUp(value, active, duration);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {v.toFixed(decimals)}
    </span>
  );
}

/** Smoothly animated number that tracks changing targets (Mosca controls). */
export function TrackingNumber({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 18, mass: 0.6 });
  const text = useTransform(spring, (v) => v.toFixed(decimals));
  useEffect(() => {
    if (reduce) mv.jump(value);
    else mv.set(value);
  }, [value, mv, reduce]);
  return (
    <motion.span
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </motion.span>
  );
}

/* ---------------- reveal ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = true,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? { opacity: 1 }
          : { opacity: 0, y, scale: 0.975, filter: blur ? "blur(8px)" : "none" }
      }
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px -10% 0px" }}
      transition={{ duration: 0.75, delay, ease: [0.16, 0.8, 0.24, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function useSectionInView<T extends Element>(margin = "-25% 0px -25% 0px") {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: margin as never });
  return { ref, inView };
}

/* ---------------- chrome ---------------- */

export function StatusDot({
  tone = "cyan",
  pulse = true,
  size = 6,
}: {
  tone?: "cyan" | "green" | "amber" | "red" | "blue" | "violet" | "orange";
  pulse?: boolean;
  size?: number;
}) {
  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `var(--${tone})`, boxShadow: `0 0 8px var(--${tone})` }}
      />
      {pulse && (
        <span
          className="animate-signal absolute inset-0 rounded-full"
          style={{ background: `var(--${tone})`, opacity: 0.5 }}
        />
      )}
    </span>
  );
}

export function Eyebrow({
  children,
  tone = "cyan",
}: {
  children: ReactNode;
  tone?: "cyan" | "violet" | "blue";
}) {
  return (
    <span className="tech-label inline-flex items-center gap-2">
      <StatusDot tone={tone} />
      <span style={{ color: `var(--${tone})` }}>{children}</span>
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "cyan",
  align = "left",
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  tone?: "cyan" | "violet" | "blue";
  align?: "left" | "center";
  aside?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "text-center")}>
        <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2.1rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>
      {aside}
    </div>
  );
}

export function RiskBadge({ risk, compact = false }: { risk: RiskLevel; compact?: boolean }) {
  const meta = RISK_META[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] font-mono text-[10px] font-medium tracking-[0.14em] uppercase",
        compact && "px-1.5",
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 38%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
      />
      {meta.label}
    </span>
  );
}

export function LangBadge({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-surface-2/70 px-1.5 py-[2px] font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
      {LANGUAGE_LABEL[language] ?? language.toUpperCase()}
    </span>
  );
}

export function QuantumBadge({
  impact,
  vulnerable,
}: {
  impact: QuantumImpact;
  vulnerable: boolean;
}) {
  const tone = vulnerable
    ? "var(--red)"
    : impact === "weakened" || impact === "deprecated"
      ? "var(--amber)"
      : "var(--green)";
  const glyph = vulnerable ? "◈" : impact === "safe" || impact === "pqc-ready" ? "◆" : "◇";
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.08em] whitespace-nowrap"
      style={{ color: tone }}
      title={QUANTUM_IMPACT_LABEL[impact] ?? impact}
    >
      <span aria-hidden="true">{glyph}</span>
      {QUANTUM_IMPACT_LABEL[impact] ?? impact}
    </span>
  );
}

export function PqcChip({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[color-mix(in_oklab,var(--cyan)_28%,transparent)] bg-[color-mix(in_oklab,var(--cyan)_10%,transparent)] px-2 py-[3px] font-mono text-[10.5px] tracking-[0.04em] text-cyan">
      {value}
    </span>
  );
}

/** Minimal, dependency-free tokenizer for the code viewer. */
export function CodeBlock({
  code,
  startLine,
  highlightLine,
  language,
}: {
  code: string;
  startLine: number;
  highlightLine: number;
  language: string;
}) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[oklch(0.12_0.02_264)]">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="tech-label">{language} source</span>
        <span className="tech-label">line {highlightLine}</span>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11.5px] leading-[1.75]">
        <code>
          {lines.map((line, i) => {
            const n = startLine + i;
            const active = n === highlightLine;
            return (
              <div
                key={i}
                className="flex gap-3 px-1"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(90deg, color-mix(in oklab, var(--red) 16%, transparent), transparent)",
                        boxShadow: "inset 2px 0 0 0 var(--red)",
                      }
                    : undefined
                }
              >
                <span className="w-8 shrink-0 text-right text-muted-foreground/60 select-none">
                  {n}
                </span>
                <span className="whitespace-pre text-foreground/85">
                  {highlight(line)}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

const KEYWORDS =
  /\b(from|import|def|return|const|let|var|function|class|public|private|new|if|else|for|err|nil|byte|await|async|package|require|raise|not|true|false|True|False)\b/g;

function highlight(line: string) {
  const parts: ReactNode[] = [];
  let rest = line;

  // strings first
  const tokens = rest.split(/("[^"]*"|'[^']*')/g);
  tokens.forEach((tok, idx) => {
    if (!tok) return;
    if (/^["']/.test(tok)) {
      parts.push(
        <span key={`s${idx}`} style={{ color: "var(--green)" }}>
          {tok}
        </span>,
      );
      return;
    }
    if (tok.trimStart().startsWith("//") || tok.trimStart().startsWith("#")) {
      parts.push(
        <span key={`c${idx}`} className="text-muted-foreground/70">
          {tok}
        </span>,
      );
      return;
    }
    const sub: ReactNode[] = [];
    let last = 0;
    for (const m of tok.matchAll(KEYWORDS)) {
      const i = m.index ?? 0;
      if (i > last) sub.push(tok.slice(last, i));
      sub.push(
        <span key={`k${idx}-${i}`} style={{ color: "var(--violet)" }}>
          {m[0]}
        </span>,
      );
      last = i + m[0].length;
    }
    if (last < tok.length) sub.push(tok.slice(last));
    parts.push(<span key={`t${idx}`}>{sub}</span>);
  });

  return parts;
}
