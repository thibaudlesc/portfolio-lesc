import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "@/data/blog";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <main>
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-8">
            ← Retour au blog
          </Link>

          <div className="flex items-center gap-3 mb-4 text-sm text-[var(--color-muted)]">
            <span>{new Date(post.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span>·</span>
            <span>{post.readingTime} min de lecture</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            {post.title}
          </h1>
          <p className="text-lg text-[var(--color-muted)] leading-relaxed mb-6">{post.description}</p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="text-xs bg-[var(--color-warm)] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <article className="space-y-6">
            {post.content.map((section, i) => {
              if (section.type === "h2") {
                return (
                  <h2 key={i} className="text-xl font-bold text-[var(--color-text)] mt-10 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                    {section.content}
                  </h2>
                );
              }
              if (section.type === "p") {
                return (
                  <p key={i} className="text-[var(--color-muted)] leading-relaxed text-base">
                    {section.content}
                  </p>
                );
              }
              if (section.type === "quote") {
                return (
                  <blockquote key={i} className="border-l-4 border-[var(--color-accent)] pl-6 py-1 bg-[var(--color-accent-light)] rounded-r-xl">
                    <p className="text-sm italic text-[var(--color-text)] leading-relaxed">
                      &ldquo;{section.content}&rdquo;
                    </p>
                  </blockquote>
                );
              }
              if (section.type === "code") {
                return (
                  <div key={i} className="card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-warm)]">
                      <div className="flex gap-1.5">
                        {["#ff5f57","#febc2e","#28c840"].map((c) => (
                          <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="text-xs text-[var(--color-muted)] uppercase tracking-widest">{section.lang}</span>
                    </div>
                    <pre className="overflow-x-auto p-6 text-sm leading-relaxed bg-[var(--color-surface)]">
                      <code className="font-mono text-[var(--color-text)]">{section.content}</code>
                    </pre>
                  </div>
                );
              }
              return null;
            })}
          </article>

          <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
            <Link href="/blog" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors font-semibold">
              ← Tous les articles
            </Link>
            <Link href="/projects/recoltiq" className="text-sm font-semibold text-[var(--color-accent)] hover:opacity-70 transition-opacity">
              Voir le projet →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
