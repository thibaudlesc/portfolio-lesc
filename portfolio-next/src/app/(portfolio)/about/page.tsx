import Image from "next/image";
import Link from "next/link";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export const metadata = { title: "À propos" };

const langSkills = [
  { src: "/images/html-5.png",                label: "HTML5" },
  { src: "/images/css-3.png",                 label: "CSS3" },
  { src: "/images/JavaScript-logo.png",       label: "JavaScript" },
  { src: "/images/python.png",                label: "Python" },
  { src: "/images/skills/php.svg",            label: "PHP" },
  { src: "/images/skills/swift.svg",          label: "Swift" },
  { src: "/images/skills/react.svg",          label: "React" },
  { src: "/images/skills/flutter.svg",        label: "Flutter" },
];

const serviceSkills = [
  { src: "/images/skills/firebase.svg",       label: "Firebase" },
  { src: "/images/skills/mysql.svg",          label: "MySQL" },
  { src: "/images/skills/figma.svg",          label: "Figma" },
  { src: "/images/skills/github.svg",         label: "GitHub" },
];

const mediaSkills = [
  { src: "/images/Adobe-Photoshop-Logo.png",       label: "Photoshop" },
  { src: "/images/logo-premiere.png",              label: "Premiere Pro" },
  { src: "/images/adobe-after-effects-logo-0.png", label: "After Effects" },
  { src: "/images/excel-logo.png",                 label: "Excel" },
];

const aiSkills = [
  { src: "/images/skills/claude.svg",         label: "Claude" },
  { src: "/images/skills/cursor.svg",         label: "Cursor" },
];

const experiences = [
  {
    year: "2025",
    title: "Développeur",
    org: "Freelance",
    detail: "Devis, vidéo, montage, captation pour clients variés.",
    color: "var(--color-accent)",
  },
  {
    year: "2023",
    title: "Stage — Réalisation & Direction artistique",
    org: "Studio Tonus!",
    detail: "Montage vidéo, captation et direction artistique pour une agence de communication.",
    color: "var(--color-accent-secondary)",
  },
  {
    year: "2021",
    title: "Stage — Ingénierie informatique",
    org: "D2N Négociant Agricole",
    detail: "Maintenance informatique et assistance à l'équipe technique.",
    color: "#16a34a",
  },
];

const education = [
  {
    years: "2025 – 2028",
    title: "BUT MMI",
    org: "IUT Bordeaux Montaigne",
    detail: "Métiers du Multimédia et de l'Internet — développement, design, vidéo.",
  },
  {
    years: "2025",
    title: "Bac STI2D — Mention",
    org: "Lycée Lemonnier, Caen",
    detail: "Spécialités SI+N, Maths & Physique-Chimie.",
  },
];

const interests = ["Hardware", "Préhistoire", "E-sport", "Football", "Pêche à la carpe"];

