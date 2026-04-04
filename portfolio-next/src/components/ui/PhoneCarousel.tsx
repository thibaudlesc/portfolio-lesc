"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface PhoneScreen {
  src: string;
  alt: string;
}

interface PhoneCarouselProps {
  screens: PhoneScreen[];
  accentColor?: string;
}

export function PhoneCarousel({ screens, accentColor = "var(--color-accent)" }: PhoneCarouselProps) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setActive((i) => (i - 1 + screens.length) % screens.length);
  const next = () => setActive((i) => (i + 1) % screens.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phone + hidden arrows — arrows appear on hover of this wrapper */}
      <div
        className="relative flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Prev — absolute, fades in on group hover */}
        <button
          onClick={prev}
          className="absolute -left-12 w-9 h-9 rounded-full border border-[var(--color-border)] bg-white/80 backdrop-blur-sm flex items-center justify-center text-lg text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-sm z-10 [.group:hover_&]:opacity-100"
          style={{ transition: "opacity 0.2s, border-color 0.2s, color 0.2s" }}
          aria-label="Précédent"
        >
          ‹
        </button>

        {/* Phone mockup — même taille que PhoneLiveApp */}
        <div
          className="relative select-none"
          style={{ width: 272, height: 575 }}
        >
          <div
            className="absolute inset-0 rounded-[20px] shadow-2xl"
            style={{ background: "#111", border: "6px solid #111" }}
          />
          {/* Dynamic Island */}
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 72, height: 20, background: "#000", borderRadius: 12, zIndex: 10, pointerEvents: "none" }} />
          <div className="absolute inset-[6px] rounded-[14px] overflow-hidden bg-white">
            {screens.map((screen, i) => (
              <Image
                key={screen.src}
                src={screen.src}
                alt={screen.alt}
                fill
                className={[
                  "object-cover transition-opacity duration-500",
                  i === active ? "opacity-100" : "opacity-0 pointer-events-none",
                ].join(" ")}
                sizes="260px"
                priority={i === 0}
              />
            ))}
          </div>

          {/* Click zones — left/right halves to navigate without visible buttons */}
          <button
            onClick={prev}
            className="absolute inset-y-0 left-0 w-1/2 z-10 opacity-0"
            aria-label="Précédent"
            tabIndex={-1}
          />
          <button
            onClick={next}
            className="absolute inset-y-0 right-0 w-1/2 z-10 opacity-0"
            aria-label="Suivant"
            tabIndex={-1}
          />
        </div>

        {/* Next — absolute, fades in on group hover */}
        <button
          onClick={next}
          className="absolute -right-12 w-9 h-9 rounded-full border border-[var(--color-border)] bg-white/80 backdrop-blur-sm flex items-center justify-center text-lg text-[var(--color-muted)] opacity-0 hover:!opacity-100 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-sm z-10 [.group:hover_&]:opacity-100"
          style={{ transition: "opacity 0.2s, border-color 0.2s, color 0.2s" }}
          aria-label="Suivant"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 items-center">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width:      i === active ? 24 : 8,
              height:     8,
              background: i === active ? accentColor : "var(--color-border)",
            }}
            aria-label={`Écran ${i + 1}`}
          />
        ))}
      </div>

      {/* Caption */}
      <p className="text-sm text-[var(--color-muted)] text-center max-w-xs">{screens[active].alt}</p>
    </div>
  );
}
