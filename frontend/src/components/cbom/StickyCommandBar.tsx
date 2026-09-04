import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Radar, ShieldHalf } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { StatusDot } from "./primitives";

const SECTIONS = [
  { id: "scan", label: "Scan" },
  { id: "cbom", label: "CBOM" },
  { id: "mosca", label: "Mosca" },
  { id: "roadmap", label: "PQC Roadmap" },
  { id: "export", label: "Export" },
];

export function StickyCommandBar({ online }: { online: boolean }) {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState("scan");

  useMotionValueEvent(scrollY, "change", (v) => setCompact(v > 260));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={false}
      animate={{
        backgroundColor: compact ? "oklch(0.135 0.022 264 / 0.82)" : "oklch(0.135 0.022 264 / 0)",
        borderBottomColor: compact ? "var(--border)" : "transparent",
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{ borderBottomWidth: 1, backdropFilter: compact ? "blur(16px)" : "none" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-4 px-5 sm:px-8">
        <motion.a
          href="#scan"
          className="flex items-center gap-2.5"
          initial={false}
          animate={{ opacity: compact ? 1 : 0, x: compact ? 0 : -8 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: compact ? "auto" : "none" }}
        >
          <span
            className="grid size-7 place-items-center rounded-lg border border-border-strong"
            style={{ background: "color-mix(in oklab, var(--cyan) 14%, transparent)" }}
          >
            <ShieldHalf className="size-3.5 text-cyan" />
          </span>
          <span className="font-mono text-[12px] font-semibold tracking-[0.18em] text-foreground">
            CBOM SENTINEL
          </span>
        </motion.a>

        <motion.nav
          className="ml-auto hidden items-center gap-1 md:flex"
          initial={false}
          animate={{ opacity: compact ? 1 : 0, y: compact ? 0 : -6 }}
          transition={{ duration: 0.4, delay: compact ? 0.06 : 0 }}
          style={{ pointerEvents: compact ? "auto" : "none" }}
          aria-label="Sections"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "relative rounded-md px-3 py-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase transition-colors",
                active === s.id ? "text-cyan" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
              {active === s.id && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                  style={{ background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </a>
          ))}
        </motion.nav>

        <motion.div
          className="ml-auto flex items-center gap-3 md:ml-0"
          initial={false}
          animate={{ opacity: compact ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: compact ? "auto" : "none" }}
        >
          <span className="hidden items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase lg:inline-flex">
            <StatusDot tone={online ? "green" : "amber"} />
            {online ? "systems online" : "demo mode"}
          </span>
          <a
            href="#scan"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-cyan uppercase transition-colors hover:bg-[color-mix(in_oklab,var(--cyan)_12%,transparent)]"
          >
            <Radar className="size-3" /> Scan
          </a>
        </motion.div>
      </div>
    </motion.header>
  );
}
