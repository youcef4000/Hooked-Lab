import { WILAYAS, TARIFS_ZONE } from "./wilayas";

/* ============================================================================
   Generateur de formulaire de commande autonome.

   Le composant React ne sert que dans cette application. Le vendeur, lui, a
   besoin du formulaire sur SA page produit : YouCan, Shopify, une landing
   HTML, une page Blogger. On genere donc un bloc HTML complet, sans
   dependance externe — pas de CDN, pas de framework, pas de police distante.

   Les 58 wilayas et leurs communes sont serialisees dans le fichier : le
   formulaire ne fait aucun appel reseau pour se remplir.

   Le decor anime (halos, grain, etincelles, liseré tournant) est confine dans
   le bloc du formulaire, jamais en position fixed : le formulaire doit
   pouvoir se coller au milieu de n'importe quelle page sans en repeindre le
   fond. Tout est anime en transform et opacity uniquement — aucune propriete
   qui declenche un recalcul de mise en page, donc aucune saccade sur les
   telephones d'entree de gamme, qui sont la majorite du parc algerien.
   ========================================================================== */

export type ThemeFormulaire = "premium" | "clair" | "sombre";

export interface OptionsFormulaire {
  /** Nom du produit, repris dans la commande envoyee. */
  produit: string;
  /** Prix affiche au client, en DZD. 0 pour ne pas afficher de prix. */
  prix: number;
  titre: string;
  soustitre: string;
  libelleBouton: string;
  /** Couleur d'accent : bouton, bordures actives, halos. */
  accent: string;
  theme: ThemeFormulaire;
  /** Decor anime en fond du bloc. Sans effet sur les themes clair et sombre. */
  fondAnime: boolean;
  /** Nombre d'etincelles qui montent derriere la carte. 0 pour les couper. */
  etincelles: number;
  /**
   * Ou partent les commandes. Vide = le formulaire affiche seulement la
   * confirmation, sans rien envoyer (utile pour tester la page).
   */
  destination: string;
  /**
   * "interne" pointe sur /api/commandes : les commandes atterrissent dans
   * l'espace admin. Google Apps Script exige un envoi en no-cors, pas un POST
   * JSON classique — d'ou la distinction.
   */
  typeDestination: "interne" | "sheets" | "webhook" | "aucune";
  /** Propose le choix domicile / stopdesk avec les tarifs par zone. */
  choixLivraison: boolean;
  langue: "fr" | "ar";
}

/**
 * Textes par defaut, par langue. Le generateur bascule automatiquement de
 * l'un a l'autre tant que le vendeur n'a pas ecrit ses propres textes :
 * afficher un titre francais au-dessus d'un formulaire arabe est le genre de
 * detail qui fait fuir un acheteur.
 */
export const TEXTES_DEFAUT = {
  fr: {
    titre: "Commander maintenant",
    soustitre: "Paiement à la livraison. Vous payez le livreur en main propre.",
    libelleBouton: "Confirmer ma commande",
  },
  ar: {
    titre: "اطلب الآن",
    soustitre: "الدفع عند الاستلام. تدفع للموصل مباشرة.",
    libelleBouton: "أكد طلبي",
  },
} as const;

export const OPTIONS_DEFAUT: OptionsFormulaire = {
  produit: "",
  prix: 0,
  ...TEXTES_DEFAUT.fr,
  accent: "#c9a227",
  theme: "premium",
  fondAnime: true,
  etincelles: 16,
  destination: "",
  typeDestination: "aucune",
  choixLivraison: true,
  langue: "fr",
};

/** Table compacte : { "16": ["Alger", 1, ["Alger Centre", ...]] } */
function donneesCompactes(): string {
  const table: Record<string, [string, number, string[]]> = {};
  for (const w of WILAYAS) table[w.code] = [w.nom, w.zone, w.communes];
  return JSON.stringify(table);
}

