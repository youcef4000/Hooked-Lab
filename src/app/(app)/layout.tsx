import Link from "next/link";
import { NavOutil } from "@/components/NavOutil";
import { Logo } from "@/components/Logo";
import { estConnecte } from "@/lib/admin-auth";
import { utilisateurCourant } from "@/lib/session";
import { abonnementActif } from "@/lib/comptes";

/* Layout de l'outil : la barre de travail, presente sur toutes les pages
   sauf la vitrine. */

export default async function LayoutOutil({ children }: { children: React.ReactNode }) {
  // L'onglet Admin n'existe que pour le proprietaire connecte. Un abonne ne
  // doit pas savoir que cette page existe : la route reste protegee de toute
  // facon, mais un lien visible invite a frapper a la porte.
  const proprietaire = await estConnecte();
  const abonne = await utilisateurCourant();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="group">
            <Logo compact />
          </Link>
          <NavOutil
            proprietaire={proprietaire}
            credits={abonne ? abonne.credits : null}
            abonnementActif={abonne ? abonnementActif(abonne) : false}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">{children}</main>

      <footer className="border-t border-ink-800 px-5 py-6 text-center text-xs leading-relaxed text-mist-400">
        Les prix et estimations sont des ordres de grandeur, à vérifier auprès des fournisseurs.
      </footer>
    </>
  );
}
