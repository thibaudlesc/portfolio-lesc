"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { experiments, COMMANDS } from "@/data/lab";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineType = "input" | "output" | "error" | "success" | "accent";

interface Line {
  type:    LineType;
  content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lineClass(type: LineType): string {
  switch (type) {
    case "input":   return "text-[var(--color-accent)]";
    case "success": return "text-green-400";
    case "error":   return "text-red-400";
    case "accent":  return "text-[var(--color-accent)] opacity-70";
    default:        return "text-[var(--color-muted)]";
  }
}

const BOOT: Line[] = [
  { type: "accent",  content: "╔══════════════════════════════════════════╗" },
  { type: "accent",  content: "║     thibaud-lescroart / lab  v1.0.0      ║" },
  { type: "accent",  content: "╚══════════════════════════════════════════╝" },
  { type: "output",  content: "" },
  { type: "output",  content: "  Tape  help  pour voir les commandes." },
  { type: "output",  content: "  Tape  ls    pour voir les projets." },
  { type: "output",  content: "" },
];

// ─── Command processor ────────────────────────────────────────────────────────

function process(raw: string): Line[] {
  const [cmd, ...args] = raw.trim().toLowerCase().split(/\s+/);
  const arg = args.join(" ");

  if (!cmd) return [];

  if (cmd === "help") {
    return COMMANDS.help.map((c) => ({ type: "output", content: c }));
  }

  if (cmd === "whoami") {
    return COMMANDS.whoami.map((c) => ({ type: "output", content: c }));
  }

  if (cmd === "ls") {
    return [
      { type: "output", content: "" },
      ...experiments.map((e) => ({
        type: "output" as LineType,
        content: `  ${e.id.padEnd(14)} ${e.status === "live" ? "●" : e.status === "wip" ? "◐" : "○"}  ${e.description}`,
      })),
      { type: "output", content: "" },
      { type: "output", content: "  Légende : ● live  ◐ wip  ○ archivé" },
      { type: "output", content: "" },
    ];
  }

  if (cmd === "run") {
    const exp = experiments.find((e) => e.id === arg);
    if (!exp) {
      return [
        { type: "error", content: `  Erreur : "${arg}" introuvable. Tape ls pour voir les ids.` },
      ];
    }
    return [
      { type: "output",  content: "" },
      { type: "success", content: `  ▶ ${exp.title}` },
      { type: "output",  content: `  ${exp.description}` },
      { type: "output",  content: "" },
      { type: "output",  content: `  Stack : ${exp.tags.join(" · ")}` },
      { type: "output",  content: `  Année : ${exp.year}  —  Status : ${exp.status}` },
      { type: "output",  content: "" },
      { type: "output",  content: "  Détails :" },
      ...exp.details.map((d) => ({ type: "output" as LineType, content: `    › ${d}` })),
      { type: "output",  content: "" },
      ...(exp.url
        ? [
            { type: "success" as LineType, content: `  Lien : ${exp.url}` },
            { type: "output"  as LineType, content: `  (tape  open ${exp.id}  pour ouvrir)` },
            { type: "output"  as LineType, content: "" },
          ]
        : []),
    ];
  }

  if (cmd === "open") {
    const exp = experiments.find((e) => e.id === arg);
    if (!exp) {
      return [{ type: "error", content: `  Erreur : "${arg}" introuvable.` }];
    }
    if (!exp.url) {
      return [{ type: "error", content: `  Pas de lien disponible pour "${arg}".` }];
    }
    if (typeof window !== "undefined") window.open(exp.url, "_blank", "noopener");
    return [{ type: "success", content: `  Ouverture de ${exp.url}…` }];
  }

  if (cmd === "clear") {
    return []; // signal spécial géré dans le composant
  }

  return [
    { type: "error", content: `  Commande inconnue : "${cmd}". Tape help.` },
  ];
}

// ─── Terminal component ───────────────────────────────────────────────────────

export function Terminal() {
  const [lines, setLines]       = useState<Line[]>(BOOT);
  const [input, setInput]       = useState("");
  const [history, setHistory]   = useState<string[]>([]);
  const [histIdx, setHistIdx]   = useState(-1);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  /* Focus on click anywhere in terminal */
  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const submit = useCallback(() => {
    const raw = input.trim();

    const echo: Line = { type: "input", content: `❯ ${raw || ""}` };

    if (!raw) {
      setLines((l) => [...l, echo]);
      setInput("");
      return;
    }

    if (raw === "clear") {
      setLines(BOOT);
      setInput("");
      setHistory((h) => [raw, ...h]);
      setHistIdx(-1);
      return;
    }

    const result = process(raw);
    setLines((l) => [...l, echo, ...result]);
    setHistory((h) => [raw, ...h]);
    setHistIdx(-1);
    setInput("");
  }, [input]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistIdx((i) => {
          const next = Math.min(i + 1, history.length - 1);
          setInput(history[next] ?? "");
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistIdx((i) => {
          const next = Math.max(i - 1, -1);
          setInput(next === -1 ? "" : (history[next] ?? ""));
          return next;
        });
      } else if (e.key === "Tab") {
        /* Autocomplete */
        e.preventDefault();
        const ids = experiments.map((ex) => ex.id);
        const cmds = ["help", "ls", "clear", "whoami", "run ", "open "];
        const all = [...cmds, ...ids.map((id) => `run ${id}`), ...ids.map((id) => `open ${id}`)];
        const match = all.find((c) => c.startsWith(input) && c !== input);
        if (match) setInput(match);
      }
    },
    [submit, history, input]
  );

  return (
    <div
      className="glass rounded-2xl overflow-hidden font-mono text-sm cursor-text flex flex-col"
      style={{ height: "min(70vh, 640px)" }}
      onClick={focusInput}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <span className="w-3 h-3 rounded-full bg-green-400/80" />
        <span className="ml-3 text-[10px] text-[var(--color-muted)] tracking-widest">
          thibaud@lab:~$
        </span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-6 space-y-0.5">
        {lines.map((line, i) => (
          <p key={i} className={`leading-relaxed whitespace-pre ${lineClass(line.type)}`}>
            {line.content}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--color-border)] shrink-0">
        <span className="text-[var(--color-accent)] select-none">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent outline-none text-[var(--color-text)] caret-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
          placeholder="tape une commande…"
        />
      </div>
    </div>
  );
}
