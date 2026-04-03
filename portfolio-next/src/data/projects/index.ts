import type { Project } from "@/types";

export const projects: Project[] = [
  // ── TERMINÉS ──────────────────────────────────────────────────────────────

  {
    slug:       "recoltiq",
    title:      "Récolt'IQ",
    tagline:    "Carnet de plaine numérique — utilisé par de vrais agriculteurs",
    year:       2024,
    role:       ["Développeur Full-Stack", "Product Owner"],
    stack:      ["JavaScript", "PWA", "Capacitor"],
    impact:     "Déployé en production, utilisateurs réels",
    coverImage: "/images/projects/recoltiq/C1.png",
    featured:   true,
    status:     "live",
    links: {
      live:     "https://recolt-iq.fr",
      appStore: "https://apps.apple.com/fr/app/recoltiq/id6740539829",
    },
    caseStudy: {
      problem:
        "Les agriculteurs gèrent leurs récoltes avec des carnets papier illisibles, des feuilles volantes et des tableurs complexes pendant la moisson — sans vue centralisée, sans calcul de marge, sans collaboration.",
      approach:
        "PWA JavaScript + Capacitor pour une distribution iOS/Android sans friction. Architecture offline-first avec synchronisation automatique, pensée pour les zones rurales à faible connectivité.",
      outcome:
        "Application déployée sur l'App Store, utilisée par de vrais agriculteurs en exploitation. Premier projet dev mené de la conception au déploiement.",
      sections: [
        { type: "image",  content: { src: "/images/projects/recoltiq/C1.png",  alt: "Récolt'IQ — Mes Parcelles",          caption: "Suivi parcelle par parcelle — poids, surface, culture" } },
        { type: "text",   content: "Le vrai défi n'était pas technique — c'était de comprendre le métier. J'ai conçu l'architecture de données autour du flux réel d'une moisson : pesées en temps réel, plusieurs camions par parcelle, stockage partagé entre exploitations." },
        { type: "metric", content: { label: "Distribution", value: "iOS", delta: "App Store + PWA" } },
        { type: "metric", content: { label: "Connectivité", value: "Offline", delta: "sync automatique" } },
        { type: "metric", content: { label: "Écrans app", value: "10+", delta: "workflow complet" } },
        { type: "image",  content: { src: "/images/projects/recoltiq/C2.png",  alt: "Récolt'IQ — stock temps réel",       caption: "Stock restant par culture — mis à jour en temps réel" } },
        { type: "split",  left: "Avant : carnets papier, tableurs Excel, impossible de savoir combien il reste à vendre.", right: "Après : dashboard centralisé, stock temps réel, export Excel auto, partage sécurisé." },
      ],
    },
  },

  {
    slug:       "bde-mmi",
    title:      "App BDE MMI",
    tagline:    "Réseau social + boutique — l'app qui relie toute la promo MMI",
    year:       2024,
    role:       ["Développeur iOS", "Lead Dev"],
    stack:      ["Flutter", "Dart", "Firebase"],
    impact:     "App communautaire toute la promo",
    coverImage: "/images/projects/bde-mmi/1.jpg",
    featured:   true,
    status:     "live",
    links: {
      appStore: "https://apps.apple.com/fr/app/bde-mmi/id6760981399",
    },
    caseStudy: {
      problem:
        "La promo MMI n'avait pas d'espace numérique commun — les événements se perdaient dans les groupes WhatsApp, la boutique BDE n'existait que physiquement.",
      approach:
        "Application Flutter + Firebase développée seul côté code, avec accompagnement créa pour le design. Feed social, boutique, calendrier, programme, profil.",
      outcome:
        "Application distribuée sur l'App Store, adoptée par toute la promotion comme espace numérique officiel du BDE MMI Montaigne.",
      sections: [
        { type: "image",  content: { src: "/images/projects/bde-mmi/1.jpg",  alt: "BDE MMI — feed social", caption: "Feed social — posts, événements, actualités BDE" } },
        { type: "metric", content: { label: "Modules", value: "5", delta: "Feed · Boutique · Calendrier · Programme · Profil" } },
        { type: "metric", content: { label: "Développement", value: "Solo", delta: "code intégral" } },
        { type: "metric", content: { label: "Distribution", value: "App Store", delta: "iOS natif Flutter" } },
        { type: "image",  content: { src: "/images/projects/bde-mmi/2.jpg",  alt: "BDE MMI — boutique", caption: "Boutique — goodies, vêtements, accès soirées" } },
      ],
    },
  },

  {
    slug:       "musee-ba-bordeaux",
    title:      "MusBA Bordeaux",
    tagline:    "Site vitrine du Musée des Beaux-Arts — projet de groupe MMI",
    year:       2024,
    role:       ["Développeur Web", "Intégrateur"],
    stack:      ["HTML", "CSS", "JavaScript"],
    impact:     "Projet groupe MMI, en ligne sur Netlify",
    coverImage: "/images/projects/musba-cover.svg",
    featured:   false,
    status:     "live",
    links: {
      live: "https://projetmmimusbagrp4.netlify.app/",
    },
    caseStudy: {
      problem:  "Créer un site vitrine moderne pour le Musée des Beaux-Arts de Bordeaux dans le cadre d'un projet MMI de groupe.",
      approach: "HTML/CSS/JS vanilla, travail en équipe, intégration des sections expositions, collections, histoire et boutique.",
      outcome:  "Site déployé en ligne sur Netlify, projet abouti en conditions réelles de collaboration.",
      sections: [],
    },
  },

  {
    slug:       "ia-2048",
    title:      "IA pour 2048",
    tagline:    "Agent Python qui joue au 2048 — recherche et heuristiques",
    year:       2024,
    role:       ["Développeur", "Algorithmique"],
    stack:      ["Python", "Algorithmes", "ML"],
    impact:     "Exploration des algorithmes de décision",
    coverImage: "/images/projects/ia2048.png",
    featured:   false,
    status:     "done",
    links:      { github: "https://github.com/thibaudlesc/IA-2048" },
    caseStudy: {
      problem:  "Comprendre comment optimiser des décisions séquentielles sur une grille en construisant un agent autonome.",
      approach: "Recherche arborescente + heuristiques custom en Python — évaluation de la position, anticipation des coups.",
      outcome:  "Agent capable de jouer des parties complètes, exploration concrète de l'IA par la pratique.",
      sections: [
        { type: "image", content: { src: "/images/projects/ia2048.png", alt: "IA 2048 — résultats", caption: "Visualisation des parties jouées par l'agent" } },
      ],
    },
  },

  {
    slug:       "data-analyse",
    title:      "Analyse de Données",
    tagline:    "Pipeline complet : nettoyage, stats, visualisation en Python",
    year:       2024,
    role:       ["Data Analyst"],
    stack:      ["Python", "Pandas", "Matplotlib"],
    impact:     "Chaîne data complète from scratch",
    coverImage: "/images/projects/graphique.png",
    featured:   false,
    status:     "done",
    links:      {},
    caseStudy: {
      problem:  "Extraire des signaux lisibles à partir de jeux de données bruts — nettoyage, normalisation, visualisation.",
      approach: "Pipeline Python complet : ingestion → nettoyage (Pandas) → stats → visualisations (Matplotlib/Seaborn).",
      outcome:  "Maîtrise de la chaîne data complète, capacité à présenter des résultats analysables.",
      sections: [
        { type: "image", content: { src: "/images/projects/graphique.png", alt: "Graphique d'analyse de données", caption: "Visualisation de données — Python" } },
      ],
    },
  },

  // ── EN COURS ──────────────────────────────────────────────────────────────

  {
    slug:       "mood-app",
    title:      "Application Mood",
    tagline:    "App pour le média Mood — UX, mobile, cohérence Instagram",
    year:       2025,
    role:       ["UX Designer", "Développeur"],
    stack:      ["UX", "Mobile", "Figma"],
    impact:     "Réflexion produit en cours",
    coverImage: "/images/projects/mood-moodfr-cover.jpg",
    featured:   false,
    status:     "wip",
    links: {
      live: "https://www.instagram.com/moodfr__/",
    },
    caseStudy: {
      problem:  "Le média Mood existe sur Instagram mais n'a pas d'expérience mobile native cohérente avec son identité.",
      approach: "Réflexion UX sur la cible mobile, wireframes, cohérence avec la présence Instagram du média.",
      outcome:  "Projet en cours — phase de conception.",
      sections: [
        { type: "image", content: { src: "/images/projects/mood-moodfr-cover.jpg", alt: "Mood — cover du média", caption: "Média Mood — @moodfr__ sur Instagram" } },
      ],
    },
  },

  {
    slug:       "bde-iq",
    title:      "Site BDE IQ",
    tagline:    "Vitrine du BDE IQ hébergée sur Firebase",
    year:       2025,
    role:       ["Développeur Web"],
    stack:      ["Web", "Firebase", "HTML/CSS"],
    impact:     "Vitrine association en ligne",
    coverImage: "/images/projects/bde-iq-cover.jpg",
    featured:   false,
    status:     "wip",
    links: {
      live: "https://bde-iq.web.app/",
    },
    caseStudy: {
      problem:  "Le BDE IQ n'avait pas de présence web propre pour ses campagnes et événements.",
      approach: "Site vitrine hébergé sur Firebase Hosting, enrichi au fil des campagnes.",
      outcome:  "En cours d'enrichissement.",
      sections: [],
    },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const liveProjects     = projects.filter((p) => p.status === "live");
export const wipProjects      = projects.filter((p) => p.status === "wip");
export const doneProjects     = projects.filter((p) => p.status === "done");
