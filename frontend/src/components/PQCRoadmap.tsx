import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPqcStandards } from "../api";
import { useAppState } from "../context/AppContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { PQCStandard } from "../types";

// ─── Static fallback standards ────────────────────────────────────────────────

const FALLBACK_STANDARDS: PQCStandard[] = [
  {
    id: "ml-kem",
    name: "ML-KEM",
    fips: "FIPS 203",
    former_name: "CRYSTALS-Kyber",
    purpose: "Key Encapsulation Mechanism",
    status: "Finalized 2024",
    variants: ["ML-KEM-512", "ML-KEM-768", "ML-KEM-1024"],
    recommended_variant: "ML-KEM-768",
    hybrid_mode: "X25519 + ML-KEM-768",
    replaces: ["RSA", "ECDH", "DH"],
    description: "Lattice-based key encapsulation for establishing shared secrets. Drop-in replacement for RSA and ECDH in TLS and key exchange protocols.",
  },
  {
    id: "ml-dsa",
    name: "ML-DSA",
    fips: "FIPS 204",
    former_name: "CRYSTALS-Dilithium",
    purpose: "Digital Signature Algorithm",
    status: "Finalized 2024",
    variants: ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"],
    recommended_variant: "ML-DSA-65",
    hybrid_mode: "ECDSA-P256 + ML-DSA-65",
    replaces: ["RSA", "ECDSA", "DSA"],
    description: "Lattice-based digital signature scheme. Primary replacement for RSA and ECDSA in code signing, authentication, and certificates.",
  },
  {
    id: "slh-dsa",
    name: "SLH-DSA",
    fips: "FIPS 205",
    former_name: "SPHINCS+",
    purpose: "Stateless Hash-Based Signature",
    status: "Finalized 2024",
    variants: ["SLH-DSA-SHA2-128s", "SLH-DSA-SHA2-256s", "SLH-DSA-SHAKE-256f"],
    recommended_variant: "SLH-DSA-SHA2-128s",
    hybrid_mode: "Ed25519 + SLH-DSA-SHA2-128s",
    replaces: ["ECDSA", "RSA", "Ed25519"],
    description: "Hash-based signature with conservative security assumptions. Recommended when long-term security properties and minimal trust assumptions are required.",
  },
  {
    id: "falcon",
    name: "Falcon",
    fips: "Draft FIPS 206",
    former_name: "Falcon",
    purpose: "Compact Digital Signature",
    status: "Standardization in progress",
    variants: ["Falcon-512", "Falcon-1024"],
    recommended_variant: "Falcon-512",
    hybrid_mode: "ECDSA-P256 + Falcon-512",
    replaces: ["ECDSA", "RSA"],
    description: "NTRU-lattice-based signature with compact signatures and fast verification. Strong candidate for constrained environments.",
  },
];

const STD_COLORS: Record<string, string> = {
  "ml-kem": "#22D3EE",
  "ml-dsa": "#8B5CF6",
  "slh-dsa": "#3B82F6",
  falcon: "#F59E0B",
};

// ─── Migration path — operation-aware ────────────────────────────────────────

function getMigrationPath(algorithm: string, operation: string | null): { pqc: string; hybrid: string } {
  const algoBase = algorithm.split("-")[0].toUpperCase();
  const op = (operation ?? "").toLowerCase();

  if (["RSA", "ECDH", "DH"].includes(algoBase) || op.includes("encap") || op.includes("key exchange") || op.includes("key generation")) {
    return { pqc: "ML-KEM-768", hybrid: "X25519 + ML-KEM-768" };
  }
  if (["ECDSA", "DSA"].includes(algoBase) || op.includes("sign") || op.includes("signature")) {
    return { pqc: "ML-DSA-65", hybrid: "ECDSA-P256 + ML-DSA-65" };
  }
  if (["MD5", "SHA1", "SHA-1", "DES", "3DES"].includes(algoBase)) {
    return { pqc: "SHA-3-256 / AES-256-GCM", hybrid: "Direct replacement" };
  }
  if (algoBase === "AES") {
    return { pqc: "AES-256-GCM", hybrid: "Increase key size" };
  }
  return { pqc: "Review FIPS 203/204", hybrid: "Hybrid deployment" };
}

// ─── Standard card ────────────────────────────────────────────────────────────

