import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useBrand, alpha, lightVector } from '../brand/brand';
import { fbm } from '../motion/noise';

/**
 * The room the whole film happens in.
 *
 * Mount this ONCE, above every scene, and never again. Scenes move objects
 * through it; they do not each paint their own background. That single rule is
 * what produces the "one continuous shot" feel — the moment a scene draws its
 * own backdrop, every transition becomes a cut, and the film reads as a
 * sequence of slides no matter how good the individual animations are.
 */

export const Stage: React.FC<{
	/**
	 * 0 = the lights are down (titles, the hook, the sign-off).
	 * 1 = the lights are up (product on screen).
	 * Ramp it across the film rather than setting it per scene.
	 */
	lift?: number;
	/** Show the dot grid. Off for pure-type moments. */
	grid?: boolean;
	children?: React.ReactNode;
}> = ({ lift = 0, grid = true, children }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const t = frame / 30;
	const { palette, light } = brand;

	// Two key lights on independent noise paths. Noise rather than sine: a sine
	// pair visibly repeats within about twelve seconds, and once you have seen
	// the loop you cannot unsee it.
	const k1x = 30 + fbm(t * 0.11, 21) * 16;
	const k1y = 28 + fbm(t * 0.09, 22) * 13;
	const k2x = 74 + fbm(t * 0.1, 23) * 15;
	const k2y = 70 + fbm(t * 0.08, 24) * 12;

	const a1 = 0.26 + lift * 0.2;
	const a2 = 0.16 + lift * 0.13;

	// The room breathes. Six thousandths of a scale is invisible as motion and
	// unmistakable as life — a frozen background is the other big tell.
	const breathe = 1 + fbm(t * 0.16, 31) * 0.006;
	const v = lightVector(brand);

	return (
		<AbsoluteFill style={{ backgroundColor: palette.stage }}>
			<AbsoluteFill style={{ transform: `scale(${breathe})` }}>
				<AbsoluteFill
					style={{
						background: [
							`radial-gradient(58% 54% at ${k1x}% ${k1y}%, rgba(${light.warm},${a1}) 0%, rgba(${light.warm},0) 62%)`,
							`radial-gradient(64% 58% at ${k2x}% ${k2y}%, rgba(${light.cool},${a2}) 0%, rgba(${light.cool},0) 60%)`,
							`linear-gradient(${160 + v.x * 12}deg, ${palette.inkDeep} 0%, ${palette.stage} 55%, #000 140%)`
						].join(', ')
					}}
				/>
				{grid ? (
					<AbsoluteFill
						style={{
							opacity: 0.42 + lift * 0.18,
							backgroundImage: `radial-gradient(${alpha(palette.text, 0.1)} 1px, transparent 1px)`,
							backgroundSize: '34px 34px',
							backgroundPosition: `${fbm(t * 0.14, 41) * 10}px ${fbm(t * 0.12, 42) * 10}px`,
							maskImage: 'radial-gradient(72% 62% at 50% 46%, #000 0%, transparent 86%)',
							WebkitMaskImage: 'radial-gradient(72% 62% at 50% 46%, #000 0%, transparent 86%)'
						}}
					/>
				) : null}
			</AbsoluteFill>
			{children}
		</AbsoluteFill>
	);
};

/**
 * A directional shade laid over the set so a text column always has something
 * to sit on. Feathered hard — it must read as the room falling away, never as
 * a visible box.
 */
export const Scrim: React.FC<{
	side?: 'left' | 'right' | 'bottom' | 'top';
	strength?: number;
	/** How far across the frame the shade reaches, in percent. */
	extent?: number;
}> = ({ side = 'left', strength = 0.82, extent = 52 }) => {
	const { palette } = useBrand();
	const stop = (a: number) => alpha(palette.stage, a);
	const angle = { left: 90, right: 270, bottom: 0, top: 180 }[side];
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				background: `linear-gradient(${angle}deg, ${stop(strength)} 0%, ${stop(
					strength * 0.9
				)} ${extent * 0.42}%, ${stop(0)} ${extent}%)`
			}}
		/>
	);
};
