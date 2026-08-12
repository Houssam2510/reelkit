import { Easing, interpolate, spring } from 'remotion';

/**
 * The motion language. Six curves and five springs — that is the whole
 * vocabulary, and every move in a reelkit film is built from them.
 *
 * The constraint is the point. What separates a studio edit from a template is
 * not that each animation is clever; it is that four hundred animations share
 * one sense of weight. Reach for a bespoke cubic-bezier and you have started
 * making a collage.
 */

export const curve = {
	/** UI-speed arrival. Fast out of the gate, long tail. The default. */
	swift: Easing.bezier(0.22, 1, 0.36, 1),
	/** The expressive one: slower start, very long tail. For hero moves. */
	glide: Easing.bezier(0.16, 1, 0.3, 1),
	/** Arrives with a hair of overshoot. Use on things that have mass. */
	settle: Easing.bezier(0.34, 1.16, 0.4, 1),
	/** Both ends eased. For moves that start and stop on screen. */
	swap: Easing.bezier(0.65, 0, 0.35, 1),
	/** Departures. Accelerates away — never use this for an entrance. */
	exit: Easing.bezier(0.5, 0, 0.9, 0.35),
	linear: Easing.linear
} as const;

export type CurveName = keyof typeof curve;

/**
 * Spring presets. `damping` above ~180 is critically damped (no overshoot);
 * below ~20 is visibly bouncy. Anything in a film should be in between.
 */
export const springs = {
	/** Default entrance: no overshoot, natural deceleration. */
	arrive: { damping: 200, mass: 0.7, stiffness: 100 },
	/** Heavy object settling into place — one small overshoot. */
	settle: { damping: 26, mass: 1.05, stiffness: 62 },
	/** Small UI element appearing. Snappy, slight bounce. */
	pop: { damping: 15, mass: 0.5, stiffness: 130 },
	/** Slow, cinematic. For camera pushes and full-screen moves. */
	drift: { damping: 60, mass: 2.2, stiffness: 48 },
	/** Impact response — fast attack, quick settle. */
	hit: { damping: 11, mass: 0.4, stiffness: 190 }
} as const;

export type SpringName = keyof typeof springs;

/** `interpolate` with house easing and clamped edges — the 90 % case. */
export const ramp = (
	frame: number,
	range: readonly [number, number],
	to: readonly [number, number] = [0, 1],
	easing: CurveName = 'swift'
): number =>
	interpolate(frame, range as [number, number], to as [number, number], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: curve[easing]
	});

/**
 * A multi-keyframe channel. This is how camera moves and any value with more
 * than one beat are written — as a timeline, not as nested interpolates.
 *
 *   track(frame, [
 *     { at: 0,  v: 0 },
 *     { at: 40, v: 1, ease: 'glide' },
 *     { at: 90, v: 1 },
 *     { at: 120, v: 0, ease: 'exit' }
 *   ])
 *
 * `ease` describes how the value arrives AT that keyframe. Before the first and
 * after the last keyframe the value is held.
 */
export type Key = { at: number; v: number; ease?: CurveName };

export const track = (frame: number, keys: readonly Key[]): number => {
	if (keys.length === 0) return 0;
	const first = keys[0]!;
	if (frame <= first.at) return first.v;
	const last = keys[keys.length - 1]!;
	if (frame >= last.at) return last.v;

	for (let i = 1; i < keys.length; i++) {
		const b = keys[i]!;
		if (frame <= b.at) {
			const a = keys[i - 1]!;
			if (b.at === a.at) return b.v;
			return interpolate(frame, [a.at, b.at], [a.v, b.v], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
				easing: curve[b.ease ?? 'swift']
			});
		}
	}
	return last.v;
};

/**
 * Delay for the i-th item of a group. Sub-frame steps are intentional: at 30fps
 * a 3-frame stagger across eight words takes almost a second, which reads as
 * sluggish. Fractional delays keep the group tight but still sequential.
 */
export const stagger = (i: number, per = 2.5, base = 0): number => base + i * per;

/** Spring in the range 0→1, by preset name. */
export const springAt = (
	frame: number,
	fps: number,
	delay = 0,
	preset: SpringName = 'arrive'
): number => spring({ frame: frame - delay, fps, config: springs[preset] });

/**
 * The presence curve every element in the kit uses: 0 → 1 on entry, back to 0
 * on exit. Returned as a single number so a component can multiply opacity by
 * it and be done, plus the two halves for when the exit needs a different
 * transform than the entrance.
 */
export const presence = (
	frame: number,
	fps: number,
	opts: { delay?: number; exitAt?: number; exitDur?: number; preset?: SpringName } = {}
): { in: number; out: number; v: number } => {
	const { delay = 0, exitAt, exitDur = 14, preset = 'arrive' } = opts;
	const enter = springAt(frame, fps, delay, preset);
	const out =
		exitAt === undefined
			? 0
			: interpolate(frame, [exitAt, exitAt + exitDur], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: curve.exit
				});
	return { in: enter, out, v: enter * (1 - out) };
};

export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));

export { interpolate, spring, Easing };
