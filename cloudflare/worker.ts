/* ============================================================================
   Hooked Lab sur Cloudflare.

   Le Worker est la porte d'entree du site (hooked-lab.com). Il transmet
   chaque requete a un conteneur unique, "principal", qui fait tourner
   l'application Next.js avec ffmpeg et yt-dlp — ce qu'un Worker seul ne
   peut pas faire.

   Trois responsabilites ici :
   - donner au conteneur ses reglages et ses secrets (envVars) ;
   - lui ouvrir le bucket R2 via une adresse interne, sans lui confier de cle
     (outboundByHost, voir stockage.ts) ;
   - le garder eveille (tache planifiee toutes les 5 minutes) pour qu'aucun
     visiteur n'attende un demarrage a froid ;
   - lui signaler quand ses reglages ont change : un secret ajoute apres coup
     (cle Stripe, pixel...) n'atteint pas un conteneur deja lance. Chaque
     requete porte l'empreinte des reglages actuels (x-hkl-config) ; si elle
     differe de celle recue au demarrage, l'application finit ses analyses,
     sauvegarde tout dans R2 et redemarre avec les nouveaux reglages.

   Les secrets (cles API, mots de passe) se saisissent dans le tableau de
   bord Cloudflare : Workers & Pages → hooked-lab → Settings → Variables and
   Secrets. Ils ne sont jamais dans le depot.
   ========================================================================== */

import { Container, getContainer } from "@cloudflare/containers";
import { env as envGlobal } from "cloudflare:workers";
import { gererStockage, type Seau } from "./stockage";

// Exige par la bibliotheque pour intercepter les requetes sortantes du
// conteneur (le pont vers R2, voir outboundByHost plus bas).
export { ContainerProxy } from "@cloudflare/containers";

interface Env {
  HOOKED_LAB: DurableObjectNamespace<HookedLab>;
  DONNEES: R2Bucket;
  SITE_URL?: string;
}

/** Hote interne intercepte : le conteneur y parle a R2. */
const HOTE_STOCKAGE = "stockage.internal";

/** Reglages et secrets transmis tels quels au conteneur, quand ils existent. */
const TRANSMISES = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_EFFORT",
  "GROQ_API_KEY",
  "OPENAI_API_KEY",
  "TRANSCRIBER",
  "ADMIN_MOT_DE_PASSE",
  "ADMIN_SECRET",
  "SESSION_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "META_PIXEL_ID",
  "TIKTOK_PIXEL_ID",
  "SITE_URL",
  "MAX_ANALYSES_SIMULTANEES",
  "MAX_VIDEO_SECONDS",
  "MAX_FRAMES",
  "USD_TO_EUR",
  "USD_TO_GBP",
  "USD_TO_AUD",
  "USD_TO_DZD_OFFICIAL",
  "USD_TO_DZD_PARALLEL",
] as const;

/** Empreinte courte et stable (FNV-1a 32 bits) d'un jeu de reglages. */
function empreinte(variables: Record<string, string>): string {
  const texte = JSON.stringify(Object.entries(variables).sort(([a], [b]) => a.localeCompare(b)));
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function reglages(): Record<string, string> {
  const source = envGlobal as unknown as Record<string, unknown>;
  const variables: Record<string, string> = {
    NODE_ENV: "production",
    PORT: "3000",
    HOSTNAME: "0.0.0.0",
    DATA_DIR: "/app/data",
    STOCKAGE_URL: `http://${HOTE_STOCKAGE}`,
    // L'application gere l'arret : elle finit les analyses en cours et vide
    // sa sauvegarde R2 avant de s'eteindre (Cloudflare laisse 15 minutes).
    NEXT_MANUAL_SIG_HANDLE: "true",
    DELAI_ARRET_S: "780",
    TRANSCRIBER: "groq",
  };
  for (const nom of TRANSMISES) {
    const valeur = source[nom];
    if (typeof valeur === "string" && valeur.trim()) variables[nom] = valeur.trim();
  }
  return variables;
}

/** Reglages transmis au conteneur, avec leur empreinte. */
function variablesConteneur(): Record<string, string> {
  const variables = reglages();
  return { ...variables, CONFIG_EMPREINTE: empreinte(variables) };
}

export class HookedLab extends Container<Env> {
  defaultPort = 3000;
  // La tache planifiee le reveille toutes les 5 minutes : il ne s'endort
  // que si elle cesse (Worker supprime, par exemple).
  sleepAfter = "30m";
  envVars = variablesConteneur();

  static outboundByHost = {
    [HOTE_STOCKAGE]: (requete: Request, env: unknown) =>
      gererStockage(requete, (env as Env).DONNEES as unknown as Seau),
  };

  override onError(erreur: unknown): void {
    console.error("[conteneur] erreur :", erreur);
  }
}

/** L'unique conteneur : toutes les requetes voient les memes comptes et la meme file d'analyses. */
function conteneur(env: Env) {
  return getContainer(env.HOOKED_LAB, "principal");
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    const url = new URL(requete.url);

    // www.hooked-lab.com -> hooked-lab.com : une seule adresse officielle.
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    // L'application doit connaitre l'adresse publique et la vraie IP du
    // visiteur (limites anti-abus). On ecrase ce que le visiteur aurait pu
    // envoyer lui-meme dans ces en-tetes.
    const entetes = new Headers(requete.headers);
    entetes.set("x-forwarded-host", url.host);
    entetes.set("x-forwarded-proto", url.protocol.replace(":", ""));
    const ip = requete.headers.get("cf-connecting-ip");
    if (ip) entetes.set("x-forwarded-for", ip);
    entetes.set("x-hkl-config", empreinte(reglages()));

    return conteneur(env).fetch(new Request(requete, { headers: entetes }));
  },

  async scheduled(_evenement: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const adresse = `${(env.SITE_URL ?? "https://hooked-lab.com").replace(/\/+$/, "")}/api/sante`;
    ctx.waitUntil(
      conteneur(env)
        .fetch(new Request(adresse, { headers: { "x-hkl-config": empreinte(reglages()) } }))
        .then(() => undefined)
        .catch((err: unknown) => console.error("[reveil] sonde en echec :", err)),
    );
  },
} satisfies ExportedHandler<Env>;
