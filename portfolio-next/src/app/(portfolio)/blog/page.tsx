import Link from "next/link";
import { posts } from "@/data/blog";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto w-full min-h-screen">
      <Reveal><Label index="BLOG">Articles</Label></Reveal>

      <Reveal delay={100}>
        <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-16 max-w-lg">
          Retours d'expérience, décisions techniques, apprentissages — ce que je n'aurais pas su écrire avant de l'avoir vécu.
        </p>
      </Reveal>

      <div className="space-y-4">
        {posts.map((post, i) => (
          <Reveal key={post.slug} delay={([0, 100] as const)[i % 2]}>
            <Link
              href={`/blog/${post.slug}`}
              className="glass rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-[var(--color-accent)] transition-all duration-300 block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em]">
                    {new Date(post.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">
                    {post.readingTime} min de lecture
                  </span>
                </div>
                <h2 className="font-mono text-xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors duration-300 leading-snug">
                  {post.title}
                </h2>
                <p className="text-[var(--color-muted)] text-sm mt-2 line-clamp-2 leading-relaxed">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map((t) => (
                    <span key={t} className="font-mono text-[10px] text-[var(--color-muted)] px-2 py-0.5 rounded-md" style={{ background: "oklch(100% 0 0 / 4%)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="font-mono text-lg text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all duration-300 shrink-0">→</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
