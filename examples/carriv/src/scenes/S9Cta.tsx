import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	Headline,
	Body,
	Rule,
	Chip,
	useBrand,
	useCameraRig,
	useSceneClock,
	ramp,
	springAt,
	type Shot
} from 'reelkit';
import { Lockup } from '../Logo';

/**
 * THE SIGN-OFF.
 *
 * The four promises fly past the camera and out of frame — the recap happens
 * in the viewer's peripheral vision, not as a bullet list — and the room goes
 * dark around the mark. The last thing on screen is the offer and the URL,
 * held still for two full seconds.
 *
 * Every product film ends by asking for something. The only mistake available
 * here is to ask quietly.
 */

const HANDHELD = { amount: 0.35 };

const SHOTS: readonly Shot[] = [
	{ at: 0, z: -420, rotY: 9, rotX: 3, focus: -700, aperture: 8 },
	{ at: 84, z: 40, rotY: 0, rotX: 0, focus: 0, aperture: 4, ease: 'glide' },
	{ at: 240, z: 90, rotY: -2, focus: 0, aperture: 3 }
];

const RECAP = [
	'One page, ATS-parsed',
	'A score you can raise',
	'Nothing invented',
	'Every application tracked'
];

export const S9Cta: React.FC = () => {
	const brand = useBrand();
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps } = useSceneClock({ outDur: 1 });

	const lockup = springAt(frame, fps, 46, 'settle');

	return (
		<AbsoluteFill>
			<World camera={camera}>
				{/* the recap, travelling toward and past the camera */}
				{RECAP.map((r, i) => {
					const t = ramp(frame, [i * 9, 74 + i * 9], [0, 1], 'linear');
					const side = i % 2 === 0 ? -1 : 1;
					return (
						<Obj
							key={r}
							x={side * (300 + i * 40) * (0.4 + t * 1.9)}
							y={(i - 1.5) * 190 * (0.5 + t * 1.4)}
							z={-1500 + t * 2400}
							rotY={-side * 16}
							opacity={Math.min(1, t * 5) * (1 - ramp(frame, [64 + i * 9, 86 + i * 9]))}
						>
							<div style={{ transform: 'translate(-50%, -50%)' }}>
								<Chip tone="neutral" size={24}>
									{r}
								</Chip>
							</div>
						</Obj>
					);
				})}

				<Obj x={0} y={-90} z={60} opacity={lockup}>
					<div style={{ transform: 'translate(-50%, -50%)' }}>
						<Lockup size={132} delay={46} />
					</div>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />

			<AbsoluteFill
				style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 250, gap: 26 }}
			>
				<Headline delay={82} size={64} accent={['free.']} style={{ justifyContent: 'center' }}>
					{'Three applications, free.'}
				</Headline>
				<Rule delay={100} width={220} />
				<Body delay={104} size={30} width={900} style={{ textAlign: 'center' }}>
					No card required.
				</Body>
				<div
					style={{
						marginTop: 14,
						fontFamily: brand.fonts.display,
						fontSize: 46,
						fontWeight: 700,
						letterSpacing: '-0.02em',
						color: brand.palette.accent,
						opacity: ramp(frame, [118, 142])
					}}
				>
					carriv.com
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
