import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { useBrand } from '../brand/brand';
import { fbm } from '../motion/noise';
import { ContactShadow, Sheen } from './Surface';

/**
 * A printed sheet. Default aspect is A4 at the ratio a 794×1123 CSS-px capture
 * produces, which is what a browser PDF render gives you.
 *
 * The stock underneath is deliberately a shade darker than the print: paper
 * has an edge, and that edge is the only thing telling the viewer this is an
 * object and not a picture of a document.
 */
export const Paper: React.FC<{
	src: string;
	width?: number;
	aspect?: number;
	label?: string;
	shadow?: boolean;
	style?: React.CSSProperties;
}> = ({ src, width = 440, aspect = 1588 / 2246, label, shadow = true, style }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const height = width / aspect;
	const idle = fbm((frame + width) / 100, 71) * 0.5;

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width,
				height,
				marginLeft: -width / 2,
				marginTop: -height / 2,
				transformStyle: 'preserve-3d',
				transform: `rotateY(${idle}deg)`,
				...style
			}}
		>
			{shadow ? <ContactShadow width={width} height={height} lift={1.1} opacity={0.5} /> : null}

			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 6,
					background: '#c9c3ba',
					transform: 'translateZ(-6px)'
				}}
			/>
			<Img
				src={staticFile(src)}
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					objectPosition: 'top',
					borderRadius: 6,
					display: 'block',
					background: '#fff'
				}}
			/>
			<Sheen radius={6} strength={0.8} />

			{label ? (
				<div
					style={{
						position: 'absolute',
						bottom: -46,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: brand.fonts.body,
						fontSize: 20,
						fontWeight: 600,
						letterSpacing: '0.18em',
						textTransform: 'uppercase',
						color: brand.palette.textFaint
					}}
				>
					{label}
				</div>
			) : null}
		</div>
	);
};
