import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import type { Film } from '../film/film';

/**
 * Narration, one clip per line, each pinned to its own frame.
 *
 * A single continuous take is tempting and always wrong: any re-record shifts
 * everything after it, and a synthesis engine will not reproduce the same
 * pauses twice. Per-line clips mean a line can be re-recorded on its own and
 * nothing downstream moves.
 */
export const Voiceover: React.FC<{ film: Film; dir?: string; volume?: number }> = ({
	film,
	dir = 'audio/vo',
	volume = 1
}) => (
	<>
		{film.scenes.map((s) =>
			s.voFrom === null ? null : (
				<Sequence key={s.id} from={s.voFrom} name={`vo/${s.id}`} layout="none">
					<Audio src={staticFile(`${dir}/${s.id}.mp3`)} volume={volume} />
				</Sequence>
			)
		)}
	</>
);

/**
 * The music bed, ducked under the narration.
 *
 * The duck ramps over ~8 frames rather than switching, because a hard gain
 * change is audible as a click and reads as amateur far more than a loud bed
 * does. With narration running nearly wall to wall, the bed is a floor — it
 * should be felt, not heard.
 */
export const Music: React.FC<{ film: Film }> = ({ film }) => {
	if (!film.music) return null;
	const { src, volume = 0.3, duckTo = 0.11 } = film.music;

	// Precomputed once per render pass, not per frame: the ranges are static.
	const ranges = film.scenes
		.filter((s) => s.voFrom !== null)
		.map((s) => [s.voFrom as number, (s.voFrom as number) + s.voDur * film.fps] as const);

	const gainAt = (f: number): number => {
		const ramp = 8;
		let duck = 0;
		for (const [a, b] of ranges) {
			if (f >= a - ramp && f <= b + ramp) {
				const inAmt = Math.min(1, Math.max(0, (f - (a - ramp)) / ramp));
				const outAmt = Math.min(1, Math.max(0, (b + ramp - f) / ramp));
				duck = Math.max(duck, Math.min(inAmt, outAmt));
			}
		}
		// A short fade at both ends of the film, so the bed never starts or stops
		// on a hard edge.
		const fade = Math.max(0, Math.min(1, f / 20, (film.total - f) / 30));
		return (volume + (duckTo - volume) * duck) * fade;
	};

	return <Audio src={staticFile(src)} volume={gainAt} />;
};
