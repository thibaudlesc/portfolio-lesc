import type { Project } from "@/types";

export const projects: Project[] = [
  // ── TERMINÉS ──────────────────────────────────────────────────────────────

  {
    slug:       "recoltiq",
    title:      "Récolt'IQ",
    tagline:    "Né du terrain — une app pour les agriculteurs, par quelqu'un qui connaît le métier",
    year:       2025,
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
        "Élevé dans le monde agricole, j'ai vu les agriculteurs gérer la moisson avec des carnets papier, des feuilles volantes et des tableurs illisibles. Impossible de savoir en temps réel combien il reste à vendre, sur quelle parcelle, pour quelle culture.",
      approach:
        "J'ai conçu l'architecture de données autour du flux réel d'une moisson : pesées en temps réel, plusieurs camions par parcelle, stock partagé entre exploitations. PWA JavaScript + Capacitor pour une distribution iOS/Android sans friction — offline-first pour les zones rurales.",
      outcome:
        "Application sur l'App Store, utilisée par de vrais agriculteurs en exploitation. Premier projet dev mené seul, de l'idée à la mise en ligne.",
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
    tagline:    "Produit phare de campagne — une app pour unir toute la promo MMI",
    year:       2026,
    role:       ["Développeur iOS", "Lead Dev"],
    stack:      ["Flutter", "Dart", "Firebase"],
    impact:     "Produit phare de la campagne BDE, ~150 étudiants",
    coverImage: "/images/projects/bde-mmi/1.jpg",
    featured:   true,
    status:     "live",
    links: {
      appStore: "https://apps.apple.com/fr/app/bde-mmi/id6760981399",
    },
    caseStudy: {
      problem:
        "Avec mon groupe, on voulait faire une campagne BDE qui marque vraiment. Après beaucoup de brainstorming, on a eu l'idée : une app pour relier tous les MMI, avec plusieurs mini-apps pour créer du lien entre les étudiants — pas juste un compte Instagram de plus.",
      approach:
        "J'ai développé l'app seul en Flutter + Firebase : feed social, boutique, calendrier des événements et carte de membre digitale avec fidélité. L'app est le produit phare de notre programme électoral — concrète, utilisable dès maintenant.",
      outcome:
        "L'app tourne sur l'App Store et est déjà téléchargée par la promo. Quand on sera élus, je la finalise avec les modules manquants. Développée seul de A à Z, en parallèle des cours.",
      sections: [
        { type: "image",  content: { src: "/images/projects/bde-mmi/C1.png", alt: "BDE MMI — Feed social", caption: "Feed social — posts, événements, actualités BDE en temps réel" } },
        { type: "metric", content: { label: "Modules", value: "5", delta: "Feed · Boutique · Calendrier · Espace · Profil" } },
        { type: "metric", content: { label: "Développement", value: "Solo", delta: "code intégral Flutter + Firebase" } },
        { type: "metric", content: { label: "Distribution", value: "App Store", delta: "iOS + Android Flutter" } },
        { type: "image",  content: { src: "/images/projects/bde-mmi/C3.png", alt: "BDE MMI — Boutique", caption: "Boutique — goodies, billets soirées, boissons" } },
        { type: "image",  content: { src: "/images/projects/bde-mmi/C4.png", alt: "BDE MMI — Espace MMI", caption: "Espace MMI — services BDE, prêt matériel, bons plans" } },
        { type: "image",  content: { src: "/images/projects/bde-mmi/C5.png", alt: "BDE MMI — Profil", caption: "Profil avec carte de membre et points de fidélité" } },
      ],
    },
  },

  {
    slug:       "musee-ba-bordeaux",
    title:      "MusBA Bordeaux",
    tagline:    "Site vitrine du Musée des Beaux-Arts — projet de groupe MMI",
    year:       2025,
    role:       ["Développeur Web", "Intégrateur"],
    stack:      ["HTML", "CSS", "JavaScript"],
    impact:     "Projet groupe MMI, en ligne sur Netlify",
    coverImage: "/images/projects/musba/cover.jpg",
    featured:   true,
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
    year:       2023,
    role:       ["Développeur", "Algorithmique"],
    stack:      ["Python", "Algorithmes", "ML"],
    impact:     "Exploration des algorithmes de décision",
    coverImage: "/images/projects/ia2048.png",
    featured:   true,
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
    year:       2023,
    role:       ["Data Analyst"],
    stack:      ["Python", "Pandas", "Matplotlib"],
    impact:     "Chaîne data complète from scratch",
    coverImage: "/images/projects/graphique.png",
    featured:   true,
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

  {
    slug:       "lbc-alert",
    title:      "Bot de veille LeBonCoin",
    tagline:    "Scraper + Gemini IA — détecte les composants PC sous-cotés en temps réel",
    year:       2025,
    role:       ["Développeur Full-Stack", "Automatisation"],
    stack:      ["Node.js", "Playwright", "Gemini AI", "Firebase", "Telegram"],
    impact:     "Alertes automatiques, analyse IA multimodale",
    coverImage: "/images/projects/lbc-alert/cover.svg",
    featured:   true,
    status:     "done",
    links:      { github: "https://github.com/thibaudlesc" },
    caseStudy: {
      problem:
        "Passionné de hardware, je voulais trouver les bonnes affaires PC sur LeBonCoin avant tout le monde — mais surveiller des centaines d'annonces par jour à la main, c'est impossible.",
      approach:
        "Scraper furtif (Playwright stealth + rotation de proxies) couplé à Gemini 1.5 Flash multimodal : il lit le texte ET les photos de chaque annonce, identifie les composants, calcule la marge de revente et alerte sur Telegram dès qu'il trouve une pépite (marge > 50%).",
      outcome:
        "Alertes Telegram en moins de 5 secondes après publication, circuit breaker anti-CAPTCHA automatique. Un projet pour moi, mais qui m'a appris à orchestrer scraping, IA multimodale et temps réel.",
      sections: [
        { type: "image", content: { src: "/images/projects/lbc-alert/cover.svg", alt: "ShadowDeal — terminal actif", caption: "Bot actif — analyse en cours, pépite détectée" } },
        { type: "text",  content: "Le vrai défi : rester invisible. LeBonCoin détecte et bloque les bots en quelques secondes. J'ai implémenté un mode stealth complet avec Playwright, simulation de comportement humain (mouvements souris, délais aléatoires) et un circuit breaker qui s'arrête automatiquement dès qu'un CAPTCHA est détecté." },
        { type: "metric", content: { label: "Analyse", value: "IA", delta: "Gemini 1.5 Flash multimodal" } },
        { type: "metric", content: { label: "Détection", value: "<5s", delta: "de la publication à l'alerte" } },
        { type: "metric", content: { label: "Stack", value: "5", delta: "Node.js · Playwright · Gemini · Firebase · Telegram" } },
      ],
    },
  },

  {
    slug:       "clip-bde",
    title:      "Clip BDE MMI",
    tagline:    "Motion design & réalisation — le clip officiel du BDE Montaigne",
    year:       2026,
    role:       ["Réalisateur", "Motion Designer"],
    stack:      ["Premiere Pro", "After Effects", "Motion Design"],
    impact:     "Clip officiel BDE MMI, diffusé à toute la promo",
    coverImage: "/images/projects/clip-bde/cover.jpg",
    featured:   true,
    status:     "done",
    links:      { live: "https://soundcloud.com/ethan-brunet-389404178/le-bde-de-tout-le-monde" },
    caseStudy: {
      problem:  "Le BDE avait besoin d'un clip de campagne mémorable pour se présenter à toute la promo MMI et marquer les esprits.",
      approach: "Réalisation complète : tournage, montage Premiere Pro, habillage motion design After Effects, synchronisation musicale.",
      outcome:  "Clip diffusé à toute la promotion MMI Montaigne, utilisé comme support de campagne électorale.",
      sections: [
        { type: "image", content: { src: "/images/projects/clip-bde/cover.svg", alt: "Clip BDE MMI", caption: "Motion design — Premiere Pro + After Effects" } },
        { type: "text",  content: "Un projet qui m'a permis de maîtriser la chaîne complète de production vidéo : de la captation au export final, en passant par le montage rythmé et les animations d'habillage." },
        { type: "metric", content: { label: "Durée", value: "3 min", delta: "Clip complet + générique" } },
        { type: "metric", content: { label: "Diffusion", value: "Promo", delta: "MMI Montaigne entière" } },
      ],
    },
  },

  {
    slug:       "strat-com",
    title:      "Campagne BDE Instagram",
    tagline:    "23 visuels, une identité, une promo à convaincre — la com' derrière l'app",
    year:       2026,
    role:       ["Stratège com", "Créateur de contenu"],
    stack:      ["Instagram", "Photoshop", "Canva", "Content Strategy"],
    impact:     "23 posts de campagne, identité visuelle cohérente",
    coverImage: "/images/projects/bde-mmi/campaign/post222_01.jpg",
    featured:   true,
    status:     "done",
    links:      { live: "https://www.instagram.com/bdedetoutlemonde/?hl=fr" },
    caseStudy: {
      problem:  "Une bonne app ne suffit pas — il fallait aussi créer le désir autour. Pour convaincre ~150 étudiants, on avait besoin d'une identité visuelle forte, d'un compte Instagram cohérent et d'un rythme de publication soutenu jusqu'au jour du vote.",
      approach: "Travail d'équipe : construction de l'identité @bdedetoutlemonde, palette, ton éditorial. J'ai participé à la création des visuels — annonces, révélations de modules, portraits de l'équipe, compte à rebours. Chaque post renforçait l'app comme produit phare de la campagne.",
      outcome:  "Compte actif avec une communauté engagée avant le vote. Com' et app se renforçaient mutuellement — l'une donnait envie de télécharger l'autre.",
      sections: [
        { type: "text",  content: "La com' digitale, c'est autant de la stratégie que de la créa. J'ai défini les piliers de contenu, le ton éditorial et le rythme de publication pour maximiser l'engagement. Chaque post avait un rôle dans le tunnel : découverte → intérêt → téléchargement." },
        { type: "metric", content: { label: "Posts créés", value: "23", delta: "@bdedetoutlemonde" } },
        { type: "metric", content: { label: "Cible", value: "~150", delta: "étudiants MMI Montaigne" } },
        { type: "metric", content: { label: "Produit phare", value: "App BDE", delta: "Flutter + Firebase" } },
      ],
    },
  },

  // ── EN COURS ──────────────────────────────────────────────────────────────

  {
    slug:       "mood-app",
    title:      "Application Mood",
    tagline:    "App pour le média Mood — UX, mobile, cohérence Instagram",
    year:       2026,
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
    year:       2026,
    role:       ["Développeur Web"],
    stack:      ["Web", "Firebase", "HTML/CSS"],
    impact:     "Vitrine association en ligne",
    coverImage: "/images/projects/bde-iq-cover.png",
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
