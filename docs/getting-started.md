# Your first film

About an hour to a rough cut, if the screenshots already exist.

---

## 1. Copy the example

```bash
cp -r examples/carriv examples/acme
cd examples/acme
rm -rf out public/screens/* public/audio/vo/*
rm src/scenes/S*.tsx src/Logo.tsx
```

Keep `src/scenes/lib.tsx` — it is the one text layout the whole film uses.

Rename the package in `examples/acme/package.json` (`"name": "acme-film"`), then
`npm install` at the repo root so the workspace is linked.

## 2. The brand

`src/brand.ts` is the entire skin.

```ts
export const acme = defineBrand({
  name: 'Acme',
  palette: {
    stage: '#07090d', inkDeep: '#0c1018', ink: '#131926',
    surface: '#ffffff', surfaceSunk: '#f5f7fa',
    text: '#f7f9fc', textMuted: '#9fb0c6', textFaint: '#63748c',
    textOnLight: '#0b111a', textOnLightMuted: '#54637a',
    accent: '#4f7cff', accentDeep: '#2b56d6', accentSoft: '#dde6ff',
    positive: '#15803d', positiveSoft: '#bbf7d0', warning: '#b45309'
  },
  fonts: { display: inter.fontFamily, body: inter.fontFamily },
  light: { angle: 34, warm: '79,124,255', cool: '90,110,140' }
});
```

Anything you leave out falls back to a neutral default. `light.warm` and
`light.cool` are bare `r,g,b` triplets — they end up inside `rgba()`.

See [brand.md](brand.md) for what the light angle actually drives.

## 3. Write the script first

Not the storyboard. The script.

```jsonc
// script/script.json
{
  "voice": "Brian",
  "model": "eleven_multilingual_v2",
  "fps": 30,
  "grid": 15,
  "lines": [
    { "id": "01-problem", "text": "…", "emphasis": "exact", "min": 7 },
    { "id": "02-product", "text": "…", "tail": 0.8 }
  ]
}
```

The order of `lines` is the running order. `leadIn` (default 0.4s) is picture
before the line starts, `tail` (0.7s) is picture after it ends, `min` is a floor.

```bash
npm run vo -- --dry     # sanity-check length and cost
npm run vo              # generate
```

You now have a timed, silent film with no pictures in it. That is the right
order: it is far cheaper to cut a line now than after you have animated it.

## 4. Scenes

One scene per beat, matched by `id`:

```ts
// src/film.ts — note the total absence of durations
export const film = resolveFilm({
  id: 'Acme',
  brand: acme,
  script: script as Script,
  timings: timings as unknown as VoTimings,
  scenes: [
    { id: '01-problem', title: 'The problem', component: S1Problem },
    { id: '02-product', title: 'The product', component: S2Product }
  ],
  lift: [ { at: 0, v: 0 }, { at: 200, v: 0.55 }, { at: 1900, v: 0.05, ease: 'exit' } ]
});
```

A scene is a camera move plus objects plus a `<Copy/>`:

```tsx
const HANDHELD = { amount: 0.6 };
const SHOTS: Shot[] = [
  { at: 0,  z: -260, rotY: 16, focus: -700, aperture: 8 },
  { at: 74, z: 60,   rotY: -2, focus: -150, aperture: 4, ease: 'glide' }
];

export const S2Product: React.FC = () => {
  const camera = useCameraRig(SHOTS, HANDHELD);
  const { enter, exit } = useSceneClock();

  return (
    <AbsoluteFill>
      <World camera={camera}>
        <Obj x={330} y={70} z={-180} rotY={-12} opacity={enter * (1 - exit)}>
          <BrowserFrame src="screens/app.png" url="acme.com" width={1180} />
        </Obj>
      </World>

      <CameraBlur shots={SHOTS} handheld={HANDHELD} />
      <Scrim side="left" strength={0.86} extent={48} />

      <Copy kicker="Acme" title={'One line,\ntwo lines.'} accent={['two']} />
    </AbsoluteFill>
  );
};
```

Three things a scene must **not** do:

- paint a background — `<Stage/>` is mounted once, for the whole film;
- add its own grain or vignette — `<Grade/>` is too;
- hard-code a duration.

## 5. Look at it

```bash
npm run studio           # scene-02-product opens on the beat itself
npm run stills           # one still per scene, in seconds
npm run render
```

`npm run stills` is the loop that matters. A typecheck proves the code compiles;
only a render proves it *composes* — that no object landed behind the scrim, that
the grade did not eat the type, that nothing throws at frame zero.

---

## Screenshots

Two families, and the frames assume their ratios:

- **App screens** — 1600×1000 CSS px at `deviceScaleFactor: 2`.
  `<BrowserFrame aspect={1.6}/>` is the default.
- **Documents** — 794×1123 at 2× (A4). `<Paper/>` defaults to that ratio.

Shoot with `reducedMotion: 'reduce'` so nothing is caught mid-transition, and
against seeded demo data — never a real account. `tools/shots.mjs` drives
Playwright from a JSON config if you want it repeatable.

## Common corrections

**White headline vanishing into a bright screenshot.** Add `<Scrim side="left"/>`.
The text column owns the left third of the frame in this house style; the scrim
is what guarantees it.

**A pill in the wrong corner.** With `flexDirection: 'row'`, `justifyContent` is
the horizontal axis and `alignItems` the vertical one. Swapping them is the
usual cause.

**An object reading as a sticker.** It is not lit consistently — check it is
inside `<Obj/>` (which publishes rotation to `<Sheen/>` and `<ContactShadow/>`)
rather than positioned by hand.

**A scene that feels dead.** Its camera has no move. A held shot still needs a
slow push; `handheld` alone is not enough.
