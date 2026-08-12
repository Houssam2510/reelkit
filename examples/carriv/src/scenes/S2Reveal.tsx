import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	BrowserFrame,
	Scrim,
	useCameraRig,
	useSceneClock,
	ramp,
	type Shot
} from 'reelkit';
import { Lockup } from '../Logo';
import { Copy } from './lib';

/**
 * THE PRODUCT.
 *
 * The answer arrives as one object: the landing page swings up out of the dark
 * and turns to face camera. It is the only cut in the film where something
 * enters fast — the previous scene ended on a problem, and hesitating here
 * would read as apology.
 */

const HANDHELD = { amount: 0.55 };

const SHOTS: readonly Shot[] = [
	{ at: 0, z: -260, rotY: 16, rotX: -4, focus: -700, aperture: 8 },
	{ at: 74, z: 60, rotY: -2, rotX: 0, focus: -150, aperture: 4, ease: 'glide' },
	{ at: 180, z: 190, rotY: -7, focus: -60, ease: 'swap' }
];

export const S2Reveal: React.FC = () => {
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, enter, exit } = useSceneClock({ preset: 'settle' });

	// The page swings in from below and to the right, then holds.
	const swing = ramp(frame, [0, 46], [0, 1], 'glide');

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj
					x={330 - (1 - swing) * 120}
					y={70 + (1 - swing) * 380}
					z={-360 + swing * 180}
					rotY={-42 + swing * 30}
					rotX={9 - swing * 7}
					rotZ={(1 - swing) * -5}
					opacity={Math.min(1, enter * 1.6) * (1 - exit)}
				>
					<BrowserFrame
						src="screens/en/01-landing.png"
						url="carriv.com"
						width={1180}
						reveal={0.66}
					/>
				</Obj>

				{/* The mark, set well forward so the rack focus has somewhere to go.
				    Upper RIGHT, not upper left: the text column owns the left third of
				    every frame in this film, and a lockup there lands on the kicker. */}
				<Obj x={640} y={-360} z={210} opacity={(1 - exit) * ramp(frame, [8, 34], [0, 1])}>
					<div style={{ transform: 'translate(-50%, -50%)' }}>
						<Lockup size={104} delay={10} />
					</div>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="left" strength={0.86} extent={48} />

			<Copy
				kicker="Carriv"
				title={'The resume you have,\nrewritten for the job\nyou want.'}
				accent={['job']}
				size={66}
				width={820}
				top={230}
				delay={16}
			/>
		</AbsoluteFill>
	);
};
