import React, { createContext, useContext } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { track, type CurveName, type Key } from './curves';
import { fbm } from './noise';
import { MotionBlur } from '../stage/Grade';

/**
 * ONE camera for the whole film.
 *
 * This is the single decision that separates a product film from a slide deck.
 * Scenes do not each invent their own perspective and their own transforms;
 * they place objects at coordinates in a shared world, and a camera moves
 * through it. Everything else — depth of field, the direction a highlight
 * slides, how much a background object lags — falls out of that for free.
 *
 * Coordinates are screen pixels at the origin plane. +x right, +y down,
 * +z toward the viewer. The camera sits at z = 0 looking down -z, so an object
 * at z = -800 is 800px "into" the screen.
 */

export type Camera = {
	/** Position. Moving the camera +x pans the world -x, as you would expect. */
	x: number;
	y: number;
	/** Dolly. Positive pushes the camera IN (the world comes toward you). */
	z: number;
	/** Orientation, degrees. */
	rotX: number;
	rotY: number;
	rotZ: number;
	/** Optical zoom, applied after the move. 1 = neutral. */
	zoom: number;
	/** Perspective distance. Low = wide/dramatic lens, high = long/flat lens. */
	lens: number;
	/** The world-z plane that is sharp. */
	focus: number;
	/**
	 * Blur in px accumulated per 1000px away from the focus plane. 0 disables
	 * depth of field entirely (and keeps every object's internal 3D intact).
	 */
	aperture: number;
	/** Ceiling on depth-of-field blur, so a far object never turns to soup. */
	maxBlur: number;
};

export const NEUTRAL_CAMERA: Camera = {
	x: 0,
	y: 0,
	z: 0,
	rotX: 0,
	rotY: 0,
	rotZ: 0,
	zoom: 1,
	lens: 2200,
	focus: 0,
	aperture: 5,
	maxBlur: 14
};

/** A keyframe on the camera. Any subset of channels; the rest are inherited. */
export type Shot = Partial<Camera> & { at: number; ease?: CurveName };

const CHANNELS = [
	'x',
	'y',
	'z',
	'rotX',
	'rotY',
	'rotZ',
	'zoom',
	'lens',
	'focus',
	'aperture',
	'maxBlur'
] as const;

type Channel = (typeof CHANNELS)[number];

const channelKeys = (shots: readonly Shot[], c: Channel): Key[] => {
	const keys: Key[] = [];
	for (const s of shots) {
		const v = s[c];
		if (typeof v === 'number') keys.push({ at: s.at, v, ease: s.ease });
	}
	return keys;
};

export type HandheldConfig = {
	/** 0 = locked off on a tripod. 1 = a steady operator. 3 = documentary. */
	amount?: number;
	/** Cycles per second of the underlying noise. Lower = lazier. */
	rate?: number;
};

/**
 * Resolve the camera for the current frame.
 *
 * Handheld is added on top of the keyframes, never baked into them, so you can
 * dial it to 0 for a locked-off product shot without rewriting the move.
 */
export const useCameraRig = (shots: readonly Shot[], handheld: HandheldConfig = {}): Camera => {
	const frame = useCurrentFrame();
	return resolveCamera(frame, shots, handheld);
};

export const resolveCamera = (
	frame: number,
	shots: readonly Shot[],
	handheld: HandheldConfig = {}
): Camera => {
	const cam: Camera = { ...NEUTRAL_CAMERA };
	for (const c of CHANNELS) {
		const keys = channelKeys(shots, c);
		if (keys.length > 0) cam[c] = track(frame, keys);
	}

	const { amount = 0, rate = 0.35 } = handheld;
	if (amount > 0) {
		const t = frame * rate * 0.05;
		cam.x += fbm(t, 1) * 9 * amount;
		cam.y += fbm(t, 4) * 6 * amount;
		cam.rotY += fbm(t * 0.8, 7) * 0.5 * amount;
		cam.rotX += fbm(t * 0.7, 11) * 0.35 * amount;
		cam.rotZ += fbm(t * 0.5, 15) * 0.22 * amount;
	}
	return cam;
};

/**
 * How fast the camera is travelling, in "blur px". Feed it to `<Grade
 * motionBlur>` — a whip pan that stays razor sharp is the most common tell
 * that a 3D scene was assembled rather than filmed.
 */
