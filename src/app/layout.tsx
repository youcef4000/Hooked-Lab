import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Figtree } from "next/font/google";
import { Suspense } from "react";
import { Pixels } from "@/components/Pixels";
import { urlSiteDepuis } from "@/lib/site";
import { langueCourante } from "@/lib/langue-serveur";
import { LangueProvider } from "@/components/Langue";
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

const TEXTES = {
  fr: {
    titre: "Hooked Lab — Décortique les créatives qui vendent",
    description:
      "Analyse n'importe quelle publicité TikTok, Instagram ou Facebook : script, angles marketing, " +
      "fournisseur sur Alibaba et 1688, rentabilité et annonces prêtes pour ton marché — États-Unis, " +
      "Europe, Royaume-Uni, Australie ou Algérie.",
    locale: "fr_FR",
  },
  en: {
    titre: "Hooked Lab — Reverse-engineer the ads that sell",
    description:
      "Analyse any TikTok, Instagram or Facebook ad: script, marketing angles, supplier on Alibaba " +
      "and 1688, profitability and ready-to-run ads for your market — US, UK, Europe, Australia " +
      "or Algeria.",
    locale: "en_US",
  },
} as const;

/**
 * Metadonnees calculees a chaque requete : l'adresse de base vient de la
 * requete elle-meme (juste en .onrender.com comme sur le nom de domaine),
 * et les textes suivent la langue du visiteur.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = TEXTES[await langueCourante()];
  return {
    // Sans adresse de base, les apercus de liens (WhatsApp, Facebook) pointent
    // vers des images relatives que les plateformes ne savent pas charger.
    metadataBase: new URL(urlSiteDepuis(await headers())),
    title: { default: t.titre, template: "%s — Hooked Lab" },
    description: t.description,
    applicationName: "Hooked Lab",
    // Une publicite partagee genere un apercu : sans ces balises, le lien
    // apparait nu et le taux de clic s'effondre.
    openGraph: {
      title: t.titre,
      description: t.description,
      locale: t.locale,
      type: "website",
      siteName: "Hooked Lab",
    },
    twitter: { card: "summary_large_image", title: "Hooked Lab", description: t.description },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const langue = await langueCourante();
  return (
    // Les variables de police vont sur <html> : le theme (--font-sans) est
    // calcule a la racine, et ne verrait pas des variables posees sur <body>.
    <html lang={langue} className={`${inter.variable} ${figtree.variable}`}>
      <body className="min-h-screen bg-ink-950">
        <LangueProvider langue={langue}>
          {children}
          <Suspense fallback={null}>
            <Pixels />
          </Suspense>
        </LangueProvider>
      </body>
    </html>
  );
}
