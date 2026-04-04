import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { experiments } from "@/data/lab";

export const metadata = { title: "Lab" };

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  live:     { badge: "bg-green-100 text-green-700", label: "En ligne" },
  wip:      { badge: "bg-amber-100 text-amber-700", label: "En cours" },
  archived: { badge: "bg-[var(--color-warm)] text-[var(--color-muted)] border border-[var(--color-border)]", label: "Archivé" },
};

export default function LabPage() {
  return (
    <main>
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container">
          <RevealOnScroll>
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Expérimentations</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Lab</h1>
            <p className="text-[var(--color-muted)] max-w-xl leading-relaxed">
              Prototypes, scripts, expériences. Certains sont en ligne, d'autres dans un coin de mon disque dur — mais tous m'ont appris quelque chose.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="section section--warm">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {experiments.map((exp, i) => {
              const s = STATUS_STYLE[exp.status] ?? STATUS_STYLE.archived;
              return (
                <RevealOnScroll key={exp.id} delay={i * 80}>
                  <div className="card p-6 flex flex-col gap-4 h-full group hover:border-[var(--color-accent)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[var(--color-muted)] font-medium mb-1">{exp.year}</p>
                        <h2 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                          {exp.title}
                        </h2>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>

                    <p className="text-[var(--color-muted)] text-sm leading-relaxed flex-1">
                      {exp.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((t) => (
                        <span key={t} className="text-xs bg-[var(--color-warm)] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">
                          {t}
                        </span>
                      ))}
                    </div>

                    {exp.url && (
                      <a
                        href={exp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--color-accent)] hover:opacity-70 transition-opacity"
                      >
                        Voir le projet ↗
                      </a>
                    )}
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
