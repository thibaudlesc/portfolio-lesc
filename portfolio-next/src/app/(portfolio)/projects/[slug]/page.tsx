import { notFound } from "next/navigation";
import Link from "next/link";
import { projects } from "@/data/projects";
import { CaseStudyRenderer } from "@/components/sections/CaseStudyRenderer";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto w-full min-h-screen">
      {/* Back */}
      <Link
        href="/projects"
        className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors tracking-widest mb-12 inline-block"
      >
        ← projets
      </Link>

      {/* Header */}
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em]">
            {project.year}
          </span>
          {project.role.map((r) => (
            <span key={r} className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.2em] uppercase">
              {r}
            </span>
          ))}
        </div>

        <h1
          className="vt-hero-title font-mono text-4xl md:text-6xl font-bold text-[var(--color-text)] leading-tight mb-4"
          style={{ viewTransitionName: `project-title-${slug}` }}
        >
          {project.title}
        </h1>
        <p className="text-[var(--color-muted)] text-lg leading-relaxed">{project.tagline}</p>

        {/* Stack */}
        <div className="flex flex-wrap gap-2 mt-6">
          {project.stack.map((s) => (
            <span
              key={s}
              className="glass font-mono text-xs text-[var(--color-muted)] px-3 py-1.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Links */}
        {(project.links.live || project.links.github || project.links.appStore) && (
          <div className="flex gap-4 mt-6">
            {project.links.live && (
              <a href={project.links.live} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--color-accent)] hover:opacity-70 transition-opacity">
                voir le site ↗
              </a>
            )}
            {project.links.appStore && (
              <a href={project.links.appStore} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                App Store ↗
              </a>
            )}
            {project.links.github && (
              <a href={project.links.github} target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                github ↗
              </a>
            )}
          </div>
        )}
      </header>

      {/* Case study — overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Problème", content: project.caseStudy.problem },
          { label: "Approche",  content: project.caseStudy.approach },
          { label: "Résultat", content: project.caseStudy.outcome },
        ].map(({ label, content }) => (
          <div key={label} className="glass rounded-2xl p-6">
            <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase mb-3">
              {label}
            </p>
            <p className="text-[var(--color-text)] text-sm leading-relaxed">{content}</p>
          </div>
        ))}
      </div>

      {/* Case study — rich sections */}
      <CaseStudyRenderer sections={project.caseStudy.sections} />
    </main>
  );
}
