import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Figtree } from "next/font/google";
import { Suspense } from "react";
import { Pixels } from "@/components/Pixels";
import { urlSiteDepuis } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const figtree = Figtree({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-figtree" });

/* ============================================================================
   Layout racine : polices, fond, metadonnees. Rien d'autre.

   Le site a deux visages, et ils n'ont pas la meme barre de navigation :
   la vitrine, ou arrive quelqu'un qui vient d'une publicite et n'a encore
   rien achete, et l'outil, ou travaille un abonne. Chacun a donc son propre
   layout — la vitrine dans page.tsx, l'outil dans (app)/layout.tsx.
   ========================================================================== */

const DESCRIPTION =
  "Analyse une créative TikTok, Instagram ou Facebook : script, angles marketing, " +
  "sourcing Alibaba et 1688, rentabilité en paiement à la livraison. Pensé pour le " +
  "e-commerce algérien.";

/**
 * Metadonnees calculees a chaque requete : l'adresse de base vient de la
 * requete elle-meme. Elle est donc juste en .onrender.com comme sur le nom
 * de domaine, sans rien configurer — alors qu'une valeur figee a la
 * construction pointerait vers localhost.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    // Sans adresse de base, les apercus de liens (WhatsApp, Facebook) pointent
    // vers des images relatives que les plateformes ne savent pas charger.
    metadataBase: new URL(urlSiteDepuis(await headers())),
    ...METADONNEES,
  };
}

const METADONNEES: Metadata = {
  title: {
    default: "Hooked Lab — Décortique les créatives qui vendent",
    template: "%s — Hooked Lab",
  },
  description: DESCRIPTION,
  applicationName: "Hooked Lab",
  // Une publicite Meta ou TikTok partagee genere un apercu : sans ces balises,
  // le lien apparait nu et le taux de clic s'effondre.
  openGraph: {
    title: "Hooked Lab — Décortique les créatives qui vendent",
    description: DESCRIPTION,
    locale: "fr_DZ",
    type: "website",
    siteName: "Hooked Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hooked Lab",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${figtree.variable} min-h-screen bg-ink-950`}>
        {children}
        <Suspense fallback={null}>
          <Pixels />
        </Suspense>
      </body>
    </html>
  );
}
