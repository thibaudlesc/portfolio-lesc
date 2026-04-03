/**
 * Home page
 *
 * ⛔ TODO [MSDF]: HeroSection utilise actuellement du texte CSS pur.
 *    Une fois public/fonts/[police].png + .json disponibles →
 *    intégrer src/components/three/MSDFText.tsx dans HeroSection.
 */
import { HeroSection }    from "@/components/sections/HeroSection";
import { AboutSection }   from "@/components/sections/AboutSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  );
}
