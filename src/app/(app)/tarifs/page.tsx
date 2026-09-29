import { PageTarifs } from "@/components/tarifs/PageTarifs";
import { langueCourante } from "@/lib/langue-serveur";

export async function generateMetadata() {
  const fr = (await langueCourante()) === "fr";
  return {
    title: fr ? "Tarifs" : "Pricing",
    description: fr
      ? "Formules dès 15 $ par mois, recharges ponctuelles, et le détail de ce que consomme chaque analyse."
      : "Plans from $15 a month, one-off top-ups, and exactly what each analysis costs.",
  };
}

export default function Tarifs() {
  return <PageTarifs />;
}
