import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAppState } from "../context/AppContext";

const NAV_ITEMS = [
  { id: "scan", label: "SCAN" },
  { id: "cbom", label: "CBOM" },
  { id: "mosca", label: "MOSCA" },
  { id: "roadmap", label: "PQC ROADMAP" },
  { id: "export", label: "EXPORT" },
];

export default function StickyNav() {
  const { scrollY } = useScroll();
  const [activeSection, setActiveSection] = useState("scan");
  const { resetScan, state } = useAppState();
  const opacity = useTransform(scrollY, [300, 500], [0, 1]);
  const y = useTransform(scrollY, [300, 500], [-20, 0]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map((item) => ({
        id: item.id,
        el: document.getElementById(item.id),
      }));
      const scrollPos = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].el;
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      style={{ opacity, y }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      aria-label="Command navigation"
    >
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(7, 11, 20, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.1)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="w-6 h-6 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path
              d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
              stroke="#22D3EE"
              strokeWidth="1.5"
              fill="rgba(34,211,238,0.1)"
            />
            <path d="M9 12l2 2 4-4" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-widest text-white" style={{ letterSpacing: "0.2em" }}>
          CBOM SENTINEL
        </span>
      </div>

      <div className="relative flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="relative px-3 py-1.5 text-xs tracking-widest transition-colors duration-200 rounded"
            style={{
              color: activeSection === item.id ? "#22D3EE" : "rgba(148, 163, 184, 0.8)",
              letterSpacing: "0.12em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {activeSection === item.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded"
                style={{ background: "rgba(34, 211, 238, 0.08)", border: "1px solid rgba(34, 211, 238, 0.25)" }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: state.backendStatus === "online" ? "#4ADE80" : state.backendStatus === "offline" ? "#EF4444" : "#94A3B8",
              animation: state.backendStatus === "online" ? "pulse-glow 2s infinite" : "none",
            }}
          />
          <span
            className="text-xs font-mono"
            style={{
              letterSpacing: "0.05em",
              color: state.backendStatus === "online" ? "#4ADE80" : state.backendStatus === "offline" ? "#EF4444" : "#94A3B8",
            }}
          >
            {state.backendStatus === "online" ? "ONLINE" : state.backendStatus === "offline" ? "OFFLINE" : "..."}
          </span>
        </div>
        <button
          onClick={() => {
            resetScan();
            scrollTo("scan");
            setTimeout(() => {
              const input = document.getElementById("repo-input") ?? document.getElementById("scan");
              input?.focus();
            }, 300);
          }}
          className="px-4 py-1.5 text-xs font-semibold tracking-widest rounded transition-all duration-200"
          style={{
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            color: "#22D3EE",
            letterSpacing: "0.12em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(34, 211, 238, 0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(34, 211, 238, 0.1)";
          }}
        >
          NEW SCAN
        </button>
      </div>
    </motion.nav>
  );
}
