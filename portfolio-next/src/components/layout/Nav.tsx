"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#about",    label: "À propos" },
  { href: "/#projects", label: "Projets" },
  { href: "/lab",       label: "Lab" },
  { href: "/blog",      label: "Blog" },
  { href: "/contact",   label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="vt-nav fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <Link
        href="/"
        className="font-mono text-sm font-bold text-[var(--color-text)] tracking-tight hover:text-[var(--color-accent)] transition-colors"
      >
        TL<span className="text-[var(--color-accent)]">.</span>
      </Link>

      {/* Links */}
      <nav className="glass rounded-full px-6 py-2.5 hidden md:flex items-center gap-6">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={[
              "font-mono text-xs tracking-wider transition-colors",
              pathname === href
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* CTA */}
      <a
        href="mailto:Thibaud.lesc@gmail.com"
        className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors hidden md:block"
      >
        hire me↗
      </a>
    </header>
  );
}
