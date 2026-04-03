#!/usr/bin/env node
import * as p from '@clack/prompts';
import { writeFileSync } from 'fs';
import pc from 'picocolors';

p.intro(pc.bgMagenta(pc.black(' ✦ PORTFOLIO INIT — Creative Developer Setup ')));

const config = await p.group(
  {
    name: () =>
      p.text({
        message: 'Ton nom complet (affiché dans le hero)',
        placeholder: 'Thibaud Lescroart',
        validate: (v) => (!v ? 'Requis.' : undefined),
      }),

    role: () =>
      p.text({
        message: 'Ta ligne de titre (tagline)',
        placeholder: 'Creative Developer & Tech Lead',
        validate: (v) => (!v ? 'Requis.' : undefined),
      }),

    theme: () =>
      p.select({
        message: 'Direction artistique',
        options: [
          { value: 'dark-depth',    label: '🌑  Dark UI profond',          hint: 'noir, accents néon, blur layers' },
          { value: 'glass',         label: '🪟  Glassmorphism',            hint: 'transparences, reflets, grain' },
          { value: 'brutalism',     label: '⬛  Brutalisme typographique', hint: 'contraste brutal, grids exposées' },
          { value: 'editorial',     label: '📰  Editorial minimaliste',    hint: 'whitespace, serif, micro-details' },
          { value: 'void',          label: '🕳️  Void / Space',             hint: 'fond total noir, matière lumineuse' },
        ],
      }),

    accent: () =>
      p.select({
        message: 'Palette d\'accent',
        options: [
          { value: '#00ff88', label: '💚  Vert cyber (#00ff88)' },
          { value: '#ff3cac', label: '💗  Magenta (#ff3cac)' },
          { value: '#00d2ff', label: '🩵  Cyan glacé (#00d2ff)' },
          { value: '#f7c59f', label: '🍑  Pêche chaud (#f7c59f)' },
          { value: '#a855f7', label: '💜  Violet électrique (#a855f7)' },
          { value: 'custom',  label: '🎨  Personnalisé…' },
        ],
      }),

    accentCustom: ({ results }) =>
      results.accent === 'custom'
        ? p.text({ message: 'Couleur hex (#rrggbb)', validate: (v) => (/^#[0-9a-fA-F]{6}$/.test(v) ? undefined : 'Format invalide') })
        : undefined,

    renderer: () =>
      p.select({
        message: 'Effet 3D / GPU principal',
        options: [
          { value: 'particles-webgpu', label: '✦  Champ de particules WebGPU (compute shaders)',       hint: 'TSL + WebGPURenderer Three.js' },
          { value: 'liquid-distortion', label: '💧  Distorsion liquide d\'images',                    hint: 'GLSL displacement map + GPGPU' },
          { value: 'msdf-type',         label: '𝐀  Typographie 3D MSDF',                             hint: 'glyphs extrudés, three-msdf-text' },
          { value: 'fluid-sim',         label: '🌊  Simulation de fluide (Navier-Stokes)',            hint: 'WebGPU compute, ping-pong buffers' },
          { value: 'ascii-postfx',      label: '░▒  ASCII post-processing',                          hint: 'render target → ASCII en fragment shader' },
        ],
      }),

    projectOrga: () =>
      p.select({
        message: 'Organisation des projets',
        options: [
          { value: 'impact',    label: '🏆  Par impact technique',      hint: 'featured → showcase → explorations' },
          { value: 'timeline',  label: '📅  Timeline 3D interactive',   hint: 'scroll horizontal, années comme axis' },
          { value: 'stack',     label: '🧱  Par stack technologique',   hint: 'WebGPU, React, Node…' },
          { value: 'case',      label: '📋  Case studies éditoriaux',   hint: 'récits détaillés, before/after' },
        ],
      }),

    stack: () =>
      p.multiselect({
        message: 'Skills à mettre en avant (multi-select avec espace)',
        options: [
          { value: 'nextjs',      label: 'Next.js',        hint: 'App Router, RSC, PPR' },
          { value: 'svelte5',     label: 'Svelte 5',       hint: 'Runes, SSR' },
          { value: 'typescript',  label: 'TypeScript' },
          { value: 'gsap',        label: 'GSAP',           hint: 'ScrollTrigger, Flip, MorphSVG' },
          { value: 'webgpu',      label: 'WebGPU + TSL',   hint: 'compute shaders, Three.js WebGPURenderer' },
          { value: 'threejs',     label: 'Three.js',       hint: 'r3f, TSL shaders' },
          { value: 'tailwind',    label: 'Tailwind CSS' },
          { value: 'react',       label: 'React',          hint: 'hooks, context, Suspense' },
          { value: 'node',        label: 'Node.js' },
          { value: 'wasm',        label: 'WebAssembly' },
        ],
        required: true,
      }),

    typography: () =>
      p.select({
        message: 'Typographie principale',
        options: [
          { value: 'geist',      label: 'Geist (Vercel)',         hint: 'moderne, technique, sans-serif' },
          { value: 'pp-neue',    label: 'PP Neue Montreal',       hint: 'grotesk, clean, premium' },
          { value: 'editorial',  label: 'Playfair + Inter',       hint: 'contraste serif/sans' },
          { value: 'mono-hero',  label: 'Hero en monospace',      hint: 'JetBrains Mono large, Geist Mono' },
          { value: 'custom',     label: 'Fontes perso (j\'ai mes fichiers)' },
        ],
      }),

    sections: () =>
      p.multiselect({
        message: 'Sections du portfolio',
        options: [
          { value: 'hero',      label: 'Hero (effet GPU)',         selected: true },
          { value: 'about',     label: 'À propos / skills',        selected: true },
          { value: 'projects',  label: 'Projets',                  selected: true },
          { value: 'lab',       label: 'Lab / Expérimentations',   selected: false },
          { value: 'blog',      label: 'Blog / Articles',          selected: false },
          { value: 'contact',   label: 'Contact',                  selected: true },
        ],
      }),

    framework: () =>
      p.select({
        message: 'Framework de base',
        options: [
          { value: 'nextjs',  label: 'Next.js 15 (App Router)',   hint: 'recommandé — SSR, Vercel-optimisé' },
          { value: 'astro',   label: 'Astro 5',                   hint: 'islands, ultra-léger, idéal portfolio' },
          { value: 'vite',    label: 'Vite + React',              hint: 'SPA pure, contrôle total' },
        ],
      }),
  },
  {
    onCancel: () => {
      p.cancel('Initialisation annulée.');
      process.exit(0);
    },
  }
);

// Résoudre la couleur finale
const accentColor = config.accentCustom ?? config.accent;

const result = {
  meta: {
    name: config.name,
    role: config.role,
  },
  design: {
    theme: config.theme,
    accentColor,
    typography: config.typography,
  },
  tech: {
    framework: config.framework,
    renderer: config.renderer,
    stack: config.stack,
  },
  content: {
    projectOrga: config.projectOrga,
    sections: config.sections,
  },
};

writeFileSync('portfolio.config.json', JSON.stringify(result, null, 2));

p.note(
  [
    `Thème         : ${result.design.theme}`,
    `Accent        : ${accentColor}`,
    `GPU / 3D      : ${result.tech.renderer}`,
    `Framework     : ${result.tech.framework}`,
    `Projets       : ${result.content.projectOrga}`,
    `Sections      : ${result.content.sections.join(', ')}`,
    `Stack         : ${result.tech.stack.join(', ')}`,
  ].join('\n'),
  '✦ Config enregistrée dans portfolio.config.json'
);

p.outro(pc.green('Lance maintenant : node scaffold.mjs pour générer l\'architecture du projet.'));
