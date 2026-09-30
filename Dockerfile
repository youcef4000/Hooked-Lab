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
# ne change pas. --omit=optional : pas de Whisper local (Groq transcrit).
COPY package.json package-lock.json ./
RUN npm ci --omit=optional

# Code, yt-dlp pour Linux, puis compilation de production.
COPY . .
RUN npm run setup && npm run build && mkdir -p /app/data

ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000

# Node directement (pas npm) : le signal d'arret arrive a l'application, qui
# finit les analyses en cours et vide sa sauvegarde R2 avant de s'eteindre.
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