const TEXTES = {
  fr: {
    nom: "Nom et prénom",
    tel: "Numéro de téléphone",
    wilaya: "Wilaya",
    commune: "Commune",
    choisir: "Choisir...",
    dabord: "Choisissez d'abord la wilaya",
    livraison: "Mode de livraison",
    domicile: "À domicile",
    stopdesk: "Au bureau (stopdesk)",
    aideTel: "C'est sur ce numéro que nous vous appelons pour confirmer.",
    errNom: "Entrez votre nom complet.",
    errNomCourt: "Le nom est trop court.",
    errTelVide: "Entrez votre numéro de téléphone.",
    errTel: "Numéro invalide. Il doit commencer par 05, 06 ou 07 et faire 10 chiffres.",
    errWilaya: "Choisissez votre wilaya.",
    errCommune: "Choisissez votre commune.",
    total: "Total à payer",
    livraisonLigne: "Livraison",
    envoi: "Envoi en cours...",
    merciTitre: "Commande enregistrée",
    merciTexte:
      "Nous vous appelons dans les prochaines heures pour confirmer. Gardez votre téléphone allumé.",
    erreurEnvoi: "L'envoi a échoué. Vérifiez votre connexion et réessayez.",
    rassurance: "Aucun paiement en ligne. Vous payez à la réception.",
  },
  ar: {
    nom: "الاسم واللقب",
    tel: "رقم الهاتف",
    wilaya: "الولاية",
    commune: "البلدية",
    choisir: "اختر...",
    dabord: "اختر الولاية أولا",
    livraison: "طريقة التوصيل",
    domicile: "إلى المنزل",
    stopdesk: "إلى المكتب",
    aideTel: "سنتصل بك على هذا الرقم لتأكيد الطلب.",
    errNom: "اكتب اسمك الكامل.",
    errNomCourt: "الاسم قصير جدا.",
    errTelVide: "اكتب رقم هاتفك.",
    errTel: "رقم غير صحيح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام.",
    errWilaya: "اختر ولايتك.",
    errCommune: "اختر بلديتك.",
    total: "المبلغ الإجمالي",
    livraisonLigne: "التوصيل",
    envoi: "جاري الإرسال...",
    merciTitre: "تم تسجيل طلبك",
    merciTexte: "سنتصل بك خلال الساعات القادمة للتأكيد. اترك هاتفك مفتوحا.",
    erreurEnvoi: "فشل الإرسال. تحقق من اتصالك وحاول مرة أخرى.",
    rassurance: "لا دفع عبر الإنترنت. تدفع عند الاستلام.",
  },
} as const;

/** Palettes. Le premium reprend exactement les jetons de Hooked Lab. */
function palette(theme: ThemeFormulaire) {
  if (theme === "premium") {
    return {
      fond: "#07060a", // onyx, la base de page du theme
      carte: "rgba(13,12,16,.74)", // encre translucide, pose sur le decor
      champ: "rgba(7,6,10,.72)",
      bord: "#2a2530",
      texte: "#f6f2ea",
      doux: "#b6afbd",
      faible: "#8b8494",
      premium: true,
    };
  }
  if (theme === "sombre") {
    return {
      fond: "#111214",
      carte: "#191b1e",
      champ: "#0d0e10",
      bord: "#2c2f34",
      texte: "#f2f3f5",
      doux: "#9aa0a8",
      faible: "#6b7178",
      premium: false,
    };
  }
  return {
    fond: "#ffffff",
    carte: "#ffffff",
    champ: "#ffffff",
    bord: "#dcdfe4",
    texte: "#16181d",
    doux: "#5a6069",
    faible: "#878d95",
    premium: false,
  };
}

export function genererFormulaireHTML(o: OptionsFormulaire): string {
  const t = TEXTES[o.langue];
  const rtl = o.langue === "ar";
  const c = palette(o.theme);
  const decor = c.premium && o.fondAnime;
  const nbEtincelles = decor ? Math.max(0, Math.min(40, o.etincelles)) : 0;

  return `<!-- Formulaire de commande COD - 58 wilayas - genere par Hooked Lab -->
<div id="cldz-form" class="${c.premium ? "cl-premium" : ""}" dir="${rtl ? "rtl" : "ltr"}">
<style>
#cldz-form{--acc:${o.accent};--or:#e0be55;--champagne:#f2dfa0;--fond:${c.fond};--carte:${c.carte};
  --champ:${c.champ};--bord:${c.bord};--txt:${c.texte};--doux:${c.doux};--faible:${c.faible};
  position:relative;max-width:${decor ? "520px" : "440px"};margin:0 auto;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--txt);box-sizing:border-box;
  ${decor ? "padding:38px 26px;border-radius:22px;background:var(--fond);overflow:hidden;isolation:isolate" : ""}}
#cldz-form *,#cldz-form *::before,#cldz-form *::after{box-sizing:inherit}

/* ---------------------------------------------------------------- decor */
${
  decor
    ? `
#cldz-form .cl-decor{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:inherit}
#cldz-form .cl-halo{position:absolute;border-radius:50%;filter:blur(70px);will-change:transform}
#cldz-form .cl-halo-1{width:420px;height:420px;top:-190px;${rtl ? "right" : "left"}:-140px;
  background:radial-gradient(circle,color-mix(in srgb,var(--acc) 34%,transparent),transparent 68%);
  animation:cl-derive-a 17s ease-in-out infinite}
