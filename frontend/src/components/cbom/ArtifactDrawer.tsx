import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { useEffect } from "react";

import type { Finding } from "@/lib/cbom/types";
import { CodeBlock, LangBadge, PqcChip, QuantumBadge, RiskBadge } from "./primitives";

export function ArtifactDrawer({
  finding,
  onClose,
  onShowInRoadmap,
}: {
  finding: Finding | null;
  onClose: () => void;
  onShowInRoadmap: (f: Finding) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {finding && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-[oklch(0.09_0.02_264_/_0.7)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${finding.algorithm} finding detail`}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[540px] flex-col border-l border-border-strong bg-[oklch(0.15_0.022_264)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.9 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <span className="tech-label">Finding {finding.id}</span>
                <h3 className="mt-1.5 font-mono text-xl font-semibold tracking-tight">
                  {finding.algorithm}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RiskBadge risk={finding.risk} />
                  <LangBadge language={finding.language} />
                  <QuantumBadge
                    impact={finding.quantumImpact}
                    vulnerable={finding.quantumVulnerable}
                  />
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close detail panel"
                className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ["File", finding.file, true],
                  ["Line", String(finding.line), true],
                  ["Operation", finding.operation, false],
                  ["Key size", finding.keySize ? `${finding.keySize} bits` : "n/a", true],
                  [
                    "Classical security",
                    finding.classicalBits != null ? `${finding.classicalBits} bits` : "n/a",
                    true,
                  ],
                  ["PQC category", finding.pqcCategory, false],
                ].map(([label, value, mono], i) => (
                  <div key={i} className={label === "File" ? "col-span-2" : undefined}>
                    <dt className="tech-label">{label}</dt>
                    <dd
                      className={
                        mono
                          ? "mt-1 font-mono text-[12px] break-all text-foreground/90"
                          : "mt-1 text-[12.5px] text-foreground/90"
                      }
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="hairline" />

              <div>
                <span className="tech-label">Detected source</span>
                <div className="mt-2">
                  <CodeBlock
                    code={finding.snippet || "// snippet unavailable from backend response"}
                    startLine={finding.snippetStartLine}
                    highlightLine={finding.line}
                    language={finding.language}
                  />
                </div>
              </div>

              <div>
                <span className="tech-label">Analyst notes</span>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {finding.notes || "No additional notes supplied."}
                </p>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: "color-mix(in oklab, var(--cyan) 26%, transparent)",
                  background:
                    "linear-gradient(150deg, color-mix(in oklab, var(--cyan) 8%, transparent), transparent)",
                }}
              >
                <span className="tech-label" style={{ color: "var(--cyan)" }}>
                  Migration recommendation
                </span>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-md border border-[color-mix(in_oklab,var(--red)_35%,transparent)] bg-[color-mix(in_oklab,var(--red)_10%,transparent)] px-2.5 py-1.5 font-mono text-[12px] text-red">
                    {finding.algorithm}
                  </span>
                  <ArrowRight className="size-4 text-cyan" />
                  <PqcChip value={finding.recommendedPqc} />
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
                  {finding.pqcCategory} — deploy in hybrid mode first so classical
                  interoperability is preserved during rollout.
                </p>
                <button
                  onClick={() => onShowInRoadmap(finding)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border-strong px-3 py-2 font-mono text-[10.5px] tracking-[0.14em] text-cyan uppercase transition-colors hover:bg-[color-mix(in_oklab,var(--cyan)_12%,transparent)]"
                >
                  Show in PQC roadmap <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
