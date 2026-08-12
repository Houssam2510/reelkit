import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useBrand, ramp, springAt, fbm } from 'reelkit';

/**
 * The Carriv mark, rebuilt from `logo.svg` as vectors rather than imported as
 * an image — so it can draw itself.
 *
 * An open "C" opening onto three ascending bars. The arcs are stroked in, then
 * the bars rise in sequence: the mark performs the promise instead of stating
 * it. Worth the extra thirty lines exactly once per film, in the first shot
 * and the last.
 */
export const LogoMark: React.FC<{ size?: number; delay?: number }> = ({
	size = 220,
	delay = 0
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - delay;

	const outer = ramp(f, [0, 34], [0, 1], 'glide');
	const inner = ramp(f, [6, 42], [0, 1], 'glide');
	const LEN = 2400;

	return (
		<svg width={size} height={size} viewBox="0 0 1024 1024" style={{ overflow: 'visible' }}>
			<g fill="none" stroke={brand.palette.text} strokeLinecap="round">
				<path
					d="M723 268 A370 370 0 1 0 693 748"
					strokeWidth={70}
					strokeDasharray={LEN}
					strokeDashoffset={LEN * (1 - outer)}
				/>
				<path
					d="M650 330 A270 270 0 1 0 603 706"
					strokeWidth={60}
					opacity={0.55 * inner}
					strokeDasharray={LEN}
					strokeDashoffset={LEN * (1 - inner)}
				/>
			</g>
			<g fill={brand.palette.accent}>
				{[
					{ x: 650, y: 540, h: 145, o: 0.7, d: 20 },
					{ x: 735, y: 455, h: 210, o: 0.85, d: 26 },
					{ x: 820, y: 360, h: 270, o: 1, d: 32 }
				].map((b, i) => {
					const g = springAt(f, fps, b.d, 'pop');
					return (
						<rect
							key={i}
							x={b.x}
							y={b.y + b.h * (1 - g)}
							width={44}
							height={b.h * g}
							rx={22}
							opacity={b.o * Math.min(1, g * 1.6)}
						/>
					);
				})}
			</g>
		</svg>
	);
};

/** Mark plus wordmark, turning gently into place. */
export const Lockup: React.FC<{ size?: number; delay?: number; word?: boolean }> = ({
	size = 190,
	delay = 0,
	word = true
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const f = frame - delay;
	const settle = springAt(f, fps, 0, 'settle');
	const wordIn = springAt(f, fps, 26, 'arrive');
	const drift = fbm(frame / 110, 91) * 2.2;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: size * 0.24,
				transformStyle: 'preserve-3d',
				transform:
					`rotateY(${(1 - settle) * -50 + drift}deg) rotateX(${(1 - settle) * 9}deg) ` +
					`translateZ(${settle * 40}px) scale(${0.87 + settle * 0.13})`
			}}
		>
			<LogoMark size={size} delay={delay + 2} />
			{word ? (
				<div
					style={{
						fontFamily: brand.fonts.display,
						fontWeight: 700,
						fontSize: size * 0.72,
						letterSpacing: '-0.035em',
						color: brand.palette.text,
						opacity: wordIn,
						transform: `translateX(${(1 - wordIn) * -26}px)`
					}}
				>
					Carriv
				</div>
			) : null}
		</div>
	);
};
