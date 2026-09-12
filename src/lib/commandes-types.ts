/* ============================================================================
   Types et libelles des commandes, sans aucune dependance Node.

   Ce module est importe par des composants clients. Le module commandes.ts,
   lui, lit et ecrit sur le disque : tout ce qui doit voyager jusqu'au
   navigateur vit donc ici, sinon le bundler embarque node:fs et la
   compilation echoue.
   ========================================================================== */

export const STATUTS = [
  "nouvelle",
  "confirmee",
  "expediee",
  "livree",
  "retournee",
  "annulee",
] as const;

export type StatutCommande = (typeof STATUTS)[number];

export const LIBELLE_STATUT: Record<StatutCommande, string> = {
  nouvelle: "À confirmer",
  confirmee: "Confirmée",
  expediee: "Expédiée",
  livree: "Livrée",
  retournee: "Retournée",
  annulee: "Annulée",
};

export interface Commande {
  id: string;
  recueLe: string;
  statut: StatutCommande;
  produit: string;
  nom: string;
  telephone: string;
  wilaya_code: string;
  wilaya: string;
  commune: string;
  livraison: string;
  frais_livraison: number;
  prix_produit: number;
  total: number;
  /** Page d'ou vient la commande : utile pour comparer deux landings. */
  page: string;
  /** Note libre du confirmateur. */
  note?: string;
}

/** Normalise un numero algerien : 10 chiffres, prefixe 05/06/07. */
export function normaliserTelephone(brut: string): string {
  let n = String(brut).replace(/[\s.\-()]/g, "");
  if (n.startsWith("+213")) n = "0" + n.slice(4);
  else if (n.startsWith("00213")) n = "0" + n.slice(5);
  else if (n.startsWith("213") && n.length === 12) n = "0" + n.slice(3);
  return n;
}

export function telephoneValide(brut: string): boolean {
  return /^0[567]\d{8}$/.test(normaliserTelephone(brut));
}
