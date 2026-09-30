import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/site";

// A la demande : l'adresse du site n'est connue qu'a l'execution (SITE_URL).
export const dynamic = "force-dynamic";

/* Google indexe la vitrine et les tarifs, jamais l'outil ni l'administration. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/tarifs", "/analyser", "/inscription"],
      disallow: ["/admin", "/api/", "/compte", "/historique", "/analyse/", "/diagnostic"],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
