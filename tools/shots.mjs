#!/usr/bin/env node
/**
 * Re-shoot a film's screenshots from a running app.
 *
 *   npm run shots -- --film=carriv
 *   npm run shots -- --film=carriv --only=08-ats-score
 *
 * Driven by `<film>/script/shots.json`, so a re-shoot after a UI change is one
 * command rather than an afternoon of dragging a browser window to the right
 * size. The size matters: `<BrowserFrame/>` assumes a 1.6 aspect and `<Paper/>`
 * assumes A4, and a capture resized afterwards is visible in the text
 * rendering.
 *
 * Playwright is an OPTIONAL peer. It is a large dependency and most people
 * editing a film never re-shoot, so it is not in package.json:
 *
 *   npm i -D playwright && npx playwright install chromium
 */
import { readFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const arg = (name, fallback = null) => {
	const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
	if (!hit) return fallback;
	return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const die = (msg) => {
	console.error(`\n✗ ${msg}\n`);
	process.exit(1);
};

let chromium;
try {
	({ chromium } = await import('playwright'));
} catch {
	die('Playwright is not installed.\n  npm i -D playwright && npx playwright install chromium');
}

const filmDir = resolve(ROOT, 'examples', String(arg('film', 'carriv')));
const configPath = join(filmDir, 'script', 'shots.json');
const ok = await access(configPath).then(
	() => true,
	() => false
);
if (!ok) {
	die(
		`No shot list at ${configPath}.\n` +
			`  It looks like:\n` +
			`  {\n` +
			`    "baseUrl": "http://localhost:5173",\n` +
			`    "cookies": [{ "name": "lang", "value": "en" }],\n` +
			`    "viewport": { "width": 1600, "height": 1000 },\n` +
			`    "deviceScaleFactor": 2,\n` +
			`    "outDir": "public/screens/en",\n` +
			`    "shots": [{ "id": "01-landing", "path": "/", "waitFor": "h1" }]\n` +
			`  }`
	);
}

const cfg = JSON.parse(await readFile(configPath, 'utf8'));
const only = arg('only');
const outDir = join(filmDir, cfg.outDir ?? 'public/screens');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
	viewport: cfg.viewport ?? { width: 1600, height: 1000 },
	deviceScaleFactor: cfg.deviceScaleFactor ?? 2,
	// Nothing may be caught mid-transition. A screenshot of a half-finished
	// animation is the one flaw no amount of compositing hides.
	reducedMotion: 'reduce'
});

if (cfg.cookies?.length) {
	const url = new URL(cfg.baseUrl);
	await context.addCookies(cfg.cookies.map((c) => ({ path: '/', domain: url.hostname, ...c })));
}

const page = await context.newPage();
let failed = 0;

for (const shot of cfg.shots) {
	if (only && shot.id !== String(only)) continue;
	const url = new URL(shot.path, cfg.baseUrl).toString();
	process.stdout.write(`  ${shot.id.padEnd(24)} ${url} … `);
	try {
		await page.goto(url, { waitUntil: 'networkidle' });
		if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 15000 });
		// Assert before shooting: a capture of the wrong state is worse than no
		// capture, because it ships.
		if (shot.assertText) {
			const found = await page.getByText(shot.assertText).count();
			if (found === 0) throw new Error(`assertText not found: "${shot.assertText}"`);
		}
		if (shot.scrollTo) await page.evaluate((y) => window.scrollTo(0, y), shot.scrollTo);
		await page.screenshot({
			path: join(outDir, `${shot.id}.png`),
			fullPage: Boolean(shot.fullPage),
			...(shot.clip ? { clip: shot.clip } : {})
		});
		console.log('ok');
	} catch (err) {
		failed++;
		console.log(`FAILED — ${err.message}`);
	}
}

await browser.close();
console.log(`\n→ ${outDir.replace(ROOT + '/', '')}`);
process.exit(failed > 0 ? 1 : 0);
