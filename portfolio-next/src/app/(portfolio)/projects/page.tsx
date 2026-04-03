import Link from "next/link";
import { projects } from "@/data/projects";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = { title: "Projets" };

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  live: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400",  label: "En ligne" },
  wip:  { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400",  label: "En cours" },
  done: { bg: "bg-zinc-500/10",  text: "text-zinc-400",  dot: "bg-zinc-500",   label: "Terminé"  },
};

const sections = [
  { key: "live", title: "En ligne",    sub: "Déployés, utilisables, réels." },
  { key: "wip",  title: "En cours",    sub: "Ça bouge encore — liens parfois perfectibles." },
  { key: "done", title: "Terminés",    sub: "Aboutis mais non déployés en prod." },
];

export default function ProjectsPage() {
  return (
    <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto w-full min-h-screen">
      <Reveal><Label index="002">Projets</Label></Reveal>

      <Reveal delay={100}>
        <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-16 max-w-xl">
          Apps mobiles, sites, algorithmes, data — ce que j'ai construit depuis que je code.
        </p>
      </Reveal>

      {sections.map(({ key, title, sub }) => {
        const list = projects.filter((p) => p.status === key);
        if (list.length === 0) return null;
        return (
          <section key={key} className="mb-16">
            <Reveal>
              <div className="flex items-baseline gap-4 mb-6">
                <h2 className="font-mono text-sm font-bold text-[var(--color-text)]">{title}</h2>
                <p className="font-mono text-[10px] text-[var(--color-muted)]">{sub}</p>
              </div>
            </Reveal>

            <div className="space-y-3">
              {list.map((project, i) => {
                const s = STATUS_STYLE[project.status];
                return (
                  <Reveal key={project.slug} delay={([0, 100, 200] as const)[i % 3]}>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[var(--color-accent)] transition-all duration-300 block"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.2em]">
                            {project.year}
                          </span>
                          <span className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                            <span className={`w-1 h-1 rounded-full ${s.dot} ${project.status === "live" ? "animate-pulse" : ""}`} />
                            {s.label}
                          </span>
                        </div>
                        <h3 className="font-mono text-xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-[var(--color-muted)] text-sm mt-0.5 line-clamp-1">{project.tagline}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-wrap gap-1.5 max-w-[180px] justify-end">
                          {project.stack.slice(0, 3).map((s) => (
                            <span key={s} className="font-mono text-[10px] text-[var(--color-muted)] px-2 py-1 rounded-md" style={{ background: "oklch(100% 0 0 / 4%)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all duration-300">→</span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
