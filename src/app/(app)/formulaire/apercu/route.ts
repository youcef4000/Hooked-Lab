import {
  OPTIONS_DEFAUT,
  TEXTES_DEFAUT,
  genererFormulaireHTML,
  type OptionsFormulaire,
} from "@/lib/formulaire-export";

/* ============================================================================
   Apercu plein ecran du formulaire.

   Un route handler et non une page React : le formulaire genere embarque son
   propre <script>, et React ne l'executerait pas s'il etait injecte dans du
   JSX. On sert donc le document tel qu'il sera reellement sur la boutique —
   c'est le seul apercu qui ne mente pas.

   Les reglages passent par l'URL, ce qui permet d'ouvrir le lien sur son
   telephone pour tester avant de coller le code.
   ========================================================================== */

function options(p: URLSearchParams): OptionsFormulaire {
  const theme = p.get("theme");
  const langue = p.get("langue") === "ar" ? "ar" : "fr";
  // Les textes par defaut suivent la langue demandee : sans cela, un lien
  // ?langue=ar afficherait un titre francais au-dessus d'un formulaire arabe.
  const defaut = TEXTES_DEFAUT[langue];
  return {
    ...OPTIONS_DEFAUT,
    produit: p.get("produit") ?? "",
    prix: Number(p.get("prix")) || 0,
    titre: p.get("titre") || defaut.titre,
    soustitre: p.get("soustitre") ?? defaut.soustitre,
    libelleBouton: p.get("bouton") || defaut.libelleBouton,
    accent: p.get("accent") || OPTIONS_DEFAUT.accent,
    theme: theme === "clair" || theme === "sombre" ? theme : "premium",
    fondAnime: p.get("decor") !== "0",
    etincelles: p.has("etincelles") ? Number(p.get("etincelles")) || 0 : OPTIONS_DEFAUT.etincelles,
    choixLivraison: p.get("livraison") !== "0",
    langue,
  };
}

export function GET(requete: Request) {
  const o = options(new URL(requete.url).searchParams);
  const fond = o.theme === "premium" ? "#050408" : o.theme === "sombre" ? "#0b0c0e" : "#f4f5f7";

  const document = `<!doctype html>
<html lang="${o.langue}" dir="${o.langue === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aperçu du formulaire de commande</title>
<style>
  html,body{margin:0;padding:0}
  body{min-height:100vh;padding:40px 18px;background:${fond};
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
</style>
</head>
<body>
${genererFormulaireHTML(o)}
</body>
</html>`;

  return new Response(document, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
