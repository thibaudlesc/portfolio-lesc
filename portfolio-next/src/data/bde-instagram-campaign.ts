/**
 * Grille type fil Instagram @bdedetoutlemonde (campagnes BDE).
 * Aligné sur le fichier Figma « portfolio » (frames 1080×1440 + bannière) :
 * https://www.figma.com/design/Cwt9RLHF4H2HunJSgEE15Y/portfolio?node-id=0-1
 *
 * Chaque ligne = une rangée de la grille 3 colonnes.
 * Un post avec plusieurs `slides` = carrousel (plusieurs calques dans le même post).
 * Ordre des slides : Figma (gauche → droite), sauf « projet-phare » inversé (carrousel de la fin vers le début).
 */
const BASE = "/images/projects/bde-mmi/campaign";

export type BdeCampaignSlide = { src: string; alt: string };

export type BdeInstagramPost = {
  id: string;
  slides: BdeCampaignSlide[];
  /** Ligne d’en-tête pleine largeur (affiche, bannière). */
  banner?: boolean;
  /** Colonnes occupées sur 3 (défaut 1). Utile pour un visuel large seul sur la ligne. */
  colSpan?: 1 | 2 | 3;
};

export type BdeInstagramRow = BdeInstagramPost[];

export const bdeInstagramCampaignRows: BdeInstagramRow[] = [
  [
    {
      id:     "banner",
      banner: true,
      slides: [{ src: `${BASE}/banner.jpg`, alt: "BDE MMI — Affiche de campagne" }],
    },
  ],
  [
    {
      id:     "projet-phare",
      slides: [
        { src: `${BASE}/post222_01.jpg`, alt: "Le projet phare — App BDE MMI" },
        { src: `${BASE}/tell_02.jpg`, alt: "App BDE MMI — Présentation" },
        { src: `${BASE}/okokok_03.jpg`, alt: "App BDE MMI — Calendrier" },
        { src: `${BASE}/okokok_02.jpg`, alt: "App BDE MMI — Feed" },
      ],
    },
    {
      id:     "programme-cover",
      slides: [{ src: `${BASE}/post222_02.jpg`, alt: "Le programme complet" }],
    },
    {
      id:     "programme-detail",
      slides: [
        { src: `${BASE}/post222_03.jpg`, alt: "Le programme — catégories" },
        { src: `${BASE}/instaaaa_01.jpeg`, alt: "Créativité & Formation" },
        { src: `${BASE}/instaaaa_02.jpeg`, alt: "Gaming & Services & Quotidien" },
        { src: `${BASE}/instaaaa_03.jpeg`, alt: "Numérique & Solidarité & Écologie" },
      ],
    },
  ],
  [
    {
      id:     "membres-gauche",
      slides: [
        { src: `${BASE}/offffffff_03.jpg`, alt: "Othman & Yanis" },
        { src: `${BASE}/offffffff_02.jpg`, alt: "Rémi & Milan" },
      ],
    },
    {
      id:     "membres-mil",
      slides: [{ src: `${BASE}/mil_02.jpeg`, alt: "Milan" }],
    },
    {
      id:     "membres-droite",
      slides: [
        { src: `${BASE}/33_02.jpeg`, alt: "Membres de la liste" },
        { src: `${BASE}/33_03.jpeg`, alt: "Membres de la liste" },
      ],
    },
  ],
];

/** Liste aplatie (ordre affichage) pour index lightbox */
export function flattenBdeInstagramPosts(rows: BdeInstagramRow[]): BdeInstagramPost[] {
  return rows.flat();
}
