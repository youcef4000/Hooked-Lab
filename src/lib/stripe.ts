import { createHmac, timingSafeEqual } from "node:crypto";
import type { Devise } from "./tarifs";

/* ============================================================================
   Paiement par carte, via Stripe Checkout.

   La page de paiement est hebergee par Stripe : aucun numero de carte ne
   transite par ce serveur. Elle accepte Visa et Mastercard — y compris les
   cartes RedotPay —, Apple Pay et Google Pay selon ce qui est active dans
   le tableau de bord Stripe.

   Le credit n'est JAMAIS accorde sur la page de retour (un client pourrait
   l'ouvrir sans avoir paye) : seulement sur l'evenement signe que Stripe
   envoie au webhook, une fois le paiement confirme.

   Appels REST directs plutot que le SDK : deux requetes et une signature,
   pas de dependance supplementaire a maintenir.
   ========================================================================== */

const API = "https://api.stripe.com/v1";

export function paiementCarteActif(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

/** Encode un objet imbrique au format attendu par l'API Stripe (a[b][0][c]=...). */
function encoder(obj: Record<string, unknown>, prefixe = "", sortie = new URLSearchParams()): URLSearchParams {
  for (const [cle, valeur] of Object.entries(obj)) {
    if (valeur === undefined || valeur === null) continue;
    const nom = prefixe ? `${prefixe}[${cle}]` : cle;
    if (typeof valeur === "object") encoder(valeur as Record<string, unknown>, nom, sortie);
    else sortie.append(nom, String(valeur));
  }
  return sortie;
}

export interface Achat {
  /** Libelle vu par le client sur la page de paiement et son releve. */
  libelle: string;
  description: string;
  /** Montant en unites (19 = 19 $), converti en centimes ici. */
  montant: number;
  devise: Devise;
  utilisateurId: string;
  email: string;
  /** Ce que le webhook devra accorder : relu tel quel, jamais recalcule cote client. */
  metadonnees: Record<string, string>;
  urlSucces: string;
  urlAnnulation: string;
}

export async function creerSessionPaiement(achat: Achat): Promise<{ url: string; id: string }> {
  const cle = process.env.STRIPE_SECRET_KEY?.trim();
  if (!cle) throw new Error("Paiement par carte non configuré.");

  const corps = encoder({
    mode: "payment",
    client_reference_id: achat.utilisateurId,
    customer_email: achat.email,
    success_url: achat.urlSucces,
    cancel_url: achat.urlAnnulation,
    locale: "auto",
    line_items: {
      0: {
        quantity: 1,
        price_data: {
          currency: achat.devise.toLowerCase(),
          unit_amount: Math.round(achat.montant * 100),
          product_data: { name: achat.libelle, description: achat.description },
        },
      },
    },
    metadata: { ...achat.metadonnees, utilisateurId: achat.utilisateurId },
    payment_intent_data: { metadata: { ...achat.metadonnees, utilisateurId: achat.utilisateurId } },
  });

  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: corps,
  });
  const donnees = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !donnees.url || !donnees.id) {
    console.error("[stripe] creation de session refusee :", donnees.error?.message ?? res.status);
    throw new Error("Le paiement par carte est momentanément indisponible.");
  }
  return { url: donnees.url, id: donnees.id };
}

/**
 * Verifie l'en-tete Stripe-Signature (t=horodatage,v1=signature) : HMAC
 * SHA-256 de "horodatage.corps" avec le secret du webhook. Refuse les
 * evenements de plus de cinq minutes, pour qu'un evenement intercepte ne
 * puisse pas etre rejoue plus tard.
 */
export function signatureValide(corps: string, entete: string | null, secret: string): boolean {
  if (!entete || !secret) return false;
  const parties = new Map<string, string[]>();
  for (const morceau of entete.split(",")) {
    const [k, v] = morceau.split("=");
    if (!k || !v) continue;
    parties.set(k.trim(), [...(parties.get(k.trim()) ?? []), v.trim()]);
  }
  const t = parties.get("t")?.[0];
  const signatures = parties.get("v1") ?? [];
  if (!t || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const attendue = Buffer.from(createHmac("sha256", secret).update(`${t}.${corps}`).digest("hex"));
  return signatures.some((s) => {
    const recue = Buffer.from(s);
    return recue.length === attendue.length && timingSafeEqual(recue, attendue);
  });
}
