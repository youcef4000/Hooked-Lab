import { cookies, headers } from "next/headers";
import { COOKIE_LANGUE, estLangue, langueDepuisEntete, type Langue } from "./langue";

/** Langue de la requete en cours, cote serveur (voir langue.ts pour l'ordre de decision). */
export async function langueCourante(): Promise<Langue> {
  const choix = (await cookies()).get(COOKIE_LANGUE)?.value;
  if (estLangue(choix)) return choix;
  return langueDepuisEntete((await headers()).get("accept-language"));
}
