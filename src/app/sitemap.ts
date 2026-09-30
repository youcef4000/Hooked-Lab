import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/site";

// A la demande : l'adresse du site n'est connue qu'a l'execution (SITE_URL).
export const dynamic = "force-dynamic";

/* Les seules pages qui ont un sens pour quelqu'un qui arrive de Google. */
export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();
  return [
    { url: `${URL_SITE}/`, lastModified: maintenant, changeFrequency: "weekly", priority: 1 },
    { url: `${URL_SITE}/tarifs`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.8 },
    { url: `${URL_SITE}/analyser`, lastModified: maintenant, changeFrequency: "weekly", priority: 0.7 },
    { url: `${URL_SITE}/inscription`, lastModified: maintenant, changeFrequency: "yearly", priority: 0.6 },
  ];
}
