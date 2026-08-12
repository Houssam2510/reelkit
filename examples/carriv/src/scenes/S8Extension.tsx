import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
	World,
	Obj,
	CameraBlur,
	BrowserFrame,
	Pill,
	Scrim,
	useCameraRig,
	useSceneClock,
	springAt,
	type Shot
} from 'reelkit';
import { Copy } from './lib';

/**
 * THE EXTENSION.
 *
 * Five and a half seconds, one idea: you never left the job page. The camera
 * pushes past the browser chrome to the corner where the extension lives —
 * a physical move toward the thing being described, which is worth more than
 * any callout arrow.
 */

const HANDHELD = { amount: 0.7 };

const SHOTS: readonly Shot[] = [
	{ at: 0, x: 0, y: 0, z: -220, rotY: -10, rotX: 3, focus: -300, aperture: 7 },
	{ at: 70, x: 150, y: -40, z: 240, rotY: -3, rotX: 1, focus: -40, aperture: 5, ease: 'glide' },
	{ at: 165, x: 240, y: -60, z: 430, rotY: 3, focus: 0, ease: 'swap' }
];

export const S8Extension: React.FC = () => {
	const camera = useCameraRig(SHOTS, HANDHELD);
	const { frame, fps, enter, exit } = useSceneClock({ outDur: 18 });
	const pop = springAt(frame, fps, 30, 'pop');

	return (
		<AbsoluteFill>
			<World camera={camera}>
				<Obj
					x={-40}
					y={90}
					z={-320 + (1 - enter) * -320}
					rotY={12 - enter * 6}
					rotX={3}
					opacity={enter * (1 - exit)}
				>
					<BrowserFrame
						src="screens/en/04-extension-callout.png"
						url="carriv.com/app"
						width={1280}
						reveal={0.62}
					/>
				</Obj>

				{/* A detail of the same screen, cropped hard to the extension card and
				    brought forward. Two full screenshots of the same page side by side
				    read as a mistake; a crop reads as a camera moving closer. */}
				<Obj
					x={480}
					y={-250}
					z={250 + (1 - pop) * -280}
					rotY={-12 + pop * 4}
					rotX={2}
					scale={0.9 + pop * 0.1}
					opacity={pop * (1 - exit)}
				>
					<BrowserFrame
						src="screens/en/04b-extension-hover.png"
						width={660}
						reveal={0.4}
						scrollY={0.48}
						url=""
					/>
				</Obj>
			</World>

			<CameraBlur shots={SHOTS} handheld={HANDHELD} />
			<Scrim side="left" strength={0.84} extent={42} />

			<Copy
				kicker="Chrome extension"
				title={'Tailor from\nthe job page.'}
				accent={['job', 'page.']}
				size={62}
				width={640}
				top={260}
				delay={8}
			/>

			<AbsoluteFill
				style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0 0 140px 118px' }}
			>
				<Pill delay={60} exitAt={140}>
					Add to Chrome — free
				</Pill>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
