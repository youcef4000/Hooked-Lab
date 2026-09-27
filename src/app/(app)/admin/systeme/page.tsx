import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { Card } from "@/components/ui";
import { ANALYSES_DIR, DATA_DIR } from "@/lib/paths";
import { config } from "@/lib/config";
import { derniersIncidents } from "@/lib/incidents";
import { etatFileAnalyses } from "@/lib/pipeline";
import { listerUtilisateurs } from "@/lib/comptes";

export const dynamic = "force-dynamic";

/* ============================================================================
   Etat de sante du site en ligne.

   Une liste de controles qui repondent tous a la meme question : est-ce que
   ce site peut encaisser une campagne publicitaire sans se casser ? Chaque
   ligne dit ce qui va, ce qui manque, et quoi faire. En dessous, le journal
   des analyses echouees : c'est la qu'on apprend qu'il faut recharger le
   compte Anthropic, avant que les clients ne s'en plaignent.
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

/** Taille du disque persistant prevu dans render.yaml. */
const DISQUE_OCTETS = 20 * 1024 ** 3;

export default function PageSysteme() {
  const poidsAnalyses = poidsDossier(ANALYSES_DIR);
  const poidsData = poidsDossier(DATA_DIR);
  const nbAnalyses = existsSync(ANALYSES_DIR)
    ? readdirSync(ANALYSES_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).length
    : 0;
  const remplissage = poidsData / DISQUE_OCTETS;

  const production = process.env.NODE_ENV === "production";
  const cle = config.anthropic.apiKey;
  const mdp = process.env.ADMIN_MOT_DE_PASSE?.trim().length ?? 0;
  const secretsOk =
    (process.env.ADMIN_SECRET?.trim().length ?? 0) >= 16 &&
    (process.env.SESSION_SECRET?.trim().length ?? 0) >= 16;
  const groqRequis = config.transcriber === "groq";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP?.trim() ?? "";
  const pixelMeta = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  const pixelTiktok = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() ?? "";
  const disquePersistant = Boolean(process.env.DATA_DIR?.trim());

  const file = etatFileAnalyses();
  const incidents = derniersIncidents(15);
  const emails = new Map(listerUtilisateurs().map((u) => [u.id, u.email]));
  // Un credit Anthropic epuise fait echouer TOUTES les analyses : c'est
  // l'alerte la plus urgente de cette page.
  const creditEpuise = incidents
    .slice(0, 3)
    .some((i) => /credit anthropic|credit balance/i.test(i.message));

  return (
    <div className="space-y-5">
      {creditEpuise && (
        <div className="rounded-[var(--r-lg)] border border-rose-warn/40 bg-rose-warn/10 px-5 py-4">
          <p className="text-sm font-semibold text-rose-warn">Crédit Anthropic épuisé</p>
          <p className="mt-1 text-sm leading-relaxed text-mist-200">
            Les dernières analyses ont échoué faute de crédit. Tes abonnés ont été remboursés
            automatiquement, mais plus rien ne passe : recharge sur console.anthropic.com →
            Billing, puis relance une analyse pour vérifier.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Espace occupé
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">
            {lisible(poidsData)}
          </p>
          <p className="mt-1 text-xs text-mist-500">
            {production
              ? `${Math.round(remplissage * 100)} % du disque de 20 Go`
              : `dont ${lisible(poidsAnalyses)} d'analyses`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            Analyses stockées
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">{nbAnalyses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
            En cours / en file
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-mist-100">
            {file.enCours} <span className="text-mist-500">/ {file.enAttente}</span>
          </p>
          <p className="mt-1 text-xs text-mist-500">{file.maximum} analyses simultanées max</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-mist-400">Modèle</p>
          <p className="mt-1.5 text-sm font-semibold tracking-tight text-mist-100">
            {config.anthropic.model}
          </p>
          <p className="mt-1 text-xs text-mist-500">Taux square : {config.fx.parallel} DA / $</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-mist-100">Réglages du serveur</h2>
        <p className="mb-2 text-xs text-mist-400">
          Tout ce que le code peut vérifier lui-même. Sur Render, chaque valeur se règle dans le
          service, onglet Environment.
        </p>

        <Controle
          etat={cle ? "ok" : "manquant"}
          titre="Clé Anthropic"
          detail={
            cle
              ? "Configurée. Le solde du compte n'est pas lisible d'ici : surveille le journal ci-dessous, il signale un crédit épuisé."
              : "Absente : aucune analyse ne peut tourner."
          }
          action={cle ? undefined : "Renseigner ANTHROPIC_API_KEY."}
        />

        {groqRequis && (
          <Controle
            etat={config.groqApiKey ? "ok" : "attention"}
            titre="Clé Groq (transcription)"
            detail={
              config.groqApiKey
                ? "Configurée : la voix des vidéos sans sous-titres est transcrite."
                : "Absente : les vidéos sans sous-titres sont analysées sans leur voix off, donc moins précisément."
            }
            action={
              config.groqApiKey ? undefined : "Renseigner GROQ_API_KEY (gratuite sur console.groq.com)."
            }
          />
        )}

        <Controle
          etat={mdp >= 16 ? "ok" : mdp >= 12 ? "attention" : "manquant"}
          titre="Mot de passe administrateur"
          detail={
            mdp >= 16
              ? "Défini, longueur solide."
              : mdp >= 12
                ? "Acceptable, mais 16 caractères ou plus sont conseillés pour un site en ligne."
                : "Trop court ou absent. Cette page donne accès aux numéros de tes clients."
          }
          action={mdp >= 16 ? undefined : "Mettre ADMIN_MOT_DE_PASSE à 16 caractères ou plus."}
        />

        <Controle
          etat={secretsOk ? "ok" : "attention"}
          titre="Secrets de session"
          detail={
            secretsOk
              ? "ADMIN_SECRET et SESSION_SECRET définis."
              : "Au moins un secret manque : les sessions sont signées avec une valeur dérivée du mot de passe."
          }
          action={
            secretsOk ? undefined : "Sur Render, ils sont générés automatiquement par render.yaml."
          }
        />

        {production && (
          <Controle
            etat={disquePersistant ? "ok" : "manquant"}
            titre="Disque persistant"
            detail={
              disquePersistant
                ? `Données enregistrées dans ${DATA_DIR} : elles survivent aux mises à jour.`
                : "DATA_DIR absent : comptes, codes et analyses seront effacés à la prochaine mise à jour."
            }
            action={
              disquePersistant ? undefined : "Attacher un disque et régler DATA_DIR=/var/data."
            }
          />
        )}

        <Controle
          etat={whatsapp ? "ok" : "attention"}
          titre="Numéro WhatsApp"
          detail={
            whatsapp
              ? `Les boutons de paiement et le support ouvrent une conversation avec le ${whatsapp}.`
              : "Absent : les clients n'ont aucun moyen de te joindre pour payer."
          }
          action={
            whatsapp
              ? undefined
              : "Renseigner NEXT_PUBLIC_WHATSAPP (ex. 213558678038), puis redéployer."
          }
        />

        <Controle
          etat={pixelMeta && pixelTiktok ? "ok" : "attention"}
          titre="Pixels publicitaires"
          detail={`Meta : ${pixelMeta ? "installé" : "absent"} · TikTok : ${
            pixelTiktok ? "installé" : "absent"
          }. Sans pixel, tes campagnes ne peuvent pas optimiser sur les inscriptions.`}
          action={
            pixelMeta && pixelTiktok
              ? undefined
              : "Renseigner NEXT_PUBLIC_META_PIXEL_ID et NEXT_PUBLIC_TIKTOK_PIXEL_ID avant de lancer les pubs, puis redéployer."
          }
        />

        <Controle
          etat={remplissage > 0.75 ? "attention" : "ok"}
          titre="Espace disque"
          detail={`${lisible(poidsData)} utilisés. Une analyse pèse environ 15 Mo, surtout la vidéo. Les dossiers orphelins sont purgés automatiquement.`}
          action={
            remplissage > 0.75
              ? "Agrandir le disque sur Render (Disks) ou supprimer d'anciennes analyses."
              : undefined
          }
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-mist-100">Analyses échouées</h2>
        <p className="mb-3 text-xs leading-relaxed text-mist-400">
          Le client voit un message simple et récupère ses crédits automatiquement. Le motif réel
          est ici. Un échec « acquisition » vient presque toujours de la plateforme (vidéo privée,
          protection anti-robot) : le client peut déposer le fichier à la place.
        </p>
        {incidents.length === 0 ? (
          <p className="py-4 text-center text-sm text-mist-500">Aucun échec enregistré.</p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {incidents.map((i, n) => (
              <li key={n} className="py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-mist-500">
                  <span className="tabular-nums">
                    {new Date(i.le).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span>·</span>
                  <span>{i.etape ?? "?"}</span>
                  <span>·</span>
                  <span className="truncate">
                    {i.utilisateurId ? (emails.get(i.utilisateurId) ?? "compte supprimé") : "toi"}
                  </span>
                </div>
                <p className="mt-0.5 break-words text-xs leading-relaxed text-mist-200">
                  {i.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
