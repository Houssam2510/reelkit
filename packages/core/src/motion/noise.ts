/**
 * Deterministic value noise.
 *
 * Handheld camera and idle drift must never repeat, but they also must be a
 * pure function of the frame number — Remotion renders frames out of order and
 * in parallel, so anything stateful or `Math.random()`-based tears. This is a
 * hash-based 1D noise: same input, same output, on any thread, forever.
 */

const hash = (n: number): number => {
	// xorshift on the integer bits, folded to 0..1
	let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
	x ^= x >>> 13;
	x = Math.imul(x, 0xc2b2ae35);
	x ^= x >>> 16;
	return (x >>> 0) / 4294967296;
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Smooth 1D noise in [-1, 1]. `seed` picks an independent channel. */
export const noise1 = (x: number, seed = 0): number => {
	const i = Math.floor(x);
	const f = x - i;
	const a = hash(i + seed * 9871);
	const b = hash(i + 1 + seed * 9871);
	return (a + (b - a) * smooth(f)) * 2 - 1;
};

/**
 * Fractal noise — three octaves, each half the amplitude and twice the rate.
 * This is what makes handheld read as a person breathing rather than a sine.
 */
export const fbm = (x: number, seed = 0): number =>
	noise1(x, seed) * 0.6 + noise1(x * 2.13, seed + 1) * 0.3 + noise1(x * 4.31, seed + 2) * 0.1;
