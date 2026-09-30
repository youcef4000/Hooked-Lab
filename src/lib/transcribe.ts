import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { config } from "./config";
import { DATA_DIR } from "./paths";
import type { Transcript, TranscriptSegment } from "@/types/analysis";

/* ------------------------------------------------------------ sous-titres */

function vttTimeToSeconds(stamp: string): number {
  const parts = stamp.trim().replace(",", ".").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(stamp) || 0;
}

/** Les sous-titres auto de TikTok sont deja alignes : c'est la meilleure source. */
export function parseVtt(content: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const blocks = content.replace(/\r/g, "").split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const cueIndex = lines.findIndex((l) => l.includes("-->"));
    if (cueIndex === -1) continue;

    const [rawStart, rawEnd] = lines[cueIndex].split("-->");
    if (!rawStart || !rawEnd) continue;

    const texte = lines
      .slice(cueIndex + 1)
      // retire les balises de karaoke <00:00:01.200><c> ... </c>
      .map((l) => l.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!texte) continue;
    const start = vttTimeToSeconds(rawStart);
    const end = vttTimeToSeconds(rawEnd.split(/\s+/)[0]);

    // Les pistes auto repetent souvent la ligne precedente en fin de bloc.
    const last = segments[segments.length - 1];
    if (last && last.texte === texte) {
      last.end = end;
      continue;
    }
    segments.push({ start, end, texte });
  }
  return segments;
}

function langFromSubtitleFile(file: string): string | undefined {
  const m = path.basename(file).match(/^video\.([a-z-]+)\.vtt$/i);
  return m?.[1];
}

function fromSubtitles(subtitlePaths: string[]): Transcript | null {
  // Ordre de preference : arabe (darija), francais, anglais, puis le reste.
  const score = (f: string) => {
    const lang = langFromSubtitleFile(f) ?? "";
    if (lang.startsWith("ar")) return 0;
    if (lang.startsWith("fr")) return 1;
    if (lang.startsWith("en")) return 2;
    return 3;
  };
  const ordered = [...subtitlePaths].sort((a, b) => score(a) - score(b));

  for (const file of ordered) {
    if (!existsSync(file)) continue;
    const segments = parseVtt(readFileSync(file, "utf8"));
    const texte = segments.map((s) => s.texte).join(" ").trim();
    if (texte.length >= 20) {
      return {
        source: "sous-titres",
        langue: langFromSubtitleFile(file),
        texte,
        segments,
        note: "Sous-titres fournis par la plateforme (alignement temporel fiable).",
      };
    }
  }
  return null;
}

/* --------------------------------------------------------- Whisper local */

/** Decode un WAV PCM 16 bits mono en Float32Array normalise. */
function readWavMono16(filePath: string): { samples: Float32Array; sampleRate: number } {
  const buf = readFileSync(filePath);
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Fichier WAV invalide");
  }

  let sampleRate = 16000;
  let offset = 12;
  let dataStart = -1;
  let dataLength = 0;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      sampleRate = buf.readUInt32LE(offset + 12);
    } else if (chunkId === "data") {
      dataStart = offset + 8;
      dataLength = Math.min(chunkSize, buf.length - dataStart);
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  if (dataStart === -1) throw new Error("Section data absente du WAV");

  const count = Math.floor(dataLength / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = buf.readInt16LE(dataStart + i * 2) / 32768;
  }
  return { samples, sampleRate };
}

/**
 * Surface minimale de @huggingface/transformers utilisee ici. Le paquet est
 * optionnel et absent en production (le Dockerfile installe avec --omit=optional) :
 * ni la verification des types ni le bundler ne doivent en dependre, sinon
 * la construction echoue sur le serveur alors qu'elle passe sur le PC.
 */
interface ModuleTransformers {
  env: { cacheDir: string; allowLocalModels: boolean };
  pipeline: (
    tache: string,
    modele: string,
    options: { dtype: string },
  ) => Promise<(audio: Float32Array, options: Record<string, unknown>) => Promise<unknown>>;
}

