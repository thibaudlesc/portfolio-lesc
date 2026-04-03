import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/Label";
import { Reveal } from "@/components/ui/Reveal";

const SKILLS = [
  { category: "Front-End",  items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { category: "Mobile",     items: ["Flutter", "Dart", "Capacitor", "PWA"] },
  { category: "Bas niveau", items: ["WebGPU", "WASM", "Node.js", "Python"] },
  { category: "Outils",     items: ["Git", "Vercel", "Figma", "Firebase"] },
];

export function AboutSection() {
  return (
    <section id="about" className="py-32 px-6 max-w-6xl mx-auto w-full">
      <Reveal>
        <Label index="001">À propos</Label>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Bio */}
        <div>
          <Reveal delay={100}>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-6">
              Je construis des interfaces
              <br />
              <span style={{ color: "var(--color-accent)" }}>qui font la différence.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[var(--color-muted)] leading-relaxed mb-4">
              Développeur Junior passionné par la frontière entre design et ingénierie.
              Je combine des technologies modernes — WebGPU, TypeScript, Flutter — pour créer
              des expériences web et mobile performantes et mémorables.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Actuellement en formation MMI, j'ai déjà livré deux applications en production
              utilisées par de vrais utilisateurs — et je cherche une équipe ambitieuse
              pour aller plus loin.
            </p>
          </Reveal>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 gap-4">
          {SKILLS.map(({ category, items }, i) => (
            <Reveal key={category} delay={([0, 100, 200, 300] as const)[i] ?? 300}>
              <GlassCard className="p-6">
                <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-[0.3em] uppercase mb-3">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="font-mono text-xs text-[var(--color-text)] px-2.5 py-1 rounded-md"
                      style={{ background: "oklch(100% 0 0 / 5%)" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
