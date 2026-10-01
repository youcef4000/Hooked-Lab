# =============================================================================
# Image du conteneur Hooked Lab (Cloudflare Containers).
#
# Construite par Cloudflare a chaque envoi sur la branche main (Workers
# Builds) : rien a installer sur ton ordinateur. Contient Node.js,
# l'application compilee, ffmpeg (paquet ffmpeg-static) et yt-dlp.
#
# Aucune donnee ni aucun secret dans l'image : les donnees vivent dans R2,
# les secrets arrivent au demarrage (cloudflare/worker.ts).
# =============================================================================

FROM node:24-bookworm-slim

# Certificats pour les appels HTTPS (Anthropic, Groq, Stripe, plateformes).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependances d'abord : cette couche est reutilisee tant que package-lock.json
# ne change pas. Les dependances optionnelles restent installees : elles
# contiennent les binaires Linux de Next.js et de Tailwind (lightningcss),
# indispensables a la compilation. Seul Whisper local est retire ensuite
# (Groq transcrit en production) : plusieurs centaines de Mo en moins.
# --ignore-scripts evite d'executer les scripts d'installation de ces
# paquets lourds ; seul ffmpeg-static a besoin du sien (telechargement de ffmpeg).
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
  && npm rebuild ffmpeg-static \
  && rm -rf node_modules/@huggingface node_modules/onnxruntime-node node_modules/onnxruntime-web node_modules/onnxruntime-common

# Code, yt-dlp pour Linux, puis compilation de production.
COPY . .
RUN npm run setup && npm run build && mkdir -p /app/data

ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000

# Node directement (pas npm) : le signal d'arret arrive a l'application, qui
# finit les analyses en cours et vide sa sauvegarde R2 avant de s'eteindre.
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
