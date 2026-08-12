# reelkit

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

## Licence

MIT for the code in `packages/`, `tools/` and `docs/`.
`examples/carriv` contains Carriv's brand, copy and product screenshots, which
are not covered — read it, do not ship it.
