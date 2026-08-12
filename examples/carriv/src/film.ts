import { resolveFilm } from 'reelkit';
import type { Script, VoTimings } from 'reelkit';
import { carriv } from './brand';
import script from '../script/script.json';
import timings from '../script/timings.json';

import { S1Hook } from './scenes/S1Hook';
import { S2Reveal } from './scenes/S2Reveal';
import { S3Paste } from './scenes/S3Paste';
import { S4Document } from './scenes/S4Document';
import { S5Ats } from './scenes/S5Ats';
import { S6Truth } from './scenes/S6Truth';
import { S7Tracker } from './scenes/S7Tracker';
import { S8Extension } from './scenes/S8Extension';
import { S9Cta } from './scenes/S9Cta';

/**
 * The film.
 *
 * There is no duration anywhere in this file. Each scene names the beat of the
 * script it illustrates, and the lengths come from `script/timings.json` —
 * which is what `npm run vo` measured the voice actually doing. Change a line,
 * re-run `vo`, and the cut re-times itself.
 *
 * The order of `scenes` IS the running order.
 */
export const film = resolveFilm({
	id: 'Carriv',
	brand: carriv,
	script: script as Script,
	timings: timings as unknown as VoTimings,
	scenes: [
		{ id: '01-hook', title: 'Hook — most resumes never reach a human', component: S1Hook },
		{ id: '02-reveal', title: 'Reveal — the product', component: S2Reveal },
		{ id: '03-paste', title: 'Paste the posting', component: S3Paste },
		{ id: '04-document', title: 'The document — one page, ATS-parsed', component: S4Document },
		{ id: '05-ats', title: 'The score', component: S5Ats },
		{ id: '06-truth', title: 'Nothing is invented', component: S6Truth },
		{ id: '07-tracker', title: 'The tracker', component: S7Tracker },
		{ id: '08-extension', title: 'Chrome extension', component: S8Extension },
		{ id: '09-cta', title: 'Call to action', component: S9Cta }
	],

	// The room comes up as the product appears and goes down for the sign-off.
	// Frames, not seconds — but expressed as a fraction of the whole so a
	// re-recorded voice does not put the lighting cues in the wrong place.
	lift: [
		{ at: 0, v: 0 },
		{ at: 200, v: 0.5, ease: 'glide' },
		{ at: 700, v: 0.62 },
		{ at: 1900, v: 0.55 },
		{ at: 2180, v: 0.05, ease: 'exit' }
	],

	handheld: { amount: 0.5, rate: 0.35 },

	// Drop a track at public/audio/track.mp3 and uncomment. It ducks under the
	// narration automatically. Around 120 BPM locks to the 15-frame grid.
	// music: { src: 'audio/track.mp3', volume: 0.3, duckTo: 0.1 },

	// Burned-in captions: off for the narrated cut, on for a silent social cut.
	captions: false
});
