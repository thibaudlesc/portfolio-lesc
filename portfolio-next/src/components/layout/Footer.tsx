import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-warm)] mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
        <p className="text-sm text-[var(--color-muted)]">© 2026 Thibaud Lescroart</p>
        <nav className="flex items-center gap-6">
          {[
            { label: "Email",    href: "mailto:Thibaud.lesc@gmail.com" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/thibaud-lescroart-0a0741264/" },
            { label: "GitHub",   href: "https://github.com/thibaudlesc" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              {label}
            </a>
          ))}
          <a
            href="/documents/cv-thibaud-lescroart.pdf"
            target="_blank"
            className="text-sm font-semibold text-[var(--color-accent)] border border-[var(--color-accent)]/30 px-3 py-1 rounded-full hover:bg-[var(--color-accent-light)] transition-colors"
          >
            CV ↓
          </a>
        </nav>
      </div>
    </footer>
  );
}