#cldz-form .cl-halo-2{width:360px;height:360px;bottom:-170px;${rtl ? "left" : "right"}:-120px;
  background:radial-gradient(circle,rgba(184,115,51,.3),transparent 68%);
  animation:cl-derive-b 21s ease-in-out infinite}
#cldz-form .cl-halo-3{width:300px;height:300px;top:38%;${rtl ? "left" : "right"}:-140px;
  background:radial-gradient(circle,color-mix(in srgb,var(--champagne) 16%,transparent),transparent 70%);
  animation:cl-derive-a 25s ease-in-out infinite reverse}
@keyframes cl-derive-a{0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(46px,34px,0) scale(1.14)}}
@keyframes cl-derive-b{0%,100%{transform:translate3d(0,0,0) scale(1.06)}
  50%{transform:translate3d(-40px,-30px,0) scale(.92)}}

/* Grain fin : casse les aplats, donne une texture de papier photo */
#cldz-form .cl-grain{position:absolute;inset:0;opacity:.055;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* Etincelles : des poussieres d'or qui montent lentement derriere la carte */
#cldz-form .cl-etincelle{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;
  background:var(--champagne);box-shadow:0 0 7px 1px color-mix(in srgb,var(--acc) 75%,transparent);
  opacity:0;animation:cl-monte-etincelle linear infinite;animation-delay:var(--d);will-change:transform,opacity}
@keyframes cl-monte-etincelle{
  0%{opacity:0;transform:translate3d(0,0,0) scale(.35)}
  14%{opacity:.9}
  70%{opacity:.55}
  100%{opacity:0;transform:translate3d(var(--x),calc(-1 * var(--h)),0) scale(1.05)}}
`
    : ""
}

/* ---------------------------------------------------------------- carte */
#cldz-form .cl-carte{position:relative;z-index:1;background:var(--carte);border:1px solid var(--bord);
  border-radius:16px;padding:24px}
${
  c.premium
    ? `
#cldz-form .cl-carte{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 24px 60px -24px rgba(0,0,0,.85),0 0 0 1px rgba(242,223,160,.07) inset}
/* Liseré qui fait le tour de la carte. @property n'est pas universel : sans
   lui le degrade reste fixe, ce qui reste un beau liseré dore. */
@property --cl-tour{syntax:'<angle>';initial-value:0deg;inherits:false}
#cldz-form .cl-carte::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;
  background:conic-gradient(from var(--cl-tour),transparent 0deg,color-mix(in srgb,var(--acc) 85%,transparent) 46deg,
    var(--champagne) 74deg,transparent 128deg,transparent 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude;animation:cl-rotation 7s linear infinite;pointer-events:none}
@keyframes cl-rotation{to{--cl-tour:360deg}}`
    : ""
}

/* ------------------------------------------------------------- en-tete */
#cldz-form h3{position:relative;margin:0;font-size:21px;font-weight:700;letter-spacing:-.015em}
#cldz-form .cl-sous{margin:7px 0 0;font-size:13.5px;line-height:1.55;color:var(--doux)}
${
  c.premium
    ? `
/* Le titre en or brosse, avec un reflet qui passe lentement dessus */
#cldz-form h3{background:linear-gradient(100deg,var(--acc) 0%,var(--champagne) 26%,#fff8e2 40%,var(--or) 58%,var(--acc) 100%);
  background-size:280% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:cl-brossage 7s ease-in-out infinite}
