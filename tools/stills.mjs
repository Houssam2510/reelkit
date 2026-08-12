#!/usr/bin/env node
/**
 * A contact sheet: one still per scene, rendered from the real compositions.
 *
 *   npm run stills
 *   npm run stills -- --at=0.35      # a third of the way into each scene
 *
 * This is the film's test suite. A typecheck proves the code compiles; only a
 * render proves it composes — that no object landed behind the scrim, that no
 * scene throws at frame zero, that the grade did not eat the type. It takes
 * seconds, which means it can run on every commit, which means a scene never
 * silently breaks and stays broken for a week.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout } from '../packages/core/src/film/timeline.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const arg = (name, fallback) => {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : fallback;
};

const filmDir = resolve(ROOT, 'examples', arg('film', 'carriv'));
const at = Number(arg('at', '0.5'));

const script = JSON.parse(await readFile(join(filmDir, 'script', 'script.json'), 'utf8'));
let durations = {};
try {
	const t = JSON.parse(await readFile(join(filmDir, 'script', 'timings.json'), 'utf8'));
	durations = Object.fromEntries(Object.entries(t.lines).map(([id, l]) => [id, l.durationSec]));
} catch {
	console.log('No timings.json yet — laying out at fallback lengths.');
}

const placed = layout({
	fps: script.fps ?? 30,
	grid: script.grid ?? 15,
	beats: script.lines,
	durations
});

const outDir = join(filmDir, 'out', 'stills');
await mkdir(outDir, { recursive: true });

let failed = 0;
for (const p of placed) {
	// Frames are relative to the solo composition, which starts at the scene.
	const frame = Math.max(0, Math.min(p.dur - 1, Math.round(p.dur * at)));
	const target = join(outDir, `${p.id}.png`);
	process.stdout.write(`  scene-${p.id.padEnd(14)} frame ${String(frame).padStart(4)} … `);

	const res = spawnSync(
		'npx',
		['remotion', 'still', `scene-${p.id}`, target, `--frame=${frame}`, '--log=error'],
		{ cwd: filmDir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }
	);

	if (res.status === 0) {
		console.log('ok');
	} else {
		failed++;
		console.log('FAILED');
		console.error((res.stderr || res.stdout || '').trim().split('\n').slice(-12).join('\n'));
	}
}

console.log(
	`\n${placed.length - failed}/${placed.length} stills in ${outDir.replace(ROOT + '/', '')}`
);
process.exit(failed > 0 ? 1 : 0);
