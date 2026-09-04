import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  FileArchive,
  FolderTree,
  Radar,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cbomApi, demoScan } from "@/lib/cbom/api";
import { SCAN_FILE_FEED, SCAN_STAGES } from "@/lib/cbom/mock";
import type { ScanResult } from "@/lib/cbom/types";
import { cn } from "@/lib/utils";
import { StatusDot } from "./primitives";

type Mode = "local" | "upload";
type Phase = "idle" | "scanning" | "complete" | "error";

const LANGS = ["Python", "Java", "JavaScript / TypeScript", "Go"];

export function ScannerConsole({
  result,
  onResult,
  onPhaseChange,
}: {
  result: ScanResult | null;
  onResult: (r: ScanResult) => void;
  onPhaseChange?: (p: Phase) => void;
}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<Mode>("local");
  const [repoPath, setRepoPath] = useState("samples/");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>(result ? "complete" : "idle");
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [artifacts, setArtifacts] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => onPhaseChange?.(phase), [phase, onPhaseChange]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const push = useCallback((line: string) => {
    setLog((l) => [...l.slice(-40), line]);
  }, []);

  const runScan = useCallback(async () => {
    if (phase === "scanning") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("scanning");
    setError(null);
    setStage(0);
    setProgress(0);
    setArtifacts(0);
    setLog([`$ cbom-sentinel scan ${mode === "upload" ? (file?.name ?? "archive.zip") : repoPath}`]);

    const target = mode === "upload" ? (file?.name ?? "archive.zip") : repoPath;
    const duration = reduce ? 400 : 5200;
    const steps = 60;
    let i = 0;

    const tick = () => {
      i += 1;
      const p = Math.min(99, (i / steps) * 100);
      setProgress(p);
      setStage(Math.min(SCAN_STAGES.length - 2, Math.floor((p / 100) * (SCAN_STAGES.length - 1))));
      const f = SCAN_FILE_FEED[i % SCAN_FILE_FEED.length]!;
      setCurrentFile(f);
      if (i % 3 === 0) {
        setArtifacts((a) => a + 1 + (i % 2));
        push(`  ✓ ${f}`);
      } else if (i % 7 === 0) {
        push(`  → parsing ${f}`);
      }
      if (i < steps) timers.current.push(setTimeout(tick, duration / steps));
    };
    timers.current.push(setTimeout(tick, duration / steps));

    let scan: ScanResult;
    try {
      scan =
        mode === "upload" && file
          ? await cbomApi.scanUpload(file)
          : await cbomApi.scanRepository(repoPath);
      push("  ✓ risk engine response received");
    } catch {
      scan = demoScan(target);
      push("  ! backend unreachable — demo dataset engaged");
    }

    const finish = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      if (scan.findings.length === 0) {
        setPhase("error");
        setError("No cryptographic artifacts detected in the supplied target.");
        return;
      }
      setProgress(100);
      setStage(SCAN_STAGES.length - 1);
      setArtifacts(scan.summary.totalAssets);
      setCurrentFile("");
      push(
        `  ✓ CBOM built — ${scan.summary.totalAssets} artifacts / ${scan.summary.quantumVulnerable} quantum-vulnerable`,
      );
      setPhase("complete");
      onResult(scan);
    };
    timers.current.push(setTimeout(finish, reduce ? 450 : duration + 200));
  }, [phase, mode, file, repoPath, reduce, push, onResult]);

  const scanning = phase === "scanning";

  return (
    <div className="panel relative overflow-hidden p-5 sm:p-6">
      {/* pulse frame while scanning */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            key="pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="pointer-events-none absolute inset-0 rounded-[1.125rem]"
            style={{ boxShadow: "inset 0 0 40px -10px var(--cyan)" }}
          />
        )}
      </AnimatePresence>

      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="grid size-9 place-items-center rounded-lg border border-border"
            style={{ background: "color-mix(in oklab, var(--cyan) 12%, transparent)" }}
          >
            <Radar className="size-4 text-cyan" />
          </span>
          <div>
            <h2 className="font-mono text-[13px] font-semibold tracking-[0.2em] text-foreground">
              CODEBASE SCANNER
            </h2>
            <p className="mt-1 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
              <StatusDot
                tone={scanning ? "cyan" : phase === "complete" ? "green" : phase === "error" ? "amber" : "blue"}
              />
              {scanning
                ? SCAN_STAGES[stage]
                : phase === "complete"
                  ? "Analysis complete"
                  : phase === "error"
                    ? "No artifacts found"
                    : "Ready for analysis"}
            </p>
          </div>
        </div>
        <div className="hidden font-mono text-[10px] tracking-[0.14em] text-muted-foreground/80 sm:block">
          ENGINE v1.6
        </div>
      </header>

      {/* mode switch */}
      <div className="mt-5 flex gap-1 rounded-lg border border-border bg-[oklch(0.14_0.022_264)] p-1">
        {(
          [
            ["local", "Local Repository", FolderTree],
            ["upload", "Upload ZIP", FileArchive],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={scanning}
            className={cn(
              "relative flex-1 rounded-md px-3 py-2 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors disabled:opacity-50",
              mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="scanner-mode"
                className="absolute inset-0 rounded-md border border-[color-mix(in_oklab,var(--cyan)_32%,transparent)]"
                style={{ background: "color-mix(in oklab, var(--cyan) 12%, transparent)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              <Icon className="size-3.5" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* target input */}
      <div className="mt-4">
        {mode === "local" ? (
          <label className="block">
            <span className="tech-label">Repository path</span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-[oklch(0.13_0.02_264)] px-3 py-2.5 transition-colors focus-within:border-[color-mix(in_oklab,var(--cyan)_45%,transparent)]">
              <span className="font-mono text-xs text-cyan/70">~/</span>
              <input
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                disabled={scanning}
                spellCheck={false}
                placeholder="path/to/repository"
                className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </label>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={cn(
              "rounded-lg border border-dashed px-4 py-6 text-center transition-all duration-300",
              dragging
                ? "border-[color-mix(in_oklab,var(--cyan)_60%,transparent)] bg-[color-mix(in_oklab,var(--cyan)_10%,transparent)]"
                : "border-border bg-[oklch(0.13_0.02_264)]",
            )}
          >
            <Upload className={cn("mx-auto size-5", dragging ? "text-cyan" : "text-muted-foreground")} />
            <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
              {file ? file.name : "DROP REPOSITORY ARCHIVE (.zip)"}
            </p>
            <label className="mt-3 inline-block cursor-pointer font-mono text-[11px] tracking-[0.1em] text-cyan uppercase hover:underline">
              Browse files
              <input
                type="file"
                accept=".zip"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}
      </div>

      {/* progress */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground uppercase">
          <span>{scanning ? SCAN_STAGES[stage] : phase === "complete" ? "COMPLETE" : "IDLE"}</span>
          <span className="text-cyan" style={{ fontVariantNumeric: "tabular-nums" }}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="relative mt-2 h-[6px] overflow-hidden rounded-full bg-[oklch(0.2_0.025_264)]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "var(--gradient-brand)", boxShadow: "0 0 14px var(--cyan)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "linear" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[10.5px]">
          <span className="truncate text-muted-foreground/80">
            {currentFile ? `▸ ${currentFile}` : phase === "complete" ? "▸ all files analyzed" : "▸ awaiting target"}
          </span>
          <span className="shrink-0 text-cyan/90">{artifacts} artifacts</span>
        </div>
      </div>

      {/* terminal log */}
      <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-[oklch(0.115_0.018_264)]">
        {scanning && !reduce && (
          <div
            className="animate-scan-sweep pointer-events-none absolute inset-x-0 top-0 h-6"
            style={{
              background:
                "linear-gradient(180deg, transparent, color-mix(in oklab, var(--cyan) 22%, transparent), transparent)",
            }}
          />
        )}
        <div
          ref={logRef}
          className="h-[112px] overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-[1.7] text-muted-foreground"
          role="log"
          aria-live="polite"
        >
          {log.length === 0 ? (
            <span className="text-muted-foreground/60">
              $ cbom-sentinel — awaiting scan command
            </span>
          ) : (
            log.map((l, i) => (
              <div key={i} className={l.startsWith("  !") ? "text-amber" : l.startsWith("$") ? "text-cyan" : undefined}>
                {l}
              </div>
            ))
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={runScan}
          disabled={scanning}
          className="group relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-mono text-[11.5px] font-medium tracking-[0.14em] uppercase transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "var(--gradient-brand)",
            color: "oklch(0.14 0.02 264)",
            boxShadow: "0 10px 30px -14px var(--cyan)",
          }}
        >
          {scanning ? <Activity className="size-4 animate-pulse" /> : <Radar className="size-4" />}
          {scanning ? "Scanning" : phase === "complete" ? "Re-scan" : "Run scan"}
        </button>
        {phase === "complete" && result && (
          <a
            href="#cbom"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:border-border-strong hover:text-foreground"
          >
            View CBOM
          </a>
        )}
        <span className="ml-auto hidden max-w-[210px] text-right font-mono text-[9.5px] leading-[1.5] tracking-[0.08em] text-muted-foreground/70 uppercase lg:block">
          {LANGS.join(" · ")}
        </span>
      </div>

      {error && (
        <p className="mt-3 font-mono text-[11px] text-amber">{error}</p>
      )}

      {/* completion summary */}
      <AnimatePresence>
        {phase === "complete" && result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 0.8, 0.24, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 rounded-lg border p-3"
              style={{
                borderColor: "color-mix(in oklab, var(--green) 30%, transparent)",
                background: "color-mix(in oklab, var(--green) 8%, transparent)",
              }}
            >
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-green uppercase">
                <CheckCircle2 className="size-3.5" /> Scan complete
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10.5px]">
                {[
                  [result.summary.totalAssets, "artifacts", "var(--cyan)"],
                  [result.summary.quantumVulnerable, "quantum-vulnerable", "var(--orange)"],
                  [result.summary.critical, "critical", "var(--red)"],
                ].map(([n, label, color]) => (
                  <div key={String(label)}>
                    <div className="text-base font-semibold" style={{ color: String(color) }}>
                      {n}
                    </div>
                    <div className="tracking-[0.08em] text-muted-foreground uppercase">{label}</div>
                  </div>
                ))}
              </div>
              {result.source === "demo" && (
                <p className="mt-2 font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase">
                  Demo dataset · backend offline
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
