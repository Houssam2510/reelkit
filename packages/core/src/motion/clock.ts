import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ramp, springAt, type SpringName } from './curves';

/**
 * Every scene's shared clock.
 *
 * `enter` is the spring-driven arrival, `exit` the linear departure, and
 * `hold` the product of the two — multiply an opacity by `hold` and a scene
 * fades in and out correctly without thinking about it.
 *
 * The reason this is a hook rather than a convention: when all nine scenes
 * draw their arrival from the same spring and their departure from the same
 * curve, hand-offs between them line up automatically, and the film has a
 * pulse instead of nine unrelated rhythms.
 */
export const useSceneClock = (
	opts: { delay?: number; outDur?: number; preset?: SpringName } = {}
): {
	frame: number;
	fps: number;
	duration: number;
	enter: number;
	exit: number;
	hold: number;
	/** The frame the scene starts leaving. Pass it to text as `exitAt`. */
	outAt: number;
} => {
	const { delay = 0, outDur = 22, preset = 'settle' } = opts;
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const outAt = durationInFrames - outDur;
	const enter = springAt(frame, fps, delay, preset);
	const exit = ramp(frame, [outAt, durationInFrames], [0, 1], 'exit');
	return { frame, fps, duration: durationInFrames, enter, exit, hold: enter * (1 - exit), outAt };
};

/**
 * A musical pulse. Returns 1 on the beat and decays to 0 before the next one —
 * multiply a scale or a glow by it to put an accent exactly on the bed.
 */
export const useBeat = (bpm = 120, decay = 0.42): number => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const period = (60 / bpm) * fps;
	const phase = (frame % period) / period;
	return Math.max(0, 1 - phase / decay);
};