@keyframes cl-brossage{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`
    : ""
}

/* -------------------------------------------------------------- champs */
#cldz-form .cl-champ{margin-top:17px;opacity:0;animation:cl-entree .55s cubic-bezier(.22,.9,.3,1) forwards;
  animation-delay:calc(var(--i) * 75ms + 90ms)}
@keyframes cl-entree{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
#cldz-form label{display:block;margin:0 0 6px;font-size:12.5px;font-weight:600;
  transition:color .2s ease}
#cldz-form .cl-champ:focus-within label{color:var(--acc)}
#cldz-form .cl-req{color:#d9534f}
#cldz-form input,#cldz-form select{width:100%;padding:13px;font-size:15px;font-family:inherit;color:var(--txt);
  background:var(--champ);border:1px solid var(--bord);border-radius:10px;outline:none;appearance:none;
  transition:border-color .2s ease,box-shadow .25s ease,background .2s ease}
#cldz-form select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23${c.premium ? "c9a227" : "888888"}' d='M1 1.5 6 6.5l5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:${rtl ? "left 15px" : "right 15px"} center;
  padding-${rtl ? "left" : "right"}:36px}
#cldz-form input:focus,#cldz-form select:focus{border-color:var(--acc);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 18%,transparent)${c.premium ? ",0 0 22px -6px color-mix(in srgb,var(--acc) 60%,transparent)" : ""}}
#cldz-form select:disabled{opacity:.5;cursor:not-allowed}
#cldz-form .cl-err{display:none;margin:6px 0 0;font-size:12px;color:#d9534f}
#cldz-form .cl-invalide input,#cldz-form .cl-invalide select{border-color:#d9534f;
  animation:cl-secousse .38s cubic-bezier(.36,.07,.19,.97)}
@keyframes cl-secousse{10%,90%{transform:translate3d(-2px,0,0)}30%,70%{transform:translate3d(4px,0,0)}
  50%{transform:translate3d(-4px,0,0)}}
#cldz-form .cl-invalide .cl-err{display:block;animation:cl-entree .3s ease both}
#cldz-form .cl-invalide .cl-aide{display:none}
#cldz-form .cl-aide{margin:6px 0 0;font-size:12px;color:var(--faible)}

/* Coche verte quand un champ devient valide : le client voit qu'il avance */
#cldz-form .cl-boite{position:relative}
#cldz-form .cl-ok{position:absolute;top:50%;${rtl ? "left" : "right"}:13px;width:16px;height:16px;
  transform:translateY(-50%) scale(0);opacity:0;transition:transform .3s cubic-bezier(.34,1.7,.5,1),opacity .2s;
  color:#4caf78;pointer-events:none}
#cldz-form select+.cl-ok{${rtl ? "left" : "right"}:34px}
#cldz-form .cl-valide .cl-ok{transform:translateY(-50%) scale(1);opacity:1}

/* ----------------------------------------------------------- livraison */
#cldz-form .cl-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
#cldz-form .cl-mode{position:relative;overflow:hidden;padding:12px;text-align:${rtl ? "right" : "left"};
  background:transparent;border:1px solid var(--bord);border-radius:10px;cursor:pointer;font-family:inherit;
  color:var(--txt);transition:border-color .2s,background .2s,transform .15s}
#cldz-form .cl-mode:active{transform:scale(.98)}
#cldz-form .cl-mode[aria-pressed="true"]{border-color:var(--acc);
  background:color-mix(in srgb,var(--acc) 11%,transparent)}
#cldz-form .cl-mode b{display:block;font-size:12.5px;font-weight:600}
#cldz-form .cl-mode span{display:block;margin-top:3px;font-size:12px;color:var(--doux)}

/* -------------------------------------------------------------- total */
#cldz-form .cl-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:19px;
  padding-top:15px;border-top:1px dashed var(--bord)}
#cldz-form .cl-total>span{font-size:13px;color:var(--doux)}
#cldz-form .cl-total b{font-size:22px;font-weight:700${c.premium ? ";color:var(--champagne)" : ""}}
#cldz-form .cl-total b.cl-bat{animation:cl-battement .45s cubic-bezier(.34,1.6,.5,1)}
@keyframes cl-battement{0%,100%{transform:scale(1)}42%{transform:scale(1.13)}}

/* ------------------------------------------------------------- bouton */
#cldz-form .cl-envoyer{position:relative;overflow:hidden;width:100%;margin-top:19px;padding:16px;
  font-size:15.5px;font-weight:700;font-family:inherit;border:0;border-radius:12px;cursor:pointer;
  transition:filter .18s ease,transform .18s ease,box-shadow .18s ease}
${
  c.premium
    ? `#cldz-form .cl-envoyer{color:#120e04;
  background:linear-gradient(100deg,#a8801d 0%,var(--or) 30%,var(--champagne) 50%,var(--acc) 72%,#a8801d 100%);
  box-shadow:0 1px 0 rgba(255,245,200,.55) inset,0 10px 30px -10px color-mix(in srgb,var(--acc) 55%,transparent)}
#cldz-form .cl-envoyer:hover{filter:brightness(1.09);
  box-shadow:0 1px 0 rgba(255,245,200,.7) inset,0 15px 42px -10px color-mix(in srgb,var(--acc) 78%,transparent)}
