"use client";

import { useMemo, useState } from "react";
import { Card, ChiffreCle, Liste, Repli, Section } from "../ui";
import {
  COUTS_PRODUCTION,
  MARCHE_DZ,
  WILAYAS_SURCOUT,
  calculerRentabilite,
  formatDZD,
  normaliserParams,
  type ParamsCOD,
} from "@/lib/dz";
import type { Report } from "@/types/analysis";

/* ============================================================================
   Calculateur de rentabilite COD.

   Le modele suit la chaine reelle du COD algerien :
     prospects -> confirmation telephonique -> livraison payee
   Une partie de la publicite est payee pour des prospects qui ne confirmeront
   jamais : c'est ce que le taux de confirmation capture.
   ========================================================================== */

function Champ({
  label,
  valeur,
  onChange,
  unite,
  pas = 1,
  aide,
}: {
  label: string;
  valeur: number;
  onChange: (v: number) => void;
  unite: string;
  pas?: number;
  aide?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-mist-400">{label}</span>
      <span className="mt-1 flex items-center rounded-lg border border-ink-700 bg-ink-850 focus-within:border-brand-500/60">
        <input
          type="number"
          step={pas}
          value={valeur}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-sm tabular-nums text-mist-100 outline-none"
        />
        <span className="shrink-0 pr-3 text-xs text-mist-400">{unite}</span>
      </span>
      {aide && <span className="mt-1 block text-[11px] leading-snug text-mist-400">{aide}</span>}
    </label>
  );
}

function Curseur({
  label,
  valeur,
  onChange,
  min,
  max,
  pas,
  affichage,
  aide,
}: {
  label: string;
  valeur: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  pas: number;
  affichage: string;
  aide?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-mist-400">{label}</span>
        <span className="font-medium tabular-nums text-mist-100">{affichage}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-brand-500)]"
      />
      {aide && <span className="mt-1 block text-[11px] leading-snug text-mist-400">{aide}</span>}
    </label>
  );
}

/** Ligne du compte de resultat. */
function LigneCompte({
  libelle,
  montant,
  signe,
  precision,
}: {
  libelle: string;
  montant: number;
  signe: "+" | "−";
  precision?: string;
}) {
  return (
    <tr>
      <td className="py-2 text-mist-300">
        {libelle}
        {precision && <span className="ml-1 text-[11px] text-mist-400">({precision})</span>}
      </td>
      <td
        className={`py-2 text-right tabular-nums ${signe === "+" ? "text-jade" : "text-rose-warn"}`}
      >
        {signe} {formatDZD(montant)}
      </td>
    </tr>
  );
}

