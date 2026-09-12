"use client";

import { useMemo, useState } from "react";
import { WILAYAS, communesDe, libelleWilaya, tarifLivraison } from "@/lib/wilayas";

/* ============================================================================
   Formulaire de commande COD.

   Quatre champs, tous obligatoires : nom, telephone, wilaya, commune. Rien de
   plus. Chaque champ supplementaire fait chuter le taux de completion, et en
   paiement a la livraison l'email ne sert a rien : c'est le telephone qui
   porte toute la relation client.

   Le telephone est le champ critique. Un numero errone est une commande
   perdue apres avoir paye la publicite : la validation est donc stricte, et
   le message d'erreur explique quoi corriger.
   ========================================================================== */

export interface Commande {
  nom: string;
  telephone: string;
  wilaya: string;
  wilaya_code: string;
  commune: string;
  livraison: "domicile" | "stopdesk";
  frais_livraison: number;
}

type Champ = "nom" | "telephone" | "wilaya" | "commune";

/**
 * Normalise un numero algerien vers le format national a 10 chiffres.
 * Accepte les saisies avec espaces, tirets, points, +213 ou 00213.
 */
export function normaliserTelephone(brut: string): string {
  let n = brut.replace(/[\s.\-()]/g, "");
  if (n.startsWith("+213")) n = "0" + n.slice(4);
  else if (n.startsWith("00213")) n = "0" + n.slice(5);
  else if (n.startsWith("213") && n.length === 12) n = "0" + n.slice(3);
  return n;
}

/** Un mobile algerien : 10 chiffres, prefixe 05 (Ooredoo), 06 (Mobilis) ou 07 (Djezzy). */
export function telephoneValide(brut: string): boolean {
  return /^0[567]\d{8}$/.test(normaliserTelephone(brut));
}

function erreurChamp(champ: Champ, valeurs: Record<Champ, string>): string | null {
  const v = valeurs[champ].trim();
  switch (champ) {
    case "nom":
      if (!v) return "Entre ton nom complet.";
      if (v.length < 3) return "Le nom est trop court.";
      if (/^\d+$/.test(v)) return "Entre un nom, pas un numéro.";
      return null;
    case "telephone":
      if (!v) return "Entre ton numéro de téléphone.";
      if (!telephoneValide(v))
        return "Numéro invalide. Il doit commencer par 05, 06 ou 07 et faire 10 chiffres.";
      return null;
    case "wilaya":
      return v ? null : "Choisis ta wilaya.";
    case "commune":
      return v ? null : "Choisis ta commune.";
  }
}

const CHAMPS: Champ[] = ["nom", "telephone", "wilaya", "commune"];

