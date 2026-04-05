import type { Metadata } from "next";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PhotoGallery } from "@/components/ui/PhotoGallery";

export const metadata: Metadata = {
  title: "Créations",
  description: "Vidéos, montages et photographie — côté créatif de Thibaud Lescroart.",
};

const videos = [
  {
    id: "z_Q--rcjjhA",
    title: "Clip BDE MMI",
    desc: "Réalisation, tournage et motion design — le clip officiel de la campagne BDE Montaigne.",
    tags: ["Réalisation", "Premiere Pro", "FL Studio"],
    accent: "var(--color-accent-secondary)",
  },
  {
    id: "W3W2KU7McTQ",
    title: "Montage vidéo 1",
    desc: "Découpage, étalonnage et habillages dans la suite Adobe.",
    tags: ["Montage", "Premiere Pro"],
    accent: "var(--color-accent)",
  },
  {
    id: "0nKf996H_ZY",
    title: "Montage vidéo 2",
    desc: "Proposition de rythme et de narration sur images tournées.",
    tags: ["Montage", "Étalonnage"],
    accent: "var(--color-accent)",
  },
];

const photos = [
  { src: "/images/gallery/caterham-1.jpg", alt: "Caterham — captation circuit" },
  { src: "/images/gallery/caterham-2.jpg", alt: "Caterham — détail mécanique" },
  { src: "/images/gallery/caterham-3.jpg", alt: "Caterham — pilotage" },
  { src: "/images/gallery/photo-1.jpg",    alt: "Photographie" },
  { src: "/images/gallery/photo-2.jpg",    alt: "Photographie" },
  { src: "/images/gallery/photo-3.jpg",    alt: "Photographie" },
  { src: "/images/gallery/photo-4.jpg",    alt: "Photographie" },
];

export default function CreativePage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="section"
        style={{ paddingTop: "5rem", paddingBottom: "4rem", background: "linear-gradient(160deg, var(--color-bg) 60%, var(--color-accent-secondary-light) 100%)" }}
      >
        <div className="container max-w-4xl">
          <RevealOnScroll>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent-secondary)" }}>— Créations</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ fontFamily: "var(--font-playfair)" }}>
              Vidéos & Photo
            </h1>
            <p className="text-lg text-[var(--color-muted)] leading-relaxed max-w-xl">
              Réalisation, montage, motion design et captation — la partie créative de mon travail.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── Vidéos ── */}
      <section className="section section--warm">
        <div className="container max-w-5xl">
          <RevealOnScroll className="mb-10">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Réalisations vidéo</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Montages & clips</h2>
          </RevealOnScroll>

          <div className="space-y-12">
            {videos.map(({ id, title, desc, tags, accent }, i) => (
              <RevealOnScroll key={id} delay={i * 80}>
                <div className="card overflow-hidden">
                  {/* 16/9 YouTube embed */}
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${id}`}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[var(--color-text)] mb-1">{title}</h3>
                      <p className="text-sm text-[var(--color-muted)] leading-relaxed">{desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {tags.map((t) => (
                        <span key={t} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${accent}18`, color: accent }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galerie photo ── */}
      <section className="section">
        <div className="container max-w-5xl">
          <RevealOnScroll className="mb-10">
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Photographie</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Galerie</h2>
          </RevealOnScroll>
          <RevealOnScroll>
            <PhotoGallery photos={photos} />
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
