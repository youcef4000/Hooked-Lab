import Link from "next/link";
import { Vitrine } from "@/components/analyser/Vitrine";
import { PosteTravail } from "@/components/analyser/PosteTravail";
import { BandeauAcces } from "@/components/compte/BandeauAcces";
import { listReports } from "@/lib/store";
import { config } from "@/lib/config";
import { estConnecte } from "@/lib/admin-auth";
import { utilisateurCourant } from "@/lib/session";
import { abonnementActif } from "@/lib/comptes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analyser une créative" };

/* ============================================================================
   Deux pages en une, selon qui regarde.

   Un visiteur venu d'une publicite recoit la vitrine : mise en scene, preuve
   du livrable, scroll narratif. Un abonne recoit son poste de travail : la
   zone de depot en haut, l'historique dessous, rien d'autre.

   Ce n'est pas une variation cosmetique — ce sont deux mises en page
   differentes, parce que les deux publics ne viennent pas pour la meme
   chose et qu'une page qui essaie de servir les deux echoue aux deux.
   ========================================================================== */

export default async function PageAnalyser() {
  const proprietaire = await estConnecte();
  const abonne = await utilisateurCourant();
  const actif = abonne !== null && abonnementActif(abonne);
  const peutAnalyser = proprietaire || (actif && abonne.credits > 0);

  const analyses = listReports();
  const cleManquante = !config.anthropic.apiKey;

  const alertes = (
    <>
      {!peutAnalyser && (
        <BandeauAcces connecte={abonne !== null} credits={abonne?.credits ?? 0} abonnementActif={actif} />
      )}
      {cleManquante && (
        <div className="mb-6 rounded-[var(--r-lg)] border border-amber-glow/30 bg-amber-glow/10 px-5 py-4">
          <p className="text-sm font-medium text-amber-glow">Configuration incomplète</p>
          <p className="mt-1 text-sm leading-relaxed text-mist-200">
            La clé <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code>{" "}
            est absente de <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs">.env.local</code>.
            Aucune analyse ne peut aboutir tant qu&apos;elle n&apos;est pas renseignée.
          </p>
          <Link
            href="/diagnostic"
            className="mt-3 inline-block rounded-[var(--r-sm)] bg-ink-800 px-3 py-1.5 text-xs text-mist-100 transition hover:bg-ink-700"
          >
            Ouvrir le diagnostic
          </Link>
        </div>
      )}
    </>
  );

  // L'abonne au travail : pas de discours, pas de demonstration.
  if (peutAnalyser && abonne) {
    return (
      <>
        {alertes}
        <PosteTravail recentes={analyses.slice(0, 8)} credits={abonne.credits} nom={abonne.nom} />
      </>
    );
  }

  // Le proprietaire teste son propre produit : meme poste de travail.
  if (peutAnalyser) {
    return (
      <>
        {alertes}
        <PosteTravail recentes={analyses.slice(0, 8)} credits={0} nom="" illimite />
      </>
    );
  }

  return (
    <>
      {alertes}
      <Vitrine recentes={analyses} />
    </>
  );
}
