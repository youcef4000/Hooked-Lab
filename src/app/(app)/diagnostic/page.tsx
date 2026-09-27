import { notFound } from "next/navigation";
import { Diagnostic } from "@/components/admin/Diagnostic";
import { estConnecte } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnostic" };

/* Reserve au proprietaire : la page revele la configuration du serveur. */
export default async function PageDiagnostic() {
  if (!(await estConnecte())) notFound();
  return <Diagnostic />;
}
