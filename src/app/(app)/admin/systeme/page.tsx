import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { Card } from "@/components/ui";
import { ANALYSES_DIR, DATA_DIR } from "@/lib/paths";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/* ============================================================================
   Etat de sante avant publication.

   Une liste de controles qui repondent tous a la meme question : est-ce que
   ce site peut encaisser une campagne publicitaire sans se casser ? Chaque
   ligne dit ce qui va, ce qui manque, et quoi faire.
   ========================================================================== */

function poidsDossier(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    try {
      total += e.isDirectory() ? poidsDossier(p) : statSync(p).size;
    } catch {
      // Fichier disparu entre le listage et la mesure : sans importance ici.
    }
  }
  return total;
}

function lisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 ** 2) return `${(octets / 1024).toFixed(0)} Ko`;
  if (octets < 1024 ** 3) return `${(octets / 1024 ** 2).toFixed(1)} Mo`;
  return `${(octets / 1024 ** 3).toFixed(2)} Go`;
}

type Etat = "ok" | "attention" | "manquant";

function Controle({
  etat,
  titre,
  detail,
  action,
}: {
  etat: Etat;
  titre: string;
  detail: string;
  action?: string;
}) {
  const style = {
    ok: { pastille: "bg-jade", texte: "text-jade", libelle: "Prêt" },
    attention: { pastille: "bg-amber-glow", texte: "text-amber-glow", libelle: "À vérifier" },
    manquant: { pastille: "bg-rose-warn", texte: "text-rose-warn", libelle: "Manquant" },
  }[etat];

  return (
    <div className="flex gap-3 border-b border-ink-800 py-3 last:border-0">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.pastille}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-sm font-medium text-mist-100">{titre}</h3>
          <span className={`text-[11px] font-medium ${style.texte}`}>{style.libelle}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{detail}</p>
        {action && (
          <p className="mt-1 text-xs leading-relaxed text-mist-300">
            <span className="text-mist-500">À faire : </span>
            {action}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PageSysteme() {
  const poidsAnalyses = poidsDossier(ANALYSES_DIR);
  const poidsData = poidsDossier(DATA_DIR);
  const nbAnalyses = existsSync(ANALYSES_DIR)
    ? readdirSync(ANALYSES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).length
    : 0;

  const cle = config.anthropic.apiKey;
  const adminOk = (process.env.ADMIN_MOT_DE_PASSE?.trim().length ?? 0) >= 12;
  const secretOk = (process.env.ADMIN_SECRET?.trim().length ?? 0) >= 16;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Espace occupé
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">
            {lisible(poidsData)}
          </p>
          <p className="mt-1 text-xs text-mist-500">dont {lisible(poidsAnalyses)} d&apos;analyses</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Dossiers d&apos;analyse
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">{nbAnalyses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">Modèle</p>
          <p className="mt-1.5 text-sm font-semibold tracking-tight text-mist-100">
            {config.anthropic.model}
          </p>
          <p className="mt-1 text-xs text-mist-500">
            Taux square : {config.fx.parallel} DA / $
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-mist-100">Avant de publier</h2>
        <p className="mb-2 text-xs text-mist-400">
          Ces contrôles portent sur ce que le code peut vérifier lui-même. Ils ne remplacent pas les
          décisions qui restent à prendre (paiement, hébergement).
        </p>

        <Controle
          etat={cle ? "ok" : "manquant"}
          titre="Clé Anthropic"
          detail={
            cle
              ? `Configurée (${cle.slice(0, 12)}…). Le solde du compte n'est pas vérifiable d'ici : une analyse échoue si le crédit est épuisé.`
              : "Absente : aucune analyse ne peut tourner."
          }
          action={cle ? undefined : "Ajouter ANTHROPIC_API_KEY dans .env.local."}
        />

        <Controle
          etat={adminOk ? "ok" : "attention"}
          titre="Mot de passe administrateur"
          detail={
            adminOk
              ? "Défini, longueur suffisante."
              : "Trop court ou absent. Cette page affiche les numéros de tes clients."
          }
          action={adminOk ? undefined : "Mettre ADMIN_MOT_DE_PASSE à 12 caractères minimum."}
        />

        <Controle
          etat={secretOk ? "ok" : "attention"}
          titre="Secret de signature des sessions"
          detail={
            secretOk
              ? "ADMIN_SECRET défini : les sessions survivent à un changement de mot de passe."
              : "Absent. Les jetons sont dérivés du mot de passe, ce qui fonctionne mais déconnecte tout le monde à chaque changement."
          }
          action={
            secretOk
              ? undefined
              : "Optionnel. Générer une chaîne aléatoire longue et la mettre dans ADMIN_SECRET."
          }
        />

        <Controle
          etat="attention"
          titre="Comptes et facturation"
          detail="Aucun système de comptes utilisateurs. Aujourd'hui, toute personne qui accède au site consomme ta clé API sans limite."
          action="Voir les étapes détaillées ci-dessous avant d'ouvrir le site au public."
        />

        <Controle
          etat={poidsAnalyses > 500 * 1024 ** 2 ? "attention" : "ok"}
          titre="Espace disque"
          detail={`${lisible(poidsAnalyses)} occupés par ${nbAnalyses} dossier${nbAnalyses > 1 ? "s" : ""} d'analyse. Les orphelins sont purgés automatiquement après une heure.`}
          action={
            poidsAnalyses > 500 * 1024 ** 2
              ? "Supprimer les analyses anciennes depuis l'historique."
              : undefined
          }
        />
      </Card>
    </div>
  );
}
