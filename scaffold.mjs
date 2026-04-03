#!/usr/bin/env node
/**
 * Lit portfolio.config.json et génère le projet Next.js (sous-dossier).
 * Ne lance pas ce fichier dans zsh en collant son contenu — exécute : node scaffold.mjs
 */
import { readFileSync, existsSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, 'portfolio.config.json');
const APP_DIR = 'portfolio-next';

if (!existsSync(CONFIG_PATH)) {
  console.error('Fichier portfolio.config.json introuvable. Lance d’abord : node init-portfolio.mjs');
  process.exit(1);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const framework = config.tech?.framework;

if (framework !== 'nextjs') {
  console.error(
    `scaffold.mjs ne gère pour l’instant que tech.framework === "nextjs" (reçu : ${JSON.stringify(framework)}).`
  );
  process.exit(1);
}

const appPath = join(ROOT, APP_DIR);
if (existsSync(appPath)) {
  console.error(
    `Le dossier "${APP_DIR}" existe déjà.\n` +
      `  Supprime-le puis relance : rm -rf ${APP_DIR}\n` +
      `  (ou renomme APP_DIR dans scaffold.mjs)`
  );
  process.exit(1);
}

console.log('→ Création du projet Next.js (TypeScript, Tailwind, App Router)…\n');

execSync(
  [
    'npx',
    '--yes',
    'create-next-app@latest',
    APP_DIR,
    '--typescript',
    '--tailwind',
    '--eslint',
    '--app',
    '--src-dir',
    '--import-alias',
    '@/*',
    '--use-npm',
    '--yes',
    '--disable-git',
  ].join(' '),
  { stdio: 'inherit', cwd: ROOT, env: process.env }
);

copyFileSync(CONFIG_PATH, join(appPath, 'portfolio.config.json'));

const libDir = join(appPath, 'src', 'lib');
mkdirSync(libDir, { recursive: true });

const accent = config.design?.accentColor ?? '#f7c59f';
const ts = `/** Généré par scaffold.mjs — copie typée de portfolio.config.json */
export const portfolioConfig = ${JSON.stringify(config, null, 2)} as const;

export const accentColor = "${accent}" as const;
`;

writeFileSync(join(libDir, 'portfolio-config.ts'), ts);

console.log(`
✓ Terminé.

  Dossier : ./${APP_DIR}/
  Config copiée : ${APP_DIR}/portfolio.config.json
  Types      : ${APP_DIR}/src/lib/portfolio-config.ts

  Ensuite :
    cd ${APP_DIR}
    npm run dev
`);
