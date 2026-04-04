import Link from "next/link";
import { posts } from "@/data/blog";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <main>
      <section className="section" style={{ paddingTop: "5rem", paddingBottom: "3rem" }}>
        <div className="container">
          <RevealOnScroll>
            <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-widest mb-2">— Articles</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Blog</h1>
            <p className="text-[var(--color-muted)] max-w-xl leading-relaxed">
              Retours d'expérience, décisions techniques, apprentissages — ce que je n'aurais pas su écrire avant de l'avoir vécu.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="section section--warm">
        <div className="container">
          <div className="space-y-6">
            {posts.map((post, i) => (
              <RevealOnScroll key={post.slug} delay={i * 80}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="card block p-8 group hover:border-[var(--color-accent)] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-[var(--color-muted)]">
                          {new Date(post.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                        </span>
                        <span className="text-sm text-[var(--color-muted)]">·</span>
                        <span className="text-sm text-[var(--color-muted)]">{post.readingTime} min de lecture</span>
                      </div>
                      <h2 className="text-xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        {post.title}
                      </h2>
                      <p className="text-[var(--color-muted)] text-sm leading-relaxed line-clamp-2 mb-4">
                        {post.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((t) => (
                          <span key={t} className="text-xs bg-[var(--color-warm)] text-[var(--color-muted)] px-2.5 py-1 rounded-full border border-[var(--color-border)]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-2xl text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all shrink-0">→</span>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
