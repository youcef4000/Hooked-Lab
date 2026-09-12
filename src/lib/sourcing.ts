import type { LienSourcing, RequetesSourcing } from "@/types/analysis";

/**
 * Construit les URLs de recherche fournisseur a partir des mots-cles produits
 * par Claude. Aucune API payante : ce sont des liens de recherche cliquables.
 */
export function buildSourcingLinks(requetes: RequetesSourcing): LienSourcing[] {
  const liens: LienSourcing[] = [];
  const en = requetes.en.filter(Boolean);
  const zh = [...requetes.zh, ...requetes.alias_zh].filter(Boolean);

  const push = (
    plateforme: LienSourcing["plateforme"],
    label: string,
    url: string,
    langue: LienSourcing["langue"],
  ) => {
    if (liens.some((l) => l.url === url)) return;
    liens.push({ plateforme, label, url, langue });
  };

  // Marches internationaux : requetes en anglais.
  for (const q of en.slice(0, 3)) {
    push(
      "Alibaba",
      `Alibaba — ${q}`,
      `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`,
      "en",
    );
    push(
      "AliExpress",
      `AliExpress — ${q}`,
      `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(q.replace(/\s+/g, "-"))}.html`,
      "en",
    );
  }
  if (en[0]) {
    push(
      "Made-in-China",
      `Made-in-China — ${en[0]}`,
      `https://www.made-in-china.com/productSearch?word=${encodeURIComponent(en[0])}`,
      "en",
    );
  }

  // Marches domestiques chinois : requetes en chinois, prix nettement plus bas.
  for (const q of zh.slice(0, 3)) {
    push(
      "1688",
      `1688 — ${q}`,
      `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(q)}`,
      "zh",
    );
  }
  for (const q of zh.slice(0, 2)) {
    push(
      "Taobao",
      `Taobao — ${q}`,
      `https://s.taobao.com/search?q=${encodeURIComponent(q)}`,
      "zh",
    );
  }

  // Reference visuelle : utile pour lancer ensuite une recherche par image.
  if (en[0]) {
    push(
      "Google Images",
      `Images de reference — ${en[0]}`,
      `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(en[0])}`,
      "en",
    );
  }

  return liens;
}

/**
 * Pages de recherche par image. Elles n'acceptent pas de parametre d'URL :
 * l'utilisateur y depose une keyframe telechargee depuis le rapport.
 */
export const RECHERCHE_PAR_IMAGE = [
  {
    plateforme: "Alibaba",
    url: "https://www.alibaba.com/picture/search.html",
    aide: "Depose une keyframe du produit pour trouver les fournisseurs correspondants.",
  },
  {
    plateforme: "1688",
    url: "https://www.1688.com/",
    aide: "Clique sur l'icone appareil photo dans la barre de recherche, puis depose la keyframe. C'est la methode la plus fiable pour retrouver un produit vu en video.",
  },
  {
    plateforme: "AliExpress",
    url: "https://www.aliexpress.com/",
    aide: "Icone appareil photo dans la barre de recherche.",
  },
] as const;

/**
 * Transforme une requete en lien de recherche sur la plateforme concernee.
 *
 * Le modele ne fournit jamais d'URL de video : il n'a pas acces au web et les
 * inventerait. Il donne la requete, et c'est cette fonction qui construit le
 * lien — garanti valide puisqu'il pointe vers une page de recherche.
 */
export function lienRechercheVideo(source: string, requete: string): string {
  const q = encodeURIComponent(requete);
  switch (source) {
    case "1688":
      return `https://s.1688.com/selloffer/offer_search.htm?keywords=${q}`;
    case "AliExpress":
      return `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(requete.replace(/\s+/g, "-"))}.html`;
    case "Alibaba":
      return `https://www.alibaba.com/trade/search?SearchText=${q}`;
    case "TikTok":
      return `https://www.tiktok.com/search/video?q=${q}`;
    case "Instagram":
      return `https://www.instagram.com/explore/search/keyword/?q=${q}`;
    case "YouTube Shorts":
      // sp=EgIYAQ%253D%253D filtre sur les videos courtes
      return `https://www.youtube.com/results?search_query=${q}&sp=EgIYAQ%253D%253D`;
    case "Pinterest":
      return `https://www.pinterest.com/search/pins/?q=${q}`;
    case "Banque libre":
      return `https://www.pexels.com/fr-fr/chercher/videos/${q}/`;
    default:
      return `https://www.google.com/search?q=${q}&tbm=vid`;
  }
}
