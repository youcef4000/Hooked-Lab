"use client";

import { useMemo, useState } from "react";
import { Card, ChiffreCle, Liste, Repli, Section } from "../ui";
import {
  COUTS_PRODUCTION_DEVISE,
  MARCHE_DZ,
  WILAYAS_SURCOUT,
  calculerRentabilite,
  normaliserParams,
  type ParamsCOD,
} from "@/lib/dz";
import { useRapport } from "./contexte";
import { locale } from "@/lib/langue";
import type { Report } from "@/types/analysis";

/* ============================================================================
   Calculateur de rentabilite.

   Un seul modele pour tous les marches :
     prospects -> confirmation -> livraison (ou commande conservee)
   - En paiement a la livraison (Algerie), une partie de la publicite est
     payee pour des prospects qui ne confirmeront jamais, et une partie des
     colis revient : c'est ce que les taux de confirmation et de livraison
     capturent.
   - En paiement par carte, il n'y a pas d'appel de confirmation (taux 1) et
     "retournee" designe une commande remboursee : on masque ce qui ne
     s'applique pas, et on ajoute le ROAS, langage des media buyers.

   Les champs suffixes _dzd sont exprimes dans la devise du marche du rapport.
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
          inputMode="decimal"
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
  const { fmt } = useRapport();
  return (
    <tr>
      <td className="py-2 text-mist-300">
        {libelle}
        {precision && <span className="ml-1 text-[11px] text-mist-400">({precision})</span>}
      </td>
      <td className={`py-2 text-right tabular-nums ${signe === "+" ? "text-jade" : "text-rose-warn"}`}>
        {signe} {fmt(montant)}
      </td>
    </tr>
  );
}

export function ProfitTab({ report }: { report: Report }) {
  const { fr, fmt, cod, marche, symbole, pays, langue } = useRapport();
  const algerie = marche.id === "dz";
  const pct = (x: number, decimales = 0) =>
    `${(x * 100).toLocaleString(locale(langue), { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}${fr ? " " : ""}%`;

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

  // Pas de saisie adapte a la devise : 100 DA, mais 1 $.
  const pas = (dzd: number, autre: number) => (algerie ? dzd : autre);

  // ROAS : chiffre d'affaires encaisse par unite de budget publicitaire.
  const caParCommande = params.prix_vente_dzd * params.taux_livraison;
  const roasSeuil = r.cpa_max_dzd > 0 ? caParCommande / r.cpa_max_dzd : Number.POSITIVE_INFINITY;
  const roasActuel = r.cout_pub_dzd > 0 ? r.ca_dzd / r.cout_pub_dzd : Number.POSITIVE_INFINITY;
  const formatRoas = (x: number) =>
    Number.isFinite(x)
      ? `${x.toLocaleString(locale(langue), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`
      : "—";

  const presets = COUTS_PRODUCTION_DEVISE[marche.devise];
  const libellesProduction: [string, number][] = [
    [fr ? "Je tourne moi-même" : "I shoot it myself", presets.soiMeme],
    [fr ? "UGC débutant" : "Entry-level UGC", presets.ugcDebutant],
    [fr ? "UGC confirmé" : "Experienced UGC", presets.ugcConfirme],
    ["Studio", presets.studio],
  ];

  const seuilImpossible = r.seuil_rentabilite_taux_livraison > 1;

  return (
    <div>
      <Section
        titre={
          fr
            ? cod
              ? "Rentabilité en paiement à la livraison"
              : "Rentabilité en paiement par carte"
            : cod
              ? "Profitability — cash on delivery"
              : "Profitability — card payment"
        }
        soustitre={
          fr
            ? `Simulation sur 100 commandes ${cod ? "confirmées" : "payées"}. Ajuste chaque hypothèse à ta réalité : rien n'est enregistré dans le rapport.`
            : `Simulated on 100 ${cod ? "confirmed" : "paid"} orders. Adjust every assumption to your reality: nothing is saved to the report.`
        }
        action={
          <button
            onClick={() => setParams(initiaux)}
            className="rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-mist-300 transition hover:text-mist-100"
          >
            {fr ? "Réinitialiser" : "Reset"}
          </button>
        }
      >
        {/* Les quatre chiffres qui decident ---------------------------- */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ChiffreCle
            label={fr ? "Profit par commande" : "Profit per order"}
            valeur={fmt(r.profit_par_commande_dzd)}
            tone={rentable ? "vert" : "rouge"}
            detail={fr ? `Marge ${r.marge_pct.toFixed(0)} %` : `${r.marge_pct.toFixed(0)}% margin`}
          />
          <ChiffreCle
            label={
              cod
                ? fr
                  ? "Coût par prospect maximum"
                  : "Max cost per lead"
                : fr
                  ? "CPA maximum"
                  : "Max CPA"
            }
            valeur={fmt(r.cpa_max_dzd)}
            tone={r.cpa_max_dzd > params.cout_par_lead_dzd ? "vert" : "rouge"}
            detail={
              r.cpa_max_dzd > params.cout_par_lead_dzd
                ? fr
                  ? "Tu es sous ce seuil"
                  : "You're under this limit"
                : fr
                  ? "Tu dépasses ce seuil"
                  : "You're over this limit"
            }
          />
          {cod ? (
            <ChiffreCle
              label={fr ? "Seuil de livraison" : "Break-even delivery rate"}
              valeur={
                seuilImpossible ? (fr ? "impossible" : "not reachable") : pct(r.seuil_rentabilite_taux_livraison)
              }
              tone={
                seuilImpossible
                  ? "rouge"
                  : r.seuil_rentabilite_taux_livraison < params.taux_livraison
                    ? "vert"
                    : "rouge"
              }
              detail={fr ? "Minimum pour rentrer dans tes frais" : "Minimum to cover your costs"}
            />
          ) : (
            <ChiffreCle
              label={fr ? "ROAS de rentabilité" : "Break-even ROAS"}
              valeur={formatRoas(roasSeuil)}
              tone={Number.isFinite(roasSeuil) && roasSeuil <= roasActuel ? "vert" : "rouge"}
              detail={fr ? "En dessous, tu perds de l'argent" : "Below this, you lose money"}
            />
          )}
          {cod ? (
            <ChiffreCle
              label={fr ? "Prospects à générer" : "Leads needed"}
              valeur={Math.ceil(r.leads_necessaires)}
              detail={fr ? "Pour 100 commandes confirmées" : "For 100 confirmed orders"}
            />
          ) : (
            <ChiffreCle
              label={fr ? "ROAS à ton CPA" : "ROAS at your CPA"}
              valeur={formatRoas(roasActuel)}
              tone={rentable ? "vert" : "ambre"}
              detail={fr ? `Avec un CPA de ${fmt(params.cout_par_lead_dzd)}` : `With a ${fmt(params.cout_par_lead_dzd)} CPA`}
            />
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[380px_1fr]">
          {/* Hypotheses ------------------------------------------------- */}
          <div className="space-y-3">
            {/* Approvisionnement */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-mist-100">{fr ? "Approvisionnement" : "Sourcing"}</h3>

              <div className="mb-4 flex gap-1 rounded-lg border border-ink-700 bg-ink-850 p-0.5">
                <button
                  onClick={() => set({ mode_approvisionnement: "import" })}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs transition ${
                    importe ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
                  }`}
                >
                  {cod ? (fr ? "Import de Chine" : "Import from China") : fr ? "Dropshipping Chine" : "China dropshipping"}
                </button>
                <button
                  onClick={() => set({ mode_approvisionnement: "local" })}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs transition ${
                    !importe ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
                  }`}
                >
                  {algerie ? (fr ? "Achat en Algérie" : "Buy in Algeria") : fr ? "Stock local" : "Local stock"}
                </button>
              </div>

              {importe ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Champ
                      label={fr ? "Prix fournisseur" : "Supplier price"}
                      valeur={params.cout_produit_usd}
                      onChange={(v) => set({ cout_produit_usd: v })}
                      unite="$"
                      pas={0.1}
                    />
                    <Champ
                      label={cod ? (fr ? "Fret unitaire" : "Unit freight") : fr ? "Livraison au client" : "Shipping to customer"}
                      valeur={params.fret_unitaire_usd}
                      onChange={(v) => set({ fret_unitaire_usd: v })}
                      unite="$"
                      pas={0.1}
                    />
                  </div>
                  {marche.devise !== "USD" && (
                    <Champ
                      label={fr ? "Taux de change" : "Exchange rate"}
                      valeur={params.taux_change}
                      onChange={(v) => set({ taux_change: v })}
                      unite={`${symbole} / $`}
                      pas={algerie ? 1 : 0.01}
                      aide={
                        algerie
                          ? fr
                            ? "Marché parallèle (square) autour de 250, officiel autour de 132."
                            : "Parallel market (square) around 250, official rate around 132."
                          : fr
                            ? "Taux du jour, frais de conversion de ta banque inclus."
                            : "Today's rate, including your bank's conversion fees."
                      }
                    />
                  )}
                  <Curseur
                    label={cod ? (fr ? "Douane et dédouanement" : "Customs & clearance") : fr ? "Taxes à l'import (TVA, droits)" : "Import taxes (VAT, duties)"}
                    valeur={params.taux_douane_pct}
                    onChange={(v) => set({ taux_douane_pct: v })}
                    min={0}
                    max={0.6}
                    pas={0.01}
                    affichage={pct(params.taux_douane_pct)}
                    aide={
                      cod
                        ? fr
                          ? "Droits, TVA à l'import et frais de dossier, en part de la valeur déclarée."
                          : "Duties, import VAT and handling fees, as a share of declared value."
                        : fr
                          ? "TVA ou droits payés à l'entrée, en part de la valeur de la marchandise."
                          : "VAT or duties paid at the border, as a share of the goods' value."
                    }
                  />
                  {algerie && (
                    <Champ
                      label={fr ? "Transit depuis le port" : "Port transit"}
                      valeur={params.frais_transit_dzd}
                      onChange={(v) => set({ frais_transit_dzd: v })}
                      unite={symbole}
                      pas={10}
                      aide={fr ? "Transitaire et acheminement, ramenés à l'unité." : "Forwarder and local haulage, per unit."}
                    />
                  )}
                </div>
              ) : (
                <Champ
                  label={algerie ? (fr ? "Prix chez le grossiste algérien" : "Algerian wholesaler price") : fr ? "Prix de gros local" : "Local wholesale price"}
                  valeur={params.prix_achat_local_dzd}
                  onChange={(v) => set({ prix_achat_local_dzd: v })}
                  unite={symbole}
                  pas={pas(50, 0.5)}
                  aide={
                    fr
                      ? "Achat local : plus cher à l'unité, mais sans douane, sans délai et sans avance de trésorerie."
                      : "Buying locally: pricier per unit, but no customs, no delays and no cash tied up."
                  }
                />
              )}

              <div className="mt-3">
                <Curseur
                  label={fr ? "Casse et invendus" : "Breakage & unsold stock"}
                  valeur={params.taux_casse_pct}
                  onChange={(v) => set({ taux_casse_pct: v })}
                  min={0}
                  max={0.2}
                  pas={0.01}
                  affichage={pct(params.taux_casse_pct)}
                />
              </div>

              <div className="mt-4 rounded-lg bg-ink-850 px-3 py-2 text-center">
                <div className="text-[11px] uppercase tracking-wide text-mist-400">
                  {fr ? "Prix de revient rendu" : "Landed cost per unit"}
                </div>
                <div className="mt-0.5 text-lg font-bold tabular-nums text-brand-300">
                  {fmt(r.cout_revient_unitaire_dzd)}
                </div>
              </div>
            </Card>

            {/* Vente et logistique */}
            <Card className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-mist-100">
                {cod ? (fr ? "Vente et livraison" : "Sales & delivery") : fr ? "Vente et paiement" : "Sales & payment"}
              </h3>

              <Champ
                label={fr ? "Prix de vente au client" : "Retail price"}
                valeur={params.prix_vente_dzd}
                onChange={(v) => set({ prix_vente_dzd: v })}
                unite={symbole}
                pas={pas(100, 1)}
              />
              <Champ
                label={cod ? (fr ? "Frais de livraison moyens" : "Average delivery cost") : fr ? "Expédition en plus" : "Extra shipping cost"}
                valeur={params.frais_livraison_dzd}
                onChange={(v) => set({ frais_livraison_dzd: v })}
                unite={symbole}
                pas={pas(50, 0.5)}
                aide={
                  cod
                    ? fr
                      ? `Stopdesk environ ${MARCHE_DZ.livraisonStopdesk} DA, domicile environ ${MARCHE_DZ.livraisonDomicile} DA.`
                      : `Stopdesk around ${MARCHE_DZ.livraisonStopdesk} DA, home delivery around ${MARCHE_DZ.livraisonDomicile} DA.`
                    : fr
                      ? "Zéro si la livraison au client est déjà comprise dans le prix fournisseur."
                      : "Zero if delivery to the customer is already included in the supplier price."
                }
              />
              <Champ
                label={cod ? (fr ? "Coût d'un colis retourné" : "Cost of a returned parcel") : fr ? "Coût d'une commande remboursée" : "Cost of a refunded order"}
                valeur={params.cout_retour_dzd}
                onChange={(v) => set({ cout_retour_dzd: v })}
                unite={symbole}
                pas={pas(50, 0.5)}
                aide={
                  cod
                    ? undefined
                    : fr
                      ? "Marchandise et port déjà partis, en général non récupérés."
                      : "Goods and shipping already spent, usually not recovered."
                }
              />
              <Champ
                label={fr ? "Emballage et préparation" : "Packaging & fulfilment"}
                valeur={params.frais_emballage_dzd}
                onChange={(v) => set({ frais_emballage_dzd: v })}
                unite={symbole}
                pas={pas(10, 0.1)}
              />

              {cod && (
                <Curseur
                  label={fr ? "Taux de confirmation téléphonique" : "Phone confirmation rate"}
                  valeur={params.taux_confirmation}
                  onChange={(v) => set({ taux_confirmation: v })}
                  min={0.3}
                  max={1}
                  pas={0.01}
                  affichage={pct(params.taux_confirmation)}
                  aide={
                    fr
                      ? "Part des prospects qui confirment. Les autres ont quand même coûté de la publicité."
                      : "Share of leads who confirm. The others still cost you ad spend."
                  }
                />
              )}
              <Curseur
                label={cod ? (fr ? "Taux de livraison réussie" : "Successful delivery rate") : fr ? "Commandes non remboursées" : "Orders not refunded"}
                valeur={params.taux_livraison}
                onChange={(v) => set({ taux_livraison: v })}
                min={cod ? 0.3 : 0.7}
                max={cod ? 0.95 : 1}
                pas={0.01}
                affichage={pct(params.taux_livraison)}
                aide={
                  cod
                    ? undefined
                    : fr
                      ? "Remboursements, colis perdus et litiges : souvent 4 à 8 % des commandes."
                      : "Refunds, lost parcels and chargebacks: often 4 to 8% of orders."
                }
              />
              <Curseur
                label={cod ? (fr ? "Commission plateforme de vente" : "Store platform fee") : fr ? "Frais de paiement et boutique" : "Payment & store fees"}
                valeur={params.taux_plateforme_pct}
                onChange={(v) => set({ taux_plateforme_pct: v })}
                min={0}
                max={0.1}
                pas={0.005}
                affichage={pct(params.taux_plateforme_pct, 1)}
                aide={
                  cod
                    ? fr
                      ? "Youcan, Shopify ou autre. Zéro si tu vends par formulaire ou messagerie."
                      : "Youcan, Shopify or other. Zero if you sell via a form or messaging."
                    : fr
                      ? "Frais de carte (≈ 3 %) plus applications et abonnement de la boutique."
                      : "Card processing (≈ 3%) plus store apps and subscription."
                }
              />
            </Card>

            {/* Acquisition et production */}
            <Card className="space-y-3 p-5">
              <h3 className="text-sm font-semibold text-mist-100">{fr ? "Publicité et production" : "Ads & production"}</h3>

              <Champ
                label={cod ? (fr ? "Coût par prospect" : "Cost per lead") : fr ? "Coût par achat (CPA)" : "Cost per purchase (CPA)"}
                valeur={params.cout_par_lead_dzd}
                onChange={(v) => set({ cout_par_lead_dzd: v })}
                unite={symbole}
                pas={pas(25, 0.5)}
                aide={
                  cod
                    ? fr
                      ? "Budget publicitaire divisé par le nombre de formulaires reçus."
                      : "Ad spend divided by the number of order forms received."
                    : fr
                      ? "Budget publicitaire divisé par le nombre de commandes payées."
                      : "Ad spend divided by the number of paid orders."
                }
              />
              {cod && (
                <Champ
                  label={fr ? "Appel de confirmation" : "Confirmation call"}
                  valeur={params.cout_confirmation_dzd}
                  onChange={(v) => set({ cout_confirmation_dzd: v })}
                  unite={symbole}
                  pas={10}
                  aide={fr ? "Crédit téléphonique et temps passé, par prospect appelé." : "Phone credit and time spent, per lead called."}
                />
              )}

              <Champ
                label={fr ? "Production des créatives" : "Creative production"}
                valeur={params.cout_production_creatives_dzd}
                onChange={(v) => set({ cout_production_creatives_dzd: v })}
                unite={symbole}
                pas={pas(500, 10)}
                aide={
                  fr
                    ? "Budget total : tournage, créateur UGC, montage, voix off."
                    : "Total budget: shooting, UGC creator, editing, voice-over."
                }
              />
              <div className="flex flex-wrap gap-1.5">
                {libellesProduction.map(([label, montant]) => (
                  <button
                    key={label}
                    onClick={() => set({ cout_production_creatives_dzd: montant })}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      params.cout_production_creatives_dzd === montant
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                        : "border-ink-700 text-mist-400 hover:text-mist-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Champ
                label={fr ? "Amorti sur" : "Spread over"}
                valeur={params.commandes_amortissement}
                onChange={(v) => set({ commandes_amortissement: v })}
                unite={fr ? "commandes" : "orders"}
                pas={50}
                aide={fr ? "Sur combien de commandes tu étales le coût de production." : "How many orders the production cost is spread over."}
              />
            </Card>
          </div>

          {/* Compte de resultat ----------------------------------------- */}
          <div className="space-y-3">
            <Card className="p-5">
              <h3 className="mb-1 text-sm font-semibold text-mist-100">
                {fr
                  ? `Compte de résultat sur 100 commandes ${cod ? "confirmées" : "payées"}`
                  : `P&L on 100 ${cod ? "confirmed" : "paid"} orders`}
              </h3>
              <p className="mb-3 text-xs text-mist-400">
                {cod
                  ? fr
                    ? `Il faut ${Math.ceil(r.leads_necessaires)} prospects pour obtenir ces 100 commandes, dont ${Math.round(r.commandes_livrees)} seront livrées et payées.`
                    : `You need ${Math.ceil(r.leads_necessaires)} leads to get these 100 orders, of which ${Math.round(r.commandes_livrees)} will be delivered and paid.`
                  : fr
                    ? `Sur ces 100 commandes, ${Math.round(r.commandes_livrees)} sont conservées et ${Math.round(r.commandes_retournees)} remboursées.`
                    : `Of these 100 orders, ${Math.round(r.commandes_livrees)} are kept and ${Math.round(r.commandes_retournees)} refunded.`}
              </p>

              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink-800">
                  <LigneCompte
                    libelle={fr ? "Chiffre d'affaires encaissé" : "Revenue collected"}
                    montant={r.ca_dzd}
                    signe="+"
                    precision={
                      cod
                        ? fr
                          ? `${Math.round(r.commandes_livrees)} colis payés`
                          : `${Math.round(r.commandes_livrees)} parcels paid`
                        : fr
                          ? `${Math.round(r.commandes_livrees)} commandes conservées`
                          : `${Math.round(r.commandes_livrees)} orders kept`
                    }
                  />
                  <LigneCompte
                    libelle={fr ? "Marchandise" : "Goods"}
                    montant={r.cout_marchandise_dzd}
                    signe="−"
                    precision={fr ? `${fmt(r.cout_revient_unitaire_dzd)} l'unité` : `${fmt(r.cout_revient_unitaire_dzd)} per unit`}
                  />
                  {(cod || r.cout_livraison_dzd > 0) && (
                    <LigneCompte libelle={fr ? "Livraison" : "Shipping"} montant={r.cout_livraison_dzd} signe="−" />
                  )}
                  <LigneCompte
                    libelle={cod ? (fr ? "Retours" : "Returns") : fr ? "Remboursements" : "Refunds"}
                    montant={r.cout_retours_dzd}
                    signe="−"
                    precision={
                      cod
                        ? fr
                          ? `${Math.round(r.commandes_retournees)} colis`
                          : `${Math.round(r.commandes_retournees)} parcels`
                        : fr
                          ? `${Math.round(r.commandes_retournees)} commandes`
                          : `${Math.round(r.commandes_retournees)} orders`
                    }
                  />
                  {(cod || r.cout_emballage_dzd > 0) && (
                    <LigneCompte libelle={fr ? "Emballage" : "Packaging"} montant={r.cout_emballage_dzd} signe="−" />
                  )}
                  <LigneCompte
                    libelle={fr ? "Publicité" : "Advertising"}
                    montant={r.cout_pub_dzd}
                    signe="−"
                    precision={
                      cod
                        ? fr
                          ? `${Math.ceil(r.leads_necessaires)} prospects`
                          : `${Math.ceil(r.leads_necessaires)} leads`
                        : fr
                          ? `100 achats à ${fmt(params.cout_par_lead_dzd)}`
                          : `100 purchases at ${fmt(params.cout_par_lead_dzd)}`
                    }
                  />
                  {cod && (
                    <LigneCompte
                      libelle={fr ? "Appels de confirmation" : "Confirmation calls"}
                      montant={r.cout_confirmation_dzd}
                      signe="−"
                    />
                  )}
                  {r.cout_plateforme_dzd > 0 && (
                    <LigneCompte
                      libelle={cod ? (fr ? "Commission plateforme" : "Platform fee") : fr ? "Frais de paiement et boutique" : "Payment & store fees"}
                      montant={r.cout_plateforme_dzd}
                      signe="−"
                    />
                  )}
                  {r.cout_production_dzd > 0 && (
                    <LigneCompte
                      libelle={fr ? "Production des créatives" : "Creative production"}
                      montant={r.cout_production_dzd}
                      signe="−"
                      precision={
                        fr
                          ? `amortie sur ${params.commandes_amortissement}`
                          : `spread over ${params.commandes_amortissement}`
                      }
                    />
                  )}
                  <tr className="border-t-2 border-ink-700">
                    <td className="py-2.5 font-semibold text-mist-100">{fr ? "Profit net" : "Net profit"}</td>
                    <td
                      className={`py-2.5 text-right font-semibold tabular-nums ${
                        rentable ? "text-jade" : "text-rose-warn"
                      }`}
                    >
                      {fmt(r.profit_net_dzd)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
                {cod
                  ? fr
                    ? "Les colis retournés reviennent en stock : leur marchandise n'est pas comptée comme perdue, seuls le transport aller-retour et la casse le sont."
                    : "Returned parcels go back into stock: their goods aren't counted as lost, only the round-trip shipping and breakage are."
                  : fr
                    ? "Une commande remboursée est comptée comme entièrement perdue (marchandise et port). C'est volontairement prudent."
                    : "A refunded order is counted as a full loss (goods and shipping). This is deliberately conservative."}
              </p>
            </Card>

            {algerie ? (
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-semibold text-amber-glow">
                  {fr ? "Wilayas où la livraison coûte plus cher" : "Wilayas where delivery costs more"}
                </h3>
                <p className="mb-2 text-xs leading-relaxed text-mist-400">
                  {fr
                    ? "Sur ces wilayas du sud, ajoute environ 300 à 600 DA au tarif de livraison, ou exclus-les du ciblage tant que la marge n'est pas confortable."
                    : "For these southern wilayas, add about 300 to 600 DA to delivery, or exclude them from targeting until your margin is comfortable."}
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
            ) : (
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-semibold text-amber-glow">
                  {fr ? `Lire ces chiffres : ${pays}` : `Reading these numbers: ${pays}`}
                </h3>
                <ul className="space-y-1.5 text-xs leading-relaxed text-mist-300">
                  <li>
                    {fr
                      ? `Tant que ton ROAS réel reste au-dessus de ${formatRoas(roasSeuil)}, chaque vente te rapporte de l'argent.`
                      : `As long as your real ROAS stays above ${formatRoas(roasSeuil)}, every sale makes you money.`}
                  </li>
                  <li>
                    {fr
                      ? `En test, vise un CPA sous ${fmt(Math.max(0, r.cpa_max_dzd * 0.7))} pour garder une marge de sécurité.`
                      : `While testing, aim for a CPA under ${fmt(Math.max(0, r.cpa_max_dzd * 0.7))} to keep a safety margin.`}
                  </li>
                  <li>
                    {fr
                      ? "Augmenter le panier (lot de 2, accessoire) fait souvent plus pour la marge que baisser le CPA."
                      : "Raising the basket (2-pack, add-on) often does more for margin than cutting CPA."}
                  </li>
                </ul>
              </Card>
            )}

            <Repli titre={fr ? "Hypothèses de l'estimation initiale" : "Assumptions behind the initial estimate"}>
              <Liste items={report.sourcing.estimation.hypotheses} />
            </Repli>
          </div>
        </div>
      </Section>
    </div>
  );
}
