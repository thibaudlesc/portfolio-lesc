import Link from "next/link";
import { featuredProjects } from "@/data/projects";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";

export function ProjectsSection() {
  return (
    <section id="projects" className="py-32 px-6 max-w-6xl mx-auto w-full">
      <Reveal>
        <Label index="002">Projets</Label>
      </Reveal>

      <div className="space-y-4">
        {featuredProjects.map((project, i) => (
          <Reveal key={project.slug} delay={([0, 100, 200] as const)[i] ?? 200}>
            <Link
              href={`/projects/${project.slug}`}
              className="glass rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-[var(--color-accent)] transition-all duration-300 block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em]">
                    {String(i + 1).padStart(2, "0")} / {project.year}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.2em] uppercase">
                    {project.role[0]}
                  </span>
                </div>
                <h3 className="font-mono text-2xl md:text-3xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors duration-300 truncate">
                  {project.title}
                </h3>
                <p className="text-[var(--color-muted)] text-sm mt-1 line-clamp-1">
                  {project.tagline}
                </p>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-wrap gap-1.5 max-w-[200px] justify-end">
                  {project.stack.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="font-mono text-[10px] text-[var(--color-muted)] px-2 py-1 rounded-md"
                      style={{ background: "oklch(100% 0 0 / 4%)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-lg text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all duration-300">
                  →
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <div className="mt-8 text-center">
          <Link
            href="/projects"
            className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors tracking-widest"
          >
            voir tous les projets →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
