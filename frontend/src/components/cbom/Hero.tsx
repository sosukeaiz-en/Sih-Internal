import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ShieldHalf } from "lucide-react";

import type { ScanResult } from "@/lib/cbom/types";
import { ScannerConsole } from "./ScannerConsole";
import { StatusDot } from "./primitives";

const SYSTEMS = [
  { label: "Scanner online", tone: "cyan" as const },
  { label: "Risk engine online", tone: "green" as const },
  { label: "PQC engine online", tone: "violet" as const },
];

export function Hero({
  result,
  onResult,
}: {
  result: ScanResult | null;
  onResult: (r: ScanResult) => void;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 480], reduce ? [1, 1] : [1, 0.78]);
  const y = useTransform(scrollY, [0, 480], reduce ? [0, 0] : [0, -40]);
  const opacity = useTransform(scrollY, [0, 380], reduce ? [1, 1] : [1, 0.05]);
  const tagOpacity = useTransform(scrollY, [0, 220], reduce ? [1, 1] : [1, 0]);

  return (
    <section
      id="scan"
      className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] items-center px-5 pt-24 pb-16 sm:px-8"
    >
      <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        {/* LEFT — scanner */}
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 28, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, ease: [0.16, 0.8, 0.24, 1], delay: 0.1 }}
          className="order-1"
        >
          <ScannerConsole result={result} onResult={onResult} />
        </motion.div>

        {/* RIGHT — brand */}
        <motion.div
          style={{ scale, y, opacity, transformOrigin: "left center" }}
          className="order-2 lg:pl-4"
        >
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 0.8, 0.24, 1] }}
          >
            <span className="tech-label inline-flex items-center gap-2">
              <StatusDot tone="cyan" />
              <span className="text-cyan">Post-quantum security intelligence</span>
            </span>

            <div className="mt-5 flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border-strong"
                style={{
                  background:
                    "linear-gradient(150deg, color-mix(in oklab, var(--cyan) 22%, transparent), color-mix(in oklab, var(--violet) 18%, transparent))",
                  boxShadow: "0 18px 50px -22px var(--cyan)",
                }}
              >
                <ShieldHalf className="size-7 text-cyan" />
              </span>
              <h1 className="text-4xl leading-[0.95] font-semibold tracking-[-0.03em] sm:text-6xl xl:text-7xl">
                <span className="brand-text">CBOM SENTINEL</span>
              </h1>
            </div>

            <p className="mt-5 font-mono text-[12.5px] tracking-[0.14em] text-muted-foreground uppercase">
              Cryptographic Bill of Materials &amp; PQC Risk Engine
            </p>

            <motion.div style={{ opacity: tagOpacity }}>
              <p className="mt-6 max-w-xl text-xl leading-snug font-medium text-foreground/90 sm:text-2xl">
                Find the cryptography that won&apos;t survive the{" "}
                <span className="brand-text font-semibold">quantum</span> era.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                CBOM Sentinel walks your source tree, inventories every cryptographic
                asset, classifies quantum exposure against Mosca&apos;s theorem, and
                produces an actionable{" "}
                <span className="font-mono text-[13px] text-cyan">NIST PQC</span>{" "}
                migration plan with exportable evidence.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
              {SYSTEMS.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase"
                >
                  <StatusDot tone={s.tone} />
                  {s.label}
                </span>
              ))}
            </div>

            <div className="hairline mt-8 max-w-md" />

            <dl className="mt-6 grid max-w-md grid-cols-3 gap-4">
              {[
                ["13", "algorithms tracked"],
                ["4", "NIST standards"],
                ["x+y>z", "mosca engine"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-mono text-lg text-foreground">{v}</dt>
                  <dd className="tech-label mt-1 block leading-tight">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
