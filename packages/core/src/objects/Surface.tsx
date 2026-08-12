import React from 'react';
import { useBrand, lightVector } from '../brand/brand';
import { usePlacement } from '../motion/camera';

/**
 * The two things that make a flat rectangle read as a physical object under a
 * light: a highlight that slides as it turns, and a shadow that falls the
 * other way. Both derive from `brand.light.angle` and from how the enclosing
 * `<Obj/>` is rotated, so every object in a shot agrees about where the lamp
 * is. Nothing here is decorative — a composite with inconsistent light is the
 * reason "3D in CSS" usually looks like a collage.
 */

/** A moving specular sheen for the face of an object. */
export const Sheen: React.FC<{ radius?: number; strength?: number }> = ({
	radius = 0,
	strength = 1
}) => {
	const brand = useBrand();
	const { rotY = 0 } = usePlacement();
	const angle = brand.light.angle + rotY * 0.75;
	// Turning away from the light widens and dims the highlight.
	const facing = Math.cos((rotY * Math.PI) / 180);
	const peak = 0.2 * strength * (0.55 + 0.45 * Math.abs(facing));

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: radius,
				pointerEvents: 'none',
				background: `linear-gradient(${angle + 90}deg, rgba(255,255,255,${peak}) 0%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 68%, rgba(255,255,255,${
					peak * 0.4
				}) 100%)`
			}}
		/>
	);
};

/**
 * The shadow the object casts into the room. Rendered as its own blurred plane
 * behind the object rather than as a `box-shadow`, so it can be offset along
 * the light vector and pushed back in z — which is what gives the object air
 * underneath it instead of a dark outline around it.
 */
export const ContactShadow: React.FC<{
	width: number;
	height: number;
	/** 1 = resting on the surface, 3 = floating well above it. */
	lift?: number;
	opacity?: number;
}> = ({ width, height, lift = 1.4, opacity = 0.55 }) => {
	const brand = useBrand();
	const { rotY = 0, rotX = 0 } = usePlacement();
	const v = lightVector(brand);
	const dx = -v.x * 46 * lift + Math.sin((-rotY * Math.PI) / 180) * 40;
	const dy = -v.y * 46 * lift + 34 * lift + Math.sin((rotX * Math.PI) / 180) * 18;
	const blur = 40 * lift;

	return (
		<div
			style={{
				position: 'absolute',
				left: dx - width * 0.06,
				top: dy - height * 0.04,
				width: width * 1.12,
				height: height * 1.08,
				borderRadius: Math.min(width, height) * 0.12,
				background: `rgba(0,0,0,${opacity})`,
				filter: `blur(${blur}px)`,
				transform: `translateZ(-${28 * lift}px)`,
				pointerEvents: 'none'
			}}
		/>
	);
};

/**
 * The edge of a physical panel — a thin lighter rim on the lit side, darker on
 * the other. One pixel of it does more for perceived quality than any amount
 * of shadow.
 */
export const useRimLight = (): string => {
	const brand = useBrand();
	const { rotY = 0 } = usePlacement();
	const angle = brand.light.angle + rotY * 0.75 + 90;
	return `linear-gradient(${angle}deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.25))`;
};
