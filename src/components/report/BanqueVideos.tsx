"use client";

import { Badge, Card, Section } from "../ui";
import { CopyButton } from "../CopyButton";
import { lienRechercheVideo } from "@/lib/sourcing";
import { useRapport } from "./contexte";
import type { PisteVideo } from "@/types/analysis";

/* ============================================================================
   Banque de videos reutilisables.

   Le modele n'a pas acces au web : il ne peut pas garantir qu'une video precise
   existe, et inventerait des URL. Il fournit donc la requete exacte, et
   l'application construit le lien de recherche — toujours valide.

   Les fiches fournisseur (1688, AliExpress) sont mises en avant : leurs videos
   montrent le produit a l'identique, sur fond neutre, sans texte incruste, et
   sont telechargeables. C'est la meilleure matiere premiere pour un montage.
   ========================================================================== */

const COULEUR_SOURCE: Record<string, string> = {
  "1688": "text-amber-glow",
  AliExpress: "text-copper",
  Alibaba: "text-amber-glow",
  TikTok: "text-mist-100",
  Instagram: "text-copper",
  "YouTube Shorts": "text-rose-warn",
  Pinterest: "text-rose-warn",
  "Banque libre": "text-jade",
};

/** Nom affiche de la source : "Banque libre" est une valeur interne. */
function nomSource(source: string, fr: boolean): string {
  return source === "Banque libre" ? (fr ? "Banque libre (Pexels)" : "Free stock (Pexels)") : source;
}

