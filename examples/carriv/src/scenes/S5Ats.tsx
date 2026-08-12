import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	BrowserFrame,
	Panel,
	Chip,
	Odometer,
	Scrim,
	useCameraRig,
	useSceneClock,
	useBrand,
	ramp,
	springAt,
	fbm,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE SCORE.
 *
 * The product's hero component gets the hero shot: the real screen sits back
 * and turned away, out of focus, while an oversized live rebuild of the gauge
 * is lifted out of it and put in front of the camera. A magnified crop of a
 * PNG would have been faster and would have looked exactly like one.
 *
 * The number rolls on a mechanical odometer rather than re-rendering thirty
 * times a second — it should read as counting, not as being replaced.
 */

const HANDHELD = { amount: 0.5 };

const SHOTS: readonly Shot[] = [
	{ at: 0, x: 120, z: -300, rotY: -12, rotX: 3, focus: -420, aperture: 9 },
	{ at: 80, x: 190, z: 90, rotY: -4, rotX: 1, focus: 230, aperture: 7, ease: 'glide' },
	{ at: 250, x: 190, z: 130, rotY: -2, focus: 230, aperture: 7 },
	{ at: 330, x: 240, z: 300, rotY: 5, focus: 240, ease: 'swap' }
];

const MATCHED = [
	'TypeScript',
	'React',
	'Node.js',
	'PostgreSQL',
	'automated testing',
	'code reviews',
	'Docker',
	'CI/CD',
	'accessibility',
	'mentoring'
];

const Gauge: React.FC<{ value: number; size: number }> = ({ value, size }) => {
	const brand = useBrand();
	const r = size / 2 - 16;
	const circ = 2 * Math.PI * r;
	return (
		<svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				stroke={brand.palette.lineOnLight}
				strokeWidth={16}
				fill="none"
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				stroke={brand.palette.positive}
				strokeWidth={16}
				strokeLinecap="round"
				fill="none"
				strokeDasharray={circ}
				strokeDashoffset={circ * (1 - value / 100)}
			/>
		</svg>
	);
};

export const S5Ats: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, enter, exit } = useSceneClock({ outDur: 24 });

	// Counts to 84, then the optimiser adds the last eight points.
	const score =
		ramp(frame, [40, 104], [0, 84], 'swift') + ramp(frame, [186, 218], [0, 8], 'settle');
	const card = springAt(frame, fps, 26, 'settle');
	const alive = 1 - exit;

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj
					x={-260}
					y={150}
					z={-620 + (1 - enter) * -600}
					rotY={28 - enter * 5}
					rotX={3}
					opacity={enter * 0.96 * alive}
				>
					<BrowserFrame
						src="screens/en/08-ats-score.png"
						url="carriv.com/app/applications"
						width={1160}
						reveal={0.62}
						scrollY={0.82}
					/>
				</Obj>

				{/* matched keywords, orbiting behind the card */}
				{MATCHED.map((k, i) => {
					const a = (i / MATCHED.length) * Math.PI * 2;
					const app = springAt(frame, fps, 66 + i * 4, 'pop');
					const rad = 500 + (i % 3) * 48;
					const drift = frame / 260;
					return (
						<Obj
							key={k}
							x={Math.cos(a + drift) * rad + 300}
							y={Math.sin(a + drift) * 310 + fbm(frame / 90 + i, 200 + i) * 10}
							z={-160 + Math.sin(a * 2) * 130}
							rotY={-Math.cos(a) * 15}
							scale={0.82 + app * 0.18}
							opacity={app * 0.94 * alive}
						>
							<div style={{ transform: 'translate(-50%, -50%)' }}>
								<Chip>✓ {k}</Chip>
							</div>
						</Obj>
					);
				})}

				{/* the gauge, rebuilt at hero scale */}
				<Obj
					x={430}
					y={(1 - card) * 60 - 30}
					z={250 + (1 - card) * -520}
					rotY={-13 + card * 5}
					rotX={2}
					opacity={card * alive}
				>
					<Panel width={720} tone="light" pad={44} style={{ marginTop: -240 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
							<div style={{ position: 'relative', width: 210, height: 210, flexShrink: 0 }}>
								<Gauge value={score} size={210} />
								<div
									style={{
										position: 'absolute',
										inset: 0,
										display: 'grid',
										placeItems: 'center'
									}}
								>
									<Odometer value={score} size={74} color={brand.palette.positive} />
								</div>
							</div>
							<div>
								<div
									style={{
										fontFamily: brand.fonts.display,
										fontSize: 38,
										fontWeight: 700,
										color: brand.palette.textOnLight,
										letterSpacing: '-0.025em'
									}}
								>
									ATS compatibility
								</div>
								<div
									style={{
										marginTop: 14,
										display: 'flex',
										gap: 12
									}}
								>
									<Chip size={19}>{Math.round(ramp(frame, [40, 104], [0, 12]))} covered</Chip>
									<Chip size={19} tone="neutral">
										2 to work on
									</Chip>
								</div>
							</div>
						</div>

						{/* the optimiser pulses, then fires */}
						<div
							style={{
								marginTop: 34,
								padding: '20px 0',
								textAlign: 'center',
								borderRadius: brand.radii.control,
								background: brand.palette.ink,
								color: brand.palette.text,
								fontFamily: brand.fonts.body,
								fontSize: 26,
								fontWeight: 600,
								boxShadow: `0 0 0 ${ramp(frame, [168, 196], [0, 18])}px rgba(212,104,46,${ramp(
									frame,
									[196, 220],
									[0.35, 0]
								)})`,
								transform: `scale(${1 - ramp(frame, [180, 188], [0, 0.02]) + ramp(frame, [188, 200], [0, 0.02])})`
							}}
						>
							Optimize the score
						</div>
						<div
							style={{
								marginTop: 14,
								textAlign: 'center',
								fontFamily: brand.fonts.body,
								fontSize: 20,
								color: brand.palette.textOnLightMuted
							}}
						>
							Free · no credit
						</div>
					</Panel>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="left" strength={0.86} extent={44} />

			<Copy
				kicker="Step two"
				title={'A score you can\nactually raise.'}
				body="Every keyword the posting wants, matched against yours — and for each gap, a rewrite that stays true to your experience."
				accent={['raise.']}
				size={66}
				width={700}
				top={140}
				delay={12}
			/>
		</AbsoluteFill>
	);
};
