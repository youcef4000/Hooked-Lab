"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/* ============================================================================
   Pixels Meta et TikTok.

   Sur Shopify, le pixel se colle dans un champ du back-office. Ici il n'y a
   pas de back-office : le pixel est un bout de JavaScript charge par
   l'application elle-meme. Les identifiants (META_PIXEL_ID, TIKTOK_PIXEL_ID)
   sont lus par le serveur a chaque requete et passes ici : on les change
   chez l'hebergeur sans reconstruire le site. Sans identifiant, rien n'est
   charge — le site reste propre en developpement.

   Une particularite qui n'existe pas sur Shopify : cette application ne
   recharge pas la page quand on navigue. Le pixel n'enverrait donc qu'un seul
   PageView, celui de l'arrivee. C'est pourquoi on renvoie l'evenement a
   chaque changement d'adresse.
   ========================================================================== */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (nom: string, params?: Record<string, unknown>) => void };
  }
}

/** Un identifiant de pixel n'est fait que de lettres et de chiffres : rien d'autre n'entre dans le script. */
const propre = (id: string | undefined) => (id && /^[A-Za-z0-9]{5,40}$/.test(id) ? id : "");

export function Pixels({ meta, tiktok }: { meta?: string; tiktok?: string }) {
  const META = propre(meta);
  const TIKTOK = propre(tiktok);
  const chemin = usePathname();
  const premier = useRef(true);

  useEffect(() => {
    // Le script du pixel envoie deja le PageView d'arrivee : le renvoyer ici
    // ferait un doublon sur la premiere page.
    if (premier.current) {
      premier.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
    window.ttq?.track("Pageview");
  }, [chemin]);

  return (
    <>
      {META && (
        <Script id="pixel-meta" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META}');fbq('track','PageView');`}
        </Script>
      )}

      {TIKTOK && (
        <Script id="pixel-tiktok" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";
o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];
a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}

/* ------------------------------------------------------------- evenements */

/**
 * Envoie un evenement aux deux regies a la fois.
 *
 * Les deux plateformes n'ont pas le meme vocabulaire pour la meme chose :
 * une inscription se dit "CompleteRegistration" chez Meta et "CompleteRegistration"
 * chez TikTok, mais une vue de page produit se dit "ViewContent" des deux
 * cotes alors qu'un depot de panier differe. On traduit donc au cas par cas
 * plutot que de transmettre le meme nom aveuglement.
 */
export function evenement(
  nom: "Lead" | "InitiateCheckout" | "CompleteRegistration" | "Purchase" | "ViewContent",
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;

  window.fbq?.("track", nom, params);

  const versTikTok: Record<string, string> = {
    Lead: "SubmitForm",
    InitiateCheckout: "InitiateCheckout",
    CompleteRegistration: "CompleteRegistration",
    Purchase: "CompletePayment",
    ViewContent: "ViewContent",
  };
  window.ttq?.track(versTikTok[nom] ?? nom, params);
}
