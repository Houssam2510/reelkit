# Workflow

The order that wastes the least time, and the loops that keep it fast.

---

## The order

1. **Script.** Write the narration before anything else. `npm run vo -- --dry`
   tells you the length. Cutting a line here costs a minute; cutting it after
   the scene is animated costs a day.
2. **Voice.** `npm run vo`. You now have a correctly-timed silent film.
3. **Screenshots.** Shoot against seeded demo data, never a real account.
4. **Scenes.** One beat at a time, in the `scene-*` composition.
5. **Grade and lighting last.** `lift`, `handheld`, `grade` — they are the
   pass where everything starts agreeing with everything else, and they are
   worthless before the scenes exist.

---

## The iteration loop

```bash
npm run studio
```

The Studio registers the master composition **and one per scene**. On a
75-second film, scrubbing to the beat you are working on costs more than the
edit does — `scene-05-ats` opens on that shot, at its real length and its real
room brightness.

Editing anything in `packages/core` hot-reloads the Studio. There is no build
step: `remotion.config.ts` aliases `reelkit` straight to its TypeScript source.

```bash
npm run stills                # one still per scene, seconds
npm run stills -- --at=0.2    # a fifth of the way in, to catch entrances
```

This is the film's test suite, and it is the only one that means anything. A
typecheck proves the code compiles; a still proves it composes. Run it before
every commit — it is how a scene never silently breaks and stays broken.

---

## Render times

The Carriv cut is 2295 frames at 1920×1080. Under WSL with the software GL
renderer, a full render is on the order of **20–40 minutes**. That is normal for
CSS-3D composites and it is why the loop above is built around stills.

If it is slower than that, in order of likelihood:

- **A per-frame SVG filter.** `feTurbulence` re-seeded every frame can be more
  than half of total render time on its own. Reelkit's `<Grain/>` avoids this by
  baking one tile into a cached data URI — do not reintroduce the pattern.
- **`backdrop-filter` running the whole time.** `<CameraBlur/>` renders no
  element at all below 0.35px, so it is free while the camera is at rest. A
  hand-rolled one usually is not.
- **Oversized screenshots.** A 3200×2000 PNG decoded per frame is real cost.
  Nothing needs to be wider than about 2× its on-screen size.

```bash
npx remotion render scene-04-document out/doc.mp4   # 405 frames, not 2295
npm run render -- --concurrency=4
```

---

## Screenshots

Two families, whose ratios the frames assume:

| | Source size | Component |
|---|---|---|
| App screens | 1600×1000 CSS px @ 2× | `<BrowserFrame aspect={1.6}/>` |
| Documents | 794×1123 @ 2× (A4) | `<Paper/>` |

Shoot with `reducedMotion: 'reduce'` so nothing is caught mid-transition, and
with a viewport that matches — resizing a capture afterwards is visible in the
text rendering.

`tools/shots.mjs` drives Playwright from a JSON config so a re-shoot after a UI
change is one command rather than an afternoon.

**Never real user data.** Seed a local database and sign in as a demo persona.
The Carriv film uses "Camille Moreau", who does not exist.

---

## CI

`.github/workflows/ci.yml` runs two jobs:

- **check** — prettier, eslint, tsc.
- **stills** — renders the contact sheet and uploads it as an artifact.

The second is the one worth having. Every PR that touches a scene arrives with
nine pictures of what it now looks like, which is a review you can actually do.

---

## Committing

- `script/script.json` and `script/timings.json` are **source**. Commit both —
  `timings.json` is what makes the cut reproducible.
- `public/audio/vo/*.mp3` is generated but **vendored**, so a fresh clone renders
  without an API key. If your narration grows past a few minutes, ignore it and
  generate in CI instead.
- `out/` is ignored. Never commit a render.