/* Le reflet qui balaie le bouton, comme sur un metal poli */
#cldz-form .cl-envoyer::after{content:"";position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.55) 50%,transparent 62%);
  transform:translateX(-130%);animation:cl-reflet 4.5s ease-in-out infinite}
@keyframes cl-reflet{0%,62%{transform:translateX(-130%)}86%,100%{transform:translateX(130%)}}`
    : `#cldz-form .cl-envoyer{color:#fff;background:var(--acc)}
#cldz-form .cl-envoyer:hover{filter:brightness(1.08)}`
}
#cldz-form .cl-envoyer:active{transform:scale(.985)}
#cldz-form .cl-envoyer:disabled{opacity:.65;cursor:wait}
#cldz-form .cl-envoyer:disabled::after{display:none}
#cldz-form .cl-rassure{margin:13px 0 0;text-align:center;font-size:12px;color:var(--faible)}

/* --------------------------------------------------------- confirmation */
#cldz-form .cl-merci{display:none;position:relative;z-index:1;padding:40px 24px;text-align:center;
  background:var(--carte);border:1px solid var(--bord);border-radius:16px${
    c.premium ? ";backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)" : ""
  }}
#cldz-form .cl-merci h3{font-size:19px}
#cldz-form .cl-merci p{margin:9px auto 0;max-width:330px;font-size:14px;line-height:1.6;color:var(--doux)}
#cldz-form .cl-rond{width:60px;height:60px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;
  background:color-mix(in srgb,var(--acc) 14%,transparent);
  box-shadow:0 0 0 0 color-mix(in srgb,var(--acc) 45%,transparent);animation:cl-onde 2.4s ease-out infinite}
@keyframes cl-onde{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--acc) 45%,transparent)}
  70%{box-shadow:0 0 0 20px transparent}100%{box-shadow:0 0 0 0 transparent}}
#cldz-form .cl-rond svg{width:28px;height:28px;stroke:var(--acc);stroke-width:2.6;fill:none;
  stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:26;stroke-dashoffset:26}
#cldz-form .cl-fini .cl-rond svg{animation:cl-trace .5s .18s cubic-bezier(.65,0,.35,1) forwards}
@keyframes cl-trace{to{stroke-dashoffset:0}}
#cldz-form .cl-fini .cl-carte{display:none}
#cldz-form .cl-fini .cl-merci{display:block;animation:cl-entree .5s cubic-bezier(.22,.9,.3,1) both}

@media(max-width:430px){
  #cldz-form{${decor ? "padding:26px 16px;" : ""}}
  #cldz-form .cl-duo{grid-template-columns:1fr}
  #cldz-form .cl-carte{padding:20px 17px}
}

/* Le mouvement est un plaisir, pas une condition d'achat : qui l'a desactive
   dans son systeme recoit un formulaire strictement identique, immobile. */
