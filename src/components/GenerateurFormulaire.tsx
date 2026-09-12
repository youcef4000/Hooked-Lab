"use client";

import { useMemo, useState } from "react";
import { Card, Repli } from "./ui";
import { CopyButton } from "./CopyButton";
import {
  OPTIONS_DEFAUT,
  SCRIPT_GOOGLE_SHEETS,
  TEXTES_DEFAUT,
  genererFormulaireHTML,
  type OptionsFormulaire,
} from "@/lib/formulaire-export";
import { NOMBRE_COMMUNES, WILAYAS } from "@/lib/wilayas";

/* ============================================================================
   Reglage et export du formulaire de commande.

   La previsualisation passe par une iframe et non par un rendu React : c'est
   exactement le code qui sera colle sur la page produit qui s'execute, donc
   ce qu'on voit ici est ce que verra le client. Un rendu React approximatif
   masquerait les erreurs de CSS ou de script.
   ========================================================================== */

const ACCENTS = [
  { nom: "Or", valeur: "#c9a227" },
  { nom: "Vert", valeur: "#1f9d55" },
  { nom: "Rouge", valeur: "#d64545" },
  { nom: "Bleu", valeur: "#2563eb" },
  { nom: "Noir", valeur: "#18181b" },
];

function Champ({
  label,
  aide,
  children,
}: {
  label: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-mist-200">{label}</span>
      {children}
      {aide && <span className="mt-1 block text-xs leading-relaxed text-mist-500">{aide}</span>}
    </label>
  );
}

const styleSaisie =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-mist-100 outline-none transition focus:border-brand-500";

