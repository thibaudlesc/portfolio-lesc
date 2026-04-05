export interface Post {
  slug:        string;
  title:       string;
  description: string;
  date:        string;
  tags:        string[];
  readingTime: number;
  /** Lien « Voir le projet » en bas d’article ; absent = pas de bouton */
  relatedProjectSlug?: string;
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
    slug:                "app-bde-mmi-flutter-campagne",
    title:               "App BDE MMI : de l’idée de groupe à l’App Store",
    description:
      "Flutter, Firebase, deux semaines en solo — et surtout l’App Store. Comment une idée collective devient un vrai produit quand quelqu’un s’en charge.",
    date:                "2026-03-18",
    tags:                ["Flutter", "Firebase", "App Store", "Campagne"],
    readingTime:         4,
    relatedProjectSlug:  "bde-mmi",
    content: [
      {
        type:    "h2",
        content: "Le problème",
      },
      {
        type:    "p",
        content:
          "L'idée venait du groupe. Mais une idée de groupe sans quelqu'un qui s'en charge, c'est juste une idée. Je me suis dit que c'était moi. J'ai pris le concept, je l'ai retravaillé, et j'ai commencé à coder.",
      },
      {
        type:    "h2",
        content: "L'approche",
      },
      {
        type:    "p",
        content:
          "Flutter + Firebase, 2 semaines seul. La partie la plus longue ? Pas le code — l'App Store. Les guidelines Apple, les rejets, les allers-retours... autant de temps que tout le reste. Au final : feed social, boutique, calendrier, espace MMI, profil avec carte de membre et points de fidélité.",
      },
      {
        type:    "h2",
        content: "Le résultat",
      },
      {
        type:    "p",
        content:
          "Les votes ne sont pas encore passés. Mais l'app tourne, et les retours sont bons. Pour l'instant c'est surtout une vitrine — et c'est exactement ça le but : montrer qu'on est capables de livrer quelque chose de concret avant même d'être élus.",
      },
      {
        type:    "quote",
        content:
          "Une idée de groupe reste une idée jusqu'à ce que quelqu'un décide de s'en charger pour de vrai. J'ai pris cette responsabilité. Deux semaines plus tard, l'app était sur l'App Store.",
      },
    ],
  },
  {
    slug:                "recoltiq-pourquoi-jai-code-pour-mon-pere",
    title:               "Récolt'IQ : pourquoi j'ai codé pour mon père",
    description:
      "Famille d’agriculteurs, carnets de moisson, offline-first dans les champs — et ce que ça change quand tu construis pour quelqu’un de réel, pas pour un brief.",
    date:                "2026-03-10",
    tags:                ["PWA", "Capacitor", "Offline", "Produit"],
    readingTime:         4,
    relatedProjectSlug:  "recoltiq",
    content: [
      {
        type:    "h2",
        content: "Le problème",
      },
      {
        type:    "p",
        content:
          "Mon père a toujours géré la moisson avec des papiers. Des carnets, des feuilles, des tableurs qu'il était le seul à comprendre. J'ai grandi avec ça. Un jour j'ai fait un site juste pour lui. Puis j'ai réalisé que tous les agriculteurs avaient le même problème — alors j'ai tout refait pour que ça soit utilisable par n'importe qui.",
      },
      {
        type:    "h2",
        content: "L'approche",
      },
      {
        type:    "p",
        content:
          "L'architecture, je l'ai pensée autour du vrai flow d'une moisson — pas d'un use case théorique. Pesées en temps réel, plusieurs camions sur la même parcelle, stock partagé. Et offline-first dès le départ, parce que dans les champs il n'y a souvent pas de réseau. Ce n'est pas un détail — si l'app tombe, le travail s'arrête.",
      },
      {
        type:    "h2",
        content: "Le résultat",
      },
      {
        type:    "p",
        content:
          "Utilisée par ma famille, les collègues et amis de mon père. Pas des milliers d'utilisateurs. Des gens réels, dans de vrais champs. Et ce que j'en retiens : il y aura toujours des bugs à corriger. Le logiciel n'est jamais fini. J'ai arrêté de chercher la version parfaite.",
      },
      {
        type:    "quote",
        content:
          "Je n'ai pas fait cette app pour la mettre sur mon CV. Je l'ai faite parce que mon père en avait besoin. C'est cette différence — coder pour quelqu'un de réel plutôt que pour un brief — qui m'a appris ce que ça veut dire de finir un projet.",
      },
    ],
  },
];
