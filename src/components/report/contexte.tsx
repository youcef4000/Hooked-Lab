"use client";

import { createContext, useContext } from "react";
import { useLangue } from "../Langue";
import { formatMontant, marche as trouverMarche, type Marche, type MarcheId } from "@/lib/marches";
import type { Langue } from "@/lib/langue";

/* ============================================================================
   Contexte d'un rapport : pour quel marche il a ete fait, dans quelle langue
   on l'affiche. Chaque onglet s'en sert pour formater les montants dans la
   devise du marche et adapter ses libelles (COD ou paiement d'avance).

   Les libelles suivent la langue choisie par le lecteur ; le contenu genere
   par l'IA reste dans la langue ou il a ete produit.
   ========================================================================== */

interface ContexteRapport {
  marche: Marche;
  langue: Langue;
  fr: boolean;
  /** Paiement a la livraison : confirmation telephonique, taux de livraison. */
  cod: boolean;
  /** Montant dans la devise du marche du rapport. */
  fmt: (n: number) => string;
  /** Nom court du marche (sans la precision entre parentheses). */
  pays: string;
  /** Symbole court de la devise, pour les unites des champs. */
  symbole: string;
}

const SYMBOLES: Record<Marche["devise"], string> = { DZD: "DA", USD: "$", EUR: "€", GBP: "£", AUD: "A$" };

function nomCourt(m: Marche, langue: Langue): string {
  return m.nom[langue].replace(/\s*\(.*\)$/, "");
}

const Contexte = createContext<ContexteRapport | null>(null);

export function RapportProvider({ marcheId, children }: { marcheId?: MarcheId; children: React.ReactNode }) {
  const langue = useLangue();
  const m = trouverMarche(marcheId);
  return (
    <Contexte.Provider
      value={{
        marche: m,
        langue,
        fr: langue === "fr",
        cod: m.modele === "cod",
        fmt: (n: number) => formatMontant(n, m.devise, langue),
        pays: nomCourt(m, langue),
        symbole: SYMBOLES[m.devise],
      }}
    >
      {children}
    </Contexte.Provider>
  );
}

export function useRapport(): ContexteRapport {
  const c = useContext(Contexte);
  const langue = useLangue();
  if (c) return c;
  // Hors rapport (ne devrait pas arriver) : Algerie, comme les rapports anciens.
  const m = trouverMarche("dz");
  return {
    marche: m,
    langue,
    fr: langue === "fr",
    cod: true,
    fmt: (n) => formatMontant(n, m.devise, langue),
    pays: nomCourt(m, langue),
    symbole: SYMBOLES[m.devise],
  };
}

/** Nom affiche de la plateforme d'origine. */
export function nomPlateforme(p: string, fr: boolean): string {
  const noms: Record<string, [string, string]> = {
    tiktok: ["TikTok", "TikTok"],
    instagram: ["Instagram", "Instagram"],
    facebook: ["Facebook", "Facebook"],
    youtube: ["YouTube", "YouTube"],
    fichier: ["Vidéo déposée", "Uploaded video"],
    image: ["Image déposée", "Uploaded image"],
    autre: ["Autre", "Other"],
  };
  const n = noms[p];
  return n ? n[fr ? 0 : 1] : p;
}

/** Niveau de production percu : "ugc", "semi_pro", "pro". */
export function niveauProduction(v: string, fr: boolean): string {
  if (v === "ugc") return "UGC";
  if (v === "semi_pro") return fr ? "Semi-pro" : "Semi-pro";
  if (v === "pro") return fr ? "Pro" : "Pro";
  return v;
}
