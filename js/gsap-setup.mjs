/**
 * Ne pas coller ce fichier dans le terminal.
 * Exemple : depuis la racine du projet → node js/gsap-setup.mjs
 * (vérifie que "type": "module" est dans package.json)
 *
 * Pour une app React : importe ce fichier (ou son contenu) depuis un .tsx,
 * pas depuis zsh.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

console.log("GSAP OK :", typeof gsap.to === "function");