export function GenerateurFormulaire() {
  const [o, setO] = useState<OptionsFormulaire>(OPTIONS_DEFAUT);
  const maj = <K extends keyof OptionsFormulaire>(cle: K, v: OptionsFormulaire[K]) =>
    setO((x) => ({ ...x, [cle]: v }));

  /**
   * Choisir "Hooked Lab" prerempli l'adresse de reception. En
   * developpement c'est localhost, ce qui suffit pour tester ; en production
   * il faut y mettre le vrai domaine, sinon le formulaire pose sur la
   * boutique enverra ses commandes dans le vide.
   */
  function choisirDestination(type: OptionsFormulaire["typeDestination"]) {
    setO((x) => {
      if (type === "interne") {
        const origine = typeof window !== "undefined" ? window.location.origin : "";
        return { ...x, typeDestination: type, destination: `${origine}/api/commandes` };
      }
      // Passer d'interne a autre chose : l'ancienne adresse n'a plus de sens.
      const destination = x.typeDestination === "interne" ? "" : x.destination;
      return { ...x, typeDestination: type, destination };
    });
  }

  /**
   * Changer de langue traduit aussi les textes tant qu'ils sont restes aux
   * valeurs par defaut. Des que le vendeur ecrit les siens, on n'y touche
   * plus : ce serait effacer son travail.
   */
  function changerLangue(langue: "fr" | "ar") {
    setO((x) => {
      if (x.langue === langue) return x;
      const ancien = TEXTES_DEFAUT[x.langue];
      const nouveau = TEXTES_DEFAUT[langue];
      return {
        ...x,
        langue,
        titre: x.titre === ancien.titre ? nouveau.titre : x.titre,
        soustitre: x.soustitre === ancien.soustitre ? nouveau.soustitre : x.soustitre,
        libelleBouton:
          x.libelleBouton === ancien.libelleBouton ? nouveau.libelleBouton : x.libelleBouton,
      };
    });
  }

  const html = useMemo(() => genererFormulaireHTML(o), [o]);

  // La previsualisation a besoin d'un document complet, avec le fond de page.
  // Le premium apporte le sien : on lui met un fond neutre tres sombre, comme
  // la section de landing sur laquelle il sera pose.
  const fondApercu =
    o.theme === "premium" ? "#050408" : o.theme === "sombre" ? "#0b0c0e" : "#f4f5f7";
  const apercu = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
      `<body style="margin:0;padding:24px 20px;background:${fondApercu}">${html}</body></html>`,
    [html, fondApercu],
  );

  // Les memes reglages, portes par l'URL : ouvrable sur un telephone.
  const lienApercu = useMemo(() => {
    const p = new URLSearchParams({
      theme: o.theme,
      langue: o.langue,
      accent: o.accent,
      titre: o.titre,
      soustitre: o.soustitre,
      bouton: o.libelleBouton,
      decor: o.fondAnime ? "1" : "0",
      etincelles: String(o.etincelles),
      livraison: o.choixLivraison ? "1" : "0",
    });
    if (o.produit) p.set("produit", o.produit);
    if (o.prix) p.set("prix", String(o.prix));
    return `/formulaire/apercu?${p.toString()}`;
  }, [o]);

  return (
    /* Les deux colonnes sont bornees par minmax(0,...) : sans cela, la largeur
       minimale du bloc de code, qui ne se coupe pas, etire la grille et fait
       defiler toute la page horizontalement sur telephone. */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* ------------------------------------------------------- reglages */}
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-mist-100">Le produit</h2>
          <div className="space-y-3">
            <Champ label="Nom du produit" aide="Il accompagne chaque commande reçue.">
              <input
                className={styleSaisie}
                value={o.produit}
                onChange={(e) => maj("produit", e.target.value)}
                placeholder="Ex : Caméra de surveillance WiFi"
              />
            </Champ>
            <Champ label="Prix de vente (DA)" aide="Mets 0 pour ne pas afficher de total.">
              <input
                type="number"
                min={0}
                className={styleSaisie}
                value={o.prix || ""}
                onChange={(e) => maj("prix", Number(e.target.value) || 0)}
                placeholder="0"
              />
            </Champ>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-mist-100">Les textes</h2>
          <div className="space-y-3">
            <Champ label="Titre">
              <input
                className={styleSaisie}
                value={o.titre}
                onChange={(e) => maj("titre", e.target.value)}
              />
            </Champ>
            <Champ label="Sous-titre">
              <input
                className={styleSaisie}
                value={o.soustitre}
                onChange={(e) => maj("soustitre", e.target.value)}
              />
            </Champ>
            <Champ label="Texte du bouton">
              <input
                className={styleSaisie}
                value={o.libelleBouton}
                onChange={(e) => maj("libelleBouton", e.target.value)}
              />
            </Champ>
            <Champ label="Langue" aide="En arabe, tout le formulaire bascule de droite à gauche.">
              <div className="grid grid-cols-2 gap-2">
                {(["fr", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => changerLangue(l)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      o.langue === l
                        ? "border-brand-500 bg-brand-500/10 text-mist-100"
                        : "border-ink-700 text-mist-300 hover:border-ink-600"
                    }`}
                  >
                    {l === "fr" ? "Français" : "العربية"}
                  </button>
                ))}
              </div>
            </Champ>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-mist-100">L&apos;apparence</h2>
          <div className="space-y-3">
            <Champ label="Couleur du bouton">
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.valeur}
                    onClick={() => maj("accent", a.valeur)}
                    title={a.nom}
                    className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-ink-900 transition ${
                      o.accent === a.valeur ? "ring-mist-100" : "ring-transparent"
                    }`}
                    style={{ background: a.valeur }}
                  />
                ))}
                <input
                  type="color"
                  value={o.accent}
                  onChange={(e) => maj("accent", e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-ink-700 bg-ink-950"
                />
              </div>
            </Champ>
            <Champ
              label="Thème"
              aide={
                o.theme === "premium"
                  ? "Noir et or, avec le décor animé. Il apporte son propre fond : à poser sur une section sombre."
                  : "Sans décor. À choisir quand le formulaire doit se fondre dans une page existante."
              }
            >
              <div className="grid grid-cols-3 gap-2">
                {(["premium", "clair", "sombre"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => maj("theme", t)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition ${
                      o.theme === t
                        ? "border-brand-500 bg-brand-500/10 text-mist-100"
                        : "border-ink-700 text-mist-300 hover:border-ink-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Champ>

            {o.theme === "premium" && (
              <>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={o.fondAnime}
                    onChange={(e) => maj("fondAnime", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-brand-500"
                  />
                  <span>
                    <span className="block text-xs font-medium text-mist-200">
                      Décor animé en fond
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-mist-500">
                      Halos dorés à la dérive, grain et liseré tournant.
                    </span>
                  </span>
                </label>

                {o.fondAnime && (
                  <Champ
                    label={`Étincelles : ${o.etincelles}`}
                    aide="Des poussières d'or qui montent derrière la carte. Zéro pour les couper."
                  >
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={2}
                      value={o.etincelles}
                      onChange={(e) => maj("etincelles", Number(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                  </Champ>
                )}
              </>
            )}
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={o.choixLivraison}
                onChange={(e) => maj("choixLivraison", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>
                <span className="block text-xs font-medium text-mist-200">
                  Proposer le choix domicile / stopdesk
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-mist-500">
                  Le stopdesk coûte moins cher et réduit nettement les retours. Les tarifs
                  s&apos;ajustent selon la zone de la wilaya choisie.
                </span>
              </span>
            </label>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 text-sm font-semibold text-mist-100">Où arrivent les commandes</h2>
          <p className="mb-3 text-xs leading-relaxed text-mist-400">
            Sans destination, le formulaire affiche le message de confirmation sans rien envoyer.
            Pratique pour tester la page, inutilisable en production.
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["interne", "Hooked Lab"],
                  ["sheets", "Google Sheets"],
                  ["webhook", "Webhook"],
                  ["aucune", "Aucune"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => choisirDestination(v)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    o.typeDestination === v
                      ? "border-brand-500 bg-brand-500/10 text-mist-100"
                      : "border-ink-700 text-mist-300 hover:border-ink-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {o.typeDestination === "interne" && (
              <div className="rounded-lg border border-brand-500/25 bg-brand-500/5 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-mist-300">
                  Les commandes arrivent directement dans{" "}
                  <a
                    href="/admin/commandes"
                    className="text-brand-300 underline underline-offset-4 hover:text-brand-400"
                  >
                    ton espace admin
                  </a>
                  , avec le téléphone cliquable et le suivi de statut.
                </p>
              </div>
            )}

            {o.typeDestination !== "aucune" && (
              <Champ
                label={
                  o.typeDestination === "sheets"
                    ? "URL du script Google"
                    : o.typeDestination === "interne"
                      ? "Adresse de ton site"
                      : "URL du webhook"
                }
                aide={
                  o.typeDestination === "sheets"
                    ? "Elle se termine par /exec. Voir la marche à suivre plus bas."
                    : o.typeDestination === "interne"
                      ? "Remplace localhost par ton vrai domaine une fois le site en ligne, sinon le formulaire n'aura personne à qui parler depuis la boutique."
                      : "Reçoit un POST JSON. Compatible n8n, Make, Zapier ou ton propre serveur."
                }
              >
                <input
                  className={styleSaisie}
                  value={o.destination}
                  onChange={(e) => maj("destination", e.target.value)}
                  placeholder="https://..."
                />
              </Champ>
            )}
          </div>
        </Card>
      </div>

      {/* --------------------------------------------- apercu et export */}
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-2.5">
            <span className="text-xs font-medium text-mist-300">Aperçu réel</span>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-mist-500 sm:inline">
                {WILAYAS.length} wilayas · {NOMBRE_COMMUNES} communes
              </span>
              <a
                href={lienApercu}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs text-mist-300 transition hover:border-ink-600 hover:text-mist-100"
              >
                Plein écran
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            </div>
          </div>
          <iframe
            srcDoc={apercu}
            title="Aperçu du formulaire"
            className="h-[680px] w-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-modals"
          />
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-mist-100">Le code à coller</h2>
              <p className="mt-0.5 text-xs text-mist-400">
                {(html.length / 1024).toFixed(0)} Ko, tout compris. Colle-le dans un bloc HTML de ta
                page produit.
              </p>
            </div>
            <CopyButton texte={html} label="Copier le code" />
          </div>
          <pre className="max-h-52 overflow-auto rounded-lg border border-ink-800 bg-ink-950 p-3 text-[11px] leading-relaxed text-mist-400">
            <code>{html.slice(0, 1400)}...</code>
          </pre>
        </Card>

        <Repli titre="Recevoir les commandes dans Google Sheets">
          <ol className="space-y-2.5 text-sm leading-relaxed text-mist-300">
            <li>
              <strong className="text-mist-100">1.</strong> Crée une feuille de calcul vierge sur
              Google Sheets.
            </li>
            <li>
              <strong className="text-mist-100">2.</strong> Menu{" "}
              <em className="text-mist-200">Extensions → Apps Script</em>. Efface le contenu et colle
              le script ci-dessous.
            </li>
            <li>
              <strong className="text-mist-100">3.</strong> Clique{" "}
              <em className="text-mist-200">Déployer → Nouveau déploiement</em>, type{" "}
              <em className="text-mist-200">Application web</em>. Mets « Exécuter en tant que : moi »
              et « Qui a accès : tout le monde ».
            </li>
            <li>
              <strong className="text-mist-100">4.</strong> Copie l&apos;URL qui finit par{" "}
              <code className="rounded bg-ink-800 px-1 py-0.5 text-xs">/exec</code> et colle-la dans
              le champ à gauche.
            </li>
            <li>
              <strong className="text-mist-100">5.</strong> Passe une commande de test sur
              l&apos;aperçu : la ligne doit apparaître dans ta feuille.
            </li>
          </ol>
          <div className="mt-3">
            <div className="mb-2 flex justify-end">
              <CopyButton texte={SCRIPT_GOOGLE_SHEETS} label="Copier le script" />
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg border border-ink-800 bg-ink-950 p-3 text-[11px] leading-relaxed text-mist-400">
              <code>{SCRIPT_GOOGLE_SHEETS}</code>
            </pre>
          </div>
          <p className="mt-3 rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-xs leading-relaxed text-mist-400">
            Le numéro de téléphone est enregistré avec une apostrophe devant : sans elle, Google
            Sheets supprime le zéro initial et tous tes numéros deviennent inutilisables.
          </p>
        </Repli>
      </div>
    </div>
  );
}
