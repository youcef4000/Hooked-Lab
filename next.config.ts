import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ces paquets embarquent des binaires natifs : ils ne doivent pas etre bundles.
  serverExternalPackages: [
    "ffmpeg-static",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
  experimental: {
    // Les analyses envoient des lots de keyframes en base64.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
