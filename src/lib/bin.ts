import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { BIN_DIR } from "./paths";

const require = createRequire(import.meta.url);

let ytDlpCache: string | null | undefined;
let ffmpegCache: string | null | undefined;

function fromPath(cmd: string): string | null {
  const finder = process.platform === "win32" ? "where" : "which";
  const res = spawnSync(finder, [cmd], { encoding: "utf8" });
  if (res.status !== 0 || !res.stdout) return null;
  const first = res.stdout.split(/\r?\n/)[0]?.trim();
  return first && existsSync(first) ? first : null;
}

/** Chemin de yt-dlp : ./bin en priorite, sinon le PATH systeme. */
export function ytDlpPath(): string {
  if (ytDlpCache !== undefined && ytDlpCache !== null) return ytDlpCache;

  const local = path.join(BIN_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
  const resolved = existsSync(local) ? local : fromPath("yt-dlp");

  if (!resolved) {
    throw new Error(
      "yt-dlp introuvable. Lance `npm run setup` a la racine du projet pour l'installer.",
    );
  }
  ytDlpCache = resolved;
  return resolved;
}

/** Chemin de ffmpeg : paquet ffmpeg-static en priorite, sinon le PATH systeme. */
export function ffmpegPath(): string {
  if (ffmpegCache !== undefined && ffmpegCache !== null) return ffmpegCache;

  let resolved: string | null = null;
  try {
    const mod = require("ffmpeg-static") as string | null;
    if (mod && existsSync(mod)) resolved = mod;
  } catch {
    /* paquet absent : on tente le PATH */
  }
  if (!resolved) resolved = fromPath("ffmpeg");

  if (!resolved) {
    throw new Error(
      "ffmpeg introuvable. Installe-le avec `npm install ffmpeg-static` " +
        "ou `winget install Gyan.FFmpeg`, puis relance `npm run setup`.",
    );
  }
  ffmpegCache = resolved;
  return resolved;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Lance un binaire et collecte sa sortie. Ne jette jamais sur un code != 0. */
export function run(
  bin: string,
  args: string[],
  opts: { timeoutMs?: number; cwd?: string } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: opts.cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          killed = true;
          child.kill("SIGKILL");
        }, opts.timeoutMs)
      : null;

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      // On borne la sortie d'erreur : ffmpeg est tres bavard.
      stderr = (stderr + d.toString()).slice(-20000);
    });
    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (killed) {
        reject(new Error(`${path.basename(bin)} a depasse le temps imparti`));
        return;
      }
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

/** Comme run(), mais leve une erreur lisible si le code de sortie n'est pas 0. */
export async function runOrThrow(
  bin: string,
  args: string[],
  opts: { timeoutMs?: number; cwd?: string; context?: string } = {},
): Promise<RunResult> {
  const res = await run(bin, args, opts);
  if (res.code !== 0) {
    const tail = res.stderr.trim().split(/\r?\n/).slice(-6).join("\n");
    throw new Error(`${opts.context || path.basename(bin)} a echoue (code ${res.code})\n${tail}`);
  }
  return res;
}
