# The motion language

The whole vocabulary is six curves, five springs, one camera and one clock.

The constraint is the point. What separates a studio edit from a template is not
that each animation is clever — it is that four hundred animations share one
sense of weight. The moment you reach for a bespoke `cubic-bezier`, you have
started making a collage.

---

## Curves

```ts
curve.swift   // (0.22, 1, 0.36, 1)   UI-speed arrival. The default.
curve.glide   // (0.16, 1, 0.3, 1)    slower start, very long tail. Hero moves.
curve.settle  // (0.34, 1.16, 0.4, 1) arrives with a hair of overshoot. Mass.
curve.swap    // (0.65, 0, 0.35, 1)   both ends eased. Starts and stops on screen.
curve.exit    // (0.5, 0, 0.9, 0.35)  accelerates away. NEVER an entrance.
curve.linear
```

`curve.exit` on an entrance is the single most common mistake, and it is
instantly legible: things that arrive by accelerating look like they are being
thrown at the viewer.

## Springs

```ts
springs.arrive  // damping 200 — no overshoot. The default entrance.
springs.settle  // damping 26  — one small overshoot. Heavy objects.
springs.pop     // damping 15  — snappy, slight bounce. Small UI.
springs.drift   // damping 60, mass 2.2 — slow, cinematic. Camera-scale moves.
springs.hit     // damping 11  — fast attack. Impacts.
```

## Helpers

```ts
ramp(frame, [30, 90], [0, 1], 'glide')     // clamped interpolate, house easing
springAt(frame, fps, delay, 'settle')      // 0→1 spring by preset
stagger(i, 2.5, delay)                     // delay for item i of a group
presence(frame, fps, { delay, exitAt })    // { in, out, v } — the 0→1→0 curve
track(frame, keys)                         // a multi-keyframe channel
```

`track` is how anything with more than one beat is written — as a timeline,
not as nested `interpolate` calls:

```ts
track(frame, [
  { at: 0,   v: 0 },
  { at: 40,  v: 1, ease: 'glide' },
  { at: 90,  v: 1 },
  { at: 120, v: 0, ease: 'exit' }
]);
```

`ease` describes how the value arrives **at** that keyframe. Before the first
and after the last, the value is held.

---

## The camera

```ts
type Camera = {
  x, y, z;              // position. +z pushes IN (the world comes toward you)
  rotX, rotY, rotZ;     // degrees
  zoom;                 // applied after the move
  lens;                 // perspective distance. low = wide/dramatic
  focus;                // the world-z plane that is sharp
  aperture;             // blur px per 1000px of defocus. 0 disables DOF
  maxBlur;
};
```

A scene declares shots and gets a camera:

```tsx
const SHOTS: Shot[] = [
  { at: 0,   x: -140, z: -240, rotY: -9, focus: -80,  aperture: 8 },
  { at: 70,  x: 40,   z: 60,   rotY: 2,  focus: 140,  aperture: 6, ease: 'glide' },
  { at: 360, x: -110, z: 190,  rotY: -3, focus: -60,  aperture: 7, ease: 'swap' }
];

const camera = useCameraRig(SHOTS, { amount: 0.45 });
```

Each channel is interpolated independently, and a shot may set any subset — so
`{ at: 300, focus: 140 }` is a rack focus with the camera stationary.

### Handheld

Added on top of the keyframes, never baked into them, so you can dial it to 0
for a locked-off product shot without rewriting the move.

```ts
useCameraRig(SHOTS, { amount: 0.9, rate: 0.4 })
// 0 = tripod · 0.5 = steady operator · 2+ = documentary
```

It is driven by hash-based fractal noise, not by sines. A sine pair visibly
repeats within about twelve seconds, and once you have seen the loop you cannot
unsee it. Noise is also a pure function of the frame number, which matters:
Remotion renders frames out of order and in parallel, so anything stateful or
`Math.random()`-based tears.

### Placing objects

```tsx
<World camera={camera}>
  <Obj x={-430} y={120} z={-40} rotY={11} opacity={alive}>
    <Paper src="screens/cv.png" width={352} />
  </Obj>
</World>
```

`<Obj/>` is centred on the origin, so a bare `<Obj/>` sits dead centre facing
camera. It publishes its own rotation through context, which is how objects
angle their highlights and shadows consistently — see [brand.md](brand.md).

### Depth of field, and the one gotcha

Blur is `|obj.z − camera.focus| / 1000 × aperture`, capped at `maxBlur`.

A CSS `filter` **flattens the 3D context of everything inside it**. So `<Obj/>`
omits the filter entirely below 0.15px of blur — which means the sharp object in
the foreground, the one whose internal depth you actually want, keeps it. Only
defocused background objects go flat, and by definition you cannot see their
depth anyway.

The same constraint is why `<CameraBlur/>` is a `backdrop-filter` on an overlay
rather than a `filter` on the world: a filter there would collapse every
object's depth exactly during the moves where depth is most visible.

---

## The scene clock

```ts
const { frame, fps, enter, exit, hold, outAt } = useSceneClock({ outDur: 22 });
```

`enter` is the spring-driven arrival, `exit` the linear departure, `hold` their
product. `outAt` is the frame the scene starts leaving — pass it to text as
`exitAt` and everything leaves together.

When all nine scenes draw their arrival from the same spring and their departure
from the same curve, the hand-offs line up on their own, and the film has a pulse
instead of nine unrelated rhythms.

---

## Type

Two rules, both non-negotiable.

**Nothing appears.** Every word is *revealed* — it rises out of a mask, the way
a title card is exposed. Fading text in is the loudest template tell, because it
is the one thing physical type cannot do.

**Line breaks are authored.** Write `\n` where the line should turn. A headline
that rewraps because someone changed a word is a headline nobody set.

```tsx
<Headline size={82} accent={['human.']} exitAt={outAt}>
  {'Most resumes\nnever reach a human.'}
</Headline>
```

`<Odometer/>` rolls digits mechanically rather than re-rendering the number
thirty times a second — the difference between a number that is counting and one
that is being replaced.

---

## Beats

Scene lengths are quantised to `script.grid` frames (default 15). At 30fps that
puts every boundary on a beat of a 120BPM bed, so a music track locks without
nudging. `useBeat(120)` returns a pulse that decays before the next beat —
multiply a scale or a glow by it to land an accent exactly on the bed.
