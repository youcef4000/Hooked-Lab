# Guide de lancement — mise en ligne, iOS, credits et tarification

Ce document repond a trois questions : comment mettre l'application en ligne (et sur iPhone),
comment maitriser la consommation de credits Anthropic, et comment fixer les prix.

---

## 1. Mise en ligne et iOS / App Store

### La realite technique d'abord

L'application n'est pas une simple page web : elle fait tourner `yt-dlp`, `ffmpeg` et Whisper
sur un serveur, avec des analyses de 3 minutes et des fichiers sur disque. **Elle ne peut pas
tourner "dans" un iPhone** : le telephone sera toujours un client qui parle a ton serveur.
Toute la strategie decoule de ca.

### Etape 1 — Un serveur en ligne (a faire en premier, tout le reste en depend)

- **Ou :** un VPS chez Hetzner (~5 €/mois), Contabo ou DigitalOcean. Eviter Vercel et les
  plateformes serverless : binaires natifs, jobs de 3 minutes et ecriture disque ne rentrent
  pas dans leur modele. Railway ou Render fonctionnent aussi via Docker (~7-10 $/mois).
- **Quoi :** Docker avec Node 20, `ffmpeg` et `yt-dlp` installes, `npm run build` + `next start`,
  un domaine (.com ~12 $/an), HTTPS automatique via Caddy.
- **Attention :** yt-dlp depuis une IP de datacenter est plus bloque que depuis chez toi.
  C'est prevu : le depot de fichier est la voie principale de l'application.
- **Avant d'ouvrir au public**, il faut des comptes utilisateurs et des credits (section 2).
  Sans ca, ta cle API paie les analyses de n'importe qui.

La landing page est deja prete sur `/landing` : au deploiement, configure-la comme page
d'accueil publique (trafic sponsorise), et mets l'application derriere une connexion.

### Etape 2 — Sur iPhone sans App Store : la PWA (quasi gratuit, immediat)

Une Progressive Web App s'installe depuis Safari > Partager > "Sur l'ecran d'accueil".
Icone, plein ecran, aucune validation Apple, aucun compte developpeur, disponible aussi sur
Android. Il manque seulement un `manifest.json` et des icones — une heure de travail.
**C'est la voie recommandee pour commencer : teste ton marche avant de payer Apple.**

### Etape 3 — Le vrai App Store (quand l'app aura des utilisateurs payants)

- **Prerequis :** compte Apple Developer (99 $/an), un Mac pour compiler (ou un service cloud
  comme Codemagic), et passer la review Apple.
- **Comment :** encapsuler l'app web avec **Capacitor**. Le code reste le meme.
- **Deux pieges Apple a connaitre :**
  1. *Guideline 4.2 (minimum functionality)* : Apple rejette les apps qui ne sont qu'un site
     dans une coquille. Ajoute au moins une vraie fonction native : l'extension de partage
     ("Partager vers Creative Lab" depuis TikTok — enorme gain d'usage) et les notifications
     push quand une analyse se termine.
  2. *Paiements* : vendre des credits DANS l'app iOS impose l'In-App Purchase d'Apple
     (commission 15-30 %, et pas de CIB/Edahabia). La parade classique et conforme : les
     credits s'achetent sur ton site web (Chargily, BaridiMob...), l'app ne fait que les
     consommer — comme Netflix. L'app ne doit pas contenir de lien direct vers le paiement web.
- **Vise Android d'abord :** en Algerie, plus de 85 % du mobile est Android. Google Play coute
  25 $ une seule fois, la review est plus rapide, et Capacitor produit les deux versions.

**Ordre recommande : VPS + landing → PWA → Play Store → App Store.**

---

## 2. Gestion des credits Anthropic

### Pourquoi "5 videos = 5 $" — et pourquoi ce n'est plus le cas

Tes premieres analyses tournaient avec le modele Opus a effort maximal (~1 $ piece, premiers
tests compris). Depuis l'optimisation, l'analyse coute **~0,63 $ avec Opus** et **~0,13 $ avec
Sonnet**. Concretement, avec `ANTHROPIC_MODEL=claude-sonnet-5` dans `.env.local`, tes 5 $
auraient fait ~38 analyses.

### Regle n°1 en production : Sonnet par defaut

| Modele | Cout/analyse | En DA (taux 252) | Qualite |
|---|---|---|---|
| claude-opus-5 | ~0,63 $ | ~160 DA | La meilleure, jugement marketing plus fin |
| claude-sonnet-5 | ~0,13 $ | ~33 DA | Tres bonne — suffisante pour ce cas d'usage |

Garde Opus comme option "analyse approfondie" facturee plus cher, ou pour ton usage interne.

### Regle n°2 : des garde-fous sur le compte Anthropic

Dans console.anthropic.com > Plans & Billing :
- **Recharge automatique avec plafond mensuel** (ex. 50 $/mois maximum) : une boucle de bug ou
  un abus ne pourra jamais vider ta carte.
- **Alertes d'usage** a 50 % et 80 % du budget.

### Regle n°3 : en production, un systeme de credits utilisateur

La cle API ne doit JAMAIS quitter ton serveur. Chaque utilisateur a un solde de credits en
base de donnees ; le serveur decremente 1 credit par analyse **apres reussite** et rembourse
automatiquement si le pipeline echoue (les erreurs reseau arrivent). C'est le prochain
chantier technique avant toute mise en ligne publique : comptes + soldes + paiement.

---

## 3. Tarification

### Le calcul de base

Prix de revient reel avec Sonnet : **~33 DA par analyse** (0,13 $ au taux parallele).
Ajoute ~20 % pour les analyses ratees, retentees et le serveur : **~40 DA tout compris**.
Regle simple : vendre au minimum 3x le cout de revient.

### Grille recommandee (celle affichee sur la landing)

| Pack | Prix | Analyses | Prix/analyse | Marge brute (cout 40 DA) |
|---|---|---|---|---|
| Decouverte | Gratuit | 3 | — | cout d'acquisition (~120 DA/inscrit) |
| Starter | 1 500 DA | 10 | 150 DA | ~73 % |
| Pro | 4 900 DA | 40 | 122 DA | ~67 % |
| Agence | 14 900 DA | 150 | 99 DA | ~60 % |

Pourquoi ca tient la route :
- **Des packs, pas un abonnement.** Le client algerien se mefie des prelevements recurrents ;
  un pack prepaye correspond a l'usage reel (on analyse par vagues, pas tous les jours).
- **L'ancrage de valeur est evident :** une seule mauvaise importation coute 50 000 a
  200 000 DA. Une analyse a 122 DA qui l'evite se vend toute seule — c'est l'argument central
  de tes publicites.
- **3 analyses gratuites** = ton cout d'acquisition est ~120 DA par inscrit, moins cher qu'un
  lead Facebook classique, et le produit se demontre lui-meme.
- Si tu proposes Opus en option "approfondie" : +150 DA par analyse, ou inclus dans Agence.

### Encaissement en Algerie

- **Chargily Pay** : CIB et Edahabia en ligne, integration API simple — la voie standard.
- **Demarrage artisanal possible :** virement BaridiMob/CCP + validation manuelle des credits
  depuis un petit ecran admin. Zero integration, parfait pour les 50 premiers clients.

### Un point de vigilance

Ne fixe pas les prix definitifs avant d'avoir mesure ton vrai taux d'utilisation : les packs
non consommes sont de la marge pure, les gros utilisateurs (agences) tirent le cout vers le
haut. Les chiffres ci-dessus sont un point de depart sain, pas une verite gravee.
