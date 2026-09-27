import type { NextConfig } from "next";

/**
 * En-tetes de securite, sur toutes les pages. Aucun ne change l'affichage :
 * ils empechent d'encadrer le site dans une page piege (clickjacking), de
 * faire deviner un type de fichier au navigateur, et de laisser fuiter
 * l'adresse complete des pages vers les sites externes.
 */
const ENTETES_SECURITE = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Ces paquets embarquent des binaires natifs : ils ne doivent pas etre bundles.
  serverExternalPackages: [
    "ffmpeg-static",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
  // Ne pas annoncer la technologie du serveur a qui scanne le site.
  poweredByHeader: false,
  experimental: {
    // Les analyses envoient des lots de keyframes en base64.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: ENTETES_SECURITE }];
  },
};

export default nextConfig;
