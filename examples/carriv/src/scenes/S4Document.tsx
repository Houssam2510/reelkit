import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	Paper,
	Panel,
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
 * THE DOCUMENT — the argument of the whole film, made once, visually.
 *
 * A scan line runs down the résumé and, as it crosses each section, the parser
 * on the right fills in the field it has just read. Single column, no tables,
 * no graphics: a machine reads it top to bottom without losing anything. The
 * caliper on the left carries the other promise without a word — one page.
 *
 * This scene replaced a template gallery. A gallery shows that the product has
 * options; this shows that the product is right. Only one of those is worth
 * thirteen seconds.
 */

const HANDHELD = { amount: 0.45 };

/**
 * The camera racks focus from the sheet to the parser at the moment the parser
 * starts producing fields, and back to the sheet for the verdict.
 */
const SHOTS: readonly Shot[] = [
	{ at: 0, x: -140, z: -240, rotY: -9, rotX: 4, focus: -80, aperture: 8 },
	{ at: 70, x: 40, z: 60, rotY: 2, rotX: 1, focus: 140, aperture: 6, ease: 'glide' },
	{ at: 300, x: 40, z: 100, rotY: 3, focus: 140, aperture: 6 },
	{ at: 360, x: -110, z: 190, rotY: -3, focus: -60, aperture: 7, ease: 'swap' },
	{ at: 405, x: -150, z: 320, rotY: -6, focus: -60, ease: 'swap' }
];

/** Where each field sits down the page (0 = top) and what the parser recovers. */
const FIELDS = [
	{ at: 0.06, key: 'name', value: 'Camille Moreau' },
	{ at: 0.22, key: 'title', value: 'Senior Full-Stack Engineer' },
	{ at: 0.3, key: 'company', value: 'Kanope Studio' },
	{ at: 0.38, key: 'dates', value: '2022-03 → present' },
	{ at: 0.62, key: 'skills', value: 'TypeScript · React · Node.js' },
	{ at: 0.78, key: 'education', value: 'B.Eng. Software Engineering' }
];

const SCAN_FROM = 56;
const SCAN_TO = 292;
const PAPER_W = 352;
const PAPER_H = PAPER_W * (2246 / 1588);

