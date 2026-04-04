import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export const metadata = { title: "Projets" };

const sections = [
  { key: "live", title: "En ligne",  sub: "Déployés, utilisables, réels." },
  { key: "wip",  title: "En cours",  sub: "Ça bouge encore." },
  { key: "done", title: "Terminés",  sub: "Aboutis mais non déployés en prod." },
];

// ── Card cover config per slug ──────────────────────────────────────────────
type AppCoverConfig     = { type: "app";     bg: string; icon?: string; iconBg?: string };
type BrowserCoverConfig = { type: "browser"; url: string };
type ImageCoverConfig   = { type: "image";   src: string; objectPosition?: string };
type CoverConfig        = AppCoverConfig | BrowserCoverConfig | ImageCoverConfig;

const covers: Record<string, CoverConfig> = {
  "recoltiq": {
    type:   "app",
    bg:     "linear-gradient(135deg, #1a6b2e 0%, #1a6b2e 55%, #f5c800 100%)",
    icon:   "/images/projects/recoltiq/icon.png",
    iconBg: "#ffffff",
  },
  "bde-mmi": {
    type:   "app",
    bg:     "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)",
    icon:   "/images/projects/bde-mmi/logo.png",
    iconBg: "transparent",
  },
  "musee-ba-bordeaux": {
    type:           "image",
    src:            "/images/projects/musba/cover.jpg",
    objectPosition: "center 40%",
  },
  "bde-iq": { type: "browser", url: "https://bde-iq.web.app/" },
};

// ── App cover component ──────────────────────────────────────────────────────
function AppCardCover({ config, title, status }: { config: AppCoverConfig; title: string; status: string }) {
  const isRecolt = config.icon?.includes("recoltiq");
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: config.bg }}>
      {/* App icon */}
      {config.icon && (
        <div
          className="relative mb-3 overflow-hidden shadow-xl"
          style={{
            width:        isRecolt ? 72 : 64,
            height:       isRecolt ? 72 : 64,
            borderRadius: isRecolt ? 16 : 14,
            background:   config.iconBg,
            flexShrink:   0,
          }}
        >
          <Image
            src={config.icon}
            alt={title}
            fill
            className={isRecolt ? "object-contain p-1" : "object-cover"}
            sizes="72px"
          />
        </div>
      )}

      {/* Title */}
      <p className="text-white font-bold text-base drop-shadow-md mb-1">{title}</p>

      {/* CTA */}
      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-[11px] font-semibold px-3 py-1.5 rounded-full mt-1">
        {isRecolt ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Démo interactive disponible
          </>
        ) : (
          <>
            Voir le projet
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </div>

      {/* Decorative blur blobs */}
      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl"
        style={{ background: "white" }} />
    </div>
  );
}

// ── Browser card preview (interactive — no Link wrapper for these) ────────────
function BrowserCardCover({ url }: { url: string }) {
  const VIEWPORT_W = 1280;
  const CARD_W     = 540;
  const scale      = CARD_W / VIEWPORT_W;

  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f1f1f1] border-b border-[#ddd] shrink-0 z-10 relative">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="flex-1 mx-2 bg-white rounded text-[10px] text-[#666] px-2 py-0.5 border border-[#ddd] truncate">
          {url.replace("https://", "")}
        </div>
      </div>
      {/* Scaled iframe — interactive (pointer-events: auto) */}
      <div className="absolute left-0 right-0" style={{ top: 30, bottom: 0, overflow: "hidden" }}>
        <iframe
          src={url}
          title="Aperçu du site"
          style={{
            width:           VIEWPORT_W,
            height:          "100%",
            transform:       `scale(${scale})`,
            transformOrigin: "0 0",
            pointerEvents:   "auto",
            border:          "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  return (
    <main>
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container">
          <RevealOnScroll>
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Réalisations</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Mes projets</h1>
            <p className="text-[var(--color-muted)] max-w-xl leading-relaxed">
              Apps mobiles, sites, algorithmes, data — ce que j&apos;ai construit depuis que je code.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {sections.map(({ key, title, sub }) => {
        const list = projects.filter((p) => p.status === key);
        if (list.length === 0) return null;
        return (
          <section key={key} className={key === "wip" || key === "done" ? "section section--warm" : "section"}>
            <div className="container">
              <RevealOnScroll className="mb-8">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
                  <span className={[
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    key === "live" ? "bg-green-100 text-green-700" :
                    key === "wip"  ? "bg-amber-100 text-amber-700" :
                    "bg-[var(--color-warm)] text-[var(--color-muted)] border border-[var(--color-border)]",
                  ].join(" ")}>
                    {key === "live" ? "En ligne" : key === "wip" ? "En cours" : "Terminé"}
                  </span>
                  <p className="text-sm text-[var(--color-muted)] hidden sm:block">{sub}</p>
                </div>
              </RevealOnScroll>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {list.map((project, i) => {
                  const cover         = covers[project.slug];
                  const isBrowser     = cover?.type === "browser";
                  const statusLabel   = project.status === "live" ? "En ligne" : project.status === "wip" ? "En cours" : "Terminé";
                  const statusClass   = project.status === "live" ? "bg-green-100 text-green-700" : project.status === "wip" ? "bg-amber-100 text-amber-700" : "bg-white/80 text-[var(--color-muted)]";

                  const coverArea = (
                    <div className="relative aspect-[4/3] bg-[var(--color-warm)] overflow-hidden">
                      {cover?.type === "app" ? (
                        <AppCardCover config={cover} title={project.title} status={project.status} />
                      ) : cover?.type === "browser" ? (
                        <BrowserCardCover url={cover.url} />
                      ) : cover?.type === "image" ? (
                        <Image
                          src={cover.src}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          style={{ objectPosition: cover.objectPosition ?? "center" }}
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <Image
                          src={project.coverImage}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      )}
                      <span className={`absolute top-3 left-3 z-30 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );

                  const cardBody = (
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-xl font-bold text-[var(--color-text)] transition-colors ${isBrowser ? "" : "group-hover:text-[var(--color-accent)]"}`}>
                          {project.title}
                        </h3>
                        <span className="text-xs text-[var(--color-muted)] mt-1 shrink-0">{project.year}</span>
                      </div>
                      <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-4">{project.tagline}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {project.stack.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs bg-[var(--color-warm)] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">
                            {s}
                          </span>
                        ))}
                        {isBrowser && (
                          <Link
                            href={`/projects/${project.slug}`}
                            className="ml-auto text-xs font-semibold text-[var(--color-accent)] hover:opacity-70 transition-opacity shrink-0"
                          >
                            Voir le projet →
                          </Link>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <RevealOnScroll key={project.slug} delay={i * 80}>
                      {isBrowser ? (
                        <div className="card overflow-hidden">
                          {coverArea}
                          {cardBody}
                        </div>
                      ) : (
                        <Link href={`/projects/${project.slug}`} className="card block overflow-hidden group">
                          {coverArea}
                          {cardBody}
                        </Link>
                      )}
                    </RevealOnScroll>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
