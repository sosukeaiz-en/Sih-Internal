import { useRef } from "react";
import { useInView } from "framer-motion";
import { useCountUp } from "../hooks/useCountUp";

interface MetricTileProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
  suffix?: string;
  description: string;
  icon: React.ReactNode;
}

export default function MetricTile({ label, value, color, bgColor, borderColor, description, icon }: MetricTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(value, inView);

  return (
    <div
      ref={ref}
      className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: inView ? `0 0 30px ${borderColor}40` : "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: color, filter: "blur(30px)", transform: "translate(30%, -30%)" }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <div className="w-1 h-8 rounded-full opacity-40" style={{ background: color }} />
        </div>
        <div className="font-mono font-bold leading-none mb-1" style={{ fontSize: "2rem", color }}>
          {count}
        </div>
        <div className="font-mono text-xs font-semibold tracking-widest mb-2" style={{ color, opacity: 0.7 }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: "rgba(148, 163, 184, 0.5)" }}>{description}</div>
      </div>
    </div>
  );
}
