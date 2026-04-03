export interface Experiment {
  id:          string;
  title:       string;
  description: string;
  tags:        string[];
  year:        string;
  status:      "live" | "wip" | "archived";
  url?:        string;
  details:     string[];   // lignes affichées dans le terminal
}

export const experiments: Experiment[] = [
  {
    id:          "recoltiq",
    title:       "Récolt'IQ",
    description: "PWA de gestion agricole — offline-first, sync auto, partage d'exploitation",
    tags:        ["JavaScript", "PWA", "Capacitor"],
    year:        "2024",
    status:      "live",
    url:         "https://recolt-iq.fr",
    details: [
      "Architecture offline-first avec service worker custom",
      "Sync bidirectionnelle en arrière-plan (Background Sync API)",
      "Calcul de marges et export Excel côté client (SheetJS)",
      "Partage de parcelles avec ACL granulaires",
      "Distribution iOS via Capacitor + App Store",
    ],
  },
  {
    id:          "bde-mmi",
    title:       "BDE MMI",
    description: "App Flutter — réseau social + boutique + calendrier pour la promo MMI",
    tags:        ["Flutter", "Dart", "iOS", "Android"],
    year:        "2024",
    status:      "live",
    url:         "https://apps.apple.com/fr/app/bde-mmi/id6760981399",
    details: [
      "Application Flutter cross-platform iOS / Android",
      "Feed social, boutique, calendrier événements, programme",
      "Back-office admin pour publication de contenu sans code",
      "Dark mode natif, UI pensée pour une cible étudiante",
      "Déployé sur l'App Store — utilisé par toute la promo",
    ],
  },
  {
    id:          "py-auto",
    title:       "py-auto",
    description: "Scripts Python d'automatisation — scraping, traitement de données, bots",
    tags:        ["Python", "Automatisation", "CLI"],
    year:        "2024",
    status:      "wip",
    details: [
      "Scraping structuré avec BeautifulSoup + Selenium",
      "Pipeline de traitement CSV / JSON vers Excel (openpyxl)",
      "Bots Telegram pour notifications automatiques",
      "Planification via cron + logging structuré",
      "Modules réutilisables packagés en CLI argparse",
    ],
  },
  {
    id:          "sites",
    title:       "vitrine/*",
    description: "Sites vitrines et projets HTML/CSS/JS — terrains d'expérimentation UI",
    tags:        ["HTML", "CSS", "JavaScript", "Figma"],
    year:        "2023–2024",
    status:      "archived",
    details: [
      "Plusieurs sites vitrines livrés pour des clients locaux",
      "Animations CSS custom — transitions, hover states, scroll",
      "Intégration Figma → code pixel-perfect",
      "Déploiements Vercel + Firebase Hosting",
      "Base de la compréhension DOM / événements / fetch",
    ],
  },
];

export const COMMANDS = {
  help: [
    "  Commandes disponibles :",
    "  ls              — lister les expérimentations",
    "  run <id>        — inspecter une expérimentation",
    "  open <id>       — ouvrir le lien (si disponible)",
    "  clear           — vider le terminal",
    "  whoami          — qui est derrière ce terminal",
  ],
  whoami: [
    "  Thibaud Lescroart",
    "  Développeur Junior — React · TypeScript · Flutter · Python",
    "  Formation MMI — passionné par les interfaces et l'automatisation",
    "  mailto:Thibaud.lesc@gmail.com",
    "  linkedin.com/in/thibaud-lescroart-0a0741264",
    "  github.com/thibaudlesc",
    "  Open to work ✦",
  ],
};
