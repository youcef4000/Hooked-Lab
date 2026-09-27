import { estConnecte } from "./admin-auth";
import { utilisateurCourant } from "./session";
import { getJob } from "./jobs";
import { getSummary, listDemos, listReports, listReportsDe } from "./store";
import type { ReportSummary } from "@/types/analysis";

/* ============================================================================
   Qui peut voir quelle analyse.

   Une analyse est une recherche produit : le produit gagnant qu'un vendeur a
   repere. La montrer a un autre vendeur, c'est lui donner son travail. Les
   regles sont donc strictes, et centralisees ici pour que chaque route
   applique les memes :

   - le proprietaire du site voit tout ;
   - un abonne voit ses analyses, et les exemples publics ;
   - un visiteur ne voit que les exemples publics, choisis dans l'admin.

   Supprimer est plus strict encore : l'auteur ou l'administration, jamais
   un exemple public par un abonne.
   ========================================================================== */

export interface Lecteur {
  admin: boolean;
  utilisateurId: string | null;
}

export async function lecteurCourant(): Promise<Lecteur> {
  if (await estConnecte()) return { admin: true, utilisateurId: null };
  const u = await utilisateurCourant();
  return { admin: false, utilisateurId: u?.id ?? null };
}

function estAuteur(proprietaireId: string | undefined, lecteur: Lecteur): boolean {
  return Boolean(lecteur.utilisateurId && proprietaireId === lecteur.utilisateurId);
}

/** Rapport termine ou analyse en cours : le lecteur a-t-il le droit de la voir ? */
export function peutVoir(id: string, lecteur: Lecteur): boolean {
  if (lecteur.admin) return true;
  const resume = getSummary(id);
  if (resume) return resume.demo === true || estAuteur(resume.proprietaireId, lecteur);
  const job = getJob(id);
  return job ? estAuteur(job.proprietaireId, lecteur) : false;
}

export function peutSupprimer(id: string, lecteur: Lecteur): boolean {
  if (lecteur.admin) return true;
  const resume = getSummary(id);
  return resume ? !resume.demo && estAuteur(resume.proprietaireId, lecteur) : false;
}

/** L'historique propre a chaque lecteur. */
export function analysesVisibles(lecteur: Lecteur): ReportSummary[] {
  if (lecteur.admin) return listReports();
  if (lecteur.utilisateurId) return listReportsDe(lecteur.utilisateurId);
  return [];
}

export { listDemos };
