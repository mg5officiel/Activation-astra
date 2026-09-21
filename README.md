# Clés Cyber — générateur de clés d'activation (Ionic + Capacitor)

Version téléphone de votre `keygen-tool` : mêmes clés que `generate.ts`, dans une application Android.

## Correspondance avec votre code

| Votre keygen-tool | Ici |
| --- | --- |
| `crypto.ts` (`hmacSign`, secret) | `src/lib/crypto.ts` — le module Node `crypto` n'existe pas sur téléphone : Web Crypto à la place, donc `hmacSign` est asynchrone |
| `generate.ts` (validation, `toBase25`, `formatKey`, `generateActivationKey`) | `src/lib/keygen.ts` — même algorithme, même format `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` |
| `console.log(...)` | `src/pages/Generate.tsx` et `src/pages/History.tsx` |

Pour changer le secret : `src/lib/crypto.ts` (tableau `_k`, comme dans votre fichier d'origine).

## Prérequis

- Node.js 22 ou plus récent
- Android Studio (récent) avec un SDK Android installé

## Installer l'application sur votre téléphone

```bash
npm install
npm run android
```

`npm run android` construit l'app, la copie dans le projet Android, puis ouvre Android Studio. Ensuite :

- **Téléphone branché en USB** (options développeur + débogage USB activés) : choisir le téléphone dans la barre du haut, puis le bouton ▶.
- **Fichier APK** : menu *Build → Build Bundle(s) / APK(s) → Build APK(s)*, puis copier `android/app/build/outputs/apk/debug/app-debug.apk` sur le téléphone et l'ouvrir (autoriser les « sources inconnues » si Android le demande).

Après une modification du code : `npm run sync`, puis relancer depuis Android Studio.

## Tester sans téléphone

```bash
npm run dev
```

Ouvrez l'adresse affichée dans le navigateur (ou, depuis le téléphone sur le même Wi-Fi, l'adresse « Network »). En `http`, le navigateur n'offre pas Web Crypto : l'app utilise alors son HMAC-SHA256 de secours, qui donne exactement les mêmes clés.

## Sécurité

L'application contient la clé secrète de signature. Ne partagez pas le fichier APK et ne le publiez pas.
