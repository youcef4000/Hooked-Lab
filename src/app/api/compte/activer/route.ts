import { activerCode, journaliser } from "@/lib/codes";
import { trouverParId, versPublic } from "@/lib/comptes";
import { utilisateurCourant } from "@/lib/session";
import { langueCourante } from "@/lib/langue-serveur";
import { viderSauvegardes } from "@/lib/sauvegarde";

/* Saisie d'un code d'activation par un abonne. */

/** Un code fait 8 caracteres : au-dela de quelques essais, c'est du tatonnement. */
const FENETRE_MS = 10 * 60_000;
const MAX_ESSAIS = 8;

type Compteur = { debut: number; nombre: number };
const registre: Map<string, Compteur> =
  (globalThis as { __hklDebitCodes?: Map<string, Compteur> }).__hklDebitCodes ??
  ((globalThis as { __hklDebitCodes?: Map<string, Compteur> }).__hklDebitCodes = new Map());

function tropDEssais(cle: string): boolean {
  const maintenant = Date.now();
  const c = registre.get(cle);
  if (!c || maintenant - c.debut > FENETRE_MS) {
    registre.set(cle, { debut: maintenant, nombre: 1 });
    if (registre.size > 5000) registre.clear();
    return false;
  }
  c.nombre++;
  return c.nombre > MAX_ESSAIS;
}

export async function POST(requete: Request): Promise<Response> {
  const fr = (await langueCourante()) === "fr";
  const u = await utilisateurCourant();
  if (!u) {
    return Response.json({ ok: false, message: fr ? "Connecte-toi d'abord." : "Please sign in first." }, { status: 401 });
  }

  // Le comptage est par compte, pas par adresse IP : plusieurs abonnes
  // peuvent partager une connexion, et l'un ne doit pas bloquer l'autre.
  if (tropDEssais(u.id)) {
    return Response.json(
      { ok: false, message: fr ? "Trop de tentatives. Réessaie dans dix minutes." : "Too many attempts. Try again in ten minutes." },
      { status: 429 },
    );
  }

  let corps: { code?: string };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: fr ? "Requête illisible." : "Unreadable request." }, { status: 400 });
  }

  const resultat = activerCode(String(corps.code ?? ""), u.id, fr ? "fr" : "en");
  if (!resultat.ok) {
    return Response.json({ ok: false, message: resultat.message }, { status: 422 });
  }

  await viderSauvegardes(10_000);
  journaliser("code_active", {
    utilisateur: u.id,
    email: u.email,
    credits: resultat.credits,
    palier: resultat.palier,
  });

  const apres = trouverParId(u.id);
  return Response.json({
    ok: true,
    credits: resultat.credits,
    palier: resultat.palier,
    utilisateur: apres ? versPublic(apres) : null,
  });
}
