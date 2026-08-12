#!/usr/bin/env node
/**
 * Voice-over — ElevenLabs, one clip per line, with word-level timestamps.
 *
 *   npm run vo                      # generate what changed, for examples/carriv
 *   npm run vo -- --film=my-film
 *   npm run vo -- --only=04         # redo one line
 *   npm run vo -- --voice=Brian
 *   npm run vo -- --force           # ignore the cache
 *   npm run vo -- --dry             # cost and length estimate, no API calls
 *
 * Three decisions worth knowing about:
 *
 * ONE CLIP PER LINE, not one continuous take. A single take means any
 * re-record shifts everything after it, and no engine reproduces the same
 * pauses twice. Per-line clips are pinned to their own frame, so re-recording
 * line four moves nothing.
 *
 * TIMESTAMPS, not just audio. The `/with-timestamps` endpoint returns the
 * engine's own per-character alignment. That is what lets the edit re-time
 * itself around the voice, and what makes word-synced captions exact rather
 * than eyeballed.
 *
 * CACHED BY CONTENT. Each line records a hash of its text plus the voice and
 * settings that produced it. Re-running costs nothing for lines that did not
 * change — which means you can and should run it on every edit.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout, toSrt } from '../packages/core/src/film/timeline.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.elevenlabs.io/v1';

const arg = (name, fallback = null) => {
	const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
	if (!hit) return fallback;
	return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const die = (msg) => {
	console.error(`\n✗ ${msg}\n`);
	process.exit(1);
};

const exists = async (p) =>
	access(p).then(
		() => true,
		() => false
	);

// --- environment ------------------------------------------------------------

// A .env at the repo root, if present. Deliberately not a dependency: this is
// four lines and one less thing that can be supply-chained into a build.
const loadEnv = async () => {
	const p = join(ROOT, '.env');
	if (!(await exists(p))) return;
	for (const raw of (await readFile(p, 'utf8')).split('\n')) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const eq = line.indexOf('=');
		if (eq < 1) continue;
		const key = line.slice(0, eq).trim();
		if (process.env[key] === undefined) {
			process.env[key] = line
				.slice(eq + 1)
				.trim()
				.replace(/^["']|["']$/g, '');
		}
	}
};

// --- ElevenLabs -------------------------------------------------------------

const listVoices = async (key) => {
	const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key } });
	if (!res.ok) die(`Could not list voices: ${res.status} ${await res.text()}`);
	const { voices } = await res.json();
	return voices ?? [];
};

/** Accept either a voice id or a name, so a script can say "Brian". */
const resolveVoiceId = async (key, wanted) => {
	// Voice ids are 20-char alphanumerics; anything else is treated as a name.
	if (/^[a-zA-Z0-9]{20}$/.test(wanted)) return wanted;
	const voices = await listVoices(key);
	const hit = voices.find((v) => v.name?.toLowerCase() === wanted.toLowerCase());
	if (!hit) {
		const names = voices.map((v) => v.name).join(', ');
		die(`No voice named "${wanted}" on this account.\n  Available: ${names || '(none)'}`);
	}
	return hit.voice_id;
};

/**
 * Character alignment → words.
 *
 * ElevenLabs returns one entry per character. A word starts at the first
 * character's start time and ends at the last one's end time; whitespace
 * flushes it. `normalized_alignment` is preferred when present — it aligns
 * against the text as spoken (numbers expanded, abbreviations read out),
 * which is what you want a caption to show.
 */
const toWords = (alignment) => {
	const chars = alignment?.characters ?? [];
	const starts = alignment?.character_start_times_seconds ?? [];
	const ends = alignment?.character_end_times_seconds ?? [];
	const words = [];
	let buf = '';
	let start = 0;

	for (let i = 0; i < chars.length; i++) {
		const c = chars[i];
		if (/\s/.test(c)) {
			if (buf) {
				words.push({ w: buf, start, end: ends[i - 1] ?? start });
				buf = '';
			}
			continue;
		}
		if (!buf) start = starts[i] ?? 0;
		buf += c;
	}
	if (buf) words.push({ w: buf, start, end: ends[chars.length - 1] ?? start });
	return words;
};

