/** Configuration centralisee, lue depuis .env.local avec des valeurs par defaut sures. */

/** Profondeur de raisonnement du modele : premier levier sur la duree d'analyse. */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    /**
     * claude-sonnet-5 par defaut : c est ce qui rend la grille tarifaire
     * viable (33 DA de cout par analyse video contre 159 DA avec opus-5).
     * Passer a claude-opus-5 pour une analyse plus fouillee, en sachant que
     * la marge des paliers Essentiel et Pro devient negative.
     */
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    /**
     * Force le meme niveau d effort sur tous les appels. Vide = chaque etape
     * garde le niveau choisi pour elle (voir analysis.ts), meilleur compromis
     * vitesse/qualite. Monter a "high" rend l analyse plus fouillee mais
     * nettement plus lente.
     */
    effort: (process.env.ANTHROPIC_EFFORT?.trim() || "") as Effort | "",
  },
  transcriber: (process.env.TRANSCRIBER || "auto") as
    | "auto"
    | "local"
    | "groq"
    | "openai"
    | "none",
  whisperLocalModel: process.env.WHISPER_LOCAL_MODEL || "Xenova/whisper-small",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  maxFrames: Math.min(40, num(process.env.MAX_FRAMES, 20)),
  maxVideoSeconds: num(process.env.MAX_VIDEO_SECONDS, 180),
  cookiesFromBrowser: process.env.YTDLP_COOKIES_FROM_BROWSER?.trim() || "",

  fx: {
    official: num(process.env.USD_TO_DZD_OFFICIAL, 132),
    parallel: num(process.env.USD_TO_DZD_PARALLEL, 252),
  },
};

export function assertAnthropicKey(): void {
  if (!config.anthropic.apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY manquante. Ouvre le fichier .env.local a la racine du projet, " +
        "colle ta cle apres ANTHROPIC_API_KEY= (elle se cree sur console.anthropic.com/settings/keys), " +
        "puis relance `npm run dev`.",
    );
  }
}
