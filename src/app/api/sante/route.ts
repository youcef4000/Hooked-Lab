import { accessSync, constants } from "node:fs";
import { DATA_DIR, ensureDir } from "@/lib/paths";
import { verifierReglages } from "@/lib/demarrage";

export const dynamic = "force-dynamic";

/* ============================================================================
   Sonde de sante pour l'hebergeur.

   Le Worker Cloudflare l'appelle toutes les quelques minutes (tache planifiee)
   pour garder le conteneur eveille : le premier visiteur n'attend jamais un
   demarrage a froid.

   Elle ne verifie que ce qui fait tomber le service : le processus repond,
   et le disque de donnees est accessible en ecriture. Jamais d'appel a une
   API payante ici — a ce rythme, la sonde couterait plus cher que les
   clients. Le diagnostic complet reste sur /api/diagnostic.
   ========================================================================== */

export function GET(requete: Request): Response {
  // Reglages publies depuis le demarrage (voir cloudflare/worker.ts) : redemarrage propre.
  verifierReglages(requete.headers.get("x-hkl-config"));
  try {
    ensureDir(DATA_DIR);
    accessSync(DATA_DIR, constants.W_OK);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, message: "Dossier de données inaccessible en écriture." },
      { status: 503 },
    );
  }
}
