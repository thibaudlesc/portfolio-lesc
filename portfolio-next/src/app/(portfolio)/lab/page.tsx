"use client";

import { useState } from "react";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";
import { Terminal } from "@/components/lab/Terminal";
import { experiments } from "@/data/lab";

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  live:     { bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-400",  label: "En ligne" },
  wip:      { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400",  label: "En cours" },
  archived: { bg: "bg-zinc-500/10",   text: "text-zinc-400",   dot: "bg-zinc-500",   label: "Archivé"  },
};

export default function LabPage() {
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto w-full min-h-screen">
      <Reveal>
        <Label index="EXP">Lab & Expérimentations</Label>
      </Reveal>

      {/* Header */}
      <Reveal delay={100}>
        <div className="mb-14">
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-3">
            Ce que j'explore,
            <br />
            <span style={{ color: "var(--color-accent)" }}>même quand c'est pas fini.</span>
          </h1>
          <p className="text-[var(--color-muted)] leading-relaxed max-w-xl">
            Prototypes, scripts, expériences. Certains sont en ligne, d'autres dans un coin de mon disque dur — mais tous m'ont appris quelque chose.
          </p>
        </div>
      </Reveal>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {experiments.map((exp, i) => {
          const s = STATUS_STYLE[exp.status] ?? STATUS_STYLE.archived;
          return (
            <Reveal key={exp.id} delay={([0, 100, 200, 300] as const)[i % 4]}>
              <div className="glass rounded-2xl p-6 flex flex-col gap-4 h-full hover:border-[var(--color-accent)] transition-colors duration-300 group">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase mb-1">
                      {exp.year}
                    </p>
                    <h2 className="font-mono text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                      {exp.title}
                    </h2>
                  </div>
                  {/* Status badge */}
                  <span className={`shrink-0 flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${exp.status === "live" ? "animate-pulse" : ""}`} />
                    {s.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[var(--color-muted)] text-sm leading-relaxed flex-1">
                  {exp.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {exp.tags.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] text-[var(--color-muted)] px-2 py-1 rounded-md"
                      style={{ background: "oklch(100% 0 0 / 5%)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Link */}
                {exp.url && (
                  <a
                    href={exp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-mono text-xs ${s.text} hover:opacity-70 transition-opacity`}
                  >
                    Voir le projet ↗
                  </a>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Terminal — mode optionnel */}
      <Reveal delay={200}>
        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <button
            onClick={() => setTerminalOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--color-accent)]">❯_</span>
              <span className="font-mono text-sm text-[var(--color-text)]">Mode terminal</span>
              <span className="font-mono text-[10px] text-[var(--color-muted)] hidden sm:inline">
                — explore les projets en ligne de commande
              </span>
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              {terminalOpen ? "fermer ↑" : "ouvrir ↓"}
            </span>
          </button>

          {terminalOpen && (
            <div className="border-t border-[var(--color-border)]">
              <Terminal />
            </div>
          )}
        </div>
      </Reveal>
    </main>
  );
}