const synthesise = async ({ key, voiceId, model, settings, text }) => {
	const res = await fetch(
		`${API}/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
		{
			method: 'POST',
			headers: { 'xi-api-key': key, 'content-type': 'application/json' },
			body: JSON.stringify({ text, model_id: model, voice_settings: settings })
		}
	);

	if (!res.ok) {
		const body = await res.text();
		if (res.status === 401) die(`ElevenLabs rejected the key (401).\n  ${body}`);
		if (res.status === 422)
			die(
				`ElevenLabs rejected the request (422). Usually the model does not\n` +
					`  support timestamps — eleven_multilingual_v2 does.\n  ${body}`
			);
		die(`ElevenLabs ${res.status}: ${body}`);
	}

	const json = await res.json();
	const audio = Buffer.from(json.audio_base64, 'base64');
	const words = toWords(json.normalized_alignment ?? json.alignment);
	const durationSec = words.length ? words[words.length - 1].end : 0;
	return { audio, words, durationSec };
};

// --- main -------------------------------------------------------------------

const main = async () => {
	await loadEnv();

	if (arg('list-voices')) {
		const key = process.env.ELEVENLABS_API_KEY;
		if (!key) die('ELEVENLABS_API_KEY is not set. Copy .env.example to .env.');
		for (const v of await listVoices(key)) {
			console.log(`${v.voice_id}  ${(v.name ?? '').padEnd(18)} ${v.labels?.description ?? ''}`);
		}
		return;
	}

	const filmDir = resolve(ROOT, 'examples', String(arg('film', 'carriv')));
	const scriptPath = join(filmDir, 'script', 'script.json');
	if (!(await exists(scriptPath))) die(`No script at ${scriptPath}`);

	const script = JSON.parse(await readFile(scriptPath, 'utf8'));
	const model = String(
		arg('model', process.env.ELEVENLABS_MODEL || script.model || 'eleven_multilingual_v2')
	);
	const voiceName = String(arg('voice', process.env.ELEVENLABS_VOICE_ID || script.voice || ''));
	const settings = script.settings ?? {};
	const fps = script.fps ?? 30;

	const only = arg('only');
	const force = Boolean(arg('force'));
	const dry = Boolean(arg('dry'));

	const outAudio = join(filmDir, 'public', 'audio', 'vo');
	const timingsPath = join(filmDir, 'script', 'timings.json');
	const srtPath = join(filmDir, 'script', 'captions.srt');

	const previous = (await exists(timingsPath))
		? JSON.parse(await readFile(timingsPath, 'utf8'))
		: { lines: {} };

	const lines = script.lines.filter((l) => l.text);
	const chars = lines.reduce((n, l) => n + l.text.length, 0);

	if (dry) {
		console.log(`\n${lines.length} lines · ${chars} characters · model ${model}`);
		console.log(`~${(chars / 1000).toFixed(1)}k credits at 1 credit/character.\n`);
		for (const l of lines) {
			// ~2.6 characters per 100ms is a fair estimate for narration pace.
			console.log(
				`  ${l.id.padEnd(14)} ${l.text.length.toString().padStart(4)} ch  ≈ ${(l.text.length / 15).toFixed(1)}s`
			);
		}
		return;
	}

	const key = process.env.ELEVENLABS_API_KEY;
	if (!key) die('ELEVENLABS_API_KEY is not set. Copy .env.example to .env and add your key.');
	if (!voiceName) die('No voice. Set `voice` in script.json, or ELEVENLABS_VOICE_ID, or --voice=.');

	const voiceId = await resolveVoiceId(key, voiceName);
	await mkdir(outAudio, { recursive: true });

	const fingerprint = (text) =>
		createHash('sha256')
			.update(JSON.stringify({ text, voiceId, model, settings }))
			.digest('hex')
			.slice(0, 16);

	const timings = { generatedAt: new Date().toISOString(), voice: voiceName, model, lines: {} };
	let made = 0;
	let cached = 0;

	for (const line of lines) {
		const hash = fingerprint(line.text);
		const mp3 = join(outAudio, `${line.id}.mp3`);
		const prev = previous.lines?.[line.id];

		if (only && !line.id.startsWith(String(only))) {
			// Not targeted by --only: keep whatever we already had.
			if (prev) timings.lines[line.id] = prev;
			else console.log(`· ${line.id.padEnd(14)} skipped, and never recorded — film will be short`);
			continue;
		}

		const upToDate = !force && prev?.hash === hash && (await exists(mp3));
		if (upToDate) {
			timings.lines[line.id] = prev;
			cached++;
			console.log(`· ${line.id.padEnd(14)} unchanged (${prev.durationSec.toFixed(2)}s)`);
			continue;
		}

		const { audio, words, durationSec } = await synthesise({
			key,
			voiceId,
			model,
			settings,
			text: line.text
		});
		await writeFile(mp3, audio);
		timings.lines[line.id] = { durationSec, hash, words };
		made++;

		const budget = line.min ?? 0;
		const flag =
			budget && durationSec + (line.leadIn ?? 0.4) + (line.tail ?? 0.7) > budget
				? ' ⚠ over min'
				: '';
		console.log(
			`✓ ${line.id.padEnd(14)} ${durationSec.toFixed(2)}s  ${words.length} words  ${(audio.length / 1024).toFixed(0)} KB${flag}`
		);
	}

	await writeFile(timingsPath, `${JSON.stringify(timings, null, '\t')}\n`);

	// Subtitles, laid out on the same arithmetic the film uses. One source of
	// truth for "where does scene four start", shared with packages/core.
	const placed = layout({
		fps,
		grid: script.grid ?? 15,
		beats: script.lines,
		durations: Object.fromEntries(
			Object.entries(timings.lines).map(([id, l]) => [id, l.durationSec])
		)
	});
	await writeFile(srtPath, toSrt(placed, timings.lines, fps));

	const total = placed.reduce((n, p) => n + p.dur, 0);
	console.log(
		`\n${made} generated, ${cached} cached.\n` +
			`Film is now ${(total / fps).toFixed(1)}s across ${placed.length} scenes.\n` +
			`  ${timingsPath.replace(ROOT + '/', '')}\n  ${srtPath.replace(ROOT + '/', '')}\n`
	);
};

main().catch((err) => die(err?.stack ?? String(err)));
