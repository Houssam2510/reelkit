#!/usr/bin/env node
/**
 * List the ElevenLabs voices available on your account, so you can put a real
 * id (or just a name) in a film's `script.json`.
 *
 *   npm run voices
 *   npm run voices -- --preview=Brian    # synthesise one line and save an mp3
 *
 * The preview matters more than the description does. A voice that reads
 * beautifully on the marketing page can be entirely wrong over a product
 * film — you are looking for a narrator, not a presenter.
 */
import { writeFile, readFile, access, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.elevenlabs.io/v1';

const arg = (name, fallback = null) => {
	const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
	if (!hit) return fallback;
	return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const loadEnv = async () => {
	const p = join(ROOT, '.env');
	const ok = await access(p).then(
		() => true,
		() => false
	);
	if (!ok) return;
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

const PREVIEW_TEXT =
	'Most resumes never reach a human. Software reads them first, and it is looking for exact words.';

await loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
	console.error('\n✗ ELEVENLABS_API_KEY is not set. Copy .env.example to .env and add your key.\n');
	process.exit(1);
}

const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key } });
if (!res.ok) {
	console.error(`\n✗ ${res.status} ${await res.text()}\n`);
	process.exit(1);
}
const { voices = [] } = await res.json();

const preview = arg('preview');
if (!preview) {
	console.log(`\n${voices.length} voices\n`);
	for (const v of voices) {
		const labels = Object.values(v.labels ?? {})
			.filter(Boolean)
			.join(' · ');
		console.log(`  ${v.voice_id}  ${(v.name ?? '').padEnd(16)} ${labels}`);
	}
	console.log(`\nPreview one:  npm run voices -- --preview=<name>\n`);
	process.exit(0);
}

const hit = voices.find((v) => v.name?.toLowerCase() === String(preview).toLowerCase());
if (!hit) {
	console.error(`\n✗ No voice named "${preview}".\n`);
	process.exit(1);
}

const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const gen = await fetch(`${API}/text-to-speech/${hit.voice_id}?output_format=mp3_44100_128`, {
	method: 'POST',
	headers: { 'xi-api-key': key, 'content-type': 'application/json' },
	body: JSON.stringify({ text: PREVIEW_TEXT, model_id: model })
});
if (!gen.ok) {
	console.error(`\n✗ ${gen.status} ${await gen.text()}\n`);
	process.exit(1);
}

const dir = join(ROOT, 'out', 'voice-previews');
await mkdir(dir, { recursive: true });
const file = join(dir, `${hit.name}.mp3`);
await writeFile(file, Buffer.from(await gen.arrayBuffer()));
console.log(`\n✓ ${file}\n  voice_id: ${hit.voice_id}\n`);
