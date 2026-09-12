import Link from "next/link";
import { adminConfigure, estConnecte } from "@/lib/admin-auth";
import { ConnexionAdmin } from "@/components/admin/ConnexionAdmin";
import { BoutonDeconnexion } from "@/components/admin/BoutonDeconnexion";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const ONGLETS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/utilisateurs", label: "Abonnés" },
  { href: "/admin/analyses", label: "Analyses" },
  { href: "/admin/systeme", label: "Système" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Le controle est ici, dans un composant serveur : le contenu des pages
  // enfants n'est jamais rendu ni envoye au navigateur sans cookie valide.
  if (!(await estConnecte())) {
    return <ConnexionAdmin configure={adminConfigure()} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-mist-100">Administration</h1>
          <p className="mt-0.5 text-sm text-mist-400">
            Tout ce qui se passe sur le site, au même endroit.
          </p>
        </div>
        <BoutonDeconnexion />
      </div>

      <nav className="barre-masquee mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {ONGLETS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="whitespace-nowrap rounded-full border border-ink-700 px-3.5 py-1.5 text-sm text-mist-300 transition hover:border-brand-500/40 hover:text-mist-100"
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
