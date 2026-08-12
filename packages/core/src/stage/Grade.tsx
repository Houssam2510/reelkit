import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useBrand } from '../brand/brand';

/**
 * The finishing pass — everything a colourist would do after the edit locks.
 *
 * Mount ONE `<Grade/>` as the last child of the film, above every scene. It is
 * what makes eight separately-built scenes look like one piece of footage:
 * they all end up under the same grain, the same falloff, the same lens.
 */

/**
 * Film grain, pre-rasterised.
 *
 * The obvious implementation — an SVG `feTurbulence` re-seeded every frame —
 * costs 1920×1080 of fractal noise per frame and can, on its own, be more than
 * half of a render's total time. This instead bakes ONE noise tile into a data
 * URI: the browser rasterises it once, caches it as an image, and every
 * subsequent frame only changes `background-position`. Same look, and the
 * grain layer stops showing up in the profile at all.
 *
 * The offsets are hash-derived rather than sequential so the tile never appears
 * to slide in a direction — it has to jitter, or it reads as a moving texture.
 */
const NOISE_TILE = (() => {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
		`<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/>` +
		`<feColorMatrix type="saturate" values="0"/></filter>` +
		`<rect width="240" height="240" filter="url(#n)"/></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

const jitter = (frame: number, seed: number): number => {
	let x = Math.imul(frame + seed * 7919, 0x27d4eb2d);
	x ^= x >>> 15;
	return (x >>> 0) % 240;
};

export const Grain: React.FC<{ opacity?: number }> = ({ opacity }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const o = opacity ?? brand.grade.grain;
	if (o <= 0) return null;
	// Re-jitter every second frame: at 30fps, per-frame grain strobes.
	const step = Math.floor(frame / 2);
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				opacity: o,
				mixBlendMode: 'overlay',
				backgroundImage: NOISE_TILE,
				backgroundRepeat: 'repeat',
				backgroundPosition: `${jitter(step, 1)}px ${jitter(step, 2)}px`
			}}
		/>
	);
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength }) => {
	const brand = useBrand();
	const s = strength ?? brand.grade.vignette;
	if (s <= 0) return null;
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				background: `radial-gradient(122% 92% at 50% 45%, rgba(0,0,0,0) 38%, rgba(0,0,0,${s}) 100%)`
			}}
		/>
	);
};

/**
 * Halation — the soft warm spill real lenses put around bright areas. A cheap
 * approximation (a screen-blended centre lift) but it does the one job that
 * matters: it stops white UI panels from looking cut out and pasted on.
 */
export const Halation: React.FC<{ strength?: number }> = ({ strength }) => {
	const brand = useBrand();
	const s = strength ?? brand.grade.bloom;
	if (s <= 0) return null;
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				mixBlendMode: 'screen',
				opacity: s * 0.14,
				background: `radial-gradient(58% 52% at 50% 46%, rgba(${brand.light.warm},1) 0%, rgba(${brand.light.warm},0) 70%)`
			}}
		/>
	);
};

/**
 * Lateral chromatic aberration at the frame edges. Two-tenths of an opacity
 * point; you should not be able to see it, only miss it when it is gone.
 */
export const Aberration: React.FC<{ strength?: number }> = ({ strength }) => {
	const brand = useBrand();
	const s = strength ?? brand.grade.aberration;
	if (s <= 0) return null;
	return (
		<>
			<AbsoluteFill
				style={{
					pointerEvents: 'none',
					mixBlendMode: 'screen',
					opacity: s * 0.1,
					background:
						'linear-gradient(90deg, rgba(255,60,40,1) 0%, rgba(255,60,40,0) 14%, rgba(255,60,40,0) 100%)'
				}}
			/>
			<AbsoluteFill
				style={{
					pointerEvents: 'none',
					mixBlendMode: 'screen',
					opacity: s * 0.1,
					background:
						'linear-gradient(270deg, rgba(40,180,255,1) 0%, rgba(40,180,255,0) 14%, rgba(40,180,255,0) 100%)'
				}}
			/>
		</>
	);
};

/**
 * Camera motion blur.
 *
 * Applied as a `backdrop-filter` rather than a `filter` on the world, on
 * purpose: a filter on a 3D container flattens every `preserve-3d` inside it,
 * which would collapse the depth of every object exactly during the moves
 * where depth is most visible. A backdrop blurs the already-composited frame
 * and touches nothing.
 *
 * Feed it `cameraSpeed()`. It costs nothing while the camera is at rest,
 * because at zero it renders no element at all.
 */
export const MotionBlur: React.FC<{ amount: number; max?: number }> = ({ amount, max = 7 }) => {
	const px = Math.min(max, amount);
	if (px < 0.35) return null;
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				backdropFilter: `blur(${px.toFixed(2)}px)`,
				WebkitBackdropFilter: `blur(${px.toFixed(2)}px)`
			}}
		/>
	);
};

/** Cinematic bars. Off by default — on a 16:9 product film they usually cost
 *  more vertical room than the mood is worth. */
export const Letterbox: React.FC<{ ratio?: number }> = ({ ratio = 2.39 }) => {
	const barPct = Math.max(0, (1 - 9 / 16 / (1 / ratio)) / 2) * 100;
	if (barPct <= 0.5) return null;
	return (
		<>
			<AbsoluteFill style={{ pointerEvents: 'none' }}>
				<div
					style={{ position: 'absolute', inset: `0 0 ${100 - barPct}% 0`, background: '#000' }}
				/>
				<div
					style={{ position: 'absolute', inset: `${100 - barPct}% 0 0 0`, background: '#000' }}
				/>
			</AbsoluteFill>
		</>
	);
};

export const Grade: React.FC<{
	/** Camera speed in blur px — see `cameraSpeed()`. */
	motionBlur?: number;
	letterbox?: number;
	children?: React.ReactNode;
}> = ({ motionBlur = 0, letterbox, children }) => (
	<>
		{motionBlur > 0 ? <MotionBlur amount={motionBlur} /> : null}
		<Halation />
		<Aberration />
		<Vignette />
		<Grain />
		{letterbox ? <Letterbox ratio={letterbox} /> : null}
		{children}
	</>
);
