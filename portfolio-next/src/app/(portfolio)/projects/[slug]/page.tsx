import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
import { PhoneCarousel } from "@/components/ui/PhoneCarousel";
import { BrowserMockup } from "@/components/ui/BrowserMockup";
import { PhoneLiveApp } from "@/components/ui/PhoneLiveApp";
import { InstagramGrid } from "@/components/ui/InstagramGrid";
import { bdeInstagramCampaignRows } from "@/data/bde-instagram-campaign";
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

// Carousel data per project
const phoneCarousels: Record<string, { src: string; alt: string }[]> = {
  recoltiq: [
    { src: "/images/projects/recoltiq/C1.png", alt: "Récolt'IQ — Mes Parcelles" },
    { src: "/images/projects/recoltiq/C2.png", alt: "Récolt'IQ — Stock" },
    { src: "/images/projects/recoltiq/C3.png", alt: "Récolt'IQ — Détail" },
    { src: "/images/projects/recoltiq/C4.png", alt: "Récolt'IQ — Finances" },
    { src: "/images/projects/recoltiq/C5.png", alt: "Récolt'IQ — Partage" },
  ],
  "bde-mmi": [
    { src: "/images/projects/bde-mmi/C1.png", alt: "BDE MMI — Feed" },
    { src: "/images/projects/bde-mmi/C2.png", alt: "BDE MMI — Calendrier" },
    { src: "/images/projects/bde-mmi/C3.png", alt: "BDE MMI — Boutique" },
    { src: "/images/projects/bde-mmi/C4.png", alt: "BDE MMI — Espace MMI" },
    { src: "/images/projects/bde-mmi/C5.png", alt: "BDE MMI — Profil" },
  ],
};

const browserMockups: Record<string, string> = {
  "musee-ba-bordeaux": "https://projetmmimusbagrp4.netlify.app/",
  "bde-iq": "https://bde-iq.web.app/",
};

const youtubeEmbeds: Record<string, string> = {
  "clip-bde": "z_Q--rcjjhA",
};

