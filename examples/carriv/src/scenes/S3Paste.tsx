import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	BrowserFrame,
	Panel,
	Pill,
	Scrim,
	useCameraRig,
	useSceneClock,
	useBrand,
	ramp,
	springAt,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE INPUT.
 *
 * One gesture: a job posting, lifted out of the world as a physical slab of
 * text, flying into the app and landing in the field. Showing the whole
 * three-step flow as three screenshots would be accurate and dead. Showing one
 * object being put into one place is the flow.
 */

const HANDHELD = { amount: 0.6 };

const SHOTS: readonly Shot[] = [
	{ at: 0, z: -180, rotY: -14, rotX: 4, focus: -900, aperture: 7 },
	{ at: 90, z: 120, rotY: -4, rotX: 1, focus: -220, aperture: 5, ease: 'glide' },
	{ at: 255, z: 300, rotY: 4, focus: -120, ease: 'swap' }
];

/** A slab of posting text. Never legible, always unmistakably a job ad. */
const POSTING_LINES = [0.94, 0.72, 0.88, 0.55, 0.8, 0.66, 0.92, 0.48, 0.84, 0.6, 0.76, 0.4];

export const S3Paste: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, enter, exit } = useSceneClock();

	// The posting flies in, then is absorbed by the screen at f96.
	const fly = springAt(frame, fps, 22, 'settle');
	const absorb = ramp(frame, [96, 122], [0, 1], 'swap');

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj
					x={210}
					y={40}
					z={-300}
					rotY={-16}
					rotX={3}
					opacity={Math.min(1, enter * 1.5) * (1 - exit)}
				>
					<BrowserFrame
						src="screens/en/05-generate-filled.png"
						url="carriv.com/app/generate"
						width={1220}
						reveal={0.64}
					/>
				</Obj>

				{/* the posting, in flight */}
				<Obj
					x={860 - fly * 560 + absorb * 30}
					y={-330 + fly * 300 + absorb * 40}
					z={520 - fly * 300 - absorb * 460}
					rotY={-30 + fly * 18}
					rotX={12 - fly * 12}
					rotZ={8 - fly * 8}
					scale={1 - absorb * 0.22}
					opacity={fly * (1 - absorb) * (1 - exit)}
				>
					<Panel width={470} tone="light" pad={30}>
						<div
							style={{
								fontFamily: brand.fonts.body,
								fontSize: 15,
								fontWeight: 700,
								letterSpacing: '0.18em',
								textTransform: 'uppercase',
								color: brand.palette.accentDeep,
								marginBottom: 18
							}}
						>
							Senior Full-Stack Engineer
						</div>
						{POSTING_LINES.map((w, i) => (
							<div
								key={i}
								style={{
									height: 9,
									width: `${w * 100}%`,
									marginBottom: 11,
									borderRadius: 5,
									background: i % 4 === 0 ? brand.palette.accentSoft : brand.palette.lineOnLight
								}}
							/>
						))}
					</Panel>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="left" strength={0.86} extent={46} />

			<Copy
				kicker="Step one"
				title={'Paste the posting.\nThat is the whole input.'}
				accent={['input.']}
				size={64}
				width={780}
				top={210}
				delay={10}
			/>

			{/* Row of pills, bottom-left. With `flexDirection: row`, `justifyContent`
			    is the horizontal axis and `alignItems` the vertical one — swapping
			    them is what puts a caption in the wrong corner. */}
			<AbsoluteFill
				style={{
					flexDirection: 'row',
					justifyContent: 'flex-start',
					alignItems: 'flex-end',
					padding: '0 0 96px 118px',
					gap: 16
				}}
			>
				<Pill delay={116} exitAt={218}>
					One credit
				</Pill>
				<Pill delay={126} exitAt={218} tone="neutral">
					Resume
				</Pill>
				<Pill delay={134} exitAt={218} tone="neutral">
					Cover letter
				</Pill>
				<Pill delay={142} exitAt={218} tone="positive">
					ATS score
				</Pill>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
