import { TableauCommandes } from "@/components/admin/TableauCommandes";
import { listerCommandes } from "@/lib/commandes";

export const dynamic = "force-dynamic";

export default function PageCommandes() {
  return <TableauCommandes initiales={listerCommandes()} />;
}
