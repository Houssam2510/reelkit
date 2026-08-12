import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	Panel,
	Scrim,
	useCameraRig,
	useSceneClock,
	useBrand,
	springAt,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE CLAIM THE PRODUCT LIVES OR DIES ON.
 *
 * Every AI writing tool says it does not invent. This scene shows the receipt:
 * each edit, the phrase it replaced, and where in your own profile the new one
 * came from. Struck-through original on the left, rewrite on the right,
 * provenance underneath.
 *
 * It is the plainest scene in the film on purpose. A claim about honesty
 * animated with flourishes reads as a claim about animation.
 */

const HANDHELD = { amount: 0.4 };

const SHOTS: readonly Shot[] = [
	{ at: 0, z: -140, rotY: 7, rotX: 3, focus: -260, aperture: 7 },
	{ at: 66, z: 130, rotY: 1, rotX: 0, focus: 60, aperture: 5, ease: 'glide' },
	{ at: 210, z: 240, rotY: -4, focus: 60, ease: 'swap' }
];

const EDITS = [
	{
		was: 'Worked on the front end',
		now: 'Led the React migration of a 40-screen product',
		from: 'Kanope Studio · 2022–2024'
	},
	{
		was: 'Good with databases',
		now: 'Designed the PostgreSQL schema behind 3M daily events',
		from: 'Profile · Skills'
	},
	{
		was: 'Helped junior devs',
		now: 'Mentored four engineers through their first year',
		from: 'Kanope Studio · 2023'
	}
];

export const S6Truth: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, exit } = useSceneClock();

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj x={380} y={30} z={40} rotY={-9} rotX={2} opacity={1 - exit}>
					<Panel width={860} tone="light" pad={38} style={{ marginTop: -230 }}>
						<div
							style={{
								fontFamily: brand.fonts.body,
								fontSize: 18,
								fontWeight: 700,
								letterSpacing: '0.2em',
								textTransform: 'uppercase',
								color: brand.palette.textOnLightMuted,
								paddingBottom: 18,
								marginBottom: 8,
								borderBottom: `1px solid ${brand.palette.lineOnLight}`
							}}
						>
							What was changed
						</div>

						{EDITS.map((e, i) => {
							const a = springAt(frame, fps, 34 + i * 16, 'arrive');
							return (
								<div
									key={e.now}
									style={{
										padding: '18px 0',
										borderBottom:
											i < EDITS.length - 1 ? `1px solid ${brand.palette.surfaceSunk}` : 'none',
										opacity: a,
										transform: `translateY(${(1 - a) * 16}px)`
									}}
								>
									<div
										style={{
											fontFamily: brand.fonts.body,
											fontSize: 21,
											color: brand.palette.textOnLightMuted,
											textDecoration: 'line-through',
											textDecorationColor: brand.palette.accent
										}}
									>
										{e.was}
									</div>
									<div
										style={{
											marginTop: 7,
											fontFamily: brand.fonts.body,
											fontSize: 26,
											fontWeight: 600,
											color: brand.palette.textOnLight
										}}
									>
										{e.now}
									</div>
									<div
										style={{
											marginTop: 8,
											display: 'inline-flex',
											alignItems: 'center',
											gap: 8,
											fontFamily: brand.fonts.mono,
											fontSize: 17,
											color: brand.palette.positive
										}}
									>
										<span
											style={{
												width: 7,
												height: 7,
												borderRadius: 999,
												background: brand.palette.positive
											}}
										/>
										from your profile — {e.from}
									</div>
								</div>
							);
						})}
					</Panel>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="left" strength={0.88} extent={46} />

			<Copy
				kicker="The rule"
				title={'Nothing is invented.\nEver.'}
				body="Every edit is listed for you to read, with the line in your own profile it came from."
				accent={['Ever.']}
				size={68}
				width={720}
				top={230}
				delay={10}
			/>
		</AbsoluteFill>
	);
};
