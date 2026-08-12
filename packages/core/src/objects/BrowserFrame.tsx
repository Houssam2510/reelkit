import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { useBrand, alpha } from '../brand/brand';
import { fbm } from '../motion/noise';
import { ContactShadow, Sheen } from './Surface';

/**
 * A browser window holding a real screenshot.
 *
 * Place it with `<Obj>`; this component only knows how to *be* a window. It
 * has a title bar, a body with visible thickness behind the face, a rim light
 * and a cast shadow, so it survives being turned in space.
 *
 * `reveal` crops the screenshot from the top — a full-height 16:10 capture at
 * a useful size is taller than the frame, and showing the top 60 % of a page
 * is what a viewer reads as "the app" anyway.
 */
export const BrowserFrame: React.FC<{
	/** Path inside `public/`, as you would pass to `staticFile()`. */
	src: string;
	width?: number;
	/** Aspect of the SOURCE capture, width / height. */
	aspect?: number;
	/** Fraction of the capture height to show. 1 = the whole thing. */
	reveal?: number;
	url?: string;
	/** Pan the capture inside the window, 0 → 1 of the hidden overflow. */
	scrollY?: number;
	shadow?: boolean;
	style?: React.CSSProperties;
}> = ({
	src,
	width = 1240,
	aspect = 1.6,
	reveal = 0.62,
	url = '',
	scrollY = 0,
	shadow = true,
	style
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const fullH = width / aspect;
	const bodyH = fullH * reveal;
	const barH = Math.round(width * 0.042);
	const totalH = bodyH + barH;

	// Nothing in a shot is ever perfectly still.
	const idle = fbm(frame / 90, 61) * 0.4;

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width,
				marginLeft: -width / 2,
				marginTop: -totalH / 2,
				transformStyle: 'preserve-3d',
				transform: `rotateY(${idle}deg)`,
				...style
			}}
		>
			{shadow ? <ContactShadow width={width} height={totalH} lift={1.6} /> : null}

			{/* the body of the machine, sitting behind the face */}
			<div
				style={{
					position: 'absolute',
					inset: -3,
					borderRadius: brand.radii.panel + 4,
					background: `linear-gradient(180deg, ${brand.palette.ink}, ${brand.palette.stage})`,
					transform: 'translateZ(-14px)'
				}}
			/>

			<div
				style={{
					position: 'relative',
					borderRadius: brand.radii.panel,
					overflow: 'hidden',
					background: brand.palette.ink,
					border: `1px solid ${brand.palette.line}`,
					boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)'
				}}
			>
				<div
					style={{
						height: barH,
						display: 'flex',
						alignItems: 'center',
						gap: barH * 0.22,
						padding: `0 ${barH * 0.5}px`,
						background: `linear-gradient(180deg, ${brand.palette.inkDeep}, ${brand.palette.ink})`,
						borderBottom: `1px solid ${brand.palette.line}`
					}}
				>
					{[0.45, 0.32, 0.22].map((o, i) => (
						<span
							key={i}
							style={{
								width: barH * 0.2,
								height: barH * 0.2,
								borderRadius: 999,
								background: alpha(brand.palette.text, o),
								display: 'block'
							}}
						/>
					))}
					{url ? (
						<div
							style={{
								margin: '0 auto',
								padding: `${barH * 0.12}px ${barH * 0.6}px`,
								borderRadius: 999,
								background: 'rgba(0,0,0,0.35)',
								color: brand.palette.textFaint,
								fontFamily: brand.fonts.body,
								fontSize: barH * 0.36
							}}
						>
							{url}
						</div>
					) : null}
				</div>

				<div
					style={{
						height: bodyH,
						overflow: 'hidden',
						position: 'relative',
						background: brand.palette.surfaceSunk
					}}
				>
					<Img
						src={staticFile(src)}
						style={{
							width: '100%',
							display: 'block',
							transform: `translateY(${-scrollY * (fullH - bodyH)}px)`
						}}
					/>
					<Sheen />
				</div>
			</div>
		</div>
	);
};