export default function AboutPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <RevealOnScroll delay={150} className="shrink-0">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-xl ring-4 ring-[var(--color-border)]">
                <Image
                  src="/images/profile.png"
                  alt="Thibaud Lescroart"
                  width={256}
                  height={256}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </RevealOnScroll>

            <RevealOnScroll className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— À propos</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
                Thibaud Lescroart
              </h1>
              <p className="text-base font-medium text-[var(--color-muted)] mb-5">
                Développeur junior · alternance septembre 2026
              </p>
              <p className="text-lg text-[var(--color-muted)] leading-relaxed mb-4 max-w-lg">
                Bonjour ! Je suis Thibaud, 19 ans, étudiant en développement full stack à Bordeaux. Élevé dans le <strong>monde agricole</strong>, j&apos;ai gardé le goût du concret.
              </p>
              <p className="text-[var(--color-muted)] leading-relaxed mb-8 max-w-lg">
                Aujourd&apos;hui je jongle entre <strong>apps iOS et Android</strong>, <strong>sites vitrines</strong>, <strong>automatisation</strong> et la <strong>vidéo</strong>. Je cherche une alternance à partir de septembre 2026 pour mettre ces compétences au service d&apos;un projet concret.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="bg-[var(--color-accent)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                  Me contacter
                </Link>
                <a href="/documents/cv-thibaud-lescroart.pdf" target="_blank" className="border border-[var(--color-border)] text-[var(--color-text)] font-semibold px-6 py-3 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                  Télécharger le CV
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="section section--warm">
        <div className="container">
          <RevealOnScroll>
            <div className="grid grid-cols-3 gap-6">
              {[
                { n: "8+",  l: "Réalisations", sub: "apps, sites, data, vidéo" },
                { n: "14+", l: "Outils & langages", sub: "dev + création + IA" },
                { n: "BUT", l: "MMI — Bordeaux", sub: "Montaigne · 2025–2028" },
              ].map(({ n, l, sub }) => (
                <div key={l} className="text-center p-6 card">
                  <p className="text-3xl font-bold text-[var(--color-accent)] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>{n}</p>
                  <p className="text-sm font-semibold text-[var(--color-text)] mb-0.5">{l}</p>
                  <p className="text-xs text-[var(--color-muted)] hidden sm:block">{sub}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Compétences ── */}
      <section className="section">
        <div className="container">
          <RevealOnScroll className="mb-10">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Outils</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Ce que je maîtrise</h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              { label: "Langages & frameworks", skills: langSkills },
              { label: "Création multimédia", skills: mediaSkills },
            ].map(({ label, skills }, gi) => (
              <RevealOnScroll key={label} delay={gi * 80}>
                <div className="card p-6 h-full">
                  <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-5">{label}</p>
                  <div className="grid grid-cols-4 gap-3">
                    {skills.map(({ src, label: l }) => (
                      <div key={l} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-warm)] border border-[var(--color-border)] flex items-center justify-center p-2.5 group-hover:border-[var(--color-accent)] transition-colors">
                          <Image src={src} alt={l} width={36} height={36} className="object-contain w-full h-full" />
                        </div>
                        <span className="text-xs text-[var(--color-muted)] font-medium text-center leading-tight">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              { label: "Services & outils", skills: serviceSkills, cols: 4 },
              { label: "IA au quotidien", skills: aiSkills, cols: 4, accent: "secondary" },
            ].map(({ label, skills, accent }, gi) => (
              <RevealOnScroll key={label} delay={gi * 80 + 160}>
                <div className={`card p-6 h-full${accent === "secondary" ? " border-l-4 border-[var(--color-accent-secondary-light)]" : ""}`}
                  style={accent === "secondary" ? { borderLeftColor: "var(--color-accent-secondary)" } : undefined}>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-5"
                    style={{ color: accent === "secondary" ? "var(--color-accent-secondary)" : "var(--color-accent)" }}>
                    {label}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {skills.map(({ src, label: l }) => (
                      <div key={l} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-2xl border flex items-center justify-center p-2.5 transition-colors"
                          style={accent === "secondary"
                            ? { background: "var(--color-accent-secondary-light)", borderColor: "var(--color-accent-secondary-light)" }
                            : { background: "var(--color-warm)", borderColor: "var(--color-border)" }}>
                          <Image src={src} alt={l} width={36} height={36} className="object-contain w-full h-full" />
                        </div>
                        <span className="text-xs font-medium text-center leading-tight"
                          style={{ color: accent === "secondary" ? "var(--color-accent-secondary)" : "var(--color-muted)" }}>
                          {l}
                        </span>
                      </div>
                    ))}
                  </div>
                  {accent === "secondary" && (
                    <p className="text-xs text-[var(--color-muted)] mt-4">Intégrés dans tous mes workflows de développement</p>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Autres outils en pills */}
          <RevealOnScroll delay={280}>
            <div className="card p-6">
              <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-3">Et aussi</p>
              <div className="flex flex-wrap gap-2">
                {["Dart", "Next.js", "Tailwind CSS", "Capacitor", "PWA", "Pandas", "Matplotlib", "Node.js"].map((s) => (
                  <span key={s} className="text-sm bg-[var(--color-warm)] text-[var(--color-muted)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">{s}</span>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Expériences ── */}
      <section className="section section--warm">
        <div className="container">
          <RevealOnScroll className="mb-10">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Expériences</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Ce que j&apos;ai fait</h2>
          </RevealOnScroll>

          <div className="space-y-4">
            {experiences.map(({ year, title, org, detail, color }, i) => (
              <RevealOnScroll key={title} delay={i * 80}>
                <div className="card p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>{year}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--color-text)] mb-0.5">{title}</p>
                    <p className="text-sm font-semibold mb-2" style={{ color }}>{org}</p>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">{detail}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formation ── */}
      <section className="section">
        <div className="container">
          <RevealOnScroll className="mb-10">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Formation</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Mon parcours</h2>
          </RevealOnScroll>

          <div className="relative pl-8 border-l-2 border-[var(--color-border)] space-y-8">
            {education.map(({ years, title, org, detail }, i) => (
              <RevealOnScroll key={title} delay={i * 100}>
                <div className="relative">
                  <div className="absolute -left-[2.65rem] w-4 h-4 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-bg)]" />
                  <p className="text-sm font-semibold text-[var(--color-accent)] mb-1">{years}</p>
                  <h3 className="font-bold text-[var(--color-text)] mb-0.5">{title}</h3>
                  <p className="text-sm font-medium text-[var(--color-muted)] mb-1">{org}</p>
                  <p className="text-sm text-[var(--color-muted)]">{detail}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Centres d'intérêt ── */}
      <section className="section section--warm">
        <div className="container">
          <RevealOnScroll className="mb-8">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— En dehors du code</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Ce qui me ressource</h2>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="flex flex-wrap gap-3">
              {interests.map((interest) => (
                <span key={interest} className="text-sm font-medium bg-white text-[var(--color-text)] px-4 py-2 rounded-full border border-[var(--color-border)] shadow-sm">
                  {interest}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section">
        <div className="container text-center">
          <RevealOnScroll>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Un projet en tête ?
            </h2>
            <p className="text-[var(--color-muted)] mb-8 max-w-md mx-auto">
              Je cherche une alternance à partir de septembre 2026. Disponible aussi pour des missions freelance ou un simple échange.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="bg-[var(--color-accent)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                Discutons-en
              </Link>
              <Link href="/projects" className="border border-[var(--color-border)] text-[var(--color-text)] font-semibold px-6 py-3 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                Voir mes projets
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
