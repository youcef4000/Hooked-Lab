import { accessSync, constants } from "node:fs";
import { DATA_DIR, ensureDir } from "@/lib/paths";

export const dynamic = "force-dynamic";

/* ============================================================================
   Sonde de sante pour l'hebergeur.

   Render interroge cette adresse toutes les quelques secondes : si elle ne
   repond plus, il redemarre l'application ; pendant une mise a jour, il
   attend qu'elle reponde avant de basculer le trafic sur la nouvelle version.

   Elle ne verifie que ce qui fait tomber le service : le processus repond,
   et le disque de donnees est accessible en ecriture. Jamais d'appel a une
   API payante ici — a ce rythme, la sonde couterait plus cher que les
   clients. Le diagnostic complet reste sur /api/diagnostic.
   ========================================================================== */

export function GET(): Response {
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
