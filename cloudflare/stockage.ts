/* ============================================================================
   Pont entre le conteneur et le bucket R2.

   Le conteneur ne detient aucune cle : il appelle http://stockage.internal,
   et le Worker intercepte ces requetes (outboundByHost) pour les traduire en
   operations R2. Ce pont n'est joignable que depuis le conteneur : une
   requete venue d'internet n'arrive jamais ici.

   Protocole (voir src/lib/sauvegarde.ts, cote conteneur) :
     GET    /objet?cle=...           lire un fichier
     PUT    /objet?cle=...           ecrire un fichier (corps brut)
     DELETE /objet?cle=...           supprimer un fichier
     GET    /liste?prefixe=&curseur= lister, par pages de 1000
     DELETE /dossier?prefixe=a/b/    supprimer tout un dossier

   Ecrit sans dependance aux types Workers pour pouvoir etre teste sous Node
   avec un faux bucket.
   ========================================================================== */

/** Ce que ce pont utilise d'un bucket R2. */
export interface Seau {
  get(cle: string): Promise<{ body: ReadableStream; size: number } | null>;
  put(cle: string, valeur: ReadableStream | ArrayBuffer): Promise<unknown>;
  delete(cles: string | string[]): Promise<void>;
  list(options: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: { key: string; size: number }[];
    truncated: boolean;
    cursor?: string;
  }>;
}

/** Une cle sure : un chemin relatif simple, sans remontee ni caractere exotique. */
function cleValide(cle: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._\-/]{0,1023}$/.test(cle) && !cle.includes("..") && !cle.includes("//");
}

function json(donnees: unknown, status = 200): Response {
  return new Response(JSON.stringify(donnees), { status, headers: { "content-type": "application/json" } });
}

/** Corps d'ecriture : un flux de longueur connue quand c'est possible, sinon en memoire. */
async function corpsEcriture(requete: Request): Promise<ReadableStream | ArrayBuffer> {
  const longueur = Number(requete.headers.get("content-length"));
  const Fixe = (globalThis as { FixedLengthStream?: new (n: number) => TransformStream }).FixedLengthStream;
  if (requete.body && Fixe && Number.isFinite(longueur) && longueur > 0) {
    const { readable, writable } = new Fixe(longueur);
    void requete.body.pipeTo(writable);
    return readable;
  }
  return requete.arrayBuffer();
}

export async function gererStockage(requete: Request, seau: Seau): Promise<Response> {
  const url = new URL(requete.url);
  const methode = requete.method.toUpperCase();

  if (url.pathname === "/objet") {
    const cle = url.searchParams.get("cle") ?? "";
    if (!cleValide(cle)) return json({ erreur: "cle invalide" }, 400);

    if (methode === "GET") {
      const objet = await seau.get(cle);
      if (!objet) return json({ erreur: "introuvable" }, 404);
      return new Response(objet.body, {
        headers: { "content-length": String(objet.size), "content-type": "application/octet-stream" },
      });
    }
    if (methode === "PUT") {
      await seau.put(cle, await corpsEcriture(requete));
      return json({ ok: true });
    }
    if (methode === "DELETE") {
      await seau.delete(cle);
      return json({ ok: true });
    }
  }

  if (url.pathname === "/liste" && methode === "GET") {
    const prefixe = url.searchParams.get("prefixe") ?? "";
    const curseur = url.searchParams.get("curseur") || undefined;
    if (prefixe && !cleValide(prefixe)) return json({ erreur: "prefixe invalide" }, 400);
    const page = await seau.list({ prefix: prefixe || undefined, cursor: curseur, limit: 1000 });
    return json({
      objets: page.objects.map((o) => ({ cle: o.key, taille: o.size })),
      curseur: page.truncated ? (page.cursor ?? null) : null,
    });
  }

  if (url.pathname === "/dossier" && methode === "DELETE") {
    const prefixe = url.searchParams.get("prefixe") ?? "";
    // Jamais de suppression globale : un dossier precis, termine par "/".
    if (!cleValide(prefixe) || !prefixe.endsWith("/") || prefixe.split("/").length < 3) {
      return json({ erreur: "prefixe invalide" }, 400);
    }
    let supprimes = 0;
    for (let tour = 0; tour < 100; tour++) {
      const page = await seau.list({ prefix: prefixe, limit: 1000 });
      if (page.objects.length === 0) break;
      await seau.delete(page.objects.map((o) => o.key));
      supprimes += page.objects.length;
      if (!page.truncated) break;
    }
    return json({ ok: true, supprimes });
  }

  return json({ erreur: "route inconnue" }, 404);
}
