import { FormulaireAuth } from "@/components/compte/FormulaireAuth";

export const metadata = { title: "Connexion" };

export default function Connexion() {
  return <FormulaireAuth mode="connexion" />;
}
