/**
 * The timing arithmetic of the cut. Shared, deliberately, between the
 * TypeScript film (which renders it) and the Node tools (which generate the
 * voice-over and the subtitles from it).
 *
 * It lives in plain .mjs for exactly that reason: two implementations of "how
 * long is scene four" is how a film goes out of sync, and it always goes out
 * of sync three days after someone re-records one line.
 */

export const DEFAULT_LEAD_IN = 0.4;
export const DEFAULT_TAIL = 0.7;
/** Length of a scene that has neither narration nor an explicit duration. */
export const ORPHAN_SECONDS = 3;

/**
 * @param {object} opts
 * @param {number} [opts.fps]
 * @param {number} [opts.grid]  quantise every scene to a multiple of N frames
 * @param {Array<{id: string, leadIn?: number, tail?: number, min?: number, seconds?: number}>} opts.beats
 *        The running order. One beat per scene, in order.
 * @param {Record<string, number>} [opts.durations]  measured VO length, seconds, by beat id
 * @returns {Array<{id: string, from: number, dur: number, voFrom: number|null, voDur: number}>}
 */
export const layout = ({ fps = 30, grid = 15, beats, durations = {} }) => {
	let cursor = 0;
	return beats.map((b) => {
		const voDur = durations[b.id] ?? 0;
		const leadIn = b.leadIn ?? DEFAULT_LEAD_IN;
		const tail = b.tail ?? DEFAULT_TAIL;

		const natural =
			b.seconds !== undefined ? b.seconds : voDur > 0 ? leadIn + voDur + tail : ORPHAN_SECONDS;

		const wanted = Math.max(natural, b.min ?? 0);
		const dur = Math.max(grid, Math.ceil((wanted * fps) / grid) * grid);

		const out = {
			id: b.id,
			from: cursor,
			dur,
			voFrom: voDur > 0 ? cursor + Math.round(leadIn * fps) : null,
			voDur
		};
		cursor += dur;
		return out;
	});
};

/** `hh:mm:ss,mmm` — SubRip's timecode. */
export const srtTime = (seconds) => {
	const ms = Math.max(0, Math.round(seconds * 1000));
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	return (
		`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` +
		`,${String(ms % 1000).padStart(3, '0')}`
	);
};

/**
 * Build a SubRip file for the whole film from per-line word timings.
 * Cues are broken on punctuation first, then on length — never mid-clause,
 * which is the difference between subtitles you can read and subtitles you
 * merely can keep up with.
 *
 * @param {Array<{id: string, voFrom: number|null}>} placed  output of layout()
 * @param {Record<string, {words: Array<{w: string, start: number, end: number}>}>} lines
 * @param {number} fps
 * @param {number} [maxChars]
 */
export const toSrt = (placed, lines, fps, maxChars = 74) => {
	const cues = [];

	for (const p of placed) {
		const line = lines[p.id];
		if (!line || p.voFrom === null) continue;
		const offset = p.voFrom / fps;

		let buf = [];
		const flush = () => {
			if (buf.length === 0) return;
			const first = buf[0];
			const last = buf[buf.length - 1];
			cues.push({
				start: offset + first.start,
				end: offset + last.end,
				text: buf.map((w) => w.w).join(' ')
			});
			buf = [];
		};

		for (const w of line.words) {
			buf.push(w);
			const text = buf.map((x) => x.w).join(' ');
			const breaks = /[.!?—…]$/.test(w.w) || (/[,;:]$/.test(w.w) && text.length > maxChars * 0.6);
			if (breaks || text.length >= maxChars) flush();
		}
		flush();
	}

	return cues
		.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`)
		.join('\n');
};
