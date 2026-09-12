# Creative Lab DZ

Analyse une creative publicitaire TikTok, Instagram ou Facebook — video ou image — puis produit
le dossier complet pour lancer le produit en Algerie : script, angles marketing, sourcing Alibaba
et 1688, calcul de rentabilite en paiement a la livraison, et pack de lancement pret a copier.

---

## Ce que fait l'application

A partir d'un seul lien, elle produit :

| Bloc | Contenu |
|---|---|
| **Script** | Script complet reconstitue (voix off + textes a l'ecran), decoupage horodate, traduction francaise |
| **Sequences cles** | Decoupage plan par plan avec le role de chacun : hook, probleme, solution, preuve, offre, appel a l'action |
| **Hook** | Les 3 premieres secondes analysees et notees, avec des variantes a tester |
| **Angles marketing** | Leviers de persuasion exploites, notes sur 10, puis reecrits pour le client algerien |
| **Mots-cles** | Mots-cles produit, hashtags, recherche en francais et en arabe, interets de ciblage publicitaire |
| **Audio** | Piste audio extraite en MP3, telechargeable et ecoutable dans le rapport |
| **Images cles** | Keyframes exportees, a deposer sur Alibaba ou 1688 pour la recherche par image |
| **Sourcing** | Produit identifie, requetes traduites en chinois, liens de recherche directs, fourchette de prix d'achat |
| **Rentabilite COD** | Calculateur ajustable : prix de revient, profit par commande, CPA maximum, seuil de livraison |
| **Pack de lancement** | Script en darija, page de vente en francais et en arabe, annonces Facebook et TikTok, objections clients, ciblage, idees de creatives, plan de lancement |

---

## Installation

### 1. Prerequis

- **Node.js 20 ou plus recent** — a telecharger sur [nodejs.org](https://nodejs.org)
- Une **cle API Anthropic** — a creer sur [console.anthropic.com](https://console.anthropic.com/settings/keys)

### 2. Installer les dependances

Dans un terminal ouvert a la racine du projet :

```bash
npm install
```

### 3. Installer yt-dlp et ffmpeg

```bash
npm run setup
```

Cette commande telecharge `yt-dlp` dans le dossier `bin/` et verifie que `ffmpeg` est utilisable.
Relance-la de temps en temps : elle met yt-dlp a jour, ce qui est necessaire quand les plateformes
changent leur fonctionnement.

### 4. Configurer la cle API

Copie `.env.example` en `.env.local`, ouvre le fichier, et colle ta cle apres `ANTHROPIC_API_KEY=` :

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
```

### 5. Lancer

```bash
npm run dev
```

Ouvre ensuite [http://localhost:3000](http://localhost:3000).

> **En cas de doute, ouvre d'abord la page Diagnostic** (lien en haut a droite). Elle verifie Node,
> yt-dlp, ffmpeg, la cle API et l'acces au modele, et indique quoi corriger pour chaque point.

---

## Pages

- `/` — l'application (analyse, historique, diagnostic)
- `/landing` — la page de vente publique, prete pour le trafic sponsorise.
  Theme "or sur noir" : parti pris assume, a l oppose du violet/bleu/rose devenu la signature
  visuelle des produits IA. Toute la palette tient dans le bloc `@theme` de `globals.css`.
  Scene de dissection scroll-driven (GSAP ScrollTrigger) : la creative se fait decortiquer
  pendant le scroll — frames, script, angles, sourcing, profit. Version empilee sur mobile,
  et toutes les animations se coupent si le systeme demande `prefers-reduced-motion`.
- Le guide de mise en ligne, iOS, credits et tarification est dans `docs/GUIDE-LANCEMENT.md`

---

## Utilisation

Deux facons d'analyser une creative.

### 1. Deposer la video (recommande)

Glisse le fichier dans la zone de depot de la page d'accueil, ou clique pour parcourir.
Formats acceptes : videos `.mp4`, `.mov`, `.webm`, `.m4v` et images `.jpg`, `.png`, `.webp`, jusqu'a 300 Mo.
Une image est traitee comme une creative statique : memes angles, meme sourcing, meme pack de lancement.

C'est la voie la plus fiable : elle ne depend d'aucune plateforme et fonctionne toujours.
Enregistre la video depuis l'application TikTok ou Instagram, transfere-la sur ton ordinateur,
et depose-la.

### 2. Coller un lien

Colle l'URL complete du post (pas un lien de profil) dans le champ sous la zone de depot.
Pratique quand ca marche, mais **TikTok, Instagram et Facebook bloquent regulierement le
telechargement automatique**. Si le lien echoue, l'application te propose directement de deposer
le fichier : l'analyse est alors identique, seules les statistiques du post (vues, likes) manquent
au rapport.

Dans les deux cas, le traitement prend environ 3 minutes et la progression s'affiche etape par etape.
Le rapport s'ouvre automatiquement et reste accessible dans **Historique**.

### Videos qui demandent une connexion

Pour insister sur la voie par lien malgre un blocage :

1. Connecte-toi a la plateforme dans Chrome, Firefox ou Edge.
2. Ajoute cette ligne dans `.env.local` :
   ```
   YTDLP_COOKIES_FROM_BROWSER=chrome
   ```
3. **Ferme completement le navigateur** (sinon le fichier de cookies est verrouille).
4. Relance `npm run dev` et reessaie.

Cette configuration aide, mais ne garantit rien : les protections evoluent en permanence.
Le depot de fichier reste la seule voie fiable a 100 %.

---

## Configuration

Tous les reglages sont dans `.env.local`. Les valeurs par defaut conviennent dans la plupart des cas.

| Variable | Defaut | Role |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Obligatoire.** Ta cle API |
| `ANTHROPIC_MODEL` | `claude-opus-5` | Modele utilise. `claude-sonnet-5` coute environ 5 fois moins cher et reste tres bon |
| `TRANSCRIBER` | `auto` | `auto`, `local`, `groq`, `openai` ou `none` — voir ci-dessous |
| `ANTHROPIC_EFFORT` | vide | Force le meme effort partout. Vide = niveau adapte a chaque etape (recommande) |
| `WHISPER_LOCAL_MODEL` | `Xenova/whisper-small` | Modele Whisper local. `Xenova/whisper-base` est plus rapide et moins precis |
| `MAX_FRAMES` | `20` | Images envoyees au modele. Plus d'images = plus precis et plus cher |
| `MAX_VIDEO_SECONDS` | `180` | Duree maximale analysee |
| `YTDLP_COOKIES_FROM_BROWSER` | vide | `chrome`, `firefox` ou `edge` pour les videos privees |
| `USD_TO_DZD_PARALLEL` | `252` | Taux de change utilise pour les estimations de prix |
| `USD_TO_DZD_OFFICIAL` | `132` | Taux officiel, fourni a titre de comparaison |

### Comment le script est recupere

La transcription suit une cascade, du plus fiable au plus degrade :

1. **Sous-titres de la plateforme** — TikTok en fournit souvent, parfaitement alignes dans le temps.
2. **Whisper en local** — gratuit, aucune cle requise. Le modele (environ 250 Mo) se telecharge tout
   seul au premier usage dans `data/models`.
3. **Lecture des textes a l'ecran** — Claude lit les sous-titres incrustes sur les images. La plupart
   des creatives e-commerce en ont, donc le script reste exploitable meme sans audio.

Si tu as une cle Groq ou OpenAI, `TRANSCRIBER=groq` donne la meilleure transcription de la darija,
pour une fraction de centime par video.

---

## Duree et cout par analyse

Une analyse complete prend **environ 3 minutes** et coute **environ 0,63 $** avec `claude-opus-5`.

Repartition typique, mesuree sur une video de 10 secondes :

| Etape | Duree |
|---|---|
| Reception du fichier, audio, images cles | ~4 s |
| Transcription | ~6 s |
| Analyse creative et sourcing | ~74 s |
| Dossier de lancement Algerie | ~91 s |

Le temps est presque entierement du temps de generation du modele : optimiser ffmpeg
n'apporterait rien. Six appels sont enchaines en exploitant au maximum le parallelisme :

```
A  lecture de la video (images)
├─ B  analyse strategique   ┐ en parallele
└─ C  sourcing fournisseur  ┘
     ├─ D   offre et textes de vente     ┐
     ├─ E1  angles, annonces, objections ├ en parallele
     └─ E2  ciblage, idees, plan         ┘
```

> **Pourquoi six appels et pas un seul ?** L'API compile chaque schema de reponse en grammaire
> et refuse au-dela d'une certaine complexite (`compiled grammar is too large`). La limite porte
> sur le nombre de champs, pas sur le volume de texte : supprimer toutes les descriptions divise
> le schema par deux sans rien changer au refus. Le decoupage est donc impose par l'API — et il
> sert desormais aussi la vitesse. Lis l'entete de `src/lib/schemas.ts` avant d'y toucher.

Pour aller plus vite ou payer moins :

| Reglage | Effet |
|---|---|
| `ANTHROPIC_MODEL=claude-sonnet-5` | Environ 2x plus rapide et 5x moins cher (~0,13 $) |
| `MAX_FRAMES=12` | Quelques secondes et quelques centimes de moins |
| `MAX_VIDEO_SECONDS=60` | Utile si tu analyses surtout des videos courtes |

Pour une analyse plus fouillee, au prix de la duree :

| Reglage | Effet |
|---|---|
| `ANTHROPIC_EFFORT=medium` | Textes plus riches, environ 1,5x plus lent |
| `ANTHROPIC_EFFORT=high` | Analyse la plus poussee, environ 2x plus lent |

Par defaut, chaque etape utilise le niveau d'effort qui lui convient : faible pour les extractions
guidees par un schema, moyen pour le jugement strategique. Le cout reel de chaque analyse est
affiche en bas du rapport.

---

## Ou sont mes donnees

Tout reste sur ton ordinateur, dans le dossier `data/analyses/<identifiant>/` :

```
video.mp4          la video telechargee ou deposee
audio.mp3          la piste audio
frames/            les images cles extraites
rapport.json       le rapport complet
```

Les fichiers que tu deposes transitent par `data/uploads/` sous un nom aleatoire, et sont supprimes
des que le rapport est produit. Un fichier reste en transit apres une analyse interrompue est
efface automatiquement au bout d'une heure. Les deux dossiers sont exclus du versionnement.

Rien n'est envoye ailleurs, en dehors des appels a l'API Anthropic. Supprimer une analyse depuis la
page Historique efface tout son dossier.

---

## Resolution des problemes

| Symptome | Cause et solution |
|---|---|
| `yt-dlp introuvable` | Lance `npm run setup` |
| `ffmpeg introuvable` | Lance `npm install ffmpeg-static` puis `npm run setup` |
| `ANTHROPIC_API_KEY manquante` | La cle est absente ou vide dans `.env.local`. Verifie qu'il n'y a pas d'espace ni de guillemets autour |
| Erreur 401 sur l'API | Cle invalide ou revoquee : recree-en une sur la console Anthropic |
| `demande une session connectee` | Depose le fichier, ou renseigne `YTDLP_COOKIES_FROM_BROWSER` (voir plus haut) |
| `protection anti-robot` | Normal et frequent : depose le fichier a la place, l'application te le propose directement |
| `Ce fichier n'est pas une video lisible` | Le fichier est corrompu, incomplet, ou n'est pas une video malgre son extension. Ouvre-le dans ton lecteur pour verifier |
| `Aucune piste video detectee` | Le fichier ne contient que du son. Depose la video complete |
| `Fichier trop volumineux` | Limite a 300 Mo. Compresse la video, ou coupe-la avant de la deposer |
| L'analyse s'arrete a la transcription | Sans importance : Claude lit les textes a l'ecran a la place |
| La reponse a ete tronquee | Baisse `MAX_FRAMES` a 12 dans `.env.local` |
| `npm install` bloque les scripts | Lance `npm approve-scripts ffmpeg-static onnxruntime-node sharp protobufjs` |

---

## Utiliser l'application depuis ton telephone

Sur le meme reseau Wi-Fi, lance :

```bash
npx next dev -H 0.0.0.0
```

Puis ouvre `http://<ip-de-ton-pc>:3000` depuis le telephone. Pour un acces depuis n'importe ou, il
faut deployer l'application sur un serveur — mais attention, `yt-dlp` et `ffmpeg` doivent y etre
installes, et les plateformes bloquent plus facilement les adresses IP de datacenter que celle de
ta connexion personnelle.

---

## Limites a garder en tete

- **Les prix de sourcing sont des estimations.** Le modele ne consulte pas Alibaba en direct : il
  estime des ordres de grandeur a partir du type de produit. Les liens de recherche te donnent les
  prix reels — le champ `fiabilite` du rapport indique la confiance a leur accorder.
- **Les constantes du marche algerien** (frais de livraison, taux de livraison, taux de change) sont
  des moyennes observees. Ajuste-les dans le calculateur de l'onglet Rentabilite, ou modifie les
  valeurs par defaut dans `src/lib/dz.ts`.
- **L'identification du produit peut se tromper** sur une video floue ou trop courte. Le rapport
  affiche un pourcentage de confiance : en dessous de 60 %, verifie manuellement avant de commander.

---

## Structure du projet

```
src/
  app/                 pages et routes API
  components/          interface, dont report/ pour les onglets du rapport
  lib/
    bin.ts             resolution de yt-dlp et ffmpeg
    acquisition.ts     point d'entree unique : lien telecharge ou fichier depose
    download.ts        telechargement par lien et metadonnees
    upload.ts          reception, validation et nettoyage des fichiers deposes
    upload-limites.ts  limites partagees entre le navigateur et le serveur
    media.ts           audio, detection de plans, images cles
    transcribe.ts      cascade de transcription
    claude.ts          appels au modele avec sortie JSON contrainte
    schemas.ts         schemas des reponses attendues (lire l'entete avant modification)
    analysis.ts        prompts et enchainement des six appels
    sourcing.ts        construction des liens fournisseurs
    dz.ts              constantes du marche algerien et calcul de rentabilite
    pipeline.ts        orchestration des etapes
scripts/setup-bins.mjs installation de yt-dlp
```
