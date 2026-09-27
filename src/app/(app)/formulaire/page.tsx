import { GenerateurFormulaire } from "@/components/GenerateurFormulaire";
import { estConnecte } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Formulaire de commande",
};

export default async function PageFormulaire() {
  const proprietaire = await estConnecte();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">
          Formulaire de commande
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
          Quatre champs obligatoires, les 58 wilayas et leurs communes. Règle-le ici, copie le code,
          colle-le sur ta page produit. Aucune dépendance : il fonctionne sur YouCan, Shopify, une
          landing HTML ou une page Blogger.
        </p>
      </div>
      <GenerateurFormulaire proprietaire={proprietaire} />
    </div>
  );
}
