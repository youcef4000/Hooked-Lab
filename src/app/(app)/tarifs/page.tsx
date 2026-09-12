import { PageTarifs } from "@/components/tarifs/PageTarifs";

export const metadata = {
  title: "Tarifs et recharges",
  description:
    "Abonnements dès 2 000 DA par mois, recharges ponctuelles, et le détail de ce que consomme chaque analyse. Paiement par BaridiMob ou CCP.",
};

export default function Tarifs() {
  return <PageTarifs />;
}