function CartePiste({ piste, rang }: { piste: PisteVideo; rang: number }) {
  const { fr } = useRapport();
  const lien = lienRechercheVideo(piste.source, piste.requete);
  const nom = nomSource(piste.source, fr);

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-800 text-xs font-semibold text-mist-300">
          {rang}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${COULEUR_SOURCE[piste.source] ?? "text-mist-100"}`}
            >
              {nom}
            </span>
            {piste.produit_identique && <Badge tone="vert">{fr ? "Produit identique" : "Exact product"}</Badge>}
            {piste.sans_texte && <Badge tone="bleu">{fr ? "Sans texte" : "No text"}</Badge>}
          </div>
          <h3 className="mt-1.5 text-sm font-medium leading-snug text-mist-100">{piste.titre}</h3>
          <p className="mt-1 text-xs leading-relaxed text-mist-300">{piste.contenu}</p>
        </div>
      </div>

      {/* La requete, copiable telle quelle */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-ink-800 bg-ink-950/60 px-3 py-2">
        <code className="min-w-0 flex-1 break-all text-xs text-mist-200">{piste.requete}</code>
        <CopyButton texte={piste.requete} label="" />
      </div>

      <p className="mt-2.5 flex-1 rounded-md bg-ink-850 px-3 py-2 text-xs leading-relaxed text-brand-300">
        <span className="font-medium">{fr ? "Au montage :" : "In the edit:"}</span> {piste.usage}
      </p>

      <a
        href={lien}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-xs font-medium text-mist-200 transition hover:border-brand-500/50 hover:text-brand-300"
      >
        {fr ? `Ouvrir la recherche sur ${nom}` : `Open the search on ${nom}`}
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14 21 3" />
        </svg>
      </a>
    </Card>
  );
}

export function BanqueVideos({ pistes }: { pistes: PisteVideo[] }) {
  const { fr, marche } = useRapport();
  const titre = fr ? "Vidéos réutilisables pour ton montage" : "Reusable footage for your edit";
  if (!pistes?.length) {
    return (
      <Section
        titre={titre}
        soustitre={fr ? "Où trouver des plans du produit, prêts à monter en 9:16." : "Where to find product shots, ready to cut in 9:16."}
      >
        <Card className="border-dashed p-6 text-center">
          <p className="text-sm text-mist-200">
            {fr
              ? "Cette analyse a été produite avant l'ajout de la banque de vidéos."
              : "This analysis was produced before the footage bank was added."}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-mist-400">
            {fr
              ? "Relance une analyse sur la même créative pour obtenir les pistes de vidéos."
              : "Run a new analysis on the same creative to get footage leads."}
          </p>
        </Card>
      </Section>
    );
  }

  const prioritaires = pistes.filter((p) => p.produit_identique);
  const complements = pistes.filter((p) => !p.produit_identique);

  return (
    <Section
      titre={titre}
      soustitre={
        fr
          ? "Des plans du produit prêts à monter en 9:16, sans avoir à tourner toi-même."
          : "Product shots ready to cut in 9:16, without shooting anything yourself."
      }
    >
      {/* Mise en garde honnete : ce sont des recherches, pas des videos garanties */}
      <div className="mb-4 flex gap-2.5 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
        </svg>
        <p className="text-xs leading-relaxed text-mist-300">
          {fr ? (
            <>
              Chaque bouton ouvre une <strong className="text-mist-100">recherche réelle</strong> sur la
              plateforme, avec la bonne requête déjà saisie. Les fiches fournisseur 1688 et AliExpress
              sont les meilleures sources : leurs vidéos montrent le produit exact, sur fond neutre et
              sans texte incrusté. Vérifie les droits d&apos;usage avant de réutiliser une vidéo prise
              sur un compte social.
            </>
          ) : (
            <>
              Each button opens a <strong className="text-mist-100">real search</strong> on the
              platform, with the right query already filled in. 1688 and AliExpress supplier listings
              are the best sources: their videos show the exact product, on a neutral background, with
              no burned-in text. Check usage rights before reusing a video from a social account.
            </>
          )}
        </p>
      </div>

      {prioritaires.length > 0 && (
        <>
          <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-jade">
            {fr ? "Le produit à l'identique" : "The exact product"} — {prioritaires.length} {fr ? "pistes" : "leads"}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {prioritaires.map((p, i) => (
              <CartePiste key={i} piste={p} rang={i + 1} />
            ))}
          </div>
        </>
      )}

      {complements.length > 0 && (
        <>
          <h3 className="mb-2.5 mt-6 text-xs font-medium uppercase tracking-wide text-mist-400">
            {fr ? "Plans de coupe et ambiance" : "B-roll and mood"} — {complements.length} {fr ? "pistes" : "leads"}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {complements.map((p, i) => (
              <CartePiste key={i} piste={p} rang={prioritaires.length + i + 1} />
            ))}
          </div>
        </>
      )}

      <div className="mt-4 rounded-lg border border-ink-800 bg-ink-900 px-4 py-3">
        <h4 className="text-xs font-semibold text-mist-100">
          {fr ? "Comment télécharger une vidéo 1688" : "How to download a 1688 video"}
        </h4>
        <ol className="mt-2 space-y-1 text-xs leading-relaxed text-mist-300">
          {fr ? (
            <>
              <li>1. Ouvre la fiche produit, la vidéo est en haut de la galerie photo.</li>
              <li>2. Clic droit sur la vidéo, puis « Enregistrer la vidéo sous ».</li>
              <li>
                3. Si le clic droit est bloqué : ouvre les outils de développement, onglet Réseau,
                filtre « media », puis relance la vidéo — le fichier apparaît et se télécharge.
              </li>
              <li>
                4. Recadre en 9:16 dans ton logiciel de montage, ajoute tes sous-titres
                {marche.id === "dz" ? " en darija" : ""}.
              </li>
            </>
          ) : (
            <>
              <li>1. Open the product listing — the video sits at the top of the photo gallery.</li>
              <li>2. Right-click the video, then “Save video as”.</li>
              <li>
                3. If right-click is blocked: open developer tools, Network tab, filter “media”, then
                replay the video — the file shows up and can be downloaded.
              </li>
              <li>4. Crop to 9:16 in your editor and add your subtitles.</li>
            </>
          )}
        </ol>
      </div>
    </Section>
  );
}
