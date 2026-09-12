import { GestionUtilisateurs } from "@/components/admin/GestionUtilisateurs";
import { abonnementActif, listerUtilisateurs } from "@/lib/comptes";

export const dynamic = "force-dynamic";

export default function PageUtilisateurs() {
  // L'empreinte du mot de passe ne quitte jamais le serveur.
  const utilisateurs = listerUtilisateurs()
    .map((u) => ({
      id: u.id,
      email: u.email,
      nom: u.nom,
      telephone: u.telephone,
      credits: u.credits,
      palier: u.palier,
      expireLe: u.expireLe,
      actif: abonnementActif(u),
      creeLe: u.creeLe,
      creditsConsommes: u.creditsConsommes,
      suspendu: u.suspendu,
    }))
    .reverse();

  return <GestionUtilisateurs initiaux={utilisateurs} />;
}
