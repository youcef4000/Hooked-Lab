import { deposerCommande } from "@/lib/commandes";

/* ============================================================================
   Reception des commandes envoyees par les formulaires.

   Cette route est publique par necessite : le formulaire vit sur la boutique
   du vendeur, donc sur un autre domaine. Elle n'expose rien en lecture — on
   ne peut qu'y deposer — et tout ce qui entre est revalide et borne.

   Un compteur par IP freine les envois en rafale. Il vit en memoire : il
   disparait au redemarrage et ne suit pas plusieurs instances. C'est un
   ralentisseur, pas une protection ; le jour ou l'application est exposee
   pour de bon, ce role revient au reverse proxy ou a Cloudflare.
   ========================================================================== */

const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 12;
const TAILLE_MAX = 4096;

type Compteur = { debut: number; nombre: number };

// globalThis : survit au rechargement a chaud du serveur de developpement.
const registre: Map<string, Compteur> =
  (globalThis as { __cldzDebitCommandes?: Map<string, Compteur> }).__cldzDebitCommandes ??
  ((globalThis as { __cldzDebitCommandes?: Map<string, Compteur> }).__cldzDebitCommandes = new Map());

function tropDeRequetes(ip: string): boolean {
  const maintenant = Date.now();
  const c = registre.get(ip);
  if (!c || maintenant - c.debut > FENETRE_MS) {
    registre.set(ip, { debut: maintenant, nombre: 1 });
    if (registre.size > 5000) registre.clear(); // garde-fou memoire
    return false;
  }
  c.nombre++;
  return c.nombre > MAX_PAR_FENETRE;
}

const ENTETES_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function reponse(corps: unknown, statut: number): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { "Content-Type": "application/json; charset=utf-8", ...ENTETES_CORS },
  });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: ENTETES_CORS });
}

export async function POST(requete: Request): Promise<Response> {
  const ip =
    requete.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    requete.headers.get("x-real-ip") ||
    "inconnue";

  if (tropDeRequetes(ip)) {
    return reponse({ ok: false, message: "Trop de tentatives. Réessayez dans une minute." }, 429);
  }

  let brut: unknown;
  try {
    const texte = await requete.text();
    if (texte.length > TAILLE_MAX) {
      return reponse({ ok: false, message: "Requête trop volumineuse." }, 413);
    }
    brut = JSON.parse(texte);
  } catch {
    return reponse({ ok: false, message: "Requête illisible." }, 400);
  }

  const resultat = deposerCommande(brut);
  if (!resultat.ok) return reponse({ ok: false, message: resultat.message }, 422);

  return reponse({ ok: true, id: resultat.commande?.id }, 201);
}
