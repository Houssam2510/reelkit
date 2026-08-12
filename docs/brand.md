# Brand

One object holds the palette, the typefaces, the radii, the key light and the
grade. No component in `packages/core` contains a hex code, which is what makes
the same nine scenes render as another company's film.

```ts
const brand = defineBrand({ /* any subset — the rest falls back */ });
<BrandProvider brand={brand}>…</BrandProvider>   // done for you by <FilmRoot/>
const { palette, fonts, radii, light } = useBrand();
```

---

## Palette

Split by **where the pixel lives**, not by hue. That is what lets a component
choose correctly without knowing anything about your brand.

| Token | Where it is used |
|---|---|
| `stage` `inkDeep` `ink` | the room, from furthest back to nearest |
| `surface` `surfaceSunk` | anything reading as paper, glass or a UI card |
| `line` / `lineOnLight` | hairlines, on dark / on light |
| `text` `textMuted` `textFaint` | type on the stage |
| `textOnLight` `textOnLightMuted` | type on a light surface |
| `accent` `accentDeep` `accentSoft` | the one colour the film may shout with |
| `positive` `positiveSoft` `warning` | semantics, used sparingly inside product UI |

Helpers: `alpha(color, 0.4)` and `rgb(color)` (a bare `"r, g, b"` triplet for
gradient stops). Both pass non-hex strings through untouched, so running a token
through twice is harmless.

### One accent

The palette has room for exactly one shouting colour, and that is deliberate. A
film with two accents has none — the eye stops treating either as a signal, and
the emphasis in your headlines quietly stops working.

---

## Light

```ts
light: {
  angle: 34,           // degrees. 0 = from screen-left, 90 = from above
  warm: '212,104,46',  // key light, as a bare r,g,b triplet
  cool: '124,90,67'    // the fill bouncing back off the room
}
```

This is the least obvious field and the one that does the most work. It drives:

- the two drifting lights in `<Stage/>`;
- the angle of every `<Sheen/>` — the specular highlight that slides across an
  object's face as it turns;
- the offset of every `<ContactShadow/>`, which falls the opposite way;
- the warm spill in `<Halation/>`.

An `<Obj/>` publishes its own rotation through context, so a panel lit from the
upper left **stays** lit from the upper left as it rotates. A composite where
each object disagrees about where the lamp is is exactly why "3D in CSS" usually
reads as a collage of stickers, and it is not a thing you can fix later with
shadows.

---

## Type

```ts
fonts: { display: 'Bricolage Grotesque', body: 'Source Sans 3', mono: '…' }
```

Reelkit does not load fonts — your film does, in `brand.ts`, and hands over the
family names:

```ts
const display = loadFont('normal', { weights: ['600','700'], subsets: ['latin'] });
export const fontsReady = display.waitUntilDone();
```

`mono` is used for machine output — parser fields, provenance lines, timecodes.
It falls back to `body` if you leave it out, but the contrast between "the
product speaking" and "a machine reporting" is cheap and worth having.

---

## Grade

```ts
grade: { grain: 0.05, vignette: 0.6, bloom: 0.55, aberration: 0.3 }
```

Defaults are tuned to be felt, not seen. If you can identify the grain at 100%
zoom on a still, it is roughly twice too strong for motion.

`aberration` above ~0.5 starts reading as a broken display rather than as a
lens. `vignette` is the one worth pushing on a dark film — it is what keeps the
eye in the middle third.

---

## Radii

```ts
radii: { control: 10, card: 14, panel: 20 }
```

Take them from the product's own tokens. A film whose corners are rounder than
the app is a film about a different app, and viewers notice this without being
able to say why.
