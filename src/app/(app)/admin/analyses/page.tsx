import Link from "next/link";
import { Card } from "@/components/ui";
import { listReports } from "@/lib/store";
import { COUT_CREDITS } from "@/lib/tarifs";
import { listerUtilisateurs } from "@/lib/comptes";
import { BoutonDemo } from "@/components/admin/BoutonDemo";

export const dynamic = "force-dynamic";

export default function PageAnalyses() {
  const analyses = listReports();
  const emails = new Map(listerUtilisateurs().map((u) => [u.id, u.email]));

  // Ce que ces analyses auraient coute en credits si elles avaient ete
  // facturees : la base pour verifier que la grille tarifaire tient.
  const creditsEstimes = analyses.length * COUT_CREDITS.videoMoyenne;

  const parJour = new Map<string, number>();
  for (const a of analyses) {
    const jour = new Date(a.createdAt).toISOString().slice(0, 10);
    parJour.set(jour, (parJour.get(jour) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Analyses produites
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">
            {analyses.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Crédits équivalents
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-300">
            {creditsEstimes}
          </p>
          <p className="mt-1 text-xs text-mist-500">
            Au tarif d&apos;une vidéo moyenne ({COUT_CREDITS.videoMoyenne} crédits)
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Jours d&apos;activité
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">
            {parJour.size}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-mist-100">Analyses enregistrées</h2>
        <p className="mb-4 text-xs leading-relaxed text-mist-400">
          Chaque abonné ne voit que les siennes. « Rendre public » en fait un exemple visible des
          visiteurs sur la page Analyser — choisis tes meilleures, jamais celles d&apos;un client
          sans son accord. La suppression se fait depuis l&apos;historique.
        </p>

        {analyses.length === 0 ? (
          <p className="py-6 text-center text-sm text-mist-500">Aucune analyse pour l&apos;instant.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-800 text-left text-xs text-mist-400">
                  <th className="pb-2 pr-3 font-medium">Produit</th>
                  <th className="pb-2 pr-3 font-medium">Auteur</th>
                  <th className="pb-2 pr-3 font-medium">Plateforme</th>
                  <th className="pb-2 pr-3 font-medium">Score DZ</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Vitrine</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a.id} className="border-b border-ink-800/60 last:border-0">
                    <td className="max-w-[220px] truncate py-2.5 pr-3 text-mist-100">
                      {a.produit || a.titre}
                    </td>
                    <td className="max-w-[180px] truncate py-2.5 pr-3 text-xs text-mist-400">
                      {a.proprietaireId ? (emails.get(a.proprietaireId) ?? "compte supprimé") : "Toi"}
                    </td>
                    <td className="py-2.5 pr-3 text-mist-400">{a.platform}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-mist-200">{a.score}/100</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-mist-400">
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2.5 pr-3">
                      <BoutonDemo id={a.id} demo={a.demo === true} />
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/analyse/${a.id}`}
                        className="text-xs text-brand-300 underline underline-offset-4 hover:text-brand-400"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
