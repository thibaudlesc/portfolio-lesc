import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PhoneLiveApp } from "@/components/ui/PhoneLiveApp";

// Ordre manuel : créa/MMI en premier, data/tech ensuite
const FEATURED_ORDER = ["musee-ba-bordeaux", "clip-bde", "strat-com", "lbc-alert", "ia-2048", "data-analyse"];
const featuredProjects = FEATURED_ORDER
  .map((s) => projects.find((p) => p.slug === s))
  .filter(Boolean) as typeof projects;

export default function Home() {
  return (
    <main>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: "7rem", paddingBottom: "6rem", background: "linear-gradient(160deg, #faf9f6 60%, #fdf0e8 100%)" }}
      >
        {/* Grain texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")", opacity: 0.4 }} />
        {/* Decorative circle */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, #fdf0e8 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <RevealOnScroll className="flex-1 max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[var(--color-accent-light)] text-[var(--color-accent)] text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-orange-200">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                Étudiant BUT MMI · Bordeaux
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] mb-6" style={{ fontFamily: "var(--font-playfair)", letterSpacing: "-0.03em" }}>
                Développeur<br />
                <em className="text-[var(--color-accent)] not-italic">&amp; Créateur</em> Multimédia
              </h1>
              <p className="text-lg text-[var(--color-muted)] leading-relaxed mb-12 md:mb-14">
                Apps mobiles, sites web, expériences interactives, data et vidéo — je construis des projets variés, du prototype à la mise en ligne.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/projects" className="bg-[var(--color-accent)] text-white font-semibold px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-orange-200">
                  Voir mes projets
                </Link>
                <Link href="/contact" className="border-2 border-[var(--color-border)] text-[var(--color-text)] font-semibold px-7 py-3.5 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                  Me contacter
                </Link>
              </div>
            </RevealOnScroll>

            {/* Photo */}
            <RevealOnScroll delay={150} className="shrink-0">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-3 rounded-3xl border-2 border-orange-200 opacity-60" />
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white">
                  <Image
                    src="/images/profile.png"
                    alt="Thibaud Lescroart"
                    width={320}
                    height={320}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-[var(--color-border)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span className="text-sm font-semibold text-[var(--color-text)]">Recherche alternance · sept. 2026</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── App BDE MMI showcase ───────────────────────────────────────────── */}
      <section className="section" style={{ background: "linear-gradient(160deg, var(--color-bg) 0%, var(--color-accent-secondary-light) 100%)" }}>
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text */}
            <RevealOnScroll className="flex-1 max-w-lg">
              <div className="inline-block bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-semibold px-3 py-1 rounded-full mb-5 border border-orange-200">
                En ligne sur l&apos;App Store
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "var(--font-playfair)", letterSpacing: "-0.02em", lineHeight: "1.1" }}>
                App BDE MMI
              </h2>
              <p className="text-[var(--color-muted)] leading-relaxed mb-8 text-base">
                Le produit phare de notre <strong>campagne électorale BDE</strong> — une app Flutter développée seul pour relier toute la promo MMI Montaigne, de A à Z.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  { label: "Conçue seul", detail: "app complète — feed social, boutique, agenda et profil. De zéro à l'App Store." },
                  { label: "Publiée le jour du vote", detail: "avec 23 visuels Instagram créés en parallèle pour asseoir la campagne." },
                  { label: "Firebase temps réel", detail: "posts, sondages et billets de soirée mis à jour en direct pour toute la promo." },
                ].map(({ label, detail }) => (
                  <div key={label} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
                      aria-hidden
                    />
                    <p className="text-[var(--color-muted)] min-w-0 flex-1">
                      <span className="font-semibold text-[var(--color-text)]">{label}</span> — {detail}
                    </p>
                  </div>
                ))}
              </div>
              {/* App Store card */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm mb-5">
                <Image src="/images/projects/bde-mmi/logo.png" alt="BDE MMI" width={52} height={52} className="rounded-2xl shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)] leading-tight">BDE MMI</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">Par Thibaud Lescroart</p>
                </div>
                <div className="shrink-0">
                  <a href="https://apps.apple.com/fr/app/bde-mmi/id6760981399" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#1a1816] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                    App Store
                  </a>
                </div>
              </div>
              <Link href="/projects/bde-mmi" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] hover:gap-3 transition-all">
                Voir le cas complet
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </RevealOnScroll>

            {/* Live demo only */}
            <RevealOnScroll delay={100} className="shrink-0">
              <PhoneLiveApp url="/demo-bde-mmi/index.html" label="BDE MMI — démo interactive" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── Récolt'IQ showcase ─────────────────────────────────────────────── */}
      <section className="section section--warm">
        <div className="container">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            {/* Text */}
            <RevealOnScroll className="flex-1 max-w-lg">
              <div className="inline-block bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-semibold px-3 py-1 rounded-full mb-5 border border-orange-200">
                Mon premier vrai projet dev
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "var(--font-playfair)", letterSpacing: "-0.02em", lineHeight: "1.1" }}>
                Récolt&apos;IQ
              </h2>
              <p className="text-[var(--color-muted)] leading-relaxed mb-8 text-base">
                App iOS pour les <strong>agriculteurs</strong> : suivi des récoltes, parcelles et finances en temps réel. De l&apos;idée à l&apos;App Store — seul, en 3 mois.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  { label: "Solo, 3 mois", detail: "de l'idée à l'App Store — conception, dev, design et déploiement sans aide." },
                  { label: "Offline-first", detail: "fonctionne en plein champ sans réseau, sync Firebase automatique dès que le signal revient." },
                  { label: "Usage réel", detail: "adoptée par de vrais agriculteurs en exploitation, pas seulement un prototype." },
                ].map(({ label, detail }) => (
                  <div key={label} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
                      aria-hidden
                    />
                    <p className="text-[var(--color-muted)] min-w-0 flex-1">
                      <span className="font-semibold text-[var(--color-text)]">{label}</span> — {detail}
                    </p>
                  </div>
                ))}
              </div>
              {/* App Store card */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm mb-5">
                <Image src="/images/projects/Icon.png" alt="Récolt'IQ" width={52} height={52} className="rounded-2xl shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)] leading-tight">Récolt&apos;IQ</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">Par Thibaud Lescroart</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <a href="https://apps.apple.com/fr/app/recoltiq/id6740539829" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#1a1816] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                    App Store
                  </a>
                  <a href="https://recolt-iq.fr" target="_blank" rel="noopener noreferrer"
                    className="text-center text-xs font-semibold text-[var(--color-accent)] hover:opacity-70 transition-opacity">
                    Site web ↗
                  </a>
                </div>
              </div>
              <Link href="/projects/recoltiq" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] hover:gap-3 transition-all">
                Voir le cas complet
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </RevealOnScroll>

            {/* Live app */}
            <RevealOnScroll delay={100} className="shrink-0">
              <PhoneLiveApp label="Récolt'IQ — maquette interactive" />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── Projets featured ────────────────────────────────────────────────── */}
      <section className="section section--warm">
        <div className="container">
          <RevealOnScroll className="mb-12">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Réalisations</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[var(--color-text)]">Projets récents</h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, i) => (
              <RevealOnScroll key={project.slug} delay={i * 80}>
                <Link href={`/projects/${project.slug}`} className="card block overflow-hidden group h-full flex flex-col">
                  <div className="relative aspect-[16/10] bg-[var(--color-warm)] overflow-hidden">
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      style={project.slug === "musee-ba-bordeaux" ? { objectPosition: "center 40%" } : undefined}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className={[
                      "absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
                      project.status === "live" ? "bg-green-100/90 text-green-700" :
                      project.status === "wip"  ? "bg-amber-100/90 text-amber-700" :
                      "bg-white/80 text-[var(--color-muted)]",
                    ].join(" ")}>
                      {project.status === "live" ? "En ligne" : project.status === "wip" ? "En cours" : "Terminé"}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                        {project.title}
                      </h3>
                      <span className="text-xs text-[var(--color-muted)] mt-1 shrink-0">{project.year}</span>
                    </div>
                    <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-4 flex-1">{project.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {project.stack.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-[var(--color-warm)] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">{s}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={200} className="text-center mt-10">
            <Link href="/projects" className="inline-flex items-center gap-2 border-2 border-[var(--color-border)] text-[var(--color-text)] font-semibold px-7 py-3.5 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
              Voir tous mes projets →
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── À propos teaser ─────────────────────────────────────────────────── */}
      <section className="section section--warm">
        <div className="container">
          <RevealOnScroll>
            <div className="card p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-10">
                <div className="shrink-0 hidden md:block">
                  <div className="w-1 h-32 rounded-full bg-gradient-to-b from-[var(--color-accent)] to-orange-200 mt-2" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-3">— Qui suis-je ?</p>
                  <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[var(--color-text)]">
                    Étudiant BUT MMI, plusieurs casquettes numériques
                  </h2>
                  <p className="text-[var(--color-muted)] leading-relaxed mb-6">
                    Élevé dans le <strong>monde agricole</strong>, j&apos;ai gardé le goût du concret. Aujourd&apos;hui je jongle entre <strong>apps iOS et Android</strong>, <strong>sites vitrines</strong>, <strong>Python</strong> et la <strong>vidéo</strong>. Je cherche des projets qui ont un usage réel — une app sur le store, un site en ligne, un outil qui aide un public précis.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/about" className="bg-[var(--color-accent)] text-white font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity text-sm shadow-md shadow-orange-100">
                      En savoir plus sur moi
                    </Link>
                    <a href="/documents/cv-thibaud-lescroart.pdf" target="_blank" className="border border-[var(--color-border)] text-[var(--color-text)] font-semibold px-5 py-2.5 rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm">
                      Télécharger le CV
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

        </div>
      </section>

    </main>
  );
}