@media(prefers-reduced-motion:reduce){
  #cldz-form *,#cldz-form *::before,#cldz-form *::after{
    animation:none!important;transition-duration:.01ms!important}
  #cldz-form .cl-champ{opacity:1}
  #cldz-form .cl-etincelle{display:none}
  ${c.premium ? "#cldz-form h3{-webkit-text-fill-color:var(--champagne);color:var(--champagne)}" : ""}
}
</style>
${
  decor
    ? `
<div class="cl-decor" aria-hidden="true">
  <span class="cl-halo cl-halo-1"></span>
  <span class="cl-halo cl-halo-2"></span>
  <span class="cl-halo cl-halo-3"></span>
  <span class="cl-etincelles"></span>
  <span class="cl-grain"></span>
</div>`
    : ""
}
<form class="cl-carte" novalidate>
  <h3>${esc(o.titre)}</h3>
  ${o.soustitre ? `<p class="cl-sous">${esc(o.soustitre)}</p>` : ""}

  <div class="cl-champ" data-champ="nom" style="--i:0">
    <label for="cl-nom">${t.nom} <span class="cl-req">*</span></label>
    <div class="cl-boite">
      <input id="cl-nom" name="nom" type="text" autocomplete="name" required>
      ${COCHE}
    </div>
    <p class="cl-err"></p>
  </div>

  <div class="cl-champ" data-champ="telephone" style="--i:1">
    <label for="cl-tel">${t.tel} <span class="cl-req">*</span></label>
    <div class="cl-boite">
      <input id="cl-tel" name="telephone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="0X XX XX XX XX" required>
      ${COCHE}
    </div>
    <p class="cl-err"></p>
    <p class="cl-aide">${t.aideTel}</p>
  </div>

  <div class="cl-champ" data-champ="wilaya" style="--i:2">
    <label for="cl-wilaya">${t.wilaya} <span class="cl-req">*</span></label>
    <div class="cl-boite">
      <select id="cl-wilaya" name="wilaya" required><option value="">${t.choisir}</option></select>
      ${COCHE}
    </div>
    <p class="cl-err"></p>
  </div>

  <div class="cl-champ" data-champ="commune" style="--i:3">
    <label for="cl-commune">${t.commune} <span class="cl-req">*</span></label>
    <div class="cl-boite">
      <select id="cl-commune" name="commune" required disabled><option value="">${t.dabord}</option></select>
      ${COCHE}
    </div>
    <p class="cl-err"></p>
  </div>
${
  o.choixLivraison
    ? `
  <div class="cl-champ" id="cl-bloc-livraison" style="--i:4;display:none">
    <label>${t.livraison}</label>
    <div class="cl-duo">
      <button type="button" class="cl-mode" data-mode="domicile" aria-pressed="true"><b>${t.domicile}</b><span></span></button>
      <button type="button" class="cl-mode" data-mode="stopdesk" aria-pressed="false"><b>${t.stopdesk}</b><span></span></button>
    </div>
  </div>`
    : ""
}
${
  o.prix > 0
    ? `
  <div class="cl-total cl-champ" style="--i:5"><span>${t.total}</span><b id="cl-total">${o.prix} DA</b></div>`
    : ""
}
  <button type="submit" class="cl-envoyer">${esc(o.libelleBouton)}</button>
  <p class="cl-rassure">${t.rassurance}</p>
</form>

<div class="cl-merci">
  <div class="cl-rond">
    <svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>
  </div>
  <h3>${t.merciTitre}</h3>
  <p>${t.merciTexte}</p>
</div>

