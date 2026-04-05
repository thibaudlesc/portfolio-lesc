import type { CaseSection, MetricBlock, ImageBlock } from "@/types";
import Image from "next/image";

// ─── Individual block renderers ───────────────────────────────────────────────

function TextBlock({ content }: { content: string }) {
  return (
    <p className="text-[var(--color-text)] leading-relaxed text-base md:text-lg">
      {content}
    </p>
  );
}

function CodeBlock({ content, lang = "tsx" }: { content: string; lang?: string }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
        <div className="flex gap-1.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest uppercase">
          {lang}
        </span>
      </div>
      <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
        <code className="font-mono text-[var(--color-text)]">{content}</code>
      </pre>
    </div>
  );
}

function MetricBlockRenderer({ content }: { content: MetricBlock }) {
  return (
    <div className="glass rounded-xl p-6 flex flex-col gap-1 text-center">
      <span className="font-mono text-3xl md:text-4xl font-black text-[var(--color-accent)]">
        {content.value}
      </span>
      {content.delta && (
        <span className="font-mono text-sm text-green-400">{content.delta}</span>
      )}
      <span className="font-mono text-xs text-[var(--color-muted)] tracking-[0.2em] uppercase mt-1">
        {content.label}
      </span>
    </div>
  );
}

function ImageBlockRenderer({ content }: { content: ImageBlock }) {
  /* Détecte les captures mobile (portrait) par extension ou convention de nom */
  const isMobile = /\/(C\d+\.png|\d+\.jpg)$/.test(content.src);

  return (
    <figure className={`space-y-4 ${isMobile ? "flex flex-col items-center" : ""}`}>
      <div
        className={[
          "glass rounded-2xl overflow-hidden relative",
          isMobile
            ? "w-[280px] aspect-[9/19.5]"
            : "w-full aspect-video",
        ].join(" ")}
      >
        <Image
          src={content.src}
          alt={content.alt}
          fill
          className="object-cover"
          sizes={isMobile ? "280px" : "(max-width: 768px) 100vw, 800px"}
        />
      </div>
      {content.caption && (
        <figcaption className="font-mono text-xs text-[var(--color-muted)] text-center tracking-wide">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

function SplitBlock({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass rounded-xl p-6">
        <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase mb-3">
          Avant
        </p>
        <p className="text-[var(--color-text)] leading-relaxed text-sm">{left}</p>
      </div>
      <div className="glass rounded-xl p-6 border-[var(--color-accent)]" style={{ borderColor: "var(--color-accent)" }}>
        <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-[0.3em] uppercase mb-3">
          Après
        </p>
        <p className="text-[var(--color-text)] leading-relaxed text-sm">{right}</p>
      </div>
    </div>
  );
}

// ─── Section wrapper with label ───────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase mb-6">
      {children}
    </p>
  );
}

// ─── Metrics row (groups consecutive metric sections) ─────────────────────────

function MetricsRow({ metrics }: { metrics: MetricBlock[] }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)` }}
    >
      {metrics.map((m, i) => (
        <MetricBlockRenderer key={i} content={m} />
      ))}
    </div>
  );
}

// ─── Block dispatcher ────────────────────────────────────────────────────────

type GroupedBlock =
  | { type: "metrics"; items: MetricBlock[] }
  | { type: "images";  items: ImageBlock[] }
  | CaseSection;

function renderBlock(block: GroupedBlock, idx: number): React.ReactNode {
  if (block.type === "metrics") {
    return <MetricsRow key={idx} metrics={block.items} />;
  }
  if (block.type === "images") {
    return (
      <div key={idx} className="flex flex-wrap justify-center gap-4">
        {block.items.map((img, j) => (
          <ImageBlockRenderer key={j} content={img} />
        ))}
      </div>
    );
  }
  if (block.type === "text") {
    return (
      <section key={idx}>
        <TextBlock content={block.content as string} />
      </section>
    );
  }
  if (block.type === "code") {
    const b = block as { type: "code"; content: string; lang?: string };
    return (
      <section key={idx}>
        <CodeBlock content={b.content} lang={b.lang} />
      </section>
    );
  }
  if (block.type === "image") {
    return (
      <section key={idx}>
        <ImageBlockRenderer content={block.content as ImageBlock} />
      </section>
    );
  }
  if (block.type === "split") {
    const b = block as { type: "split"; left: string; right: string };
    return (
      <section key={idx}>
        <SplitBlock left={b.left} right={b.right} />
      </section>
    );
  }
  return null;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function CaseStudyRenderer({ sections }: { sections: CaseSection[] }) {
  if (sections.length === 0) return null;

  // Group consecutive metrics into rows, consecutive images into grids
  const blocks: GroupedBlock[] = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    if (s.type === "metric") {
      const group: MetricBlock[] = [];
      while (i < sections.length && sections[i].type === "metric") {
        group.push((sections[i] as { type: "metric"; content: MetricBlock }).content);
        i++;
      }
      blocks.push({ type: "metrics", items: group });
    } else if (s.type === "image") {
      const group: ImageBlock[] = [];
      while (i < sections.length && sections[i].type === "image") {
        group.push((sections[i] as { type: "image"; content: ImageBlock }).content);
        i++;
      }
      if (group.length > 1) {
        blocks.push({ type: "images", items: group });
      } else {
        blocks.push({ type: "image", content: group[0] } as CaseSection);
      }
    } else {
      blocks.push(s);
      i++;
    }
  }

  return (
    <div className="space-y-10 mt-16">
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}
