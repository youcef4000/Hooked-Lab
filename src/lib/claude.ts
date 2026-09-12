import Anthropic from "@anthropic-ai/sdk";
import { config, assertAnthropicKey, type Effort } from "./config";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  assertAnthropicKey();
  if (!client) client = new Anthropic({ apiKey: config.anthropic.apiKey });
  return client;
}

/** Tarifs publics par million de tokens, pour l'estimation de cout affichee. */
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-5": { in: 5, out: 25 },
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
};

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  usd_estime: number;
}

export function estimateCost(model: string, input: number, output: number): number {
  const p = PRICING[model] ?? PRICING["claude-opus-5"];
  return (input / 1_000_000) * p.in + (output / 1_000_000) * p.out;
}

export interface ImagePart {
  base64: string;
  mediaType: "image/jpeg" | "image/png";
  legende: string;
}

export interface AskOptions {
  system: string;
  /** Blocs texte du tour utilisateur, envoyes apres les images. */
  texte: string;
  images?: ImagePart[];
  /** Schema JSON qui contraint la reponse (structured outputs). */
  schema: Record<string, unknown>;
  maxTokens?: number;
  /** Le contenu stable place avant ce point est mis en cache. */
  cacheSystem?: boolean;
  /**
   * Profondeur de raisonnement. C est le principal levier sur la duree : une
   * extraction guidee par schema n a pas besoin du meme effort qu une analyse
   * strategique. Par defaut "low", tres solide sur Claude Opus 5.
   */
  effort?: Effort;
  /**
   * Met les images en cache pour que l appel suivant qui envoie les memes
   * n ait pas a les retraiter.
   */
  cacheImages?: boolean;
}

/** Erreur portant un message deja lisible par un utilisateur non technique. */
export class ClaudeError extends Error {}

function humanize(err: unknown): ClaudeError {
  if (err instanceof Anthropic.BadRequestError && err.message.includes("credit balance")) {
    return new ClaudeError(
      "Credit Anthropic epuise. Recharge ton compte sur console.anthropic.com > Plans & Billing, puis relance l analyse.",
    );
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new ClaudeError(
      "Cle ANTHROPIC_API_KEY invalide ou revoquee. Verifie .env.local sur console.anthropic.com.",
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new ClaudeError(
      "Limite de debit Anthropic atteinte. Attends une minute puis relance l'analyse.",
    );
  }
  if (err instanceof Anthropic.NotFoundError) {
    return new ClaudeError(
      `Modele "${config.anthropic.model}" introuvable. Corrige ANTHROPIC_MODEL dans .env.local ` +
        "(par ex. claude-opus-5 ou claude-sonnet-5).",
    );
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new ClaudeError("Connexion a l'API Anthropic impossible. Verifie ta connexion internet.");
  }
  if (err instanceof Anthropic.APIError) {
    return new ClaudeError(`Erreur API Anthropic (${err.status}) : ${err.message}`);
  }
  return new ClaudeError(`Appel a Claude echoue : ${(err as Error).message}`);
}

/** true si l'erreur vient du drapeau beta "fallbacks" plutot que de la requete elle-meme. */
function isFallbackBetaError(err: unknown): boolean {
  if (!(err instanceof Anthropic.BadRequestError)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("fallback") || msg.includes("beta");
}

let fallbacksEnabled = true;

/**
 * Vrai pour les pannes passageres : coupure de flux, connexion perdue, surcharge
 * momentanee de l API. Ces erreurs meritent une nouvelle tentative ; un schema
 * invalide ou une cle erronee, non.
 */
function estTransitoire(err: unknown): boolean {
  if (err instanceof Anthropic.APIConnectionError) return true;
  if (err instanceof Anthropic.RateLimitError) return true;
  if (err instanceof Anthropic.InternalServerError) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("terminated") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up") ||
    msg.includes("fetch failed") ||
    msg.includes("other side closed") ||
    msg.includes("timeout")
  );
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Un appel a Claude dont la sortie est contrainte par un schema JSON.
 *
 * Notes importantes sur claude-opus-5 :
 *  - le raisonnement est actif par defaut et consomme le meme budget que la
 *    reponse : d'ou un max_tokens genereux et le streaming, sinon le JSON est
 *    tronque en plein milieu ;
 *  - temperature / top_p / top_k sont rejetes par l'API (400) : le pilotage se
 *    fait uniquement par le prompt.
 */
export async function askStructured<T>(opts: AskOptions): Promise<{ data: T; usage: Usage }> {
  const anthropic = getClient();
  const model = config.anthropic.model;
  const maxTokens = opts.maxTokens ?? 32000;

  const images = opts.images ?? [];
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];

  images.forEach((img, i) => {
    content.push({ type: "text", text: img.legende });
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
      // Marqueur sur la derniere image : le prefixe systeme + images devient
      // reutilisable par l appel suivant qui envoie exactement les memes.
      ...(opts.cacheImages && i === images.length - 1
        ? { cache_control: { type: "ephemeral" as const } }
        : {}),
    });
  });

  content.push({ type: "text", text: opts.texte });

  const params = {
    model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text" as const,
        text: opts.system,
        // Le prompt systeme est identique d'une analyse a l'autre : on le met en cache.
        ...(opts.cacheSystem === false ? {} : { cache_control: { type: "ephemeral" as const } }),
      },
    ],
    output_config: {
      effort: config.anthropic.effort || opts.effort || "low",
      format: { type: "json_schema" as const, schema: opts.schema },
    },
    messages: [{ role: "user" as const, content }],
  };

  const run = async (withFallbacks: boolean) => {
    const stream = anthropic.beta.messages.stream({
      ...params,
      ...(withFallbacks
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });
    return stream.finalMessage();
  };

  // Une analyse complete enchaine cinq appels longs et couteux : une coupure
  // reseau sur le dernier ne doit pas perdre tout le travail deja paye.
  const TENTATIVES = 3;
  let message: Anthropic.Beta.BetaMessage | undefined;
  let derniere: unknown;

  for (let essai = 1; essai <= TENTATIVES; essai++) {
    try {
      message = await run(fallbacksEnabled);
      break;
    } catch (err) {
      derniere = err;

      // Le repli serveur est un beta : si le compte n'y a pas acces, on rejoue sans.
      if (fallbacksEnabled && isFallbackBetaError(err)) {
        fallbacksEnabled = false;
        essai--;
        continue;
      }

      if (!estTransitoire(err) || essai === TENTATIVES) throw humanize(err);
      await attendre(essai * 3000);
    }
  }

  if (!message) throw humanize(derniere);

  if (message.stop_reason === "refusal") {
    throw new ClaudeError(
      "Claude a refuse d'analyser cette video (filtre de securite). " +
        "Essaie une autre creative, ou verifie que le contenu est bien commercial.",
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new ClaudeError(
      "La reponse de Claude a ete tronquee (limite de tokens atteinte). " +
        "Reduis MAX_FRAMES dans .env.local puis relance.",
    );
  }

  const texte = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!texte) {
    throw new ClaudeError("Claude n'a renvoye aucun contenu exploitable.");
  }

  let data: T;
  try {
    data = JSON.parse(texte) as T;
  } catch {
    throw new ClaudeError(
      "Reponse de Claude illisible (JSON invalide). Relance l'analyse ; " +
        "si le probleme persiste, reduis MAX_FRAMES.",
    );
  }

  const input = message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0);
  const output = message.usage.output_tokens;

  return {
    data,
    usage: { input_tokens: input, output_tokens: output, usd_estime: estimateCost(model, input, output) },
  };
}
