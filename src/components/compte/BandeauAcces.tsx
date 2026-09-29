import Link from "next/link";
import { CARTE_ACTIVE } from "@/lib/public";
import type { Langue } from "@/lib/langue";

/* ============================================================================
   Bandeau affiche au-dessus de la zone de depot quand l'analyse n'est pas
   possible. Trois situations, trois messages, trois actions differentes :
   pas de compte, pas de formule active, plus de credits. Un message unique
   du genre "acces refuse" laisserait le visiteur sans savoir quoi faire.
   ========================================================================== */

const TEXTES = {
  fr: {
    visiteur: {
      titre: "Crée ton compte pour lancer une analyse",
      texte: CARTE_ACTIVE
        ? "Une minute, un paiement sécurisé, et ta première analyse part aussitôt."
        : "Une minute, et on t'active dans l'heure. Tu peux déjà parcourir un rapport d'exemple.",
      action: "Créer mon compte",
      secondaire: "J'ai déjà un compte",
    },
    inactif: {
      titre: "Ton compte n'a pas encore de formule active",
      texte: "Choisis ta formule depuis ton compte : tes crédits arrivent aussitôt.",
      action: "Choisir ma formule",
      secondaire: "Voir les formules",
    },
    vide: {
      titre: "Il ne te reste plus de crédits",
      texte: (c: number) => `Ton solde est à ${c}. Une recharge te remet en route tout de suite, sans changer de formule.`,
      action: "Recharger",
      secondaire: "Voir les recharges",
    },
  },
  en: {
    visiteur: {
      titre: "Create your account to run an analysis",
      texte: CARTE_ACTIVE
        ? "One minute, a secure payment, and your first analysis starts right away."
        : "One minute, and we activate you within the hour. You can already browse a sample report.",
      action: "Create my account",
      secondaire: "I already have an account",
    },
    inactif: {
      titre: "Your account has no active plan yet",
      texte: "Pick your plan from your account: credits land right away.",
      action: "Choose my plan",
      secondaire: "See the plans",
    },
    vide: {
      titre: "You're out of credits",
      texte: (c: number) => `Your balance is ${c}. A top-up gets you going right away, without changing plans.`,
      action: "Top up",
      secondaire: "See top-ups",
    },
  },
};

export function BandeauAcces({
  connecte,
  credits,
  abonnementActif,
  langue,
}: {
  connecte: boolean;
  credits: number;
  abonnementActif: boolean;
  langue: Langue;
}) {
  const t = TEXTES[langue];
  const cas = !connecte ? "visiteur" : !abonnementActif ? "inactif" : "vide";

  const contenu = {
    visiteur: { ...t.visiteur, href: "/inscription", hrefSecondaire: "/connexion" },
    inactif: { ...t.inactif, href: "/compte", hrefSecondaire: "/tarifs" },
    vide: { ...t.vide, texte: t.vide.texte(credits), href: "/compte", hrefSecondaire: "/tarifs" },
  }[cas];

  // Une seule ligne sur grand ecran : ce bandeau precede le hero, et rien ne
  // doit voler la vedette a l'entree de la page. Il informe, il n'expose pas.
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--r-md)] border border-brand-500/25 bg-brand-500/[0.06] px-4 py-2.5">
      <p className="min-w-[15rem] flex-1 text-sm leading-snug text-mist-200">
        <span className="font-medium text-brand-300">{contenu.titre}</span>
        <span className="hidden text-mist-400 sm:inline"> — {contenu.texte}</span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Link
          href={contenu.href}
          className="rounded-[var(--r-sm)] bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          {contenu.action}
        </Link>
        <Link
          href={contenu.hrefSecondaire}
          className="rounded-[var(--r-sm)] border border-ink-700 px-3.5 py-1.5 text-xs font-medium text-mist-300 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          {contenu.secondaire}
        </Link>
      </div>
    </div>
  );
}
