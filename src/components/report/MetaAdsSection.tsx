"use client";

import { useState } from "react";
import { Badge, Card, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import type { MetaAd } from "@/types/analysis";

/* ============================================================================
   Annonces Meta.

   Chaque champ est copiable separement parce que le gestionnaire de publicites
   Meta a trois zones de saisie distinctes : on colle l'une apres l'autre. Le
   compteur de caracteres previent la troncature avant de lancer la campagne.
   ========================================================================== */

/** Limites au-dela desquelles Meta coupe l'affichage. */
const LIMITES = { texte_principal: 125, titre: 40, description: 30 };

function Champ({
  label,
  valeur,
  limite,
  rtl = false,
}: {
  label: string;
  valeur: string;
  limite: number;
  rtl?: boolean;
}) {
  const longueur = valeur.length;
  const depasse = longueur > limite;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-mist-400">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] tabular-nums ${depasse ? "text-amber-glow" : "text-mist-400"}`}
            title={
              depasse
                ? `Au-dela de ${limite} caracteres, Meta tronque l'affichage`
                : `Limite conseillee : ${limite} caracteres`
            }
          >
            {longueur}/{limite}
          </span>
          <CopyButton texte={valeur} label="" />
        </div>
      </div>
      <p
        dir={rtl ? "rtl" : "ltr"}
        className={`whitespace-pre-wrap rounded-lg border bg-ink-950/60 px-3 py-2.5 text-sm leading-relaxed text-mist-100 ${
          depasse ? "border-amber-glow/35" : "border-ink-700"
        }`}
      >
        {valeur}
      </p>
    </div>
  );
}

function CarteAnnonce({ ad }: { ad: MetaAd }) {
  const [langue, setLangue] = useState<"fr" | "ar">("fr");
  const ar = langue === "ar";

  // Bloc complet, pour qui prefere tout copier d'un coup.
  const tout = ar
    ? `${ad.texte_principal_ar}\n\n${ad.titre_ar}\n${ad.description_ar}`
    : `${ad.texte_principal}\n\n${ad.titre}\n${ad.description}`;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-mist-100">{ad.nom_variante}</h3>
          <p className="mt-0.5 text-xs text-mist-400">Angle : {ad.angle_utilise}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border border-ink-700 bg-ink-850 p-0.5">
            <button
              onClick={() => setLangue("fr")}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                !ar ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setLangue("ar")}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                ar ? "bg-ink-700 text-mist-100" : "text-mist-400 hover:text-mist-200"
              }`}
            >
              العربية
            </button>
          </div>
          <CopyButton texte={tout} label="Tout copier" />
        </div>
      </div>

      <div className="space-y-3">
        <Champ
          label="Texte principal"
          valeur={ar ? ad.texte_principal_ar : ad.texte_principal}
          limite={LIMITES.texte_principal}
          rtl={ar}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ
            label="Titre"
            valeur={ar ? ad.titre_ar : ad.titre}
            limite={LIMITES.titre}
            rtl={ar}
          />
          <Champ
            label="Description"
            valeur={ar ? ad.description_ar : ad.description}
            limite={LIMITES.description}
            rtl={ar}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-ink-800 pt-3">
        <span className="text-[11px] uppercase tracking-wide text-mist-400">Bouton</span>
        <Badge tone="vert">{ad.bouton_cta}</Badge>
      </div>
    </Card>
  );
}

export function MetaAdsSection({ ads }: { ads: MetaAd[] }) {
  // Les rapports produits avant l'ajout de cette section n'ont pas le champ.
  // On le dit explicitement plutot que de disparaitre sans explication.
  if (!ads?.length) {
    return (
      <Section
        titre="Annonces Meta prêtes à publier"
        soustitre="Texte principal, titre, description et bouton, prêts à coller dans le gestionnaire Meta."
      >
        <Card className="border-dashed p-6 text-center">
          <p className="text-sm text-mist-200">
            Cette analyse a été produite avant l&apos;ajout des annonces Meta.
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-mist-400">
            Relance une analyse sur la même créative pour obtenir les annonces au format Meta,
            en français et en arabe algérien.
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section
      titre="Annonces Meta prêtes à publier"
      soustitre="Chaque champ correspond à une zone du gestionnaire de publicités Facebook et Instagram. Copie, colle, lance."
    >
      <div className="space-y-3">
        {ads.map((ad, i) => (
          <CarteAnnonce key={i} ad={ad} />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-mist-400">
        Les compteurs signalent les dépassements : au-delà de la limite, Meta tronque le texte
        dans le fil d&apos;actualité. Teste au moins trois angles différents en parallèle avant
        d&apos;augmenter le budget sur le gagnant.
      </p>
    </Section>
  );
}
