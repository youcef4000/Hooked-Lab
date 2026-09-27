import { deposerCommande } from "@/lib/commandes";
import { creerLimiteur, ipClient } from "@/lib/limiteur";

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

const TAILLE_MAX = 4096;
const tropDeRequetes = creerLimiteur("commandes", 60_000, 12);

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
  if (tropDeRequetes(ipClient(requete))) {
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
