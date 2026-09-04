import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { MIGRATION_PATHS, PQC_STANDARDS, ROADMAP_STAGES } from "@/lib/cbom/pqc";
import { cbomApi } from "@/lib/cbom/api";
import type { PqcStandard } from "@/lib/cbom/types";
import { Reveal, useSectionInView } from "./primitives";
import { cn } from "@/lib/utils";

export function PQCRoadmap({
  highlightStandardId,
  highlightAlgorithm,
}: {
  highlightStandardId: string | null;
  highlightAlgorithm: string | null;
}) {
  const { ref, inView } = useSectionInView<HTMLDivElement>("-15% 0px -15% 0px");
  const reduce = useReducedMotion();
  const [standards, setStandards] = useState<PqcStandard[]>(PQC_STANDARDS);
  const [open, setOpen] = useState<string | null>("ml-kem");

  useEffect(() => {
    cbomApi.pqcStandards().then(setStandards).catch(() => setStandards(PQC_STANDARDS));
  }, []);

  useEffect(() => {
    if (highlightStandardId) setOpen(highlightStandardId);
  }, [highlightStandardId]);

  return (
    <div ref={ref} className="space-y-6">
      {/* stage rail */}
      <div className="panel p-5">
        <span className="tech-label">Migration journey</span>
        <div className="relative mt-5 grid gap-5 md:grid-cols-5">
          <motion.div
            className="absolute top-[13px] left-0 hidden h-px md:block"
            style={{ background: "var(--gradient-brand)" }}
            initial={reduce ? { width: "100%" } : { width: 0 }}
            animate={inView ? { width: "100%" } : {}}
            transition={{ duration: 1.4, ease: [0.16, 0.8, 0.24, 1] }}
          />
          {ROADMAP_STAGES.map((s, i) => (
            <motion.div
              key={s.id}
              className="relative"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.16 }}
            >
              <span
                className="relative z-10 grid size-[26px] place-items-center rounded-full border font-mono text-[10px]"
                style={{
                  borderColor:
                    i === ROADMAP_STAGES.length - 1
                      ? "color-mix(in oklab, var(--green) 55%, transparent)"
                      : "var(--border-strong)",
                  background: "oklch(0.16 0.024 264)",
                  color: i === ROADMAP_STAGES.length - 1 ? "var(--green)" : "var(--cyan)",
                  boxShadow:
                    i === ROADMAP_STAGES.length - 1 ? "0 0 18px -4px var(--green)" : undefined,
                }}
              >
                {i + 1}
              </span>
              <p className="mt-3 font-mono text-[11px] tracking-[0.12em] text-foreground uppercase">
                {s.label}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* standard cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {standards.map((s, i) => {
          const active = open === s.id;
          const highlighted = highlightStandardId === s.id;
          return (
            <Reveal key={s.id} delay={i * 0.07}>
              <div
                className={cn("panel panel-hover h-full overflow-hidden")}
                style={
                  highlighted
                    ? {
                        borderColor: "color-mix(in oklab, var(--cyan) 55%, transparent)",
                        boxShadow: "0 0 42px -18px var(--cyan)",
                      }
                    : undefined
                }
              >
                <button
                  onClick={() => setOpen(active ? null : s.id)}
                  aria-expanded={active}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                        {s.algorithm}
                      </h3>
                      <p className="mt-1 font-mono text-[10.5px] tracking-[0.14em] text-cyan uppercase">
                        {s.standard}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        active && "rotate-180 text-cyan",
                      )}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Tag>{s.purpose}</Tag>
                    <Tag tone="violet">{s.family}</Tag>
                    <Tag tone="muted">was {s.formerName}</Tag>
                  </div>
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 0.8, 0.24, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 border-t border-border px-4 py-4">
                    <Field label="Recommended">
                      <span className="rounded-md border border-[color-mix(in_oklab,var(--cyan)_30%,transparent)] bg-[color-mix(in_oklab,var(--cyan)_10%,transparent)] px-2 py-1 font-mono text-[11px] text-cyan">
                        {s.recommended}
                      </span>
                    </Field>
                    <Field label="Hybrid mode">
                      <span className="font-mono text-[11.5px] text-foreground/90">{s.hybrid}</span>
                    </Field>
                    <Field label="Variants">
                      <span className="flex flex-wrap gap-1.5">
                        {s.variants.map((v) => (
                          <Tag key={v} tone="muted">
                            {v}
                          </Tag>
                        ))}
                      </span>
                    </Field>
                    <Field label="Replaces">
                      <span className="font-mono text-[11.5px] text-muted-foreground">
                        {s.replaces.join(" · ")}
                      </span>
                    </Field>
                    <Field label="Status">
                      <span className="font-mono text-[11px] text-green">{s.status}</span>
                    </Field>
                  </div>
                </motion.div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* migration paths */}
      <div className="panel p-5">
        <span className="tech-label">Migration paths for detected algorithms</span>
        <div className="mt-4 space-y-3">
          {MIGRATION_PATHS.map((p, i) => {
            const isHot =
              highlightStandardId === p.standardId ||
              (highlightAlgorithm
                ? p.legacy.toLowerCase().includes(highlightAlgorithm.split("-")[0]!.toLowerCase())
                : false);
            const nodes = [p.legacy, ...p.steps, p.target];
            return (
              <motion.div
                key={p.legacy}
                className="flex flex-wrap items-center gap-2 rounded-xl border p-3 transition-colors"
                style={{
                  borderColor: isHot
                    ? "color-mix(in oklab, var(--cyan) 45%, transparent)"
                    : "var(--border)",
                  background: isHot
                    ? "color-mix(in oklab, var(--cyan) 7%, transparent)"
                    : "oklch(0.14 0.02 264 / 60%)",
                }}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              >
                {nodes.map((n, k) => (
                  <span key={n} className="flex items-center gap-2">
                    <span
                      className="rounded-md border px-2.5 py-1.5 font-mono text-[11px]"
                      style={{
                        color:
                          k === 0
                            ? "var(--red)"
                            : k === nodes.length - 1
                              ? "var(--green)"
                              : "var(--cyan)",
                        borderColor: `color-mix(in oklab, ${
                          k === 0 ? "var(--red)" : k === nodes.length - 1 ? "var(--green)" : "var(--cyan)"
                        } 32%, transparent)`,
                        background: `color-mix(in oklab, ${
                          k === 0 ? "var(--red)" : k === nodes.length - 1 ? "var(--green)" : "var(--cyan)"
                        } 9%, transparent)`,
                        boxShadow:
                          k === nodes.length - 1 && isHot ? "0 0 22px -8px var(--green)" : undefined,
                      }}
                    >
                      {n}
                    </span>
                    {k < nodes.length - 1 && (
                      <motion.span
                        initial={reduce ? { opacity: 1 } : { opacity: 0, x: -4 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.35, delay: 0.3 + i * 0.1 + k * 0.12 }}
                      >
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                      </motion.span>
                    )}
                  </span>
                ))}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Tag({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "violet" | "muted";
}) {
  const color =
    tone === "muted" ? "var(--muted-foreground)" : tone === "violet" ? "var(--violet)" : "var(--cyan)";
  return (
    <span
      className="rounded border px-1.5 py-[2px] font-mono text-[10px] tracking-[0.08em]"
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 28%, transparent)`,
        background: `color-mix(in oklab, ${color} 8%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="tech-label">{label}</span>
      {children}
    </div>
  );
}
