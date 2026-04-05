"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { BdeInstagramPost, BdeInstagramRow } from "@/data/bde-instagram-campaign";
import { flattenBdeInstagramPosts } from "@/data/bde-instagram-campaign";

interface InstagramGridProps {
  rows: BdeInstagramRow[];
}

/** Tuiles portrait 4:6 (flux Insta récent), sans changer l’ordre ni les assets. */
const TILE_ASPECT = "aspect-[4/6]";

function cellClass(post: BdeInstagramPost): string {
  if (post.banner) return "col-span-3 aspect-[3/1]";
  if (post.colSpan === 3) return "col-span-3 aspect-[2/1] sm:aspect-[21/9]";
  if (post.colSpan === 2) return `col-span-2 ${TILE_ASPECT} max-sm:col-span-3`;
  return `col-span-1 ${TILE_ASPECT}`;
}

export function InstagramGrid({ rows }: InstagramGridProps) {
  const posts = useMemo(() => flattenBdeInstagramPosts(rows), [rows]);
  const [lbPost, setLbPost] = useState<number | null>(null);
  const [lbSlide, setLbSlide] = useState(0);

  const cur = lbPost !== null ? posts[lbPost] : null;
  const totalSlides = cur?.slides.length ?? 0;

  const open = (postId: string) => {
    const i = posts.findIndex((p) => p.id === postId);
    if (i >= 0) {
      setLbPost(i);
      setLbSlide(0);
    }
  };

  const close = () => {
    setLbPost(null);
    setLbSlide(0);
  };

  const prevSlide = () => setLbSlide((s) => (s - 1 + totalSlides) % totalSlides);
  const nextSlide = () => setLbSlide((s) => (s + 1) % totalSlides);

  return (
    <>
      <div className="space-y-[2px] overflow-hidden bg-[var(--color-border)]">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-[2px]">
            {row.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => open(post.id)}
                className={[
                  "relative overflow-hidden bg-purple-50 group cursor-zoom-in outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
                  cellClass(post),
                ].join(" ")}
              >
                <Image
                  src={post.slides[0].src}
                  alt={post.slides[0].alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes={post.banner ? "100vw" : post.colSpan === 3 ? "100vw" : "(max-width: 768px) 33vw, 240px"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 pointer-events-none" />
                {!post.banner && post.slides.length > 1 && (
                  <div className="absolute top-2 right-2 opacity-95 pointer-events-none" aria-hidden>
                    <svg viewBox="0 0 20 20" className="w-4 h-4 drop-shadow-md" fill="white">
                      <rect x="1" y="4" width="13" height="14" rx="2" />
                      <rect x="5" y="1" width="13" height="14" rx="2" fill="rgba(255,255,255,0.65)" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {cur && lbPost !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm p-4"
          onClick={close}
          role="presentation"
        >
          {totalSlides > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-2 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl z-10 transition-colors"
              aria-label="Slide précédente"
            >
              ‹
            </button>
          )}

          <div
            className="relative w-full max-w-[min(520px,calc(100vw-2rem))] max-h-[88vh] aspect-[9/16] sm:aspect-auto sm:h-[min(88vh,820px)] sm:min-h-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={cur.slides[lbSlide].src}
              alt={cur.slides[lbSlide].alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 520px"
              priority
            />
          </div>

          {totalSlides > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl z-10 transition-colors"
              aria-label="Slide suivante"
            >
              ›
            </button>
          )}

          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-xl transition-colors z-10"
            aria-label="Fermer"
          >
            ×
          </button>

          {totalSlides > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {cur.slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLbSlide(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === lbSlide ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
                  aria-label={`Image ${i + 1} sur ${totalSlides}`}
                />
              ))}
            </div>
          )}

          {totalSlides > 1 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium z-10">
              {lbSlide + 1} / {totalSlides}
            </div>
          )}
        </div>
      )}
    </>
  );
}