function NistCard({
  standard, color, isSelected, isHighlighted, onClick,
}: {
  standard: PQCStandard; color: string; isSelected: boolean; isHighlighted: boolean; onClick: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer transition-all duration-250 relative overflow-hidden"
      style={{
        background: isSelected || isHighlighted ? `${color}08` : "rgba(11,18,32,0.7)",
        border: isHighlighted
          ? `2px solid ${color}70`
          : isSelected
          ? `1px solid ${color}45`
          : "1px solid rgba(34,211,238,0.09)",
        boxShadow: isHighlighted ? `0 0 30px ${color}18` : "none",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isHighlighted)
          (e.currentTarget as HTMLElement).style.borderColor = `${color}28`;
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isHighlighted)
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,211,238,0.09)";
      }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      aria-expanded={isSelected}
      aria-label={`${standard.name} — ${standard.purpose}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: color, filter: "blur(36px)", transform: "translate(30%,-30%)" }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{standard.name}</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>{standard.fips}</div>
          </div>
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
          >
            {standard.status.includes("Finalized") ? "FINAL" : "DRAFT"}
          </span>
        </div>
        {standard.former_name && (
          <div className="font-mono text-xs mb-2" style={{ color: "rgba(148,163,184,0.4)" }}>
            fka {standard.former_name}
          </div>
        )}
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-mono mb-3"
          style={{ background: "rgba(59,130,246,0.1)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          {standard.purpose}
        </span>

        {isHighlighted && !isSelected && (
          <div className="mb-2 font-mono text-xs px-2 py-1 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            ★ RELEVANT TO YOUR SCAN
          </div>
        )}

        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-2 space-y-3" style={{ borderTop: `1px solid ${color}18` }}>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                  {standard.description}
                </p>
                <div>
                  <div className="font-mono text-xs mb-1.5" style={{ color: "rgba(34,211,238,0.5)" }}>VARIANTS</div>
                  <div className="flex flex-wrap gap-1.5">
                    {standard.variants.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-xs font-mono"
                        style={{
                          background: v === standard.recommended_variant ? `${color}14` : "rgba(148,163,184,0.06)",
                          border: v === standard.recommended_variant ? `1px solid ${color}38` : "1px solid rgba(148,163,184,0.1)",
                          color: v === standard.recommended_variant ? color : "rgba(148,163,184,0.6)",
                        }}
                      >
                        {v === standard.recommended_variant ? "★ " : ""}{v}
                      </span>
                    ))}
                  </div>
                </div>
                {standard.hybrid_mode && (
                  <div className="rounded-xl p-3" style={{ background: "rgba(7,11,20,0.6)", border: "1px solid rgba(34,211,238,0.07)" }}>
                    <div className="font-mono text-xs mb-1" style={{ color: "rgba(34,211,238,0.5)" }}>HYBRID MODE</div>
                    <div className="font-mono text-sm" style={{ color: "#E2E8F0" }}>{standard.hybrid_mode}</div>
                  </div>
                )}
                <div>
                  <div className="font-mono text-xs mb-1" style={{ color: "rgba(148,163,184,0.4)" }}>REPLACES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {standard.replaces.map((r) => (
                      <span key={r} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function PQCRoadmap() {
  const { state, selectAlgorithm } = useAppState();
  const reduced = useReducedMotion();
  const [standards, setStandards] = useState<PQCStandard[]>(FALLBACK_STANDARDS);
  const [loadingStds, setLoadingStds] = useState(false);
  const [selectedStdId, setSelectedStdId] = useState<string | null>("ml-kem");

  // Load standards from API
  useEffect(() => {
    setLoadingStds(true);
    getPqcStandards()
      .then((stds) => { if (stds.length > 0) setStandards(stds); })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoadingStds(false));
  }, []);

  // Determine highlighted standards from scan + selected algorithm
  const highlightedStdIds = useMemo(() => {
    const ids = new Set<string>();
    const selectedAlgo = state.selectedAlgorithm;
    const findings = state.report?.findings ?? [];

    const algos = selectedAlgo
      ? [selectedAlgo]
      : [...new Set(findings.map((f) => f.algorithm.split("-")[0].toUpperCase()))];

    for (const algo of algos) {
      if (["RSA", "ECDH", "DH"].includes(algo)) ids.add("ml-kem");
      if (["ECDSA", "DSA", "RSA"].includes(algo)) ids.add("ml-dsa");
      if (["ECDSA", "ED25519"].includes(algo)) ids.add("slh-dsa");
    }
    return ids;
  }, [state.selectedAlgorithm, state.report]);

  // Migration paths from actual findings
  const migrationPaths = useMemo(() => {
    if (!state.report) return [];
    const seen = new Set<string>();
    return state.report.findings
      .filter((f) => f.quantum_vulnerable)
      .map((f) => {
        const key = `${f.algorithm.split("-")[0]}:${f.operation ?? ""}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const { pqc, hybrid } = getMigrationPath(f.algorithm, f.operation);
        return { from: f.algorithm, pqc, hybrid, riskColor: f.risk_level === "Critical" ? "#EF4444" : "#F97316" };
      })
      .filter(Boolean)
      .slice(0, 6) as { from: string; pqc: string; hybrid: string; riskColor: string }[];
  }, [state.report]);

  return (
    <section id="roadmap" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="h-px w-full mb-10" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="font-mono text-xs tracking-widest mb-1" style={{ color: "rgba(59,130,246,0.7)" }}>NIST STANDARDS</h2>
        <p className="text-2xl font-semibold text-white">Post-Quantum Migration Roadmap</p>
        <p className="mt-1 text-sm mb-5" style={{ color: "rgba(148,163,184,0.6)" }}>
          From vulnerable classical cryptography to quantum-resistant infrastructure
          {state.selectedAlgorithm && (
            <span style={{ color: "#22D3EE" }}>
              {" "}— filtered for <strong>{state.selectedAlgorithm}</strong>
              <button
                onClick={() => selectAlgorithm(null)}
                className="ml-2 text-xs underline"
                style={{ color: "rgba(34,211,238,0.5)" }}
                aria-label="Clear algorithm filter"
              >
                clear
              </button>
            </span>
          )}
        </p>
        {loadingStds && (
          <div className="font-mono text-xs mb-3" style={{ color: "rgba(34,211,238,0.4)" }}>
            Loading standards…
          </div>
        )}

        {/* Migration journey */}
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {[
            { label: "CURRENT CRYPTO", desc: "Classical algorithms", color: "#EF4444" },
            { label: "IDENTIFY", desc: "CBOM scanning", color: "#F97316" },
            { label: "PRIORITIZE", desc: "Risk classification", color: "#F59E0B" },
            { label: "HYBRID DEPLOY", desc: "Classical + PQC", color: "#8B5CF6" },
            { label: "PQC READY", desc: "Full quantum safety", color: "#10B981" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="rounded-xl px-3 py-2 text-center"
                style={{ background: `${step.color}0d`, border: `1px solid ${step.color}28` }}
              >
                <div className="font-mono text-xs font-semibold" style={{ color: step.color }}>{step.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>{step.desc}</div>
              </motion.div>
              {i < arr.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.08 + 0.25 }}
                  className="w-6 sm:w-8 h-px origin-left flex-shrink-0"
                  style={{ background: `linear-gradient(90deg, ${step.color}60, ${arr[i+1].color}60)` }}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Standard cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {standards.map((std) => {
            const color = STD_COLORS[std.id] ?? "#22D3EE";
            return (
              <NistCard
                key={std.id}
                standard={std}
                color={color}
                isSelected={selectedStdId === std.id}
                isHighlighted={highlightedStdIds.has(std.id)}
                onClick={() => setSelectedStdId(selectedStdId === std.id ? null : std.id)}
              />
            );
          })}
        </div>

        {/* Migration paths from real findings */}
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="panel p-5 space-y-4"
        >
          <div className="font-mono text-xs font-semibold tracking-widest" style={{ color: "rgba(34,211,238,0.6)" }}>
            {state.report ? "MIGRATION PATHS" : "MIGRATION EXAMPLES"}
          </div>

          {migrationPaths.length === 0 && (
            <div className="text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
              {state.report
                ? "No quantum-vulnerable algorithms detected."
                : "Scan a repository to see tailored migration paths."}
            </div>
          )}

          <div className="space-y-5">
            {migrationPaths.map((path, i) => (
              <motion.div
                key={`${path.from}:${i}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="space-y-1.5"
              >
                {/* Legacy */}
                <div className="flex justify-center">
                  <span
                    className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: path.riskColor }}
                  >
                    {path.from}
                  </span>
                </div>
                {/* Arrow */}
                <div className="flex justify-center">
                  <motion.div
                    className="w-px h-4 origin-top"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: reduced ? 0 : 0.3, delay: i * 0.07 + 0.2 }}
                    style={{ background: `linear-gradient(180deg, ${path.riskColor}60, rgba(34,211,238,0.4))` }}
                  />
                </div>
                {/* PQC */}
                <div className="flex justify-center">
                  <span
                    className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold"
                    style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22D3EE" }}
                  >
                    {path.pqc}
                  </span>
                </div>
                {/* Hybrid */}
                {path.hybrid !== "Direct replacement" && path.hybrid !== "Increase key size" && (
                  <>
                    <div className="flex justify-center">
                      <div className="w-px h-3 origin-top" style={{ background: "rgba(34,211,238,0.2)" }} />
                    </div>
                    <div className="text-center font-mono text-xs" style={{ color: "rgba(148,163,184,0.35)" }}>
                      Hybrid: {path.hybrid}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