export function FormulaireCommande({
  onCommande,
  titre = "Commander maintenant",
  soustitre = "Paiement à la livraison. Tu payes le livreur, en main propre.",
  libelleBouton = "Confirmer ma commande",
  afficherLivraison = true,
}: {
  onCommande?: (c: Commande) => void;
  titre?: string;
  soustitre?: string;
  libelleBouton?: string;
  afficherLivraison?: boolean;
}) {
  const [valeurs, setValeurs] = useState<Record<Champ, string>>({
    nom: "",
    telephone: "",
    wilaya: "",
    commune: "",
  });
  const [touches, setTouches] = useState<Partial<Record<Champ, boolean>>>({});
  const [livraison, setLivraison] = useState<"domicile" | "stopdesk">("domicile");
  const [envoye, setEnvoye] = useState(false);

  const communes = useMemo(() => communesDe(valeurs.wilaya), [valeurs.wilaya]);
  const tarif = useMemo(() => tarifLivraison(valeurs.wilaya), [valeurs.wilaya]);

  const erreurs = useMemo(() => {
    const e: Partial<Record<Champ, string>> = {};
    for (const c of CHAMPS) {
      const msg = erreurChamp(c, valeurs);
      if (msg) e[c] = msg;
    }
    return e;
  }, [valeurs]);

  const complet = Object.keys(erreurs).length === 0;

  function majChamp(champ: Champ, valeur: string) {
    setValeurs((v) => {
      // Changer de wilaya invalide la commune : elle n'existe pas ailleurs.
      if (champ === "wilaya") return { ...v, wilaya: valeur, commune: "" };
      return { ...v, [champ]: valeur };
    });
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTouches({ nom: true, telephone: true, wilaya: true, commune: true });
    if (!complet) return;

    const w = WILAYAS.find((x) => x.code === valeurs.wilaya);
    if (!w) return;

    onCommande?.({
      nom: valeurs.nom.trim(),
      telephone: normaliserTelephone(valeurs.telephone),
      wilaya: w.nom,
      wilaya_code: w.code,
      commune: valeurs.commune,
      livraison,
      frais_livraison: tarif ? tarif[livraison] : 0,
    });
    setEnvoye(true);
  }

  const montre = (c: Champ) => touches[c] && erreurs[c];

  const styleChamp = (c: Champ) =>
    `w-full rounded-lg border bg-ink-950 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 ${
      montre(c) ? "border-rose-warn/60 focus:border-rose-warn" : "border-ink-700 focus:border-brand-500"
    }`;

  if (envoye) {
    return (
      <div className="rounded-xl border border-jade/30 bg-jade/5 p-8 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-jade/15">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-jade"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-mist-100">Commande enregistrée</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-mist-300">
          On t&apos;appelle dans les prochaines heures pour confirmer. Garde ton téléphone allumé.
        </p>
        <button
          onClick={() => {
            setEnvoye(false);
            setValeurs({ nom: "", telephone: "", wilaya: "", commune: "" });
            setTouches({});
          }}
          className="mt-4 text-xs text-mist-400 underline underline-offset-4 hover:text-mist-200"
        >
          Passer une autre commande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} noValidate className="rounded-xl border border-ink-800 bg-ink-900 p-5">
      <h3 className="text-base font-semibold tracking-tight text-mist-100">{titre}</h3>
      <p className="mt-0.5 text-sm text-mist-400">{soustitre}</p>

      <div className="mt-5 space-y-4">
        {/* Nom */}
        <div>
          <label htmlFor="cmd-nom" className="mb-1.5 block text-xs font-medium text-mist-200">
            Nom et prénom <span className="text-rose-warn">*</span>
          </label>
          <input
            id="cmd-nom"
            name="nom"
            type="text"
            autoComplete="name"
            placeholder="Ex : Karim Benali"
            value={valeurs.nom}
            onChange={(e) => majChamp("nom", e.target.value)}
            onBlur={() => setTouches((t) => ({ ...t, nom: true }))}
            className={styleChamp("nom")}
          />
          {montre("nom") && <p className="mt-1 text-xs text-rose-warn">{erreurs.nom}</p>}
        </div>

        {/* Telephone */}
        <div>
          <label htmlFor="cmd-tel" className="mb-1.5 block text-xs font-medium text-mist-200">
            Numéro de téléphone <span className="text-rose-warn">*</span>
          </label>
          <input
            id="cmd-tel"
            name="telephone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0X XX XX XX XX"
            value={valeurs.telephone}
            onChange={(e) => majChamp("telephone", e.target.value)}
            onBlur={() => setTouches((t) => ({ ...t, telephone: true }))}
            className={styleChamp("telephone")}
          />
          {montre("telephone") ? (
            <p className="mt-1 text-xs text-rose-warn">{erreurs.telephone}</p>
          ) : (
            <p className="mt-1 text-xs text-mist-500">
              C&apos;est sur ce numéro qu&apos;on t&apos;appelle pour confirmer.
            </p>
          )}
        </div>

        {/* Wilaya et commune */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cmd-wilaya" className="mb-1.5 block text-xs font-medium text-mist-200">
              Wilaya <span className="text-rose-warn">*</span>
            </label>
            <select
              id="cmd-wilaya"
              name="wilaya"
              value={valeurs.wilaya}
              onChange={(e) => majChamp("wilaya", e.target.value)}
              onBlur={() => setTouches((t) => ({ ...t, wilaya: true }))}
              className={styleChamp("wilaya")}
            >
              <option value="">Choisir...</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {libelleWilaya(w)}
                </option>
              ))}
            </select>
            {montre("wilaya") && <p className="mt-1 text-xs text-rose-warn">{erreurs.wilaya}</p>}
          </div>

          <div>
            <label htmlFor="cmd-commune" className="mb-1.5 block text-xs font-medium text-mist-200">
              Commune <span className="text-rose-warn">*</span>
            </label>
            <select
              id="cmd-commune"
              name="commune"
              value={valeurs.commune}
              disabled={!valeurs.wilaya}
              onChange={(e) => majChamp("commune", e.target.value)}
              onBlur={() => setTouches((t) => ({ ...t, commune: true }))}
              className={`${styleChamp("commune")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">
                {valeurs.wilaya ? "Choisir..." : "Choisis d'abord la wilaya"}
              </option>
              {communes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {montre("commune") && <p className="mt-1 text-xs text-rose-warn">{erreurs.commune}</p>}
          </div>
        </div>

        {/* Mode de livraison : facultatif, mais le stopdesk coute moins cher
            et reduit nettement le taux de retour. */}
        {afficherLivraison && tarif && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-mist-200">Mode de livraison</span>
            <div className="grid grid-cols-2 gap-2">
              {(["domicile", "stopdesk"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLivraison(mode)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    livraison === mode
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-ink-700 hover:border-ink-600"
                  }`}
                >
                  <span className="block text-xs font-medium text-mist-100">
                    {mode === "domicile" ? "À domicile" : "Au bureau (stopdesk)"}
                  </span>
                  <span className="mt-0.5 block text-xs text-mist-400">{tarif[mode]} DA</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-5 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-brand-400"
      >
        {libelleBouton}
      </button>

      <p className="mt-3 text-center text-xs text-mist-500">
        Aucun paiement en ligne. Tu payes le livreur à la réception.
      </p>
    </form>
  );
}