async function whisperLocal(wavPath: string): Promise<Transcript> {
  // Import dynamique par une variable, ignore du bundler : le paquet est
  // optionnel, l'application doit se construire et demarrer sans lui.
  const nomPaquet = "@huggingface/transformers";
  const mod = (await import(/* webpackIgnore: true */ nomPaquet).catch(
    () => null,
  )) as ModuleTransformers | null;
  if (!mod) {
    throw new Error(
      "Whisper local indisponible (@huggingface/transformers non installe). " +
        "Installe-le avec `npm install @huggingface/transformers`.",
    );
  }

  const { pipeline, env } = mod;
  // Les poids sont mis en cache dans data/models pour ne les telecharger qu'une fois.
  env.cacheDir = path.join(DATA_DIR, "models");
  env.allowLocalModels = true;

  const transcriber = await pipeline("automatic-speech-recognition", config.whisperLocalModel, {
    dtype: "q8",
  });

  const { samples } = readWavMono16(wavPath);
  const output = (await transcriber(samples, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  })) as { text?: string; chunks?: { timestamp: [number, number | null]; text: string }[] };

  const segments: TranscriptSegment[] = (output.chunks ?? [])
    .filter((c) => c.text?.trim())
    .map((c) => ({
      start: Number(c.timestamp?.[0] ?? 0),
      end: Number(c.timestamp?.[1] ?? c.timestamp?.[0] ?? 0),
      texte: c.text.trim(),
    }));

  return {
    source: "whisper-local",
    texte: (output.text ?? segments.map((s) => s.texte).join(" ")).trim(),
    segments,
    note: `Transcrit en local avec ${config.whisperLocalModel}.`,
  };
}

/* ------------------------------------------------------------ APIs Whisper */

async function whisperApi(
  audioPath: string,
  provider: "groq" | "openai",
): Promise<Transcript> {
  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions";
  const apiKey = provider === "groq" ? config.groqApiKey : config.openaiApiKey;
  const model = provider === "groq" ? "whisper-large-v3" : "whisper-1";

  if (!apiKey) throw new Error(`Cle API ${provider} manquante dans .env.local`);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(readFileSync(audioPath))]), path.basename(audioPath));
  form.append("model", model);
  form.append("response_format", "verbose_json");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Transcription ${provider} refusee (HTTP ${res.status}) : ${await res.text()}`);
  }

  const data = (await res.json()) as {
    text: string;
    language?: string;
    segments?: { start: number; end: number; text: string }[];
  };

  return {
    source: provider,
    langue: data.language,
    texte: data.text?.trim() ?? "",
    segments: (data.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      texte: s.text.trim(),
    })),
    note: `Transcrit via l'API ${provider} (${model}).`,
  };
}

/* ------------------------------------------------------------ orchestration */

export const EMPTY_TRANSCRIPT: Transcript = {
  source: "aucune",
  texte: "",
  segments: [],
  note: "Aucune transcription audio : Claude reconstruit le script depuis les images.",
};

/**
 * Strategie en cascade. Ne jette jamais : une transcription absente degrade
 * l'analyse mais ne doit pas faire echouer le pipeline (Claude lit les
 * sous-titres brules a l'ecran en dernier recours).
 */
export async function transcribe(input: {
  subtitlePaths: string[];
  wavPath?: string;
  mp3Path?: string;
}): Promise<{ transcript: Transcript; warnings: string[] }> {
  const warnings: string[] = [];
  const mode = config.transcriber;

  if (mode === "none") return { transcript: EMPTY_TRANSCRIPT, warnings };

  // Les sous-titres de la plateforme d'abord : ils sont gratuits, instantanes,
  // et souvent plus justes qu'une transcription. En mode groq ou openai, cela
  // evite de payer un appel quand le texte est deja la.
  if (mode === "auto" || mode === "groq" || mode === "openai") {
    const subs = fromSubtitles(input.subtitlePaths);
    if (subs) return { transcript: subs, warnings };
  }

  if (mode === "groq" || mode === "openai") {
    try {
      const audio = input.mp3Path ?? input.wavPath;
      if (!audio) throw new Error("aucun fichier audio disponible");
      return { transcript: await whisperApi(audio, mode), warnings };
    } catch (err) {
      warnings.push(`Transcription ${mode} echouee : ${(err as Error).message}`);
      return { transcript: EMPTY_TRANSCRIPT, warnings };
    }
  }

  if ((mode === "auto" || mode === "local") && input.wavPath) {
    try {
      const t = await whisperLocal(input.wavPath);
      if (t.texte.trim().length >= 5) return { transcript: t, warnings };
      warnings.push("Whisper local n'a detecte aucune parole exploitable.");
    } catch (err) {
      warnings.push(
        `Whisper local indisponible (${(err as Error).message}). ` +
          "Claude lira les sous-titres a l'ecran a la place.",
      );
    }
  }

  // Dernier filet : des sous-titres meme imparfaits valent mieux que rien.
  const subs = fromSubtitles(input.subtitlePaths);
  if (subs) return { transcript: subs, warnings };

  return { transcript: EMPTY_TRANSCRIPT, warnings };
}
