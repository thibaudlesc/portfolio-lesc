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
    <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto w-full min-h-screen">
      {/* Back */}
      <Link href="/blog" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors tracking-widest mb-12 inline-block">
        ← articles
      </Link>

      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em]">
            {new Date(post.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span className="font-mono text-[10px] text-[var(--color-muted)]">{post.readingTime} min</span>
        </div>
        <h1 className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-[var(--color-muted)] leading-relaxed">{post.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map((t) => (
            <span key={t} className="glass font-mono text-[10px] text-[var(--color-muted)] px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </header>

      {/* Content */}
      <article className="space-y-6">
        {post.content.map((section, i) => {
          if (section.type === "h2") {
            return (
              <h2 key={i} className="font-mono text-xl font-bold text-[var(--color-text)] mt-10 mb-2">
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
              <blockquote key={i} className="border-l-2 pl-6 py-1" style={{ borderColor: "var(--color-accent)" }}>
                <p className="font-mono text-sm italic text-[var(--color-text)] leading-relaxed">
                  "{section.content}"
                </p>
              </blockquote>
            );
          }
          if (section.type === "code") {
            return (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
                  <div className="flex gap-1.5">
                    {["#ff5f57","#febc2e","#28c840"].map((c) => (
                      <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest uppercase">{section.lang}</span>
                </div>
                <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                  <code className="font-mono text-[var(--color-text)]">{section.content}</code>
                </pre>
              </div>
            );
          }
          return null;
        })}
      </article>

      {/* Footer nav */}
      <div className="mt-16 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
        <Link href="/blog" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
          ← tous les articles
        </Link>
        <Link href="/projects/recoltiq" className="font-mono text-xs text-[var(--color-accent)] hover:opacity-70 transition-opacity">
          voir le projet →
        </Link>
      </div>
    </main>
  );
}
