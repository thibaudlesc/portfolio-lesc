"use client";

import { useState } from "react";
import Image from "next/image";

interface Slide { src: string; alt: string }
export interface InstagramPost { id: string; slides: Slide[]; banner?: boolean }

export function InstagramGrid({ posts }: { posts: InstagramPost[] }) {
  const [lb, setLb] = useState<{ pi: number; si: number } | null>(null);

  const cur = lb ? posts[lb.pi] : null;
  const total = cur?.slides.length ?? 0;

  const prev  = () => setLb(l => l ? { ...l, si: (l.si - 1 + total) % total } : l);
  const next  = () => setLb(l => l ? { ...l, si: (l.si + 1) % total } : l);
  const close = () => setLb(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-[2px]">
        {posts.map((post, pi) => (
          <button
            key={post.id}
            onClick={() => setLb({ pi, si: 0 })}
            className={[
              "relative overflow-hidden bg-purple-50 group cursor-zoom-in",
              post.banner ? "col-span-3 aspect-[3/1]" : "aspect-[4/5]",
            ].join(" ")}
          >
            <Image
              src={post.slides[0].src}
              alt={post.slides[0].alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={post.banner ? "100vw" : "(max-width: 768px) 33vw, 20vw"}
            />
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            {/* Carousel indicator */}
            {!post.banner && post.slides.length > 1 && (
              <div className="absolute top-2 right-2 opacity-90">
                <svg viewBox="0 0 20 20" className="w-4 h-4 drop-shadow" fill="white">
                  <rect x="1" y="4" width="13" height="14" rx="2"/>
                  <rect x="5" y="1" width="13" height="14" rx="2" fill="rgba(255,255,255,0.6)"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {lb && cur && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
          onClick={close}
        >
          {total > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl z-10 transition-colors"
            >‹</button>
          )}

          <div
            className="relative max-h-[88vh] mx-16"
            style={{ width: "min(420px, calc(100vw - 8rem))", aspectRatio: "9/16" }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={cur.slides[lb.si].src}
              alt={cur.slides[lb.si].alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {total > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl z-10 transition-colors"
            >›</button>
          )}

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-xl transition-colors"
          >×</button>

          {/* Dots */}
          {total > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {cur.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLb(l => l ? { ...l, si: i } : l); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === lb.si ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          )}

          {/* Slide counter */}
          {total > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium">
              {lb.si + 1} / {total}
            </div>
          )}
        </div>
      )}
    </>
  );
}