const soundcloudEmbeds: Record<string, string> = {
  "clip-bde": "https://soundcloud.com/ethan-brunet-389404178/le-bde-de-tout-le-monde",
};

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const carousel = phoneCarousels[slug];
  const browserUrl = browserMockups[slug];
  const youtubeId = youtubeEmbeds[slug];
  const soundcloudUrl = soundcloudEmbeds[slug];
  const accentColor = slug === "bde-mmi" || slug === "clip-bde" ? "var(--color-accent-secondary)" : "var(--color-accent)";

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="section relative overflow-hidden"
        style={{
          paddingTop: "5rem",
          paddingBottom: "3rem",
          background: slug === "bde-mmi"
            ? "linear-gradient(160deg, #faf9f6 0%, #f5f0ff 100%)"
            : "linear-gradient(160deg, #faf9f6 60%, #fdf0e8 100%)",
        }}
      >
        <div className="container max-w-5xl">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
          >
            ← Retour aux projets
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-[var(--color-muted)]">{project.year}</span>
            <span className={[
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              project.status === "live" ? "bg-green-100 text-green-700" :
              project.status === "wip"  ? "bg-amber-100 text-amber-700" :
              "bg-[var(--color-warm)] text-[var(--color-muted)] border border-[var(--color-border)]",
            ].join(" ")}>
              {project.status === "live" ? "En ligne" : project.status === "wip" ? "En cours" : "Terminé"}
            </span>
            {project.role.map((r) => (
              <span key={r} className="text-xs text-[var(--color-muted)] border border-[var(--color-border)] px-2.5 py-1 rounded-full">{r}</span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text)] leading-tight mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            {project.title}
          </h1>
          <p className="text-xl text-[var(--color-muted)] leading-relaxed mb-6 max-w-2xl">{project.tagline}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.stack.map((s) => (
              <span key={s} className="text-sm bg-white/80 text-[var(--color-muted)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                {s}
              </span>
            ))}
          </div>

          {(project.links.live || project.links.github || project.links.appStore) && (
            <div className="flex flex-wrap gap-3">
              {project.links.live && (
                <a href={project.links.live} target="_blank" rel="noopener noreferrer"
                  className="bg-[var(--color-accent)] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity shadow-md shadow-orange-100">
                  Voir le site ↗
                </a>
              )}
              {project.links.appStore && (
                <a href={project.links.appStore} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1a1816] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-80 transition-opacity">
                  <svg className="w-4 h-4" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  App Store
                </a>
              )}
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer"
                  className="border border-[var(--color-border)] text-[var(--color-text)] font-semibold px-5 py-2.5 rounded-full text-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors">
                  GitHub ↗
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── YouTube embed ── */}
      {youtubeId && (
        <section className="section section--warm">
          <div className="container max-w-4xl">
            <div className="card overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={project.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SoundCloud player ── */}
      {soundcloudUrl && (
        <section className="section section--warm">
          <div className="container max-w-4xl">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-accent-secondary)" }}>— Morceau officiel</p>
              <h2 className="text-xl font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-playfair)" }}>
                Le BDE du Peuple — SoundCloud
              </h2>
            </div>
            <div className="card overflow-hidden">
              <iframe
                width="100%"
                height="166"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%237c3aed&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                className="border-0"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Live demo + carousel côte à côte (apps mobiles) ── */}
      {(slug === "recoltiq" || slug === "bde-mmi") && (
        <section className="section section--warm">
          <div className="container max-w-5xl">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              {slug === "recoltiq" && (
                <p className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  Maquette locale — même aperçu que l&apos;accueil
                </p>
              )}
              {slug === "bde-mmi" && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest"
                    style={{ color: "var(--color-accent-secondary)", background: "var(--color-accent-secondary-light)" }}>
                    Démo interactive — connexion Firebase réelle
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Connecte-toi avec un compte existant. Les écritures sont désactivées.
                  </p>
                </div>
              )}
            </div>
            {/* Maquette + carousel côte à côte sur desktop, centré */}
            <div className="flex flex-col lg:flex-row items-start justify-center gap-12 lg:gap-16">
              <PhoneLiveApp
                url={slug === "bde-mmi" ? "/demo-bde-mmi/index.html" : undefined}
                label={slug === "bde-mmi" ? "BDE MMI — démo interactive" : "Récolt'IQ — maquette interactive"}
              />
              {carousel && (
                <PhoneCarousel screens={carousel} accentColor={accentColor} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Browser mockup (web projects) ── */}
      {browserUrl && (
        <section className="section section--warm">
          <div className="container max-w-5xl">
            <BrowserMockup url={browserUrl} title={`${project.title} — ${browserUrl.replace("https://", "")}`} />
          </div>
        </section>
      )}

      {/* ── Galerie Instagram ── */}
      {(slug === "bde-mmi" || slug === "strat-com") && (
        <section className="section">
          <div className="container max-w-4xl">
            <div className="mb-8 flex items-end justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-accent-secondary)" }}>— Campagne Instagram</p>
                <h2 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-playfair)" }}>
                  @bdedetoutlemonde
                </h2>
              </div>
              <a
                href="https://www.instagram.com/bdedetoutlemonde/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold transition-colors"
                style={{ color: "var(--color-accent-secondary)" }}
              >
                Voir le compte ↗
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <InstagramGrid rows={bdeInstagramCampaignRows} />
            </div>
          </div>
        </section>
      )}

      {/* ── Overview ── */}
      <section className="section">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Problème", content: project.caseStudy.problem, color: "#dc2626" },
              { label: "Approche",  content: project.caseStudy.approach, color: "var(--color-accent)" },
              { label: "Résultat", content: project.caseStudy.outcome, color: "#16a34a" },
            ].map(({ label, content, color }) => (
              <div key={label} className="card p-6 border-t-4" style={{ borderTopColor: color }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color }}>{label}</p>
                <p className="text-[var(--color-text)] text-sm leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case study sections ── */}
      {project.caseStudy.sections.length > 0 && (
        <section className="section section--warm">
          <div className="container max-w-4xl space-y-10">
            {project.caseStudy.sections.map((block, i) => {
              if (block.type === "image") {
                // Images supprimées — le carousel et la maquette live suffisent
                return null;
              }
              if (block.type === "text") {
                return (
                  <p key={i} className="text-[var(--color-text)] leading-relaxed text-lg max-w-3xl">
                    {block.content as string}
                  </p>
                );
              }
              if (block.type === "metric") {
                const m = block.content as { label: string; value: string; delta?: string };
                return (
                  <div key={i} className="card p-6 inline-flex flex-col gap-1 min-w-[160px]">
                    <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest">{m.label}</p>
                    <p className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: "var(--font-playfair)" }}>{m.value}</p>
                    {m.delta && <p className="text-sm text-[var(--color-muted)]">{m.delta}</p>}
                  </div>
                );
              }
              if (block.type === "split") {
                const s = block as unknown as { left: string; right: string };
                return (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6 border-l-4 border-red-300 bg-red-50/50">
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-2">Avant</p>
                      <p className="text-[var(--color-text)] text-sm leading-relaxed">{s.left}</p>
                    </div>
                    <div className="card p-6 border-l-4 border-green-300 bg-green-50/50">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">Après</p>
                      <p className="text-[var(--color-text)] text-sm leading-relaxed">{s.right}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* ── Nav ── */}
      <section className="section">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/projects" className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors font-semibold text-sm">
            ← Tous les projets
          </Link>
          <Link href="/contact" className="bg-[var(--color-accent)] text-white font-semibold px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-md shadow-orange-100">
            Travaillons ensemble
          </Link>
        </div>
      </section>
    </main>
  );
}
