"use client";

import dynamic from "next/dynamic";

/* Chargement dynamique — évite SSR du canvas WebGL */
const HeroText = dynamic(
  () => import("@/components/three/HeroText").then((m) => m.HeroText),
  { ssr: false }
);

const STACK = ["React", "TypeScript", "WebGPU", "Next.js", "Node.js", "WASM"];

export function HeroSection() {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Ambient blobs ── */}
      <div
        aria-hidden
        className="absolute top-1/4 left-[15%] w-[28rem] h-[28rem] rounded-full blur-[140px] opacity-15 pointer-events-none"
        style={{ background: "var(--color-accent)" }}
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 right-[12%] w-[22rem] h-[22rem] rounded-full blur-[110px] opacity-10 pointer-events-none"
        style={{ background: "#a78bfa" }}
      />

      {/* ── Grid overlay ── */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Three.js canvas (troika text + particles) ── */}
      <HeroText accent="#f7c59f" />

      {/* ── Stack pills — HTML overlay ── */}
      <div className="absolute bottom-20 inset-x-0 flex flex-wrap justify-center gap-2 px-6 pointer-events-none">
        {STACK.map((s) => (
          <span
            key={s}
            className="glass font-mono text-xs text-[var(--color-muted)] px-3 py-1.5 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      {/* ── Status bar ── */}
      <div className="absolute bottom-6 inset-x-0 px-6 flex items-center justify-between pointer-events-none">
        <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest">
          © 2026
        </span>
        <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          OPEN TO WORK
        </span>
      </div>
    </section>
  );
}
