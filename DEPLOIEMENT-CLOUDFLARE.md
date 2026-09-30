# Mettre Hooked Lab en ligne sur Cloudflare

Tout se passe dans le tableau de bord Cloudflare (dash.cloudflare.com) et dans
Stripe. Rien à installer sur ton ordinateur : Cloudflare construit le site
lui-même à partir de GitHub.

> **Sécurité** — les clés (Anthropic, Groq, Stripe) et les mots de passe se
> tapent **uniquement** dans Cloudflare ou Stripe. Jamais dans un chat, jamais
> dans une capture d'écran, jamais dans le dépôt GitHub.

## Comment c'est construit

| Pièce | Rôle |
|---|---|
| **Worker `hooked-lab`** | Porte d'entrée de hooked-lab.com. Transmet chaque visite au conteneur. |
| **Conteneur** (Cloudflare Containers) | Fait tourner le site, ffmpeg et yt-dlp. 1 vCPU, 3 Go. |
| **Bucket R2 `hooked-lab-donnees`** | Garde comptes, crédits, paiements et analyses. Le disque du conteneur est effacé à chaque redémarrage : tout est recopié dans R2 à chaque enregistrement, et rapatrié à chaque démarrage. |
| **Tâche planifiée** | Réveille le site toutes les 5 minutes : aucun visiteur n'attend un démarrage à froid. |

---

## 1. Activer le plan Workers Paid (5 $/mois)

Cloudflare → **Workers & Pages** → **Plans** → **Workers Paid** → souscrire.
Les conteneurs ne fonctionnent qu'avec ce plan.

## 2. Créer le bucket R2

Cloudflare → **R2 Object Storage** → **Create bucket**
- Nom : `hooked-lab-donnees` (exactement ce nom)
- Location : *Automatic*

À la première utilisation de R2, Cloudflare te demande d'accepter les
conditions. Les 10 premiers Go sont gratuits.

## 3. Libérer le domaine

Le Worker va prendre `hooked-lab.com` et `www.hooked-lab.com`. S'il existe déjà
des enregistrements DNS pour ces noms, Cloudflare refusera.

Cloudflare → **hooked-lab.com** → **DNS** → **Records** : supprime les
enregistrements **A**, **AAAA** et **CNAME** dont le nom est `hooked-lab.com`
(ou `@`) et `www`. Ne touche pas aux enregistrements **MX** et **TXT** (email).

## 4. Brancher GitHub

Cloudflare → **Workers & Pages** → **Create** → **Import a repository**
1. Autorise l'accès au dépôt `youcef4000/Hooked-Lab`.
2. Réglages :
   - **Project name** : `hooked-lab` (exactement ce nom)
   - **Production branch** : `main`
   - **Build command** : laisser vide
   - **Deploy command** : `npx wrangler deploy`
3. **Save and Deploy**.

La première construction prend 10 à 20 minutes (Cloudflare fabrique l'image du
conteneur). Les suivantes sont plus rapides.

À la fin, `hooked-lab.com` et `www.hooked-lab.com` apparaissent dans
**Settings → Domains & Routes**, avec le certificat HTTPS.

## 5. Saisir les secrets

Cloudflare → **Workers & Pages** → **hooked-lab** → **Settings** →
**Variables and Secrets** → **Add**, type **Secret** :

| Nom | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | ta clé Anthropic (console.anthropic.com) |
| `GROQ_API_KEY` | ta clé Groq (console.groq.com) |
| `ADMIN_MOT_DE_PASSE` | **nouveau** mot de passe admin, 16 caractères minimum, différent de celui de ton ordinateur |
| `ADMIN_SECRET` | 32 caractères aléatoires (générateur de mots de passe) |
| `SESSION_SECRET` | 32 autres caractères aléatoires |
| `STRIPE_SECRET_KEY` | voir étape 6 |
| `STRIPE_WEBHOOK_SECRET` | voir étape 6 |

Facultatif, type **Text** : `META_PIXEL_ID`, `TIKTOK_PIXEL_ID`.

**Pas besoin de redéployer** : dans les 5 minutes, le site détecte les
nouveaux réglages, termine les analyses en cours, sauvegarde tout dans R2 et
redémarre avec les nouvelles valeurs.

## 6. Stripe (le seul moyen de paiement)

Sur dashboard.stripe.com :

1. **Réglages → Moyens de paiement** : cartes (actives par défaut),
   **Apple Pay** et **Google Pay** à activer.
2. **Réglages → Informations publiques** : nom `Hooked Lab`, email de support
   `support@hooked-lab.com`, site `https://hooked-lab.com`.
3. **Développeurs → Clés API** : copie la **clé secrète** → secret
   `STRIPE_SECRET_KEY` dans Cloudflare.
4. **Développeurs → Webhooks → Ajouter une destination** :
   - URL : `https://hooked-lab.com/api/paiement/webhook`
   - Événements : `checkout.session.completed` et
     `checkout.session.async_payment_succeeded`
   - Copie le **secret de signature** (`whsec_...`) → secret
     `STRIPE_WEBHOOK_SECRET` dans Cloudflare.

**Conseil** : fais un premier essai en **mode test** (clés `sk_test_...`, un
webhook créé en mode test, carte `4242 4242 4242 4242`, date future, n'importe
quel code), puis remplace les deux secrets par ceux du **mode live**.

Ce que voit le client : il choisit sa formule, paie sur la page Stripe, et
revient directement dans l'outil avec ses crédits — l'accès est immédiat. Le
site vérifie le paiement auprès de Stripe au retour, et le webhook confirme
en parallèle : un paiement n'est jamais crédité deux fois.

## 7. Email de support (gratuit)

Cloudflare → **hooked-lab.com** → **Email** → **Email Routing** → activer →
**Create address** : `support@hooked-lab.com` → vers ton adresse Gmail
(Cloudflare t'envoie un email de confirmation). C'est l'adresse affichée aux
clients sur le site.

## 8. Vérifier

1. Ouvre `https://hooked-lab.com`.
2. `https://hooked-lab.com/admin` → ton nouveau mot de passe → **Système** :
   chaque ligne doit être verte (clé Anthropic, Stripe, Sauvegarde R2…).
3. Lance une analyse, puis rends-la publique depuis l'admin : c'est l'exemple
   que verront les visiteurs sur la page Analyser.

---

## Au quotidien

- **Mises à jour** : chaque envoi sur la branche `main` est construit et mis en
  ligne automatiquement. Les analyses en cours se terminent avant la bascule
  (jusqu'à 13 minutes), et les données restent dans R2.
- **Journaux** : Workers & Pages → hooked-lab → **Logs**.
- **Coût mensuel estimé** : 5 $ (Workers Paid) + environ 20 $ (conteneur
  allumé en permanence) + R2 quasi gratuit, plus Anthropic (~0,25 $ par
  analyse vidéo).
- **Limite de fichier** : 95 Mo par vidéo déposée (Cloudflare refuse au-delà
  de 100 Mo par requête). Une vidéo publicitaire pèse en général 5 à 40 Mo.
