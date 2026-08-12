import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	BrowserFrame,
	Scrim,
	useBrand,
	useCameraRig,
	useSceneClock,
	springAt,
	fbm,
	alpha,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE TRACKER.
 *
 * The six statuses lift out of the list and arrange themselves into the arc
 * they describe — draft through offer. The screen stays underneath, in focus
 * long enough to be believed, then softens as the statuses come forward.
 */

const HANDHELD = { amount: 0.6 };

const SHOTS: readonly Shot[] = [
	{ at: 0, x: -60, z: -260, rotY: 10, rotX: 4, focus: -300, aperture: 7 },
	{ at: 72, x: 60, z: 90, rotY: 2, rotX: 1, focus: -80, aperture: 6, ease: 'glide' },
	{ at: 150, x: 90, z: 150, rotY: -1, focus: 200, aperture: 8, ease: 'swap' },
	{ at: 240, x: 140, z: 300, rotY: -6, focus: 220, ease: 'swap' }
];

const STATUSES = [
	{ label: 'Draft', tone: 'muted' },
	{ label: 'Applied', tone: 'accent' },
	{ label: 'Screening', tone: 'accent' },
	{ label: 'Interview', tone: 'accent' },
	{ label: 'Offer', tone: 'positive' },
	{ label: 'Closed', tone: 'muted' }
] as const;

export const S7Tracker: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, enter, exit } = useSceneClock();

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj
					x={310}
					y={210}
					z={-420 + (1 - enter) * -420}
					rotY={16 - enter * 6}
					rotX={4}
					opacity={enter * (1 - exit)}
				>
					<BrowserFrame
						src="screens/en/06-applications-list.png"
						url="carriv.com/app/applications"
						width={1240}
						reveal={0.6}
					/>
				</Obj>

				{/* the six statuses, lifting out along an arc */}
				{STATUSES.map((s, i) => {
					const a = springAt(frame, fps, 58 + i * 7, 'settle');
					const spread = (i - (STATUSES.length - 1) / 2) / ((STATUSES.length - 1) / 2);
					const color =
						s.tone === 'positive'
							? brand.palette.positive
							: s.tone === 'accent'
								? brand.palette.accent
								: brand.palette.textFaint;

					return (
						<Obj
							key={s.label}
							x={430 + spread * 360}
							// the arc: the middle of the run sits highest
							y={-250 - (1 - spread * spread) * 100 + fbm(frame / 100 + i, 300 + i) * 8}
							z={(200 + Math.abs(spread) * -120) * a + (1 - a) * -420}
							rotY={-spread * 15}
							scale={0.86 + a * 0.14}
							opacity={a * (1 - exit)}
						>
							<div
								style={{
									transform: 'translate(-50%, -50%)',
									display: 'inline-flex',
									alignItems: 'center',
									gap: 12,
									padding: '15px 26px',
									borderRadius: 999,
									whiteSpace: 'nowrap',
									background: brand.palette.surface,
									color: brand.palette.textOnLight,
									border: `1px solid ${alpha(color, 0.4)}`,
									boxShadow: `0 20px 46px rgba(0,0,0,0.4)`,
									fontFamily: brand.fonts.body,
									fontSize: 24,
									fontWeight: 600
								}}
							>
								<span style={{ width: 11, height: 11, borderRadius: 999, background: color }} />
								{s.label}
							</div>
						</Obj>
					);
				})}
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			{/* The applications list is the brightest screenshot in the film. Without
			    a left scrim the white headline sits straight on top of white UI and
			    half of it disappears. */}
			<Scrim side="left" strength={0.9} extent={48} />
			<Scrim side="bottom" strength={0.7} extent={26} />

			<Copy
				kicker="After you send it"
				title={'Every application,\nin one place.'}
				body="Draft, applied, interview, offer — with your own notes beside each one."
				accent={['one', 'place.']}
				size={62}
				width={720}
				bodyWidth={600}
				top={420}
				delay={12}
			/>
		</AbsoluteFill>
	);
};