<script>
(function(){
  var W = ${donneesCompactes()};
  var TARIF = ${JSON.stringify(TARIFS_ZONE)};
  var T = ${JSON.stringify(t)};
  var PRIX = ${o.prix};
  var PRODUIT = ${JSON.stringify(o.produit)};
  var DEST = ${JSON.stringify(o.destination)};
  var TYPE = ${JSON.stringify(o.typeDestination)};
  var LIVRAISON_ACTIVE = ${o.choixLivraison ? "true" : "false"};
  var NB_ETINCELLES = ${nbEtincelles};

  var racine = document.getElementById('cldz-form');
  var form = racine.querySelector('form');
  var selW = racine.querySelector('#cl-wilaya');
  var selC = racine.querySelector('#cl-commune');
  var blocLiv = racine.querySelector('#cl-bloc-livraison');
  var elTotal = racine.querySelector('#cl-total');
  var bouton = racine.querySelector('.cl-envoyer');
  var mode = 'domicile';
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Etincelles semees au hasard : chacune a sa trajectoire, sa duree et son
  // retard, sinon l'oeil percoit tout de suite la boucle.
  var bac = racine.querySelector('.cl-etincelles');
  if (bac && NB_ETINCELLES && !calme) {
    var hauteur = racine.offsetHeight || 620;
    for (var e = 0; e < NB_ETINCELLES; e++) {
      var s = document.createElement('span');
      s.className = 'cl-etincelle';
      s.style.left = (Math.random() * 100) + '%';
      s.style.setProperty('--x', (Math.random() * 70 - 35) + 'px');
      s.style.setProperty('--h', (hauteur * (0.55 + Math.random() * 0.5)) + 'px');
      s.style.setProperty('--d', (-Math.random() * 9000) + 'ms');
      s.style.animationDuration = (7000 + Math.random() * 6000) + 'ms';
      s.style.opacity = '0';
      bac.appendChild(s);
    }
  }

  // Remplissage des wilayas, triees par code.
  var codes = Object.keys(W).sort();
  for (var i = 0; i < codes.length; i++) {
    var op = document.createElement('option');
    op.value = codes[i];
    op.textContent = codes[i] + ' - ' + W[codes[i]][0];
    selW.appendChild(op);
  }

  function fraisActuels(){
    var w = W[selW.value];
    if (!w || !LIVRAISON_ACTIVE) return 0;
    return TARIF[w[1]][mode];
  }

  function majTotal(){
    if (!elTotal) return;
    var avant = elTotal.textContent;
    elTotal.textContent = (PRIX + fraisActuels()) + ' DA';
    if (avant !== elTotal.textContent && !calme) {
      elTotal.classList.remove('cl-bat');
      void elTotal.offsetWidth; // force le redemarrage de l'animation
      elTotal.classList.add('cl-bat');
    }
  }

  function majLivraison(){
    if (!blocLiv) return;
    var w = W[selW.value];
    if (!w) { blocLiv.style.display = 'none'; return; }
    var apparait = blocLiv.style.display === 'none';
    blocLiv.style.display = 'block';
    if (apparait && !calme) {
      blocLiv.style.animation = 'none';
      void blocLiv.offsetWidth;
      blocLiv.style.animation = 'cl-entree .45s cubic-bezier(.22,.9,.3,1) both';
    }
    var boutons = blocLiv.querySelectorAll('.cl-mode');
    for (var i = 0; i < boutons.length; i++) {
      var m = boutons[i].getAttribute('data-mode');
      boutons[i].querySelector('span').textContent = TARIF[w[1]][m] + ' DA';
    }
  }

  selW.addEventListener('change', function(){
    // Changer de wilaya invalide la commune choisie.
    selC.innerHTML = '';
    var w = W[selW.value];
    var vide = document.createElement('option');
    vide.value = '';
    vide.textContent = w ? T.choisir : T.dabord;
    selC.appendChild(vide);
    selC.disabled = !w;
    if (w) {
      for (var i = 0; i < w[2].length; i++) {
        var op = document.createElement('option');
        op.value = w[2][i];
        op.textContent = w[2][i];
        selC.appendChild(op);
      }
    }
    racine.querySelector('[data-champ="commune"]').classList.remove('cl-valide');
    majLivraison();
    majTotal();
    valider('wilaya');
  });

  selC.addEventListener('change', function(){ valider('commune'); });

  if (blocLiv) {
    blocLiv.addEventListener('click', function(ev){
      var b = ev.target.closest('.cl-mode');
      if (!b) return;
      mode = b.getAttribute('data-mode');
      var boutons = blocLiv.querySelectorAll('.cl-mode');
      for (var i = 0; i < boutons.length; i++) {
        boutons[i].setAttribute('aria-pressed', boutons[i] === b ? 'true' : 'false');
      }
      majTotal();
    });
  }

  function normTel(v){
    var n = String(v).replace(/[\\s.\\-()]/g, '');
    if (n.indexOf('+213') === 0) n = '0' + n.slice(4);
    else if (n.indexOf('00213') === 0) n = '0' + n.slice(5);
    else if (n.indexOf('213') === 0 && n.length === 12) n = '0' + n.slice(3);
    return n;
  }

  function messageErreur(nom, val){
    val = String(val || '').trim();
    if (nom === 'nom') {
      if (!val) return T.errNom;
      if (val.length < 3) return T.errNomCourt;
      if (/^[0-9]+$/.test(val)) return T.errNom;
      return '';
    }
    if (nom === 'telephone') {
      if (!val) return T.errTelVide;
      return /^0[567][0-9]{8}$/.test(normTel(val)) ? '' : T.errTel;
    }
    if (nom === 'wilaya') return val ? '' : T.errWilaya;
    if (nom === 'commune') return val ? '' : T.errCommune;
    return '';
  }

  function valider(nom){
    var bloc = racine.querySelector('[data-champ="' + nom + '"]');
    if (!bloc) return true;
    var ctrl = bloc.querySelector('input,select');
    var msg = messageErreur(nom, ctrl.value);
    bloc.classList.toggle('cl-invalide', !!msg);
    bloc.classList.toggle('cl-valide', !msg && !!String(ctrl.value).trim());
    bloc.querySelector('.cl-err').textContent = msg;
    return !msg;
  }

  var champs = ['nom', 'telephone', 'wilaya', 'commune'];
  champs.forEach(function(nom){
    var bloc = racine.querySelector('[data-champ="' + nom + '"]');
    var ctrl = bloc.querySelector('input,select');
    // On ne signale l'erreur qu'apres que le client a quitte le champ :
    // afficher "invalide" pendant la frappe fait abandonner.
    ctrl.addEventListener('blur', function(){ valider(nom); });
    ctrl.addEventListener('input', function(){
      if (bloc.classList.contains('cl-invalide')) valider(nom);
      else if (!messageErreur(nom, ctrl.value)) bloc.classList.add('cl-valide');
    });
  });

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var ok = true;
    for (var i = 0; i < champs.length; i++) { if (!valider(champs[i])) ok = false; }
    if (!ok) {
      var premier = racine.querySelector('.cl-invalide input,.cl-invalide select');
      if (premier) premier.focus();
      return;
    }

    var w = W[selW.value];
    var commande = {
      produit: PRODUIT,
      nom: racine.querySelector('#cl-nom').value.trim(),
      telephone: normTel(racine.querySelector('#cl-tel').value),
      wilaya_code: selW.value,
      wilaya: w[0],
      commune: selC.value,
      livraison: LIVRAISON_ACTIVE ? mode : '',
      frais_livraison: fraisActuels(),
      prix_produit: PRIX,
      total: PRIX + fraisActuels(),
      date: new Date().toISOString(),
      page: location.href
    };

    if (TYPE === 'aucune' || !DEST) { termine(); return; }

    bouton.disabled = true;
    var libelleInitial = bouton.textContent;
    bouton.textContent = T.envoi;

    if (TYPE === 'sheets') {
      // Google Apps Script refuse le preflight CORS : on envoie en texte brut.
      fetch(DEST, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(commande)
      }).then(termine).catch(echec);
    } else {
      fetch(DEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commande)
      }).then(function(r){
        if (r.ok) { termine(); return; }
        // Le serveur explique souvent ce qui cloche (numero refuse, envois en
        // rafale) : ce message vaut mieux qu'un "echec" opaque.
        return r.json().then(function(d){
          throw new Error((d && d.message) || 'http ' + r.status);
        }, function(){
          throw new Error('http ' + r.status);
        });
      }).catch(echec);
    }

    function echec(err){
      bouton.disabled = false;
      bouton.textContent = libelleInitial;
      var m = err && err.message && err.message.indexOf('http ') !== 0 ? err.message : T.erreurEnvoi;
      alert(m);
    }
  });

  function termine(){
    racine.classList.add('cl-fini');
    racine.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'center' });
    // Signal pour Meta Pixel / TikTok Pixel, si presents sur la page.
    if (typeof fbq === 'function') fbq('track', 'Lead');
    if (typeof ttq === 'object' && ttq.track) ttq.track('SubmitForm');
  }

  majTotal();
})();
<\/script>
</div>`;
}

/** Coche verte affichee quand un champ devient valide. */
const COCHE =
  '<svg class="cl-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Le script Google Sheets a coller dans Extensions > Apps Script. */
export const SCRIPT_GOOGLE_SHEETS = `function doPost(e) {
  var feuille = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);

  // En-tetes crees une seule fois, a la premiere commande.
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(['Date', 'Produit', 'Nom', 'Telephone', 'Wilaya', 'Commune',
                       'Livraison', 'Frais', 'Total', 'Statut']);
  }

  feuille.appendRow([
    new Date(), d.produit, d.nom, "'" + d.telephone, d.wilaya_code + ' - ' + d.wilaya,
    d.commune, d.livraison, d.frais_livraison, d.total, 'A confirmer'
  ]);

  return ContentService.createTextOutput('ok');
}`;