export const cameraSpeed = (
	frame: number,
	shots: readonly Shot[],
	handheld: HandheldConfig = {}
): number => {
	const a = resolveCamera(frame - 1, shots, handheld);
	const b = resolveCamera(frame, shots, handheld);
	const linear = Math.hypot(b.x - a.x, b.y - a.y, (b.z - a.z) * 0.5);
	const angular = Math.hypot(b.rotY - a.rotY, b.rotX - a.rotX) * 26;
	return (linear + angular) / 34;
};

const CameraContext = createContext<Camera>(NEUTRAL_CAMERA);
export const useCamera = (): Camera => useContext(CameraContext);

/**
 * Drop this inside a scene, after its `<World/>`, to blur the frame in
 * proportion to how fast the camera is travelling. A whip pan that stays razor
 * sharp is the loudest tell that a shot was assembled rather than filmed.
 */
export const CameraBlur: React.FC<{
	shots: readonly Shot[];
	handheld?: HandheldConfig;
	/** Scale the effect. 0 disables it. */
	amount?: number;
}> = ({ shots, handheld, amount = 1 }) => {
	const frame = useCurrentFrame();
	return <MotionBlur amount={cameraSpeed(frame, shots, handheld) * amount} />;
};

const cameraTransform = (c: Camera): string =>
	[
		`scale(${c.zoom})`,
		`translateZ(${c.z}px)`,
		`rotateX(${-c.rotX}deg)`,
		`rotateY(${-c.rotY}deg)`,
		`rotateZ(${-c.rotZ}deg)`,
		`translate3d(${-c.x}px, ${-c.y}px, 0)`
	].join(' ');

/**
 * The world. Mount ONE of these per scene (or one for the whole film) and put
 * every 3D object inside it. The camera transform is applied here, once.
 */
export const World: React.FC<{
	camera: Camera;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({ camera, children, style }) => (
	<CameraContext.Provider value={camera}>
		<AbsoluteFill
			style={{
				perspective: camera.lens,
				perspectiveOrigin: '50% 50%',
				transformStyle: 'preserve-3d',
				...style
			}}
		>
			<AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: cameraTransform(camera) }}>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	</CameraContext.Provider>
);

export type Placement = {
	x?: number;
	y?: number;
	z?: number;
	rotX?: number;
	rotY?: number;
	rotZ?: number;
	scale?: number;
	opacity?: number;
};

/**
 * How the nearest `<Obj/>` is turned. Objects read this to angle their own
 * highlights and shadows, so a panel lit from the left stays lit from the left
 * as it rotates — which is the whole reason a CSS-3D composite reads as an
 * object rather than a sticker.
 */
const PlacementContext = createContext<Placement>({});
export const usePlacement = (): Placement => useContext(PlacementContext);

export const placementTransform = (p: Placement): string =>
	[
		`translate3d(${p.x ?? 0}px, ${p.y ?? 0}px, ${p.z ?? 0}px)`,
		`rotateX(${p.rotX ?? 0}deg)`,
		`rotateY(${p.rotY ?? 0}deg)`,
		`rotateZ(${p.rotZ ?? 0}deg)`,
		`scale(${p.scale ?? 1})`
	].join(' ');

/** Depth-of-field blur for an object sitting at world-z `z`. */
export const defocus = (camera: Camera, z: number): number => {
	if (camera.aperture <= 0) return 0;
	const d = Math.abs(z - camera.focus);
	return Math.min(camera.maxBlur, (d / 1000) * camera.aperture);
};

/**
 * An object in the world. Centred on the origin by default, so a `<Obj/>` with
 * no props sits dead centre facing the camera.
 *
 * Depth of field is applied only when it is actually visible (> 0.15px).
 * Below that the `filter` is omitted entirely, because a CSS filter flattens
 * the 3D context of everything inside it — and the sharp object in the
 * foreground is exactly the one whose internal depth you want to keep.
 */
export const Obj: React.FC<
	Placement & {
		children: React.ReactNode;
		/** Set false on an object that must keep its internal 3D even when soft. */
		dof?: boolean;
		style?: React.CSSProperties;
	}
> = ({ children, dof = true, style, ...p }) => {
	const camera = useCamera();
	const blur = dof ? defocus(camera, p.z ?? 0) : 0;
	return (
		<PlacementContext.Provider value={p}>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: '50%',
					transformStyle: 'preserve-3d',
					transform: placementTransform(p),
					opacity: p.opacity ?? 1,
					filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined,
					...style
				}}
			>
				{children}
			</div>
		</PlacementContext.Provider>
	);
};
