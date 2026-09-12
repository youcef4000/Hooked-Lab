#!/usr/bin/env node
/**
 * Telecharge yt-dlp dans ./bin et verifie que ffmpeg est utilisable.
 * Idempotent : relancer la commande met simplement yt-dlp a jour.
 *
 *   npm run setup
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN_DIR = path.join(ROOT, "bin");

const RELEASES = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";
const ASSET =
  process.platform === "win32"
    ? "yt-dlp.exe"
    : process.platform === "darwin"
      ? "yt-dlp_macos"
      : "yt-dlp";

const TARGET = path.join(BIN_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

const log = (icon, msg) => console.log(`${icon}  ${msg}`);

/**
 * Telecharge un fichier. Le fetch natif de Node ignore les variables de proxy
 * du systeme ; sur un poste derriere un proxy il echoue la ou curl passe. On
 * essaie donc fetch, puis curl en repli.
 */
async function download(url, dest) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    return;
  } catch (err) {
    const cause = err.cause?.message ? ` (${err.cause.message})` : "";
    log("[..]", `Telechargement direct indisponible${cause}, tentative via curl...`);
  }

  const curl = spawnSync("curl", ["-fsSL", "--retry", "2", "-o", dest, url], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (curl.status !== 0) {
    throw new Error(
      `curl a echoue (${curl.status}) ${curl.stderr?.trim() || curl.error?.message || ""}`.trim(),
    );
  }
}

async function setupYtDlp() {
  mkdirSync(BIN_DIR, { recursive: true });
  log("[..]", `Telechargement de yt-dlp (${ASSET})...`);
  await download(`${RELEASES}/${ASSET}`, TARGET);
  if (process.platform !== "win32") chmodSync(TARGET, 0o755);

  const size = (statSync(TARGET).size / 1024 / 1024).toFixed(1);
  const check = spawnSync(TARGET, ["--version"], { encoding: "utf8" });
  if (check.status !== 0) {
    throw new Error(`yt-dlp installe mais ne demarre pas : ${check.stderr || check.error}`);
  }
  log("[ok]", `yt-dlp ${check.stdout.trim()} installe (${size} Mo) -> bin/`);
}

function checkFfmpeg() {
  let ffmpegPath = null;

  // 1. paquet npm ffmpeg-static
  try {
    const mod = require("ffmpeg-static");
    if (mod && existsSync(mod)) ffmpegPath = mod;
  } catch {
    /* pas installe : on tente le PATH */
  }

  // 2. ffmpeg du systeme
  if (!ffmpegPath) {
    const which = spawnSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], {
      encoding: "utf8",
    });
    if (which.status === 0) ffmpegPath = which.stdout.split(/\r?\n/)[0].trim();
  }

  if (!ffmpegPath) {
    log("[!!]", "ffmpeg introuvable.");
    console.log(
      "      Corrige avec l'une de ces options :\n" +
        "        npm install ffmpeg-static      (recommande, binaire local au projet)\n" +
        "        winget install Gyan.FFmpeg     (Windows, ffmpeg global)\n" +
        "        brew install ffmpeg            (macOS)",
    );
    return false;
  }

  if (spawnSync(ffmpegPath, ["-version"], { encoding: "utf8" }).status !== 0) {
    log("[!!]", `ffmpeg trouve (${ffmpegPath}) mais ne demarre pas.`);
    return false;
  }
  log("[ok]", `ffmpeg -> ${ffmpegPath}`);
  return true;
}

console.log("\n  Creative Lab DZ - installation des dependances externes\n");

try {
  await setupYtDlp();
} catch (err) {
  log("[!!]", `Echec yt-dlp : ${err.message}`);
  console.log(
    `      Installation manuelle : telecharge ${RELEASES}/${ASSET}\n` +
      `      puis copie le fichier dans ${BIN_DIR}`,
  );
  process.exitCode = 1;
}

if (!checkFfmpeg()) process.exitCode = 1;

if (!existsSync(path.join(ROOT, ".env.local"))) {
  log("[!!]", "Cree .env.local (copie de .env.example) avec ta cle ANTHROPIC_API_KEY.");
}
console.log("");
