# The voice

The narration is not a layer added to a finished film. It is the film's
skeleton: scene lengths are computed from it, captions are derived from it, and
the subtitle file falls out of the same arithmetic.

---

## The loop

```bash
cp .env.example .env          # add ELEVENLABS_API_KEY
npm run voices                # what your account can speak
npm run voices -- --preview=Brian
npm run vo -- --dry           # characters and estimated length, no API calls
npm run vo                    # generate whatever changed
```

`vo` writes:

```
public/audio/vo/01-hook.mp3   …one clip per line
script/timings.json           …durations + per-word timestamps
script/captions.srt           …the whole film, cued on clauses
```

and prints the new running time. Nothing else needs updating — the film reads
`timings.json` and re-lays itself out.

---

## Three decisions worth understanding

**One clip per line, not one continuous take.** A single take means any
re-record shifts everything after it, and no engine reproduces the same pauses
twice. Per-line clips are each pinned to their own frame, so re-recording line
four moves nothing.

**Timestamps, not just audio.** `/with-timestamps` returns the engine's own
per-character alignment. That is what makes captions exact instead of eyeballed,
and it is what lets the edit re-time itself. `eleven_multilingual_v2` is the
default because it reliably returns them; not every tier does.

**Cached by content.** Each line stores a hash of its text plus the voice and
settings that produced it. Unchanged lines cost nothing, so running `vo` on
every edit is free.

---

## Choosing a voice

Preview before you commit — a voice that reads beautifully on the marketing page
can be entirely wrong over a product film. You are looking for a **narrator**,
not a presenter.

For a calm, technical product film: mid-to-low register, "narration" category,
never "trailer" or "energetic". On ElevenLabs, **Brian** (US male, deep) is the
reference for the Carriv cut; **Sarah** (US female, warm) and **George** (UK
male) are the good alternatives.

```jsonc
"settings": {
  "stability": 0.5,          // lower = more expressive and less repeatable
  "similarity_boost": 0.75,
  "style": 0.08,             // above ~0.3 starts performing. Don't.
  "use_speaker_boost": true,
  "speed": 0.98              // a touch under 1 reads as considered
}
```

---

## Writing a line that survives synthesis

- **One stressed word per line, no more.** Record it in `emphasis` — it is
  direction for whoever, or whatever, reads it.
- **Write the punctuation you want heard.** Em dashes become pauses. Commas
  become breaths. A sentence with no punctuation is read at one pitch.
- **Spell out what engines mispronounce.** The Carriv script says `LAY-tek`,
  because every engine tried so far reads "LaTeX" as "lay-tex". Check your
  product's own name first.
- **Numbers and units are read, not shown.** "1 page" may come out "one page" or
  "one p"; write the words if it matters.
- **Keep lines under about twelve seconds.** Past that a listener stops tracking
  the sentence, and the matching scene has to hold a single idea too long.

Set `min` on a line to give its scene a floor — a four-word line still needs
room to land. `vo` warns when a take overruns the `min` you asked for.

---

## Captions

With word timings present, `captions: true` on the film burns in a caption whose
words light on the syllable they are spoken on. Leave it **off** for the
narrated cut and **on** for a silent-autoplay social cut — same film, one flag.

`script/captions.srt` is the whole cut as SubRip, broken on clauses rather than
on character count. Upload it with the video; do not re-type it.

---

## Music

With narration running nearly wall to wall, the bed is a floor, not a voice.
`<Music/>` ducks it under every line automatically, ramping over ~8 frames — a
hard gain change is audible as a click and reads as amateur far more than a loud
bed does.

What to look for: minimal, warm, ambient. A sustained pad or soft Rhodes over a
low pulse. **No mid-range melody** — a lead instrument at 1–4 kHz fights the
voice directly, while pads, sub-bass and sparse high texture leave that band
clear. No drum-forward corporate uplift, no cymbal swells.

Around **120 BPM** if it has a pulse: scene boundaries sit on a 15-frame grid, so
it locks with no nudging.

```ts
music: { src: 'audio/track.mp3', volume: 0.3, duckTo: 0.1 }
```
