import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300","400","500","600","700","800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal","italic"],
  weight: ["500","600","700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-next-nine-alpha.vercel.app"),
  title: {
    default: "Thibaud Lescroart — Développeur & Créateur Multimédia",
    template: "%s — Thibaud Lescroart",
  },
  description:
    "Applications mobiles, sites web, expériences interactives, data et vidéo — je construis des projets variés, du prototype à la mise en ligne.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-full flex flex-col" style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
