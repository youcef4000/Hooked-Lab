import { GestionCodes } from "@/components/admin/GestionCodes";
import { listerCodes } from "@/lib/codes";

export const dynamic = "force-dynamic";

export default function PageCodes() {
  return <GestionCodes initiaux={listerCodes().reverse()} />;
}
