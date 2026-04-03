import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";

const LINKS = [
  { label: "Email",    href: "mailto:Thibaud.lesc@gmail.com",                             display: "Thibaud.lesc@gmail.com" },
  { label: "GitHub",   href: "https://github.com/thibaudlesc",                            display: "github.com/thibaudlesc" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/thibaud-lescroart-0a0741264/", display: "linkedin.com/in/thibaud-lescroart" },
  { label: "CV",       href: "/documents/cv-thibaud-lescroart.pdf",                       display: "Télécharger mon CV (PDF)" },
];

export function ContactSection() {
  return (
    <section id="contact" className="py-32 px-6 max-w-6xl mx-auto w-full">
      <Reveal>
        <Label index="003">Contact</Label>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <Reveal delay={100}>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-6">
              Travaillons
              <br />
              <span style={{ color: "var(--color-accent)" }}>ensemble.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Ouvert aux opportunités de stage, alternance ou projets freelance.
              Je réponds en moins de 24h.
            </p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <GlassCard className="p-8 space-y-4">
            {LINKS.map(({ label, href, display }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between group py-3 border-b border-[var(--color-border)] last:border-0"
              >
                <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase w-20 shrink-0">
                  {label}
                </span>
                <span className="font-mono text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                  {display}
                </span>
                <span className="font-mono text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all ml-3 shrink-0">
                  ↗
                </span>
              </a>
            ))}
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
