export interface Post {
  slug:        string;
  title:       string;
  description: string;
  date:        string;
  tags:        string[];
  readingTime: number;
  content:     Section[];
}

export interface Section {
  type:    "h2" | "p" | "code" | "quote" | "img";
  content: string;
  lang?:   string;
  caption?: string;
}

export const posts: Post[] = [
  {
    slug:        "comment-jai-construit-recoltiq",
    title:       "Comment j'ai construit Récolt'IQ de zéro",
    description: "De l'idée au déploiement App Store — ce que j'ai appris en construisant ma première vraie application utilisée par de vrais agriculteurs.",
    date:        "2024-12-01",
    tags:        ["PWA", "Capacitor", "Product", "Retour d'expérience"],
    readingTime: 6,
    content: [
      {
        type:    "p",
        content: "Récolt'IQ est né d'une conversation avec un agriculteur qui me montrait ses carnets de moisson : des dizaines de pages illisibles, des chiffres griffonnés en plein champ sous 35°C, des totaux recalculés à la main chaque soir. « Si seulement il y avait une appli qui faisait ça proprement… » — j'avais 18 ans et aucune application déployée à mon actif. J'ai dit oui quand même.",
      },
      {
        type:    "h2",
        content: "Le vrai problème à résoudre",
      },
      {
        type:    "p",
        content: "Avant d'écrire une ligne de code, j'ai passé du temps à comprendre le workflow d'une moisson. Un agriculteur gère plusieurs parcelles en parallèle. Sur chaque parcelle, plusieurs camions viennent charger à des heures différentes. Le poids de chaque passage doit être noté, additionné, et comparé au stock restant. Et tout ça se passe dans des zones sans réseau stable.",
      },
      {
        type:    "p",
        content: "C'est ce dernier point qui a tout changé dans mes choix techniques : offline-first n'était pas une option, c'était une contrainte absolue.",
      },
      {
        type:    "h2",
        content: "Pourquoi PWA + Capacitor plutôt que natif",
      },
      {
        type:    "p",
        content: "Je ne connaissais pas SwiftUI à l'époque. J'aurais pu l'apprendre — mais j'aurais perdu des mois sur la courbe d'apprentissage avant d'arriver à quelque chose d'utilisable. JavaScript, je le pratiquais déjà. La PWA m'a permis de livrer vite, et Capacitor de distribuer sur l'App Store sans réécrire l'app.",
      },
      {
        type:    "code",
        lang:    "javascript",
        content: `// Service worker — stratégie offline-first
// Les données de pesée sont enregistrées localement d'abord
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/pesees')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});`,
      },
      {
        type:    "h2",
        content: "La fonctionnalité la plus complexe : le partage de parcelles",
      },
      {
        type:    "p",
        content: "Un chef d'exploitation peut avoir plusieurs employés qui saisissent des données en même temps sur des appareils différents. Il fallait gérer des droits de lecture/écriture granulaires, et surtout éviter les conflits de données quand deux personnes modifient la même parcelle hors-ligne puis se reconnectent.",
      },
      {
        type:    "quote",
        content: "Le bug le plus dur à débugger est celui qu'on ne voit pas en développement — parce qu'on a du réseau.",
      },
      {
        type:    "p",
        content: "J'ai fini par implémenter une stratégie de merge basée sur les timestamps côté client, avec une file d'attente de synchronisation gérée par la Background Sync API. Pas parfait, mais suffisant pour les cas d'usage réels.",
      },
      {
        type:    "h2",
        content: "Ce que j'ai appris",
      },
      {
        type:    "p",
        content: "Construire une vraie application — pas un projet de cours, pas un exercice — c'est une expérience complètement différente. Les utilisateurs ne lisent pas la doc. Ils trouvent des bugs que tu n'aurais jamais imaginés. Et quand un agriculteur t'appelle depuis son tracteur pour te dire que ça marche, c'est la meilleure validation qu'un portfolio ne donnera jamais.",
      },
      {
        type:    "p",
        content: "Récolt'IQ m'a appris à concevoir pour des contraintes réelles, pas des contraintes de specs. C'est la différence entre faire du code et faire du produit.",
      },
    ],
  },
];
