import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

/**
 * Dynamic, low-cost background: CSS gradient light fields + grid + a small
 * canvas node/signal field. Capped at ~30fps and paused when off-screen.
 */
export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let last = 0;
    let nodes: Node[] = [];
    let w = 0;
    let h = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(64, Math.max(24, Math.round((w * h) / 42000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (t - last < 33) return;
      last = t;

      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;
      }

      // signal links
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 26000) continue;
          const alpha = (1 - d2 / 26000) * 0.14;
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // nodes
      for (const n of nodes) {
        const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t / 2600 + n.phase));
        ctx.fillStyle = `rgba(59, 130, 246, ${0.18 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.1 + pulse * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* base */}
      <div className="absolute inset-0 bg-background" />

      {/* slow light fields */}
      <div
        className="absolute -top-1/3 -left-1/4 h-[85vh] w-[85vw] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--blue) 26%, transparent), transparent 65%)",
          filter: "blur(70px)",
          animation: "drift-a 34s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[80vh] w-[70vw] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--cyan) 20%, transparent), transparent 68%)",
          filter: "blur(80px)",
          animation: "drift-b 46s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[60vh] w-[60vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--violet) 20%, transparent), transparent 70%)",
          filter: "blur(90px)",
          animation: "drift-a 58s ease-in-out infinite reverse",
        }}
      />

      {/* grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
        }}
      />

      {/* circuit traces */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]">
        <defs>
          <linearGradient id="trace" x1="0" x2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[14, 32, 55, 78].map((y, i) => (
          <path
            key={y}
            d={`M -5 ${y}% H 32% l 6% -6% H 68% l 5% 5% H 105%`}
            fill="none"
            stroke="url(#trace)"
            strokeWidth="1"
            strokeDasharray="8 14"
            style={{
              animation: reduce
                ? undefined
                : `dash-flow ${26 + i * 7}s linear infinite`,
            }}
          />
        ))}
        <style>{`@keyframes dash-flow { to { stroke-dashoffset: -600; } }`}</style>
      </svg>

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />

      {/* noise */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 80% at 50% 0%, transparent 40%, oklch(0.09 0.02 264 / 85%) 100%)",
        }}
      />
    </div>
  );
}
