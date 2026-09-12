import Link from "next/link";
import { Card } from "@/components/ui";
import { LIBELLE_STATUT, listerCommandes, statistiques } from "@/lib/commandes";
import { listReports } from "@/lib/store";

export const dynamic = "force-dynamic";

function Chiffre({
  label,
  valeur,
  detail,
  ton = "neutre",
}: {
  label: string;
  valeur: string;
  detail?: string;
  ton?: "neutre" | "or" | "vert" | "rouge";
}) {
  const couleur = {
    neutre: "text-mist-100",
    or: "text-brand-300",
    vert: "text-jade",
    rouge: "text-rose-warn",
  }[ton];
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${couleur}`}>{valeur}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-mist-500">{detail}</p>}
    </Card>
  );
}

/** Petit histogramme des 14 derniers jours, en barres CSS. */
function Courbe({ jours }: { jours: { jour: string; nombre: number }[] }) {
  const derniers = jours.slice(-14);
  const max = Math.max(1, ...derniers.map((j) => j.nombre));

  if (derniers.length === 0) {
    return <p className="py-6 text-center text-sm text-mist-500">Aucune commande pour l&apos;instant.</p>;
  }

  // Les barres sont enfants directs d'un conteneur de hauteur fixe : c'est la
  // condition pour qu'une hauteur en pourcentage se resolve.
  return (
    <div>
      {/* max-w : au premier jour d'activite, une barre unique etiree sur toute
          la largeur ressemble a un bandeau, pas a une mesure. */}
      <div className="flex h-28 items-end gap-1.5">
        {derniers.map((j) => (
          <div
            key={j.jour}
            className="max-w-16 flex-1 rounded-t bg-brand-500/70 transition hover:bg-brand-400"
            style={{ height: `${Math.max(4, (j.nombre / max) * 100)}%` }}
            title={`${j.nombre} commande${j.nombre > 1 ? "s" : ""} le ${j.jour}`}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {derniers.map((j) => (
          <span key={j.jour} className="max-w-16 flex-1 text-center text-[10px] text-mist-500">
            {j.jour.slice(8)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const commandes = listerCommandes();
  const s = statistiques(commandes);
  const analyses = listReports();

  const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
  const da = (v: number) => `${v.toLocaleString("fr-FR")} DA`;

  // Sur 30 jours : la fenetre qui parle a quelqu'un qui fait tourner de la pub.
  const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentes = commandes.filter((c) => new Date(c.recueLe).getTime() > limite);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre
          label="Commandes reçues"
          valeur={String(s.total)}
          detail={`${recentes.length} sur les 30 derniers jours`}
        />
        <Chiffre
          label="À traiter"
          valeur={String(s.parStatut.nouvelle)}
          detail="En attente d'appel de confirmation"
          ton={s.parStatut.nouvelle > 0 ? "or" : "neutre"}
        />
        <Chiffre
          label="Encaissé"
          valeur={da(s.chiffreAffaires)}
          detail="Seules les commandes livrées comptent"
          ton="vert"
        />
        <Chiffre
          label="Taux de livraison"
          valeur={pct(s.tauxLivraison)}
          detail="Sur les commandes déjà parties"
          ton={s.tauxLivraison !== null && s.tauxLivraison < 0.55 ? "rouge" : "neutre"}
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-mist-100">Commandes par jour</h2>
            <p className="mt-0.5 text-xs text-mist-400">Les 14 derniers jours avec activité.</p>
          </div>
          <Link
            href="/admin/commandes"
            className="whitespace-nowrap text-xs text-brand-300 underline underline-offset-4 hover:text-brand-400"
          >
            Voir les commandes
          </Link>
        </div>
        <Courbe jours={s.parJour} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-mist-100">Où en sont les commandes</h2>
          {s.total === 0 ? (
            <p className="py-4 text-sm text-mist-500">
              Rien encore. Branche un formulaire sur « Hooked Lab » depuis la page Formulaire
              pour que les commandes arrivent ici.
            </p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(s.parStatut).map(([statut, nombre]) => (
                <li key={statut} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-mist-300">
                    {LIBELLE_STATUT[statut as keyof typeof LIBELLE_STATUT]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className="h-full rounded-full bg-brand-500/70"
                      style={{ width: `${s.total ? (nombre / s.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-mist-200">
                    {nombre}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-mist-100">Top wilayas</h2>
          {s.parWilaya.length === 0 ? (
            <p className="py-4 text-sm text-mist-500">Aucune donnée.</p>
          ) : (
            <ul className="space-y-2">
              {s.parWilaya.slice(0, 8).map((w) => (
                <li key={w.wilaya} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-mist-200">{w.wilaya}</span>
                  <span className="shrink-0 text-xs text-mist-400">
                    {w.nombre} reçue{w.nombre > 1 ? "s" : ""} · {w.livrees} livrée
                    {w.livrees > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-mist-100">Analyses de créatives</h2>
            <p className="mt-0.5 text-xs text-mist-400">
              {analyses.length} analyse{analyses.length > 1 ? "s" : ""} enregistrée
              {analyses.length > 1 ? "s" : ""} sur ce poste.
            </p>
          </div>
          <Link
            href="/admin/analyses"
            className="whitespace-nowrap text-xs text-brand-300 underline underline-offset-4 hover:text-brand-400"
          >
            Détail
          </Link>
        </div>
      </Card>
    </div>
  );
}