export function ProfitTab({ report }: { report: Report }) {
  // Les rapports anterieurs n'ont pas tous les champs : on les complete.
  const initiaux = useMemo(
    () => normaliserParams(report.rentabilite.params as Partial<ParamsCOD>),
    [report.rentabilite.params],
  );

  const [params, setParams] = useState<ParamsCOD>(initiaux);
  const calcul = useMemo(() => calculerRentabilite(params), [params]);
  const r = calcul.resultats;

  const set = (patch: Partial<ParamsCOD>) => setParams((p) => ({ ...p, ...patch }));
  const rentable = r.profit_net_dzd > 0;
  const importe = params.mode_approvisionnement === "import";

  return (
    <div>
      <Section
        titre="Rentabilité en paiement à la livraison"
        soustitre="Simulation sur 100 commandes confirmées. Ajuste chaque hypothèse à ta réalité : rien n'est enregistré dans le rapport."
        action={
          <button
            onClick={() => setParams(initiaux)}
            className="rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-mist-300 transition hover:text-mist-100"
          >
            Réinitialiser
          </button>
        }
      >
        {/* Les quatre chiffres qui decident ---------------------------- */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ChiffreCle
            label="Profit par commande"
            valeur={formatDZD(r.profit_par_commande_dzd)}
            tone={rentable ? "vert" : "rouge"}
            detail={`Marge ${r.marge_pct.toFixed(0)} %`}
          />
          <ChiffreCle
            label="Coût par prospect maximum"
            valeur={formatDZD(r.cpa_max_dzd)}
            tone={r.cpa_max_dzd > params.cout_par_lead_dzd ? "vert" : "rouge"}
            detail={
              r.cpa_max_dzd > params.cout_par_lead_dzd
                ? "Tu es sous ce seuil"
                : "Tu dépasses ce seuil"
            }
          />
          <ChiffreCle
            label="Seuil de livraison"
            valeur={
              r.seuil_rentabilite_taux_livraison > 1
                ? "impossible"
                : `${Math.round(r.seuil_rentabilite_taux_livraison * 100)} %`
            }
            tone={
              r.seuil_rentabilite_taux_livraison > 1
                ? "rouge"
                : r.seuil_rentabilite_taux_livraison < params.taux_livraison
                  ? "vert"
                  : "rouge"
            }
            detail="Minimum pour rentrer dans tes frais"
          />
          <ChiffreCle
            label="Prospects à générer"
            valeur={Math.ceil(r.leads_necessaires)}
            detail="Pour 100 commandes confirmées"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[380px_1fr]">
          {/* Hypotheses ------------------------------------------------- */}
          <div className="space-y-3">
            {/* Approvisionnement */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-mist-100">Approvisionnement</h3>

              <div className="mb-4 flex gap-1 rounded-lg border border-ink-700 bg-ink-850 p-0.5">
                <button
                  onClick={() => set({ mode_approvisionnement: "import" })}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs transition ${
                    importe ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
                  }`}
                >
                  Import de Chine
                </button>
                <button
                  onClick={() => set({ mode_approvisionnement: "local" })}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs transition ${
                    !importe ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
                  }`}
                >
                  Achat en Algérie
                </button>
              </div>

              {importe ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Champ
                      label="Prix fournisseur"
                      valeur={params.cout_produit_usd}
                      onChange={(v) => set({ cout_produit_usd: v })}
                      unite="$"
                      pas={0.1}
                    />
                    <Champ
                      label="Fret unitaire"
                      valeur={params.fret_unitaire_usd}
                      onChange={(v) => set({ fret_unitaire_usd: v })}
                      unite="$"
                      pas={0.1}
                    />
                  </div>
                  <Champ
                    label="Taux de change"
                    valeur={params.taux_change}
                    onChange={(v) => set({ taux_change: v })}
                    unite="DA / $"
                    aide="Marché parallèle (square) autour de 250, officiel autour de 132."
                  />
                  <Curseur
                    label="Douane et dédouanement"
                    valeur={params.taux_douane_pct}
                    onChange={(v) => set({ taux_douane_pct: v })}
                    min={0}
                    max={0.6}
                    pas={0.01}
                    affichage={`${Math.round(params.taux_douane_pct * 100)} %`}
                    aide="Droits, TVA à l'import et frais de dossier, en part de la valeur déclarée."
                  />
                  <Champ
                    label="Transit depuis le port"
                    valeur={params.frais_transit_dzd}
                    onChange={(v) => set({ frais_transit_dzd: v })}
                    unite="DA"
                    pas={10}
                    aide="Transitaire et acheminement, ramenés à l'unité."
                  />
                </div>
              ) : (
                <Champ
                  label="Prix chez le grossiste algérien"
                  valeur={params.prix_achat_local_dzd}
                  onChange={(v) => set({ prix_achat_local_dzd: v })}
                  unite="DA"
                  pas={50}
                  aide="Achat local : plus cher à l'unité, mais sans douane, sans délai et sans avance de trésorerie."
                />
              )}

              <div className="mt-3">
                <Curseur
                  label="Casse et invendus"
                  valeur={params.taux_casse_pct}
                  onChange={(v) => set({ taux_casse_pct: v })}
                  min={0}
                  max={0.2}
                  pas={0.01}
                  affichage={`${Math.round(params.taux_casse_pct * 100)} %`}
                />
              </div>

              <div className="mt-4 rounded-lg bg-ink-850 px-3 py-2 text-center">
                <div className="text-[11px] uppercase tracking-wide text-mist-400">
                  Prix de revient rendu
                </div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-brand-300">
                  {formatDZD(r.cout_revient_unitaire_dzd)}
                </div>
              </div>
            </Card>

            {/* Vente et logistique */}
            <Card className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-mist-100">Vente et livraison</h3>

              <Champ
                label="Prix de vente au client"
                valeur={params.prix_vente_dzd}
                onChange={(v) => set({ prix_vente_dzd: v })}
                unite="DA"
                pas={100}
              />
              <Champ
                label="Frais de livraison moyens"
                valeur={params.frais_livraison_dzd}
                onChange={(v) => set({ frais_livraison_dzd: v })}
                unite="DA"
                pas={50}
                aide={`Stopdesk environ ${MARCHE_DZ.livraisonStopdesk} DA, domicile environ ${MARCHE_DZ.livraisonDomicile} DA.`}
              />
              <Champ
                label="Coût d'un colis retourné"
                valeur={params.cout_retour_dzd}
                onChange={(v) => set({ cout_retour_dzd: v })}
                unite="DA"
                pas={50}
              />
              <Champ
                label="Emballage et préparation"
                valeur={params.frais_emballage_dzd}
                onChange={(v) => set({ frais_emballage_dzd: v })}
                unite="DA"
                pas={10}
              />

              <Curseur
                label="Taux de confirmation téléphonique"
                valeur={params.taux_confirmation}
                onChange={(v) => set({ taux_confirmation: v })}
                min={0.3}
                max={1}
                pas={0.01}
                affichage={`${Math.round(params.taux_confirmation * 100)} %`}
                aide="Part des prospects qui confirment. Les autres ont quand même coûté de la publicité."
              />
              <Curseur
                label="Taux de livraison réussie"
                valeur={params.taux_livraison}
                onChange={(v) => set({ taux_livraison: v })}
                min={0.3}
                max={0.95}
                pas={0.01}
                affichage={`${Math.round(params.taux_livraison * 100)} %`}
              />
              <Curseur
                label="Commission plateforme de vente"
                valeur={params.taux_plateforme_pct}
                onChange={(v) => set({ taux_plateforme_pct: v })}
                min={0}
                max={0.1}
                pas={0.005}
                affichage={`${(params.taux_plateforme_pct * 100).toFixed(1)} %`}
                aide="Youcan, Shopify ou autre. Zéro si tu vends par formulaire ou messagerie."
              />
            </Card>

            {/* Acquisition et production */}
            <Card className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-mist-100">Publicité et production</h3>

              <Champ
                label="Coût par prospect"
                valeur={params.cout_par_lead_dzd}
                onChange={(v) => set({ cout_par_lead_dzd: v })}
                unite="DA"
                pas={25}
                aide="Budget publicitaire divisé par le nombre de formulaires reçus."
              />
              <Champ
                label="Appel de confirmation"
                valeur={params.cout_confirmation_dzd}
                onChange={(v) => set({ cout_confirmation_dzd: v })}
                unite="DA"
                pas={10}
                aide="Crédit téléphonique et temps passé, par prospect appelé."
              />

              <Champ
                label="Production des créatives"
                valeur={params.cout_production_creatives_dzd}
                onChange={(v) => set({ cout_production_creatives_dzd: v })}
                unite="DA"
                pas={500}
                aide="Budget total : tournage, créateur UGC, montage, voix off."
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["Je tourne moi-même", COUTS_PRODUCTION.soiMeme],
                  ["UGC débutant", COUTS_PRODUCTION.ugcDebutant],
                  ["UGC confirmé", COUTS_PRODUCTION.ugcConfirme],
                  ["Studio", COUTS_PRODUCTION.studio],
                ].map(([label, montant]) => (
                  <button
                    key={label as string}
                    onClick={() => set({ cout_production_creatives_dzd: montant as number })}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      params.cout_production_creatives_dzd === montant
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                        : "border-ink-700 text-mist-400 hover:text-mist-200"
                    }`}
                  >
                    {label as string}
                  </button>
                ))}
              </div>

              <Champ
                label="Amorti sur"
                valeur={params.commandes_amortissement}
                onChange={(v) => set({ commandes_amortissement: v })}
                unite="commandes"
                pas={50}
                aide="Sur combien de commandes tu étales le coût de production."
              />
            </Card>
          </div>

          {/* Compte de resultat ----------------------------------------- */}
          <div className="space-y-3">
            <Card className="p-5">
              <h3 className="mb-1 text-sm font-semibold text-mist-100">
                Compte de résultat sur 100 commandes confirmées
              </h3>
              <p className="mb-3 text-xs text-mist-400">
                Il faut {Math.ceil(r.leads_necessaires)} prospects pour obtenir ces 100 commandes,
                dont {Math.round(r.commandes_livrees)} seront livrées et payées.
              </p>

              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-800">
                  <LigneCompte
                    libelle="Chiffre d'affaires encaissé"
                    montant={r.ca_dzd}
                    signe="+"
                    precision={`${Math.round(r.commandes_livrees)} colis payés`}
                  />
                  <LigneCompte
                    libelle="Marchandise"
                    montant={r.cout_marchandise_dzd}
                    signe="−"
                    precision={`${formatDZD(r.cout_revient_unitaire_dzd)} l'unité`}
                  />
                  <LigneCompte libelle="Livraison" montant={r.cout_livraison_dzd} signe="−" />
                  <LigneCompte
                    libelle="Retours"
                    montant={r.cout_retours_dzd}
                    signe="−"
                    precision={`${Math.round(r.commandes_retournees)} colis`}
                  />
                  <LigneCompte libelle="Emballage" montant={r.cout_emballage_dzd} signe="−" />
                  <LigneCompte
                    libelle="Publicité"
                    montant={r.cout_pub_dzd}
                    signe="−"
                    precision={`${Math.ceil(r.leads_necessaires)} prospects`}
                  />
                  <LigneCompte
                    libelle="Appels de confirmation"
                    montant={r.cout_confirmation_dzd}
                    signe="−"
                  />
                  {r.cout_plateforme_dzd > 0 && (
                    <LigneCompte
                      libelle="Commission plateforme"
                      montant={r.cout_plateforme_dzd}
                      signe="−"
                    />
                  )}
                  {r.cout_production_dzd > 0 && (
                    <LigneCompte
                      libelle="Production des créatives"
                      montant={r.cout_production_dzd}
                      signe="−"
                      precision={`amorti sur ${params.commandes_amortissement}`}
                    />
                  )}
                  <tr className="border-t-2 border-ink-700">
                    <td className="py-2.5 font-semibold text-mist-100">Profit net</td>
                    <td
                      className={`py-2.5 text-right font-semibold tabular-nums ${
                        rentable ? "text-jade" : "text-rose-warn"
                      }`}
                    >
                      {formatDZD(r.profit_net_dzd)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
                Les colis retournés reviennent en stock : leur marchandise n&apos;est pas comptée
                comme perdue, seuls le transport aller-retour et la casse le sont.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-amber-glow">
                Wilayas où la livraison coûte plus cher
              </h3>
              <p className="mb-2 text-xs leading-relaxed text-mist-400">
                Sur ces wilayas du sud, ajoute environ 300 à 600 DA au tarif de livraison, ou
                exclus-les du ciblage tant que la marge n&apos;est pas confortable.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WILAYAS_SURCOUT.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-ink-800 px-2 py-0.5 text-[11px] text-mist-300 ring-1 ring-inset ring-ink-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </Card>

            <Repli titre="Hypothèses de l'estimation initiale">
              <Liste items={report.sourcing.estimation.hypotheses} />
            </Repli>
          </div>
        </div>
      </Section>
    </div>
  );
}