export const S4Document: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, enter, exit } = useSceneClock({ outDur: 26 });

	const scan = ramp(frame, [SCAN_FROM, SCAN_TO], [0, 1], 'linear');
	const scanning = frame > SCAN_FROM && frame < SCAN_TO + 6;
	const verdict = springAt(frame, fps, SCAN_TO + 10, 'pop');
	const alive = Math.min(1, enter * 1.5) * (1 - exit);

	return (
		<AbsoluteFill>
			<World camera={camera}>
				{/* the sheet */}
				<Obj
					x={-430}
					y={120}
					z={-40 + (1 - enter) * -820}
					rotY={11 - enter * 4}
					rotX={2}
					opacity={alive}
				>
					<Paper src="screens/en/cv-classic.png" width={PAPER_W} />

					{scanning ? (
						<div
							style={{
								position: 'absolute',
								left: -PAPER_W * 0.54,
								top: -PAPER_H / 2 + scan * PAPER_H,
								width: PAPER_W * 1.08,
								height: 3,
								transform: 'translateZ(24px)',
								background: `linear-gradient(90deg, transparent 0%, ${brand.palette.accent} 18%, #ffd7bd 50%, ${brand.palette.accent} 82%, transparent 100%)`,
								boxShadow: `0 0 26px 6px rgba(212,104,46,0.55)`,
								borderRadius: 2
							}}
						/>
					) : null}

					{/* the caliper: one page, stated by measurement rather than by claim */}
					<div
						style={{
							position: 'absolute',
							left: -PAPER_W / 2 - 100,
							top: -PAPER_H / 2,
							width: 76,
							height: PAPER_H,
							transform: 'translateZ(8px)',
							opacity: ramp(frame, [30, 58])
						}}
					>
						{[0, PAPER_H - 2].map((top, i) => (
							<div
								key={i}
								style={{
									position: 'absolute',
									top,
									right: 0,
									width: 48,
									height: 2,
									background: brand.palette.textFaint,
									opacity: 0.85
								}}
							/>
						))}
						<div
							style={{
								position: 'absolute',
								top: 0,
								right: 23,
								width: 2,
								height: `${ramp(frame, [34, 68], [0, 100])}%`,
								background: brand.palette.textFaint,
								opacity: 0.85
							}}
						/>
						<div
							style={{
								position: 'absolute',
								top: '50%',
								right: 38,
								transform: 'translateY(-50%) rotate(-90deg)',
								transformOrigin: 'right center',
								fontFamily: brand.fonts.body,
								fontSize: 21,
								fontWeight: 600,
								letterSpacing: '0.2em',
								textTransform: 'uppercase',
								color: brand.palette.textFaint,
								whiteSpace: 'nowrap'
							}}
						>
							1 page
						</div>
					</div>
				</Obj>

				{/* the parser — machinery, so a dark surface */}
				<Obj
					x={360}
					y={80}
					z={150 + (1 - enter) * -420}
					rotY={-12 + enter * 3}
					rotX={2}
					opacity={alive}
				>
					<Panel width={680} tone="dark" pad={32} style={{ marginTop: -300 }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								paddingBottom: 18,
								marginBottom: 18,
								borderBottom: `1px solid ${brand.palette.line}`
							}}
						>
							<span
								style={{
									fontFamily: brand.fonts.body,
									fontSize: 19,
									fontWeight: 600,
									letterSpacing: '0.2em',
									textTransform: 'uppercase',
									color: brand.palette.textFaint
								}}
							>
								Applicant tracking system
							</span>
							<span
								style={{
									fontFamily: brand.fonts.mono,
									fontSize: 18,
									color: scanning ? brand.palette.accent : brand.palette.textFaint
								}}
							>
								{scanning ? 'parsing…' : frame > SCAN_TO ? 'done' : 'ready'}
							</span>
						</div>

						{FIELDS.map((f) => {
							const at = SCAN_FROM + f.at * (SCAN_TO - SCAN_FROM);
							const a = springAt(frame, fps, at, 'arrive');
							return (
								<div
									key={f.key}
									style={{
										display: 'flex',
										alignItems: 'baseline',
										gap: 18,
										marginBottom: 15,
										opacity: a,
										transform: `translateX(${(1 - a) * -22}px)`
									}}
								>
									<span
										style={{
											fontFamily: brand.fonts.mono,
											fontSize: 20,
											color: brand.palette.textMuted,
											minWidth: 148
										}}
									>
										{f.key}
									</span>
									<span
										style={{
											fontFamily: brand.fonts.body,
											fontSize: 25,
											fontWeight: 600,
											color: brand.palette.text
										}}
									>
										{f.value}
									</span>
									<span
										style={{ marginLeft: 'auto', color: brand.palette.positiveSoft, fontSize: 22 }}
									>
										✓
									</span>
								</div>
							);
						})}

						<div
							style={{
								marginTop: 22,
								paddingTop: 20,
								borderTop: `1px solid ${brand.palette.line}`,
								display: 'flex',
								alignItems: 'center',
								gap: 14,
								opacity: verdict,
								transform: `scale(${0.94 + verdict * 0.06})`
							}}
						>
							<span
								style={{
									padding: '8px 18px',
									borderRadius: 999,
									background: 'rgba(76,122,63,0.22)',
									border: `1px solid ${brand.palette.positive}`,
									color: brand.palette.positiveSoft,
									fontFamily: brand.fonts.body,
									fontSize: 22,
									fontWeight: 600
								}}
							>
								Parsed — 0 errors
							</span>
							<span
								style={{
									fontFamily: brand.fonts.body,
									fontSize: 20,
									color: brand.palette.textFaint
								}}
							>
								every field recovered
							</span>
						</div>
					</Panel>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="bottom" strength={0.9} extent={32} />

			<Copy
				kicker="The document"
				title={'Typeset like LaTeX.\nRead like data.'}
				body="Single column, no tables, no graphics — the exact layout the systems large companies run can actually parse. And always one page."
				accent={['data.']}
				size={62}
				width={1500}
				bodyWidth={1180}
				top={78}
				delay={12}
			/>
		</AbsoluteFill>
	);
};
