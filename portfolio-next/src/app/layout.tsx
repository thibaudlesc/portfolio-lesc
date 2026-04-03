import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://thibaud-lescroart.vercel.app"),
  title: {
    default: "Thibaud Lescroart — Développeur Junior",
    template: "%s — Thibaud Lescroart",
  },
  description:
    "Développeur Junior passionné par React, TypeScript, WebGPU et les interfaces haute performance.",
  openGraph: {
    type:   "website",
    locale: "fr_FR",
    images: [{ url: "/images/og/default.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}
