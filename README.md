<div align="center">

# reelkit

### Une caméra, un étalonnage, et un montage dérivé du script enregistré
### *One camera, one grade, and an edit derived from the recorded script*

**A Remotion toolkit for cinematic product films, with an ElevenLabs voice-over pipeline.**

<br/>

[![Remotion](https://img.shields.io/badge/Remotion-4+-0B84F3)](https://www.remotion.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-with--timestamps-000000)](https://elevenlabs.io/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/licence-MIT-blue.svg)](#licence--license)

[🇬🇧 English](#-english) · [🇫🇷 Français](#-français)

</div>

---

<details open>
<summary><h2 id="-english">&nbsp;🇬🇧&nbsp;&nbsp;English</h2></summary>

<br/>

A Remotion toolkit for **cinematic product films** — the kind of 60-to-90-second
piece a company puts on its landing page — plus the ElevenLabs pipeline that
narrates them.

It is brand-agnostic. Point it at a palette, a typeface and a script, and the
same engine renders your film. `examples/carriv` is a complete, real one,
included so you can read a finished piece rather than a hello-world.

```bash
npm install
npm run studio      # Remotion Studio — the film and every scene, live
npm run stills      # one still per scene: the fastest proof it still composes
npm run render      # → examples/carriv/out/carriv.mp4
npm run vo          # (re)generate the narration from script.json
```

---

## The four ideas

Everything in here serves one of four. If you find yourself reaching for a
fifth, it probably belongs in your film, not in the kit.

### 1. A brand is the only place a colour is decided

One object — `defineBrand({...})` — holds the palette, the typefaces, the
radii, **the direction of the key light**, and the grade. No component in the
kit contains a hex code. Re-skinning a whole film is one file.

```ts
export const acme = defineBrand({
  palette: { stage: '#07090d', accent: '#4f7cff', /* … */ },
  fonts: { display: 'Inter', body: 'Inter' },
  light: { angle: 34, warm: '96,132,255', cool: '90,110,140' }
});
```

### 2. One camera moves through one world

Scenes do **not** each invent a perspective and a stack of transforms. They
place objects at coordinates in a shared world, and a camera moves through it:

```tsx
const SHOTS: Shot[] = [
  { at: 0,  z: -620, rotY: -13, focus: -1500, aperture: 9 },
  { at: 150, z: 130, rotY: 3,   focus: -520,  aperture: 6, ease: 'glide' }
];

const camera = useCameraRig(SHOTS, { amount: 0.9 });

<World camera={camera}>
  <Obj x={-430} y={120} z={-40} rotY={11}><Paper src="cv.png" /></Obj>
</World>
<CameraBlur shots={SHOTS} />
```

Depth of field falls out of it: an object's blur is its distance from the
camera's focus plane, so a **rack focus is a keyframe on `focus`**, not a
hand-animated blur. Motion blur falls out of it too — `<CameraBlur/>` reads the
rig's velocity. So does the direction of every highlight and cast shadow, via
`brand.light`.

This is the difference that reads on screen. A film where each scene has its
own perspective is a slideshow with good transitions.

### 3. The grade is applied once, to everything

`<Grade/>` is mounted once, above every scene: grain, vignette, halation, a
breath of chromatic aberration. It is what makes nine separately-built scenes
look like one piece of footage.

The grain is worth a note. The obvious implementation — an SVG `feTurbulence`
re-seeded every frame — recomputes fractal noise at 1920×1080 thirty times a
second and can be **more than half of a render's total time**. Reelkit bakes one
noise tile into a data URI, which the browser rasterises once and caches, and
animates `background-position`. Same look; the grain stops appearing in the
profile at all.

### 4. The script is the cut

No scene declares a duration. Anywhere.

The script declares the running order and how much air each line wants; `npm run
vo` measures what the voice actually did; scene lengths are computed from the
two and quantised to a musical grid. **Re-record a line and the film re-times
itself.**

```jsonc
// script/script.json
{ "id": "04-document", "text": "What comes out is a single column…", "min": 8 }
```
```ts
// src/film.ts — no numbers
{ id: '04-document', title: 'The document', component: S4Document }
```

The arithmetic lives in one plain `.mjs` file shared by the TypeScript film and
the Node tools, because two implementations of "how long is scene four" is
exactly how a film goes out of sync three days after someone re-records a line.

---

## The voice

`npm run vo` calls ElevenLabs' `/with-timestamps` endpoint, which returns the
engine's own per-character alignment along with the audio. That buys three
things at once:

- **the edit re-times itself** (above);
- **word-synced captions** that are exact rather than eyeballed — `captions:
  true` on the film, and every word lights on the syllable it is spoken on;
- **a SubRip file** for the whole cut, broken on clauses rather than on length.

It is cached by content hash, so re-running costs nothing for lines that did not
change — which means you can and should run it on every edit.

```bash
npm run voices                      # what your account can speak
npm run voices -- --preview=Brian   # hear one read the hook
npm run vo -- --dry                 # character count and cost, no API calls
npm run vo                          # generate what changed
npm run vo -- --only=04 --force     # redo one line
```

Set `ELEVENLABS_API_KEY` in `.env` (see `.env.example`). Without a key, the
Carriv example still renders — its takes are vendored.

See **[docs/voice.md](docs/voice.md)** for voice selection, settings, and how to
write a line that survives synthesis.

---

## Starting your own film

```
examples/your-film/
├── package.json          two scripts, one dependency on `reelkit`
├── remotion.config.ts    copied as-is
├── script/script.json    ← the cut lives here
├── public/               screenshots, documents, music
└── src/
    ├── brand.ts          your palette + fonts
    ├── film.ts           beat id → scene component. No durations.
    ├── Root.tsx          <FilmCompositions film={film} />
    └── scenes/
```

Copy `examples/carriv`, delete the nine scenes, keep `lib.tsx`. Full walk-through
in **[docs/getting-started.md](docs/getting-started.md)**.

---

## Docs

| | |
|---|---|
| [getting-started.md](docs/getting-started.md) | your first film, end to end |
| [motion.md](docs/motion.md) | the camera rig, the six curves, why the vocabulary is small |
| [voice.md](docs/voice.md) | ElevenLabs: voices, settings, writing for synthesis |
| [brand.md](docs/brand.md) | theming, and where the light comes from |
| [workflow.md](docs/workflow.md) | screenshots, iteration loop, render times, CI |

## Layout

```
packages/core/     the engine — published as `reelkit`
tools/             Node CLIs: vo, voices, stills, shots
examples/carriv/   a complete film
docs/
```

## Requirements

Node 20+. Rendering needs a Chromium; Remotion fetches its own headless shell on
first run, or point `REMOTION_BROWSER_EXECUTABLE` at one you already have.

</details>

<details>
<summary><h2 id="-français">&nbsp;🇫🇷&nbsp;&nbsp;Français</h2></summary>

<br/>

Une boîte à outils Remotion pour les **films produit cinématiques** — le genre de
pièce de 60 à 90 secondes qu'une entreprise met sur sa page d'accueil — et le
pipeline ElevenLabs qui les raconte.

Elle est agnostique de la marque. Pointez-la sur une palette, une police et un
script, et le même moteur rend votre film. `examples/carriv` en est un, complet
et réel, inclus pour que vous puissiez lire une pièce terminée plutôt qu'un
hello-world.

```bash
npm install
npm run studio      # Remotion Studio — le film et chaque scène, en direct
npm run stills      # une image fixe par scène : la preuve la plus rapide que ça compose encore
npm run render      # → examples/carriv/out/carriv.mp4
npm run vo          # (re)génère la narration depuis script.json
```

---

## Les quatre idées

Tout ici sert l'une des quatre. Si vous vous surprenez à en chercher une
cinquième, elle appartient probablement à votre film, pas à la boîte à outils.

### 1. Une marque est le seul endroit où une couleur se décide

Un seul objet — `defineBrand({...})` — porte la palette, les polices, les rayons,
**la direction de la lumière principale**, et l'étalonnage. Aucun composant de la
boîte à outils ne contient de code hexadécimal. Re-habiller un film entier, c'est
un fichier.

```ts
export const acme = defineBrand({
  palette: { stage: '#07090d', accent: '#4f7cff', /* … */ },
  fonts: { display: 'Inter', body: 'Inter' },
  light: { angle: 34, warm: '96,132,255', cool: '90,110,140' }
});
```

### 2. Une seule caméra traverse un seul monde

Les scènes n'inventent **pas** chacune leur perspective et leur pile de
transformations. Elles placent des objets à des coordonnées dans un monde
partagé, et une caméra y circule :

```tsx
const SHOTS: Shot[] = [
  { at: 0,  z: -620, rotY: -13, focus: -1500, aperture: 9 },
  { at: 150, z: 130, rotY: 3,   focus: -520,  aperture: 6, ease: 'glide' }
];

const camera = useCameraRig(SHOTS, { amount: 0.9 });

<World camera={camera}>
  <Obj x={-430} y={120} z={-40} rotY={11}><Paper src="cv.png" /></Obj>
</World>
<CameraBlur shots={SHOTS} />
```

La profondeur de champ en découle : le flou d'un objet est sa distance au plan de
netteté de la caméra, donc une **mise au point glissante est une image clé sur
`focus`**, pas un flou animé à la main. Le flou de mouvement en découle aussi —
`<CameraBlur/>` lit la vitesse du rig. Et la direction de chaque reflet et de
chaque ombre portée également, via `brand.light`.

C'est la différence qui se voit à l'écran. Un film où chaque scène a sa propre
perspective est un diaporama avec de bonnes transitions.

### 3. L'étalonnage s'applique une fois, à tout

`<Grade/>` est monté une seule fois, au-dessus de toutes les scènes : grain,
vignettage, halation, un souffle d'aberration chromatique. C'est ce qui fait que
neuf scènes construites séparément ressemblent à une seule pellicule.

Le grain mérite une note. L'implémentation évidente — un `feTurbulence` SVG
re-semé à chaque image — recalcule un bruit fractal en 1920×1080 trente fois par
seconde et peut représenter **plus de la moitié du temps total d'un rendu**.
Reelkit cuit une tuile de bruit dans une URI de données, que le navigateur
rastérise une fois et met en cache, puis anime `background-position`. Même rendu ;
le grain disparaît complètement du profil de performance.

### 4. Le script est le montage

Aucune scène ne déclare de durée. Nulle part.

Le script déclare l'ordre de passage et l'air que chaque réplique demande ;
`npm run vo` mesure ce que la voix a réellement fait ; la longueur des scènes est
calculée à partir des deux, puis quantifiée sur une grille musicale.
**Réenregistrez une réplique et le film se re-cale tout seul.**

```jsonc
// script/script.json
{ "id": "04-document", "text": "What comes out is a single column…", "min": 8 }
```
```ts
// src/film.ts — aucun nombre
{ id: '04-document', title: 'The document', component: S4Document }
```

L'arithmétique vit dans un seul fichier `.mjs` ordinaire, partagé par le film
TypeScript et les outils Node, parce que deux implémentations de « combien dure
la scène quatre » est exactement la façon dont un film se désynchronise trois
jours après que quelqu'un a réenregistré une réplique.

---

## La voix

`npm run vo` appelle le point d'accès `/with-timestamps` d'ElevenLabs, qui renvoie
l'alignement caractère par caractère du moteur lui-même, en plus de l'audio. Ça
achète trois choses d'un coup :

- **le montage se re-cale tout seul** (ci-dessus) ;
- **des sous-titres synchronisés au mot**, exacts plutôt qu'estimés à l'œil —
  `captions: true` sur le film, et chaque mot s'allume sur la syllabe où il est
  prononcé ;
- **un fichier SubRip** pour tout le montage, découpé sur les propositions plutôt
  que sur la longueur.

C'est mis en cache par empreinte de contenu, donc relancer ne coûte rien pour les
répliques inchangées — ce qui veut dire que vous pouvez, et devez, le lancer à
chaque retouche.

```bash
npm run voices                      # ce que votre compte sait dire
npm run voices -- --preview=Brian   # en entendre une lire l'accroche
npm run vo -- --dry                 # nombre de caractères et coût, sans appel API
npm run vo                          # génère ce qui a changé
npm run vo -- --only=04 --force     # refait une seule réplique
```

Renseignez `ELEVENLABS_API_KEY` dans `.env` (voir `.env.example`). Sans clé,
l'exemple Carriv se rend quand même : ses prises sont versionnées.

Voir **[docs/voice.md](docs/voice.md)** pour le choix de la voix, les réglages, et
comment écrire une réplique qui survit à la synthèse.

---

## Démarrer votre propre film

```
examples/votre-film/
├── package.json          deux scripts, une dépendance à `reelkit`
├── remotion.config.ts    copié tel quel
├── script/script.json    ← le montage vit ici
├── public/               captures d'écran, documents, musique
└── src/
    ├── brand.ts          votre palette + vos polices
    ├── film.ts           id de temps → composant de scène. Aucune durée.
    ├── Root.tsx          <FilmCompositions film={film} />
    └── scenes/
```

Copiez `examples/carriv`, supprimez les neuf scènes, gardez `lib.tsx`. Le
parcours complet est dans **[docs/getting-started.md](docs/getting-started.md)**.

---

## Docs

| | |
|---|---|
| [getting-started.md](docs/getting-started.md) | votre premier film, de bout en bout |
| [motion.md](docs/motion.md) | le rig de caméra, les six courbes, pourquoi le vocabulaire est petit |
| [voice.md](docs/voice.md) | ElevenLabs : voix, réglages, écrire pour la synthèse |
| [brand.md](docs/brand.md) | le thème, et d'où vient la lumière |
| [workflow.md](docs/workflow.md) | captures d'écran, boucle d'itération, temps de rendu, CI |

## Disposition

```
packages/core/     le moteur — publié sous le nom `reelkit`
tools/             CLI Node : vo, voices, stills, shots
examples/carriv/   un film complet
docs/
```

## Prérequis

Node 20+. Le rendu a besoin d'un Chromium ; Remotion télécharge son propre
headless shell au premier lancement, ou pointez `REMOTION_BROWSER_EXECUTABLE` sur
un binaire que vous avez déjà.

</details>

---

## Licence / License

MIT pour le code de `packages/`, `tools/` et `docs/`. `examples/carriv` contient
la marque, les textes et les captures produit de Carriv, qui ne sont pas
couverts — à lire, pas à publier.

*MIT for the code in `packages/`, `tools/` and `docs/`. `examples/carriv` contains
Carriv's brand, copy and product screenshots, which are not covered — read it, do
not ship it.*
