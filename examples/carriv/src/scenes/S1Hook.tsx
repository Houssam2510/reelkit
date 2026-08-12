import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	Paper,
	Scrim,
	useCameraRig,
	useSceneClock,
	ramp,
	fbm,
	useBrand,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE PROBLEM.
 *
 * A drift of identical résumés, receding into the dark. The camera pushes
 * through them while a machine reader sweeps across the field and strikes them
 * out one after another — no explanation, no icon, no copy about it.
 *
 * The old version of this scene opened on the logo. That is the instinct to
 * resist: nobody has been given a reason to care about the logo yet. Open on
 * the thing that is wrong.
 */

const HANDHELD = { amount: 0.9, rate: 0.4 };

/** The camera pushes in, and the focus plane comes forward with it. */
const SHOTS: readonly Shot[] = [
	{ at: 0, z: -620, rotY: -13, rotX: 3, focus: -1500, aperture: 9, zoom: 1.06 },
	{ at: 150, z: 130, rotY: 3, rotX: 1, focus: -520, aperture: 6, zoom: 1, ease: 'glide' },
	{ at: 240, z: 470, rotY: 9, focus: -260, aperture: 7, ease: 'swap' }
];

/** Twelve sheets, hand-placed. A random scatter always clumps; this does not. */
const FIELD = [
	{ x: -560, y: -170, z: -1550, rot: -14 },
	{ x: -120, y: 120, z: -1380, rot: 9 },
	{ x: 420, y: -230, z: -1240, rot: -6 },
	{ x: 760, y: 150, z: -1050, rot: 13 },
	{ x: -780, y: 190, z: -900, rot: 7 },
	{ x: -300, y: -260, z: -760, rot: -11 },
	{ x: 260, y: 240, z: -640, rot: 5 },
	{ x: 830, y: -180, z: -520, rot: -9 },
	{ x: -880, y: -120, z: -420, rot: 12 },
	{ x: -420, y: 260, z: -300, rot: -5 },
	{ x: 560, y: -300, z: -220, rot: 8 },
	{ x: 980, y: 240, z: -140, rot: -12 }
];

/** The reader's strike, drawn across a sheet once it has been "read". */
const Strike: React.FC<{ t: number; width: number; color: string }> = ({ t, width, color }) => (
	<div
		style={{
			position: 'absolute',
			left: -width * 0.06,
			top: '46%',
			width: width * 1.12 * t,
			height: 3,
			background: color,
			boxShadow: `0 0 18px 3px ${color}`,
			transform: 'translateZ(8px)',
			borderRadius: 2
		}}
	/>
);

export const S1Hook: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, exit } = useSceneClock();

	// The reader sweeps the whole field from back to front between f30 and f170.
	const sweep = ramp(frame, [30, 170], [0, 1], 'linear');

	return (
		<AbsoluteFill>
			<World camera={camera}>
				{FIELD.map((p, i) => {
					// Each sheet is struck when the sweep passes its depth.
					const at = i / FIELD.length;
					const struck = ramp(sweep, [at, at + 0.1], [0, 1], 'swift');
					const drift = fbm(frame / 120 + i, 100 + i) * 14;
					const w = 300;

					return (
						<Obj
							key={i}
							x={p.x}
							y={p.y + drift}
							z={p.z}
							rotY={p.rot}
							rotZ={p.rot * 0.3}
							opacity={(1 - exit) * (0.5 - struck * 0.22)}
						>
							<div style={{ filter: `grayscale(${1 - struck * 0.35}) contrast(0.85)` }}>
								<Paper src="screens/en/cv-classic.png" width={w} shadow={false} />
								{struck > 0.01 ? (
									<Strike t={struck} width={w} color={brand.palette.accent} />
								) : null}
							</div>
						</Obj>
					);
				})}
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="bottom" strength={0.92} extent={62} />
			<Scrim side="left" strength={0.72} extent={44} />

			<Copy
				kicker="The problem"
				title={'Most resumes\nnever reach a human.'}
				body="Applicant tracking systems read them first, and they are looking for exact words."
				accent={['human.']}
				size={82}
				width={1000}
				top={330}
				delay={44}
			/>
		</AbsoluteFill>
	);
};
