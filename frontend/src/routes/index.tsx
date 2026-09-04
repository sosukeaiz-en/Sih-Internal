import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AlgorithmChart } from "@/components/cbom/AlgorithmChart";
import { ArtifactDrawer } from "@/components/cbom/ArtifactDrawer";
import { ArtifactTable } from "@/components/cbom/ArtifactTable";
import { CBOMOverview } from "@/components/cbom/CBOMOverview";
import { CyberBackground } from "@/components/cbom/CyberBackground";
import { ExportPanel } from "@/components/cbom/ExportPanel";
import { Hero } from "@/components/cbom/Hero";
import { MoscaSimulator } from "@/components/cbom/MoscaSimulator";
import { PQCRoadmap } from "@/components/cbom/PQCRoadmap";
import { RiskDonut } from "@/components/cbom/RiskDonut";
import { Reveal, SectionHeading } from "@/components/cbom/primitives";
import { StickyCommandBar } from "@/components/cbom/StickyCommandBar";
import { demoScan } from "@/lib/cbom/api";
import { standardIdForAlgorithm } from "@/lib/cbom/pqc";
import type { Finding, ScanResult } from "@/lib/cbom/types";

const TITLE = "CBOM Sentinel — Cryptographic Bill of Materials & PQC Risk Engine";
const DESC =
  "Scan repositories for cryptographic artifacts, classify quantum risk with Mosca's theorem, and generate a NIST post-quantum migration roadmap.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [result, setResult] = useState<ScanResult>(() => demoScan("samples/"));
  const [selected, setSelected] = useState<Finding | null>(null);
  const [highlightStandard, setHighlightStandard] = useState<string | null>(null);
  const [highlightAlgo, setHighlightAlgo] = useState<string | null>(null);

  const showInRoadmap = (f: Finding) => {
    setHighlightStandard(standardIdForAlgorithm(f.algorithm));
    setHighlightAlgo(f.algorithm);
    setSelected(null);
    document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <CyberBackground />
      <StickyCommandBar online={result.source === "api"} />

      <main>
        <Hero result={result} onResult={setResult} />

        {/* CBOM */}
        <section
          id="cbom"
          className="mx-auto w-full max-w-[1400px] scroll-mt-20 space-y-6 px-5 py-20 sm:px-8"
        >
          <Reveal>
            <SectionHeading
              eyebrow="Inventory layer"
              title="Cryptographic Bill of Materials"
              description="Every cryptographic artifact discovered across the scanned codebase, ranked by quantum exposure and remediation urgency."
              aside={
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  target · {result.summary.repository} · {result.summary.filesScanned} files
                </span>
              }
            />
          </Reveal>

          <CBOMOverview result={result} />

          <Reveal delay={0.05}>
            <ArtifactTable
              result={result}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <Reveal>
              <RiskDonut result={result} />
            </Reveal>
            <Reveal delay={0.08}>
              <AlgorithmChart result={result} />
            </Reveal>
          </div>
        </section>

        {/* Mosca */}
        <section
          id="mosca"
          className="mx-auto w-full max-w-[1400px] scroll-mt-20 space-y-6 px-5 py-20 sm:px-8"
        >
          <Reveal>
            <SectionHeading
              eyebrow="Quantum threat simulator"
              title="Mosca's Theorem"
              description="Will your data outlive your migration window? Adjust the three horizons and watch the threat ratio respond."
              tone="violet"
            />
          </Reveal>
          <MoscaSimulator />
        </section>

        {/* Roadmap */}
        <section
          id="roadmap"
          className="mx-auto w-full max-w-[1400px] scroll-mt-20 space-y-6 px-5 py-20 sm:px-8"
        >
          <Reveal>
            <SectionHeading
              eyebrow="Standards layer"
              title="NIST Post-Quantum Migration Roadmap"
              description="From vulnerable classical cryptography to quantum-resistant infrastructure."
              tone="blue"
            />
          </Reveal>
          <PQCRoadmap
            highlightStandardId={highlightStandard}
            highlightAlgorithm={highlightAlgo}
          />
        </section>

        {/* Export */}
        <section
          id="export"
          className="mx-auto w-full max-w-[1400px] scroll-mt-20 space-y-6 px-5 py-20 sm:px-8"
        >
          <Reveal>
            <SectionHeading
              eyebrow="Evidence layer"
              title="Generate Security Evidence"
              description="Export machine-readable and stakeholder-ready proof of your cryptographic posture."
            />
          </Reveal>
          <ExportPanel result={result} />
          <Reveal>
            <p className="pt-6 text-center font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70 uppercase">
              CBOM Sentinel · engine v1.6 ·{" "}
              {result.source === "api" ? "live backend" : "demo dataset"}
            </p>
          </Reveal>
        </section>
      </main>

      <ArtifactDrawer
        finding={selected}
        onClose={() => setSelected(null)}
        onShowInRoadmap={showInRoadmap}
      />
    </>
  );
}
