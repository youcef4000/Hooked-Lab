import { PageTarifs } from "@/components/tarifs/PageTarifs";

export const metadata = {
  title: "Tarifs et recharges",
  description:
    "Abonnements dès 2 300 DA ou 15 $ par mois, recharges ponctuelles, et le détail de ce que consomme chaque analyse.",
};

export default function Tarifs() {
  return <PageTarifs />;
}
