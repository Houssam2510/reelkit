import type React from 'react';
import type { Brand } from '../brand/brand';
import type { Key } from '../motion/curves';
import type { HandheldConfig } from '../motion/camera';
import { layout } from './timeline.mjs';

/**
 * THE SCRIPT IS THE CUT.
 *
 * Every product film that has gone out of sync went out of sync the same way:
 * someone wrote `durationInFrames={240}`, then re-recorded a line that came
 * back four hundred milliseconds longer.
 *
 * So no scene here declares a length. The script declares the running order and
 * how much air each line wants around it; `npm run vo` measures what the voice
 * actually did; and the scene lengths fall out of the two. Re-record a line and
 * the cut re-times itself. The film only supplies pictures.
 *
 * The one thing still hand-set is the grid: lengths are quantised so every
 * boundary lands on a musical beat.
 */

/** `script/script.json` — authored by a human, read by both the tools and the film. */
export type Script = {
	/** ElevenLabs voice id, or a name the tools can resolve. */
	voice: string;
	model?: string;
	settings?: Record<string, number | boolean>;
	fps?: number;
	grid?: number;
	/** Delivery notes for whoever (or whatever) reads it. Not used at render time. */
	direction?: string;
	lines: readonly ScriptLine[];
};

export type ScriptLine = {
	id: string;
	text: string;
	/** Seconds of picture before the line starts. */
	leadIn?: number;
	/** Seconds of picture after it ends. */
	tail?: number;
	/** Floor in seconds — a four-word line still needs room to land. */
	min?: number;
	/** Hard length in seconds. For beats with no narration. */
	seconds?: number;
	/** The one word to stress. Direction only. */
	emphasis?: string;
};

/** Written by `tools/vo.mjs` from the ElevenLabs response. */
export type VoWord = { w: string; start: number; end: number };
export type VoLine = { durationSec: number; hash: string; words: VoWord[] };
export type VoTimings = {
	generatedAt: string;
	voice: string;
	model: string;
	lines: Record<string, VoLine>;
};

/** A scene supplies pictures for one beat of the script. `id` is the link. */
export type SceneSpec = {
	id: string;
	/** Shown in the Studio sidebar and in the contact sheet. */
	title: string;
	component: React.FC;
	/** Only for a beat that has no line in the script. */
	seconds?: number;
};

export type FilmSpec = {
	id: string;
	brand: Brand;
	script: Script;
	/** Parsed `script/timings.json`. Null lays the film out at fallback lengths. */
	timings?: VoTimings | null;
	scenes: readonly SceneSpec[];
	width?: number;
	height?: number;
	/** How the room brightens across the film. Keys are in FRAMES. */
	lift?: readonly Key[];
	handheld?: HandheldConfig;
	music?: { src: string; volume?: number; duckTo?: number };
	/** Burn word-synced captions into the picture. Social cuts want this. */
	captions?: boolean;
};

export type ResolvedScene = SceneSpec & {
	from: number;
	dur: number;
	/** Absolute frame in the film where this scene's narration starts. */
	voFrom: number | null;
	voDur: number;
	line: ScriptLine | null;
};

export type Film = {
	id: string;
	brand: Brand;
	fps: number;
	width: number;
	height: number;
	grid: number;
	handheld: HandheldConfig;
	captions: boolean;
	lift: readonly Key[];
	music?: FilmSpec['music'];
	script: Script;
	timings: VoTimings | null;
	scenes: readonly ResolvedScene[];
	total: number;
};

export const resolveFilm = (spec: FilmSpec): Film => {
	const { script } = spec;
	const fps = script.fps ?? 30;
	const grid = script.grid ?? 15;
	const timings = spec.timings ?? null;

	const byId = new Map(script.lines.map((l) => [l.id, l]));

	const beats = spec.scenes.map((s) => {
		const line = byId.get(s.id);
		return {
			id: s.id,
			leadIn: line?.leadIn,
			tail: line?.tail,
			min: line?.min,
			seconds: s.seconds ?? line?.seconds
		};
	});

	const durations: Record<string, number> = {};
	if (timings) {
		for (const [id, l] of Object.entries(timings.lines)) durations[id] = l.durationSec;
	}

	const placed = layout({ fps, grid, beats, durations });

	const scenes: ResolvedScene[] = spec.scenes.map((s, i) => {
		const p = placed[i]!;
		return {
			...s,
			from: p.from,
			dur: p.dur,
			voFrom: p.voFrom,
			voDur: p.voDur,
			line: byId.get(s.id) ?? null
		};
	});

	const total = scenes.reduce((n, s) => n + s.dur, 0);

	return {
		id: spec.id,
		brand: spec.brand,
		fps,
		width: spec.width ?? 1920,
		height: spec.height ?? 1080,
		grid,
		handheld: spec.handheld ?? { amount: 0.6 },
		captions: spec.captions ?? false,
		lift: spec.lift ?? [
			{ at: 0, v: 0 },
			{ at: Math.round(total * 0.12), v: 0.55 },
			{ at: Math.round(total * 0.86), v: 0.55 },
			{ at: total, v: 0.08, ease: 'exit' }
		],
		music: spec.music,
		script,
		timings,
		scenes,
		total
	};
};

/** Which narration line, if any, is speaking at this frame. */
export const lineAt = (film: Film, frame: number): ResolvedScene | null => {
	for (const s of film.scenes) {
		if (s.voFrom === null) continue;
		if (frame >= s.voFrom && frame <= s.voFrom + s.voDur * film.fps) return s;
	}
	return null;
};

/** A printable table of the cut. Worth logging in CI — a scene that silently
 *  grew by two seconds is otherwise invisible until someone watches it. */
export const filmSummary = (film: Film): string => {
	const tc = (f: number) => {
		const total = f / film.fps;
		const m = Math.floor(total / 60);
		return `${m}:${(total - m * 60).toFixed(1).padStart(4, '0')}`;
	};
	const rows = film.scenes.map(
		(s) =>
			`  ${s.id.padEnd(14)} ${tc(s.from).padStart(7)}  ${(s.dur / film.fps)
				.toFixed(1)
				.padStart(5)}s   ${s.voDur > 0 ? `${s.voDur.toFixed(2)}s vo` : 'silent'}`
	);
	return [
		`${film.id} — ${film.scenes.length} scenes, ${(film.total / film.fps).toFixed(1)}s @ ${film.fps}fps`,
		...rows
	].join('\n');
};
