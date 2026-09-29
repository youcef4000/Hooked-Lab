import type { Metadata } from "next";
import { GenerateurFormulaire } from "@/components/GenerateurFormulaire";
import { estConnecte } from "@/lib/admin-auth";
import { langueCourante } from "@/lib/langue-serveur";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const fr = (await langueCourante()) === "fr";
  return { title: fr ? "Formulaire de commande COD" : "Algeria COD order form" };
}

export default async function PageFormulaire() {
  const proprietaire = await estConnecte();
  const fr = (await langueCourante()) === "fr";
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-mist-100">
          {fr ? "Formulaire de commande COD" : "Algeria COD order form"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
          {fr
            ? "Pour vendre en Algérie en paiement à la livraison : quatre champs obligatoires, les 58 wilayas et leurs communes. Règle-le ici, copie le code, colle-le sur ta page produit. Aucune dépendance : il fonctionne sur YouCan, Shopify, une landing HTML ou une page Blogger."
            : "For cash-on-delivery sales in Algeria: four required fields, all 58 wilayas and their communes. Set it up here, copy the code, paste it on your product page. No dependencies: it works on YouCan, Shopify, a plain HTML landing page or Blogger."}
        </p>
        {!fr && (
          <p className="mt-2 max-w-2xl rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs leading-relaxed text-mist-300">
            The settings below are in French, like the form your Algerian customers will see. Selling
            with card payment (US, UK, Europe, Australia)? You don&apos;t need this tool — your store
            checkout handles orders.
          </p>
        )}
      </div>
      <GenerateurFormulaire proprietaire={proprietaire} />
    </div>
  );
}
