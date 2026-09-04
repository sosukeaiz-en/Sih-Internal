import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { RISK_ORDER } from "@/lib/cbom/pqc";
import type { Finding, RiskLevel, ScanResult } from "@/lib/cbom/types";
import { cn } from "@/lib/utils";
import { LangBadge, PqcChip, QuantumBadge, RiskBadge } from "./primitives";

const riskRank = (r: RiskLevel) => RISK_ORDER.indexOf(r);

type SortKey = "risk" | "algorithm" | "file" | "keySize";

export function ArtifactTable({
  result,
  onSelect,
  selectedId,
}: {
  result: ScanResult;
  onSelect: (f: Finding) => void;
  selectedId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [language, setLanguage] = useState<string>("all");
  const [onlyQuantum, setOnlyQuantum] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "risk", dir: 1 });

  const languages = useMemo(
    () => [...new Set(result.findings.map((f) => f.language))].sort(),
    [result.findings],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = result.findings.filter((f) => {
      if (risk !== "all" && f.risk !== risk) return false;
      if (language !== "all" && f.language !== language) return false;
      if (onlyQuantum && !f.quantumVulnerable) return false;
      if (!q) return true;
      return (
        f.algorithm.toLowerCase().includes(q) ||
        f.file.toLowerCase().includes(q) ||
        f.operation.toLowerCase().includes(q) ||
        f.recommendedPqc.toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => {
      const d = sort.dir;
      switch (sort.key) {
        case "algorithm":
          return a.algorithm.localeCompare(b.algorithm) * d;
        case "file":
          return a.file.localeCompare(b.file) * d;
        case "keySize":
          return ((a.keySize ?? 0) - (b.keySize ?? 0)) * d;
        default:
          return (riskRank(a.risk) - riskRank(b.risk)) * d || a.file.localeCompare(b.file);
      }
    });
  }, [result.findings, query, risk, language, onlyQuantum, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="panel overflow-hidden">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-input bg-[oklch(0.13_0.02_264)] px-2.5 py-2 focus-within:border-[color-mix(in_oklab,var(--cyan)_45%,transparent)]">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search algorithm, file, operation…"
            aria-label="Search artifacts"
            className="w-full bg-transparent font-mono text-[11.5px] outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Select
          value={risk}
          onChange={(v) => setRisk(v as RiskLevel | "all")}
          options={[["all", "All risk"], ...RISK_ORDER.map((r) => [r, r] as [string, string])]}
          label="Risk filter"
        />
        <Select
          value={language}
          onChange={setLanguage}
          options={[["all", "All languages"], ...languages.map((l) => [l, l] as [string, string])]}
          label="Language filter"
        />
        <button
          onClick={() => setOnlyQuantum((v) => !v)}
          aria-pressed={onlyQuantum}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-[10.5px] tracking-[0.1em] uppercase transition-colors",
            onlyQuantum
              ? "border-[color-mix(in_oklab,var(--orange)_45%,transparent)] bg-[color-mix(in_oklab,var(--orange)_12%,transparent)] text-orange"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="size-3" /> Quantum only
        </button>
        <span className="ml-auto font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">
          {rows.length} / {result.findings.length}
        </span>
      </div>

      {/* desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {(
                [
                  ["risk", "Risk", "risk"],
                  ["algorithm", "Algorithm", "algorithm"],
                  [null, "Lang", null],
                  ["file", "File", "file"],
                  [null, "Line", null],
                  [null, "Operation", null],
                  ["keySize", "Key", "keySize"],
                  [null, "Quantum impact", null],
                  [null, "Recommended PQC", null],
                  [null, "", null],
                ] as [SortKey | null, string, SortKey | null][]
              ).map(([key, label], i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 font-mono text-[9.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase"
                >
                  {key ? (
                    <button
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-cyan"
                    >
                      {label}
                      {sort.key === key && <span>{sort.dir === 1 ? "↑" : "↓"}</span>}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((f, i) => (
                <motion.tr
                  key={f.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.012, 0.3) }}
                  onClick={() => onSelect(f)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(f);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer border-b border-border/60 transition-colors last:border-0",
                    selectedId === f.id
                      ? "bg-[color-mix(in_oklab,var(--cyan)_9%,transparent)]"
                      : "hover:bg-[color-mix(in_oklab,var(--cyan)_5%,transparent)]",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <RiskBadge risk={f.risk} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12.5px] font-medium text-foreground">
                      {f.algorithm}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <LangBadge language={f.language} />
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {f.file}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground/80">
                    {f.line}
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted-foreground">
                    {f.operation}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {f.keySize ? `${f.keySize}b` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <QuantumBadge impact={f.quantumImpact} vulnerable={f.quantumVulnerable} />
                  </td>
                  <td className="px-3 py-2.5">
                    <PqcChip value={f.recommendedPqc} />
                  </td>
                  <td className="px-2 py-2.5">
                    <ChevronRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* mobile / tablet cards */}
      <div className="divide-y divide-border/60 lg:hidden">
        {rows.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className="block w-full px-3 py-3 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--cyan)_6%,transparent)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[13px] font-medium">{f.algorithm}</span>
              <RiskBadge risk={f.risk} />
            </div>
            <p className="mt-1.5 truncate font-mono text-[10.5px] text-muted-foreground">
              {f.file}:{f.line}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <LangBadge language={f.language} />
              <QuantumBadge impact={f.quantumImpact} vulnerable={f.quantumVulnerable} />
              <PqcChip value={f.recommendedPqc} />
            </div>
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="px-4 py-10 text-center font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          No artifacts match the active filters
        </p>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-[oklch(0.13_0.02_264)] py-2 pr-7 pl-2.5 font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase outline-none transition-colors hover:text-foreground"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-[oklch(0.16_0.02_264)]">
            {l}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[9px] text-muted-foreground">
        ▼
      </span>
    </label>
  );
}
