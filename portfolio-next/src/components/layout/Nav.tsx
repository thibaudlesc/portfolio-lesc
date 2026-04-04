"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primaryLinks = [
  { href: "/projects",  label: "Projets" },
  { href: "/creative",  label: "Créations" },
  { href: "/about",     label: "À propos" },
  { href: "/contact",   label: "Contact" },
];

const secondaryLinks = [
  { href: "/lab",  label: "Lab" },
  { href: "/blog", label: "Blog" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="vt-nav fixed top-0 inset-x-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">
          Thibaud<span className="text-[var(--color-accent)]">.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {primaryLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "text-sm font-medium px-3 py-1.5 rounded-full transition-colors",
                pathname === href
                  ? "text-[var(--color-accent)] bg-[var(--color-accent-light)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-warm)]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
          <span className="w-px h-4 bg-[var(--color-border)] mx-2" />
          {secondaryLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors",
                pathname === href
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)]/70 hover:text-[var(--color-muted)]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="mailto:Thibaud.lesc@gmail.com"
          className="hidden md:inline-flex items-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Me contacter
        </a>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-[var(--color-warm)] transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span className={`block w-5 h-0.5 bg-[var(--color-text)] transition-all duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[var(--color-text)] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[var(--color-text)] transition-all duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4 flex flex-col gap-1">
          {[...primaryLinks, ...secondaryLinks].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={[
                "text-base font-medium py-2 transition-colors",
                pathname === href ? "text-[var(--color-accent)]" : "text-[var(--color-text)] hover:text-[var(--color-accent)]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
            <a href="mailto:Thibaud.lesc@gmail.com" className="text-sm text-[var(--color-accent)] font-semibold">
              Thibaud.lesc@gmail.com
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
