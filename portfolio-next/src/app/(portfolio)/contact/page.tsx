import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export const metadata = { title: "Contact" };

const LINKS = [
  { label: "Email",    href: "mailto:Thibaud.lesc@gmail.com",                             display: "Thibaud.lesc@gmail.com" },
  { label: "GitHub",   href: "https://github.com/thibaudlesc",                            display: "github.com/thibaudlesc" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/thibaud-lescroart-0a0741264/", display: "linkedin.com/in/thibaud-lescroart" },
  { label: "CV",       href: "/documents/cv-thibaud-lescroart.pdf",                       display: "Télécharger mon CV (PDF)" },
];

export default function ContactPage() {
  return (
    <main>
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container">
          <RevealOnScroll>
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Contact</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Travaillons ensemble
            </h1>
            <p className="text-[var(--color-muted)] max-w-xl leading-relaxed">
              Ouvert aux opportunités de stage, alternance ou projets freelance. Je réponds en moins de 24h.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="section section--warm">
        <div className="container max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Left — pitch */}
            <RevealOnScroll>
              <div className="card p-8">
                <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
                  Pourquoi me contacter ?
                </h2>
                <ul className="space-y-3 text-[var(--color-muted)] text-sm leading-relaxed">
                  <li className="flex gap-2"><span className="text-[var(--color-accent)] font-bold">→</span> Un projet d'app mobile ou web</li>
                  <li className="flex gap-2"><span className="text-[var(--color-accent)] font-bold">→</span> Une opportunité de stage ou alternance</li>
                  <li className="flex gap-2"><span className="text-[var(--color-accent)] font-bold">→</span> Une mission freelance</li>
                  <li className="flex gap-2"><span className="text-[var(--color-accent)] font-bold">→</span> Juste pour échanger</li>
                </ul>
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-muted)]">Basé à Bordeaux, disponible à distance</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Right — links */}
            <RevealOnScroll delay={100}>
              <div className="card p-2 divide-y divide-[var(--color-border)]">
                {LINKS.map(({ label, href, display }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") || href.startsWith("mailto") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between gap-4 px-6 py-4 group hover:bg-[var(--color-warm)] transition-colors rounded-xl"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-0.5">{label}</p>
                      <p className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate max-w-[180px]">{display}</p>
                    </div>
                    <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>
    </main>
  );
}
