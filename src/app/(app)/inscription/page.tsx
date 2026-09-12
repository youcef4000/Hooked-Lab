import { FormulaireAuth } from "@/components/compte/FormulaireAuth";

export const metadata = { title: "Créer un compte" };

export default function Inscription() {
  return <FormulaireAuth mode="inscription" />;
}
