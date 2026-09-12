import Link from "next/link";

/* ============================================================================
   Bandeau affiche au-dessus de la zone de depot quand l'analyse n'est pas
   possible. Trois situations, trois messages, trois actions differentes :
   pas de compte, compte non active, plus de credits. Un message unique du
   genre "acces refuse" laisserait le visiteur sans savoir quoi faire.
   ========================================================================== */

export function BandeauAcces({
  connecte,
  credits,
  abonnementActif,
}: {
  connecte: boolean;
  credits: number;
  abonnementActif: boolean;
}) {
  const cas = !connecte ? "visiteur" : !abonnementActif ? "inactif" : "vide";

  const contenu = {
    visiteur: {
      titre: "Crée ton compte pour lancer une analyse",
      texte:
        "Deux minutes, puis on t'appelle pour l'activer. Tu peux déjà parcourir un rapport d'exemple pour voir ce que tu recevras.",
      action: { href: "/inscription", label: "Créer mon compte" },
      secondaire: { href: "/connexion", label: "J'ai déjà un compte" },
    },
    inactif: {
      titre: "Ton compte n'est pas encore activé",
      texte:
        "Saisis le code reçu après ton paiement, et tes crédits seront disponibles immédiatement.",
      action: { href: "/compte", label: "Saisir mon code" },
      secondaire: { href: "/#tarifs", label: "Voir les formules" },
    },
    vide: {
      titre: "Il ne te reste plus de crédits",
      texte: `Ton solde est à ${credits}. Une recharge te remet en route tout de suite, sans changer ton abonnement.`,
      action: { href: "/compte", label: "Recharger" },
      secondaire: { href: "/#tarifs", label: "Voir les recharges" },
    },
  }[cas];

  // Une seule ligne sur grand ecran : ce bandeau precede le hero, et rien ne
  // doit voler la vedette a l'entree de la page. Il informe, il n'expose pas.
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--r-md)] border border-brand-500/25 bg-brand-500/[0.06] px-4 py-2.5">
      <p className="min-w-0 flex-1 text-sm leading-snug text-mist-200">
        <span className="font-medium text-brand-300">{contenu.titre}</span>
        <span className="hidden text-mist-400 sm:inline"> — {contenu.texte}</span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Link
          href={contenu.action.href}
          className="rounded-[var(--r-sm)] bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-brand-400"
        >
          {contenu.action.label}
        </Link>
        <Link
          href={contenu.secondaire.href}
          className="rounded-[var(--r-sm)] border border-ink-700 px-3.5 py-1.5 text-xs font-medium text-mist-300 transition hover:border-brand-500/50 hover:text-brand-300"
        >
          {contenu.secondaire.label}
        </Link>
      </div>
    </div>
  );
}
