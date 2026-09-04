import { motion } from "motion/react";
import { Check, FileCode2, FileJson, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { cbomApi } from "@/lib/cbom/api";
import type { ScanResult } from "@/lib/cbom/types";
import { Reveal } from "./primitives";

type Kind = "cyclonedx" | "cbom" | "html";

const ITEMS: { kind: Kind; title: string; sub: string; icon: typeof FileJson; tone: string }[] = [
  { kind: "cyclonedx", title: "CycloneDX v1.6", sub: "JSON · standards-compliant CBOM", icon: FileCode2, tone: "var(--cyan)" },
  { kind: "cbom", title: "Raw CBOM", sub: "JSON · full artifact inventory", icon: FileJson, tone: "var(--blue)" },
  { kind: "html", title: "Executive Report", sub: "HTML · stakeholder summary", icon: FileText, tone: "var(--violet)" },
];

export function ExportPanel({ result }: { result: ScanResult }) {
  const [state, setState] = useState<Record<string, "idle" | "working" | "ready">>({});

  const run = async (kind: Kind) => {
    setState((s) => ({ ...s, [kind]: "working" }));
    let blobUrl: string | null = null;
    try {
      const res = await fetch(cbomApi.exportUrl(kind));
      if (!res.ok) throw new Error("export failed");
      blobUrl = URL.createObjectURL(await res.blob());
    } catch {
      const payload =
        kind === "html"
          ? new Blob(
              [
                `<!doctype html><meta charset="utf-8"><title>CBOM Sentinel Report</title><body style="font-family:system-ui;background:#070B14;color:#e6edf7;padding:40px"><h1>CBOM Sentinel — Executive Report</h1><p>${result.summary.repository} · ${result.summary.totalAssets} artifacts · ${result.summary.quantumVulnerable} quantum-vulnerable · ${result.summary.critical} critical</p><pre>${result.findings
                  .map((f) => `${f.risk.toUpperCase().padEnd(9)} ${f.algorithm} ${f.file}:${f.line} → ${f.recommendedPqc}`)
                  .join("\n")}</pre></body>`,
              ],
              { type: "text/html" },
            )
          : new Blob(
              [
                JSON.stringify(
                  kind === "cyclonedx"
                    ? {
                        bomFormat: "CycloneDX",
                        specVersion: "1.6",
                        metadata: { component: { name: result.summary.repository, type: "application" } },
                        components: result.findings.map((f) => ({
                          type: "cryptographic-asset",
                          name: f.algorithm,
                          cryptoProperties: {
                            assetType: "algorithm",
                            algorithmProperties: {
                              primitive: f.operation,
                              parameterSetIdentifier: f.keySize ?? undefined,
                              classicalSecurityLevel: f.classicalBits ?? undefined,
                              nistQuantumSecurityLevel: f.quantumVulnerable ? 0 : 1,
                            },
                          },
                          evidence: { occurrences: [{ location: `${f.file}#L${f.line}` }] },
                        })),
                      }
                    : result,
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            );
      blobUrl = URL.createObjectURL(payload);
    }
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download =
      kind === "html" ? "cbom-sentinel-report.html" : `cbom-sentinel-${kind}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    setState((s) => ({ ...s, [kind]: "ready" }));
    setTimeout(() => setState((s) => ({ ...s, [kind]: "idle" })), 2600);
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ITEMS.map((item, i) => {
        const st = state[item.kind] ?? "idle";
        const Icon = item.icon;
        return (
          <Reveal key={item.kind} delay={i * 0.08}>
            <button
              onClick={() => run(item.kind)}
              disabled={st === "working"}
              className="panel panel-hover group relative flex h-full w-full flex-col items-start overflow-hidden p-5 text-left"
            >
              <div
                className="pointer-events-none absolute -top-14 -right-10 h-32 w-32 rounded-full opacity-40 transition-opacity group-hover:opacity-80"
                style={{
                  background: `radial-gradient(circle, color-mix(in oklab, ${item.tone} 45%, transparent), transparent 70%)`,
                  filter: "blur(28px)",
                }}
              />
              {/* document stack visual */}
              <div className="relative h-20 w-16">
                <span
                  className="absolute inset-x-2 top-2 h-16 rounded-md border border-border bg-[oklch(0.19_0.025_264)]"
                  style={{ transform: "rotate(-6deg)" }}
                />
                <span
                  className="absolute inset-x-1 top-1 h-16 rounded-md border border-border bg-[oklch(0.21_0.026_264)]"
                  style={{ transform: "rotate(3deg)" }}
                />
                <span
                  className="absolute inset-x-0 top-0 grid h-16 place-items-center rounded-md border"
                  style={{
                    borderColor: `color-mix(in oklab, ${item.tone} 40%, transparent)`,
                    background: `color-mix(in oklab, ${item.tone} 10%, transparent)`,
                  }}
                >
                  <Icon className="size-5" style={{ color: item.tone }} />
                </span>
              </div>

              <h3 className="relative mt-4 font-mono text-[13.5px] font-semibold tracking-[0.06em] text-foreground">
                {item.title}
              </h3>
              <p className="relative mt-1 font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground uppercase">
                {item.sub}
              </p>

              <span
                className="relative mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase"
                style={{
                  color: st === "ready" ? "var(--green)" : item.tone,
                  borderColor: `color-mix(in oklab, ${st === "ready" ? "var(--green)" : item.tone} 38%, transparent)`,
                  background: `color-mix(in oklab, ${st === "ready" ? "var(--green)" : item.tone} 10%, transparent)`,
                }}
              >
                {st === "working" && <Loader2 className="size-3 animate-spin" />}
                {st === "ready" && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="size-3" />
                  </motion.span>
                )}
                {st === "working" ? "Generating" : st === "ready" ? "Report ready" : "Generate"}
              </span>
            </button>
          </Reveal>
        );
      })}
    </div>
  );
}
