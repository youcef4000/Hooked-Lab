import { estConnecte } from "@/lib/admin-auth";
import { annulerCode, genererCodes, journaliser, listerCodes, type TypeCode } from "@/lib/codes";

/* Generation et suivi des codes. Reserve a l'administrateur. */

async function refuseSiNonConnecte(): Promise<Response | null> {
  return (await estConnecte())
    ? null
    : Response.json({ ok: false, message: "Non autorisé." }, { status: 401 });
}

export async function GET(): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;
  return Response.json({ ok: true, codes: listerCodes().reverse() });
}

export async function POST(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  let corps: {
    type?: unknown;
    reference?: unknown;
    mois?: unknown;
    note?: unknown;
    quantite?: unknown;
  };
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    return Response.json({ ok: false, message: "Requête illisible." }, { status: 400 });
  }

  const type = corps.type === "recharge" ? "recharge" : ("abonnement" as TypeCode);
  const resultat = genererCodes({
    type,
    reference: String(corps.reference ?? ""),
    mois: Number(corps.mois) || 1,
    note: String(corps.note ?? ""),
    quantite: Number(corps.quantite) || 1,
  });

  if (!resultat.ok) return Response.json({ ok: false, message: resultat.message }, { status: 422 });

  journaliser("codes_generes", {
    type,
    reference: String(corps.reference ?? ""),
    quantite: resultat.codes?.length ?? 0,
    codes: resultat.codes?.map((c) => c.code),
  });

  return Response.json({ ok: true, codes: resultat.codes }, { status: 201 });
}

export async function DELETE(requete: Request): Promise<Response> {
  const refus = await refuseSiNonConnecte();
  if (refus) return refus;

  const code = new URL(requete.url).searchParams.get("code") ?? "";
  if (!annulerCode(code)) {
    return Response.json(
      { ok: false, message: "Code introuvable, ou déjà utilisé — un code utilisé ne s'annule pas." },
      { status: 422 },
    );
  }
  journaliser("code_annule", { code });
  return Response.json({ ok: true });
}
