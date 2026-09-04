import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { scanRepo, scanUpload } from "../api";
import { useAppState } from "../context/AppContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { ScanMode } from "../types";

const SCAN_PHASES = [
  "INITIALIZING ANALYSIS",
  "PARSING SOURCE FILES",
  "DETECTING CRYPTO ARTIFACTS",
  "CLASSIFYING QUANTUM RISK",
  "BUILDING CBOM",
  "FINALIZING REPORT",
];

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-11 h-11 flex-shrink-0">
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
        stroke="url(#sh-grad)"
        strokeWidth="1.5"
        fill="url(#sh-fill)"
      />
      <path
        d="M9 12l2.5 2.5L15.5 9"
        stroke="#22D3EE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sh-grad" x1="4" y1="2" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="sh-fill" x1="4" y1="2" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0.1" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.06" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Hero() {
  const { startScan, completeScan, failScan, enableDemoMode, state } = useAppState();
  const reduced = useReducedMotion();

  const [scanMode, setScanMode] = useState<ScanMode>("repository");
  const [repoInput, setRepoInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [localLogs, setLocalLogs] = useState<string[]>([]);

  const logRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repoInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, reduced ? 0 : -60]);
  const brandingOpacity = useTransform(scrollY, [0, 280], [1, 0]);
  const brandingScale = useTransform(scrollY, [0, 280], [1, reduced ? 1 : 0.75]);

  const isScanning = state.scanStatus === "scanning";
  const isDone =
    state.scanStatus === "success" ||
    state.scanStatus === "empty" ||
    state.scanStatus === "error";

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [localLogs]);

  // Phase cycling during scan
  useEffect(() => {
    if (!isScanning) {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }
    setPhaseIndex(0);
    setElapsed(0);
    elapsedTimerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    phaseTimerRef.current = setInterval(() => {
      setPhaseIndex((i) => Math.min(i + 1, SCAN_PHASES.length - 1));
      setLocalLogs((prev) => [
        ...prev,
        `→ ${SCAN_PHASES[Math.min(prev.length, SCAN_PHASES.length - 1)]}`,
      ]);
    }, 1800);
    return () => {
      clearInterval(phaseTimerRef.current!);
      clearInterval(elapsedTimerRef.current!);
    };
  }, [isScanning]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".zip") && file.type !== "application/zip") {
      setInputError("Only .zip files are supported.");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setInputError("File is too large (max 500 MB).");
      return;
    }
    setSelectedFile(file);
    setInputError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const validateRepo = (): boolean => {
    if (!repoInput.trim()) {
      setInputError("Please enter a repository path.");
      repoInputRef.current?.focus();
      return false;
    }
    setInputError(null);
    return true;
  };

  const validateUpload = (): boolean => {
    if (!selectedFile) {
      setInputError("Please select a ZIP file to upload.");
      return false;
    }
    setInputError(null);
    return true;
  };

  const runScan = async () => {
    if (isScanning) return;
    if (scanMode === "repository" && !validateRepo()) return;
    if (scanMode === "upload" && !validateUpload()) return;

    abortRef.current = new AbortController();
    startScan();
    setLocalLogs([`→ Scan initiated (${scanMode === "repository" ? repoInput.trim() : selectedFile!.name})`]);
    setPhaseIndex(0);

    try {
      const report =
        scanMode === "repository"
          ? await scanRepo(repoInput.trim(), abortRef.current.signal)
          : await scanUpload(selectedFile!, abortRef.current.signal);

      setLocalLogs((prev) => [
        ...prev,
        `→ SCAN COMPLETE — ${report.findings.length} artifacts found`,
      ]);
      completeScan(report);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setLocalLogs((prev) => [...prev, `✕ ${msg}`]);
      failScan(msg);
    }
  };

  const handleModeSwitch = (mode: ScanMode) => {
    setScanMode(mode);
    setInputError(null);
    setSelectedFile(null);
    setLocalLogs([]);
  };

  return (
    <motion.section
      id="scan"
      style={{ opacity: heroOpacity, y: heroY }}
      className="relative min-h-screen flex items-center"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* ── LEFT — Scanner console ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Demo mode banner */}
          <AnimatePresence>
            {state.demoMode && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-3 px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-xs"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}
              >
                <span>◉</span>
                <span>DEMO MODE — displaying sample data, not a real scan result</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "rgba(11,18,32,0.9)",
              border: isScanning
                ? "1px solid rgba(34,211,238,0.4)"
                : "1px solid rgba(34,211,238,0.18)",
              boxShadow: isScanning
                ? "0 0 0 1px rgba(34,211,238,0.3), 0 0 60px rgba(34,211,238,0.1)"
                : "0 20px 60px rgba(0,0,0,0.5)",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "rgba(7,11,20,0.7)", borderBottom: "1px solid rgba(34,211,238,0.09)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(34,211,238,0.7)" }}>
                  CODEBASE SCANNER
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isScanning ? "#22D3EE" : isDone ? "#10B981" : "rgba(148,163,184,0.4)",
                    boxShadow: isScanning ? "0 0 6px #22D3EE" : "none",
                    animation: isScanning && !reduced ? "pulse-glow 1s infinite" : "none",
                  }}
                />
                <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
                  {isScanning ? SCAN_PHASES[phaseIndex] : isDone ? "ANALYSIS COMPLETE" : "READY FOR ANALYSIS"}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Mode tabs */}
              <div className="flex gap-1.5" role="tablist" aria-label="Scan mode">
                {(["repository", "upload"] as ScanMode[]).map((mode) => (
                  <button
                    key={mode}
                    role="tab"
                    aria-selected={scanMode === mode}
                    disabled={isScanning}
                    onClick={() => handleModeSwitch(mode)}
                    className="px-3 py-1.5 text-xs font-mono tracking-wider rounded transition-all duration-200 focus:outline-none focus-visible:ring-2"
                    style={{
                      background: scanMode === mode ? "rgba(34,211,238,0.12)" : "transparent",
                      border: scanMode === mode ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(148,163,184,0.12)",
                      color: scanMode === mode ? "#22D3EE" : "rgba(148,163,184,0.45)",
                      "--tw-ring-color": "#22D3EE",
                    } as React.CSSProperties}
                  >
                    {mode === "repository" ? "LOCAL REPOSITORY" : "UPLOAD ZIP"}
                  </button>
                ))}
              </div>

              {/* Repository input */}
              {scanMode === "repository" && (
                <div>
                  <label
                    htmlFor="repo-input"
                    className="block font-mono text-xs mb-1.5"
                    style={{ color: "rgba(34,211,238,0.5)" }}
                  >
                    REPOSITORY PATH
                  </label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{
                      background: "rgba(7,11,20,0.8)",
                      border: inputError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(34,211,238,0.15)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "rgba(34,211,238,0.4)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <input
                      id="repo-input"
                      ref={repoInputRef}
                      type="text"
                      value={repoInput}
                      onChange={(e) => { setRepoInput(e.target.value); setInputError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && runScan()}
                      placeholder="/path/to/repository or samples/"
                      disabled={isScanning}
                      aria-invalid={!!inputError}
                      aria-describedby={inputError ? "input-error" : undefined}
                      className="flex-1 bg-transparent outline-none font-mono text-sm"
                      style={{ color: "#E2E8F0", caretColor: "#22D3EE" }}
                    />
                  </div>
                </div>
              )}

              {/* ZIP upload */}
              {scanMode === "upload" && (
                <div>
                  <div className="font-mono text-xs mb-1.5" style={{ color: "rgba(34,211,238,0.5)" }}>
                    ZIP ARCHIVE
                  </div>
                  <div
                    className="rounded-xl p-4 transition-all duration-200 cursor-pointer"
                    style={{
                      background: dragOver ? "rgba(34,211,238,0.06)" : "rgba(7,11,20,0.8)",
                      border: dragOver
                        ? "1px dashed rgba(34,211,238,0.6)"
                        : inputError
                        ? "1px dashed rgba(239,68,68,0.5)"
                        : "1px dashed rgba(34,211,238,0.2)",
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Drop ZIP file or click to select"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,application/zip"
                      className="sr-only"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                      aria-label="Select ZIP file"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ background: "rgba(34,211,238,0.1)" }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#22D3EE">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-white truncate">{selectedFile.name}</div>
                          <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                            {(selectedFile.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setInputError(null); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs"
                          style={{ background: "rgba(148,163,184,0.1)", color: "rgba(148,163,184,0.6)" }}
                          aria-label="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="font-mono text-xs mb-1" style={{ color: "rgba(34,211,238,0.6)" }}>
                          DROP ZIP HERE
                        </div>
                        <div className="text-xs" style={{ color: "rgba(148,163,184,0.35)" }}>
                          or click to browse
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation error */}
              <AnimatePresence>
                {inputError && (
                  <motion.div
                    id="input-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 font-mono text-xs px-3 py-2 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}
                  >
                    <span>⚠</span>
                    {inputError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Language support */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.35)" }}>SUPPORTS:</span>
                {["Python", "Java", "JavaScript", "TypeScript", "Go"].map((lang) => (
                  <span key={lang} className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", color: "#93C5FD" }}>
                    {lang}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              {isScanning && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs" style={{ color: "rgba(34,211,238,0.7)" }}>
                      {SCAN_PHASES[phaseIndex]}
                    </span>
                    <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>{elapsed}s</span>
                  </div>
                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.1)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #22D3EE, #8B5CF6)" }}
                      animate={{ width: `${((phaseIndex + 1) / SCAN_PHASES.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              )}

              {/* Terminal log */}
              {localLogs.length > 0 && (
                <div
                  ref={logRef}
                  className="rounded-lg p-3 space-y-0.5 overflow-y-auto"
                  style={{
                    background: "rgba(7,11,20,0.85)",
                    border: "1px solid rgba(34,211,238,0.07)",
                    maxHeight: "100px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                  }}
                  aria-live="polite"
                  aria-label="Scan log"
                >
                  {localLogs.map((log, i) => (
                    <div
                      key={i}
                      className="leading-relaxed"
                      style={{
                        color: log.includes("✕") ? "#EF4444"
                          : log.includes("COMPLETE") ? "#10B981"
                          : "rgba(148,163,184,0.6)",
                      }}
                    >
                      {log}
                    </div>
                  ))}
                  {isScanning && <div className="text-cyan-400 animate-pulse">▊</div>}
                </div>
              )}

              {/* Success state */}
              <AnimatePresence>
                {(state.scanStatus === "success" || state.scanStatus === "empty") && state.report && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4"
                    style={{
                      background: state.scanStatus === "empty" ? "rgba(59,130,246,0.06)" : "rgba(16,185,129,0.06)",
                      border: state.scanStatus === "empty" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-mono text-xs font-semibold tracking-wider" style={{ color: state.scanStatus === "empty" ? "#3B82F6" : "#10B981" }}>
                        {state.scanStatus === "empty" ? "SCAN COMPLETE — NO FINDINGS" : "SCAN COMPLETE"}
                      </span>
                    </div>
                    {state.scanStatus === "success" && (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "ARTIFACTS", value: state.report.summary.total_artifacts, color: "#E2E8F0" },
                          { label: "QUANTUM VULN", value: state.report.summary.vulnerable_count, color: "#F97316" },
                          { label: "CRITICAL", value: state.report.summary.critical_count, color: "#EF4444" },
                          { label: "PROJECT", value: state.report.project_name, color: "#22D3EE" },
                        ].map((s) => (
                          <div key={s.label} className="text-center">
                            <div className="font-mono text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                            <div className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              <AnimatePresence>
                {state.scanStatus === "error" && state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}
                    role="alert"
                  >
                    <div className="font-mono text-xs text-red-400 font-semibold tracking-wider">SCAN COULD NOT BE COMPLETED</div>
                    <p className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>{state.error}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={runScan}
                        className="px-3 py-1.5 rounded-lg font-mono text-xs transition-colors"
                        style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22D3EE" }}
                      >
                        Retry
                      </button>
                      <button
                        onClick={enableDemoMode}
                        className="px-3 py-1.5 rounded-lg font-mono text-xs transition-colors"
                        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}
                      >
                        Use Demo Mode
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA button */}
              <button
                onClick={runScan}
                disabled={isScanning}
                aria-busy={isScanning}
                className="w-full py-3 rounded-xl font-semibold text-sm tracking-widest transition-all duration-300 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                style={{
                  background: isScanning
                    ? "rgba(34,211,238,0.04)"
                    : "linear-gradient(135deg, rgba(34,211,238,0.14), rgba(139,92,246,0.14))",
                  border: "1px solid rgba(34,211,238,0.28)",
                  color: isScanning ? "rgba(34,211,238,0.4)" : "#22D3EE",
                  letterSpacing: "0.14em",
                  cursor: isScanning ? "not-allowed" : "pointer",
                }}
              >
                {isScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                    SCANNING…
                  </span>
                ) : isDone ? (
                  "RESCAN"
                ) : (
                  "INITIATE SCAN"
                )}
              </button>

              {/* Demo mode link */}
              {!state.demoMode && state.scanStatus === "idle" && (
                <button
                  onClick={enableDemoMode}
                  className="w-full py-1.5 font-mono text-xs text-center transition-colors"
                  style={{ color: "rgba(148,163,184,0.35)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,158,11,0.7)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.35)"; }}
                >
                  or try demo mode
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT — Brand ─────────────────────────────────────────── */}
        <motion.div
          style={{ opacity: brandingOpacity, scale: brandingScale }}
          className="space-y-7 lg:pl-6"
          initial={{ opacity: 0, x: reduced ? 0 : 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        >
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #22D3EE" }} />
              <span className="font-mono text-xs tracking-widest" style={{ color: "rgba(34,211,238,0.75)" }}>
                POST-QUANTUM SECURITY INTELLIGENCE
              </span>
            </div>

            <div className="flex items-start gap-4">
              <ShieldIcon />
              <div>
                <h1
                  className="font-bold leading-none tracking-wider"
                  style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", letterSpacing: "0.08em", color: "#F1F5F9" }}
                >
                  CBOM SENTINEL
                </h1>
                <p className="text-sm mt-1.5" style={{ color: "rgba(148,163,184,0.6)" }}>
                  Cryptographic Bill of Materials & PQC Risk Engine
                </p>
              </div>
            </div>

            <p className="text-xl font-light mt-6 leading-relaxed" style={{ color: "rgba(226,232,240,0.85)" }}>
              Find the cryptography that won't survive the{" "}
              <span className="font-semibold" style={{ color: "#22D3EE", textShadow: "0 0 18px rgba(34,211,238,0.35)" }}>
                quantum era
              </span>
              .
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.55)" }}>
              Discover vulnerable cryptographic assets across your codebase, evaluate quantum risk
              with Mosca's Theorem, and generate a migration roadmap aligned with NIST FIPS 203/204/205.
            </p>
          </div>

          {/* System status */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "SCANNER", color: "#10B981" },
              { label: "RISK ENGINE", color: "#10B981" },
              { label: "PQC ENGINE", color: "#10B981" },
            ].map((sys) => (
              <div
                key={sys.label}
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.13)" }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sys.color, boxShadow: `0 0 5px ${sys.color}` }} />
                  <span className="font-mono text-xs text-green-400">ONLINE</span>
                </div>
                <span className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.45)", letterSpacing: "0.07em" }}>
                  {sys.label}
                </span>
              </div>
            ))}
          </div>

          {/* Backend status */}
          {state.backendStatus !== "unknown" && (
            <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "rgba(148,163,184,0.45)" }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: state.backendStatus === "online" ? "#10B981" : "#EF4444" }}
              />
              BACKEND {state.backendStatus.toUpperCase()}
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
