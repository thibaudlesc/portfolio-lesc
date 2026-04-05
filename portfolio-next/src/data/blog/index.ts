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
    slug:               "app-bde-mmi-flutter-campagne",
    title:              "App BDE MMI : de l’idée de groupe à l’App Store",
    description:
      "Flutter, Firebase, deux semaines en solo — architecture temps réel, modules, et pourquoi l’App Store m’a pris autant de temps que tout le reste.",
    date:               "2026-03-18",
    tags:               ["Flutter", "Firebase", "Firestore", "App Store", "Dart", "Campagne"],
    readingTime:        16,
    relatedProjectSlug: "bde-mmi",
    content:            [
      { type: "p", content: "L’idée venait du groupe. Mais une idée de groupe sans quelqu’un qui s’en charge, ça reste une slide dans un deck. Je me suis dit que c’était moi : reprendre le concept, le resserrer, et le traduire en produit. Objectif clair — une app que les étudiants MMI Montaigne peuvent télécharger, utiliser, et qui matérialise la campagne avant même le vote." },
      { type: "h2", content: "Pourquoi Flutter, pourquoi maintenant" },
      { type: "p", content: "J’avais besoin d’iOS et Android avec un seul codebase : pas le temps de doubler le travail en deux stacks natives pour une deadline de campagne. Flutter + Dart, ça collait : UI déclarative, hot reload pour itérer vite, et une chaîne de build documentée jusqu’au store. Ce n’était pas mon premier « Hello World » en Dart, mais c’était de loin le projet le plus complet que je montais seul dessus — auth, temps réel, paiements symboliques côté boutique, navigation profonde entre cinq gros modules." },
      { type: "p", content: "Le compromis qu’on accepte avec Flutter web (pour la démo embarquée sur le portfolio) : poids du bundle, CanvasKit, et comportements iframe sur mobile. Le binaire iOS/Android reste la cible principale ; le web sert surtout à montrer l’UI sans forcer l’installation." },
      { type: "h2", content: "Stack côté backend : Firebase sans sur-ingénierie" },
      { type: "p", content: "J’ai posé Firebase comme socle : Authentication pour les comptes promo, Cloud Firestore pour tout ce qui doit vivre en temps réel (posts du feed, likes, commentaires, événements du calendrier), et Firebase Storage pour les médias lourds (images des posts, visuels boutique). L’intérêt, c’est la cohérence : les listeners Firestore propagent les changements aux clients sans que je recâble du polling." },
      { type: "p", content: "Les règles de sécurité Firestore, je les ai écrites tôt — c’est le genre de truc qui te mord les chevilles si tu codes d’abord « open bar » puis que tu essaies de refermer. Lecture largement ouverte pour le contenu public de campagne, écriture réservée aux rôles qui ont le droit de publier, validation des champs obligatoires côté règles quand c’était possible pour éviter des documents corrompus." },
      { type: "code", lang: "text", content: `# Schéma mental (simplifié)\nposts/{postId}     → auteur, texte, imageUrl, timestamps, likeCount\nevents/{eventId}  → titre, date, lieu, description\nusers/{uid}       → displayName, photoUrl, pointsFidelite, role` },
      { type: "h2", content: "Les cinq modules — ce que ça implique techniquement" },
      { type: "p", content: "Feed social : liste paginée ou infinite scroll selon ce que le design imposait, cartes avec image + texte riche, interaction like en optimistic UI puis rollback si la règle Firestore refuse. Le détail qui compte en campagne : la latence perçue — si le cœur apparaît instantanément et que la synchro suit, l’utilisateur a l’impression que « ça marche »." },
      { type: "p", content: "Boutique : catalogue produits (goodies, billets), état stock cohérent, flux « ajouter au panier » vers une logique de commande adaptée au contexte associatif — pas un Shopify, mais quelque chose de crédible pour une promo étudiante. Là encore Firestore pour l’inventaire et les commandes, avec attention aux conditions de concurrence (deux personnes qui cliquent en même temps sur le dernier billet)." },
      { type: "p", content: "Calendrier : modèle de données orienté événements, fuseaux et affichage localisé, rappels côté client. Espace MMI et profil : contenu statique semi-dynamique (liens utiles, services BDE), carte de membre visuelle et système de points de fidélité — surtout de la présentation + persistance légère sur le document utilisateur." },
      { type: "h2", content: "Deux semaines de dev — et autant pour l’App Store" },
      { type: "p", content: "Le code des features principales, je l’ai bouclé dans une fenêtre courte en solo. Ce qui m’a pris proportionnellement autant de temps, c’est Apple : compte développeur, certificats, profils de provisioning, conformité aux Human Interface Guidelines, textes de métadonnées, captures d’écran aux bonnes tailles, politique de confidentialité hébergée quelque part, et la boucle infinie des rejets avec messages parfois cryptiques." },
      { type: "p", content: "Chaque rejet est une mini-formation : interpréter la note du reviewer, corriger sans casser le reste, renvoyer un build. TestFlight a servi de filet — faire tester par des gens de la liste avant de repousser en review. La leçon : prévoir du buffer « store » dans l’estimation, surtout sur un premier déploiement sérieux." },
      { type: "quote", content: "La partie la plus longue ? Pas le code — l’App Store. Les guidelines, les rejets, les allers-retours." },
      { type: "h2", content: "État des lieux campagne et produit" },
      { type: "p", content: "Les votes n’étaient pas encore passés au moment où j’écris ça. L’app tourne, les retours sont bons : les gens comprennent le message de campagne parce qu’il existe en tactile, pas seulement sur Instagram. C’est beaucoup une vitrine — et c’est voulu : montrer qu’on sait livrer un binaire signé et une expérience cohérente avant le scrutin." },
      { type: "p", content: "Si la liste est élue, la suite logique c’est d’en faire un outil vivant (vraies ventes, contenus modérés, rôles admin plus fins). Si ce n’est pas le cas, le dépôt technique reste une preuve de compétence — pas glorieux à dire comme ça, mais c’est la réalité des projets étudiants à fort enjeu politique." },
      { type: "h2", content: "Ce que j’en retiens" },
      { type: "p", content: "Une idée collective ne vaut que ce que quelqu’un accepte de porter jusqu’au bout. J’ai pris ce rôle : Flutter et Firebase comme levier de vitesse, la discipline des règles Firestore et la patience face à Apple comme garde-fous. Deux semaines pour un MVP crédible en prod, plus le temps « invisible » du store — c’est ça, une vraie livraison." },
      { type: "quote", content: "Une idée de groupe reste une idée jusqu’à ce que quelqu’un décide de s’en charger pour de vrai. J’ai pris cette responsabilité. Deux semaines plus tard, l’app était sur l’App Store." },
    ],
  },
  {
    slug:               "recoltiq-pourquoi-jai-code-pour-mon-pere",
    title:              "Récolt'IQ : pourquoi j'ai codé pour mon père",
    description:
      "PWA, Capacitor, offline-first dans les champs — architecture données, sync, et pourquoi viser « suffisamment bon » plutôt que « parfait » quand les utilisateurs sont dans la boue.",
    date:               "2026-03-10",
    tags:               ["PWA", "Capacitor", "JavaScript", "Firebase", "Offline", "Service Worker"],
    readingTime:        18,
    relatedProjectSlug: "recoltiq",
    content:            [
      { type: "p", content: "Mon père a toujours géré la moisson avec des papiers. Carnets griffonnés, feuilles qui s’envolent avec le vent, tableurs Excel qu’il était presque le seul à lire correctement. J’ai grandi avec ce bruit de fond. Un premier jet, c’était un site fait uniquement pour lui — un prototype privé. Puis l’évidence : le problème n’était pas « son » organisation, c’était un pattern métier. J’ai tout recadré pour une app utilisable par d’autres exploitations, sans perdre le flux réel d’une récolte." },
      { type: "h2", content: "Le problème terrain que le papier ne résout pas" },
      { type: "p", content: "Une moisson, ce n’est pas une ligne dans un tableur. Ce sont plusieurs parcelles actives, plusieurs camions qui se succèdent, des pesées à enregistrer à la volée, un stock qui bouge en temps réel et des décisions le soir même (« combien il reste à vendre ? »). Le papier scale mal : erreurs de retranscription, pas d’historique fiable, pas de partage propre entre personnes sur le terrain." },
      { type: "p", content: "Le deuxième problème, c’est géographique. Les champs, c’est souvent mal couvert. Pas de 4G stable, parfois rien du tout pendant des heures. Une app « online only » est une app morte au moment où tu en as le plus besoin. D’où le choix d’une architecture offline-first : l’outil doit rester utilisable quand le réseau disparaît, et rattraper le retard quand il revient." },
      { type: "h2", content: "Pourquoi PWA + Capacitor plutôt que Swift natif d’entrée" },
      { type: "p", content: "Je maîtrisais déjà JavaScript et l’écosystème web. Partir sur SwiftUI ou UIKit pour un premier produit complet, c’était des mois de montée en puissance avant la moindre release utile. La PWA m’a permis de valider le produit vite : même codebase pour le navigateur et la logique métier, service worker pour le hors-ligne, et itération continue avec des utilisateurs qui testent sur leurs propres téléphones." },
      { type: "p", content: "Capacitor est entré en jeu pour la distribution App Store : empaqueter le shell web dans une WebView native, accéder aux APIs iOS (splash, statut bar, plugins réseau / stockage natif quand nécessaire) sans réécrire toute l’UI. Ce n’est pas la solution « pure perf » qu’un puriste natif choisirait — c’est le bon compromis quand le risque principal était de ne jamais shipper." },
      { type: "h2", content: "Offline-first : concrètement, ça veut dire quoi" },
      { type: "p", content: "Ça commence par une règle d’or : toute action métier critique doit pouvoir être enregistrée localement sans attendre une réponse HTTP. Les pesées, les mises à jour de stock, les notes de passage camion — tout ça part dans une couche locale (IndexedDB via des abstractions JS, ou stockage structuré selon ce que j’avais branché à l’époque) avec un horodatage et un identifiant client." },
      { type: "p", content: "Quand le réseau revient, une file de synchronisation rejoue les opérations vers Firebase. Là où ça devient délicat, c’est les conflits : deux personnes modifient la même parcelle hors ligne, ou une pesée locale contredit une règle métier côté serveur. J’ai fini par une stratégie pragmatique basée sur les timestamps et l’ordre d’arrivée côté client, avec des garde-fous pour ne pas écraser silencieusement des données plus récentes." },
      { type: "code", lang: "javascript", content: `// Idée de flux (simplifié) : écrire d'abord local, marquer 'pending'
async function enregistrerPeseeLocale(payload) {
  const id = crypto.randomUUID();
  await localStore.put({
    id,
    ...payload,
    status: "pending",
    createdAt: Date.now(),
  });
  await syncQueue.enqueue({ type: "pesee", localId: id });
  trySyncWhenOnline();
}` },
      { type: "p", content: "Le service worker joue le rôle de filet : mettre en cache les assets de l’app, intercepter certaines routes pour répondre depuis le cache, et laisser passer les appels API quand la connectivité le permet. Le piège classique, c’est de cacher trop agressivement et de servir une vieille version de l’app — j’ai versionné les caches et invalidé sur déploiement." },
      { type: "h2", content: "Modèle de données et temps réel quand ça existe" },
      { type: "p", content: "Côté cloud, Firebase (Firestore + Auth) pour le compte utilisateur, le partage de parcelles entre membres d’une exploitation, et les agrégats de stock. Le modèle tourne autour des entités métier : parcelles, camions, pesées, cultures, stock restant. Les règles de sécurité Firestore segmentent par utilisateur / exploitation pour éviter qu’un exploitant lise les données d’un autre." },
      { type: "p", content: "Quand la connexion est là, les écouteurs Firestore mettent à jour l’UI — tableau de bord, graphiques simplifiés, alertes de seuil. Quand elle n’y est pas, l’UI reste alimentée par le cache local et les files en attente ; l’utilisateur voit un état cohérent avec ce qu’il vient de saisir, pas un spinner infini." },
      { type: "h2", content: "Qui utilise l’app, et à quelle échelle" },
      { type: "p", content: "Pas des milliers d’utilisateurs. Ma famille, les collègues et amis de mon père — un réseau proche, des retours directs, des bugs signalés par SMS. C’est une échelle modeste mais honnête : les personas ne sont pas inventés en salle de réunion, ce sont des gens qui ramassent du grain et qui s’énervent si un bouton est au mauvais endroit." },
      { type: "h2", content: "Exports, Excel, et le monde réel" },
      { type: "p", content: "Les agriculteurs vivent encore avec Excel pour la compta et les déclarations. J’ai branché des exports (CSV / tableurs) pour ne pas les enfermer dans mon UI : l’app accélère la saisie et la centralisation, le tableur reste l’outil de fin de chaîne qu’ils connaissent. C’est un détail produit plus important qu’un dark mode parfait." },
      { type: "h2", content: "Ce que j’ai appris — au-delà du technique" },
      { type: "p", content: "Le logiciel n’est jamais fini. Il y aura toujours des bugs à corriger, des cas limites découverts en conditions réelles, des téléphones plus vieux que prévu. J’ai arrêté de chercher la version parfaite avant de sortir : j’ai visé une version suffisamment fiable pour ne pas bloquer le travail sur le terrain, puis j’ai itéré avec les retours." },
      { type: "p", content: "C’est mon premier vrai projet dev mené seul de bout en bout jusqu’au store et à des utilisateurs réels. La leçon la plus personnelle, ce n’est pas une astuce Firestore — c’est que coder pour quelqu’un que tu connais change la manière dont tu priorises. Tu ne peux pas te cacher derrière une spec floue : la spec, c’est ton père qui gèle dans la cabine du camion." },
      { type: "quote", content: "Je n'ai pas fait cette app pour la mettre sur mon CV. Je l'ai faite parce que mon père en avait besoin. C'est cette différence — coder pour quelqu'un de réel plutôt que pour un brief — qui m'a appris ce que ça veut dire de finir un projet." },
    ],
  },
];
