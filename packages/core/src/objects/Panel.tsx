import React from 'react';
import { useBrand, alpha } from '../brand/brand';
import { ContactShadow, Sheen } from './Surface';

/**
 * A free-floating card. Use it to lift a piece of product UI out of a
 * screenshot and rebuild it at hero scale — a real component the camera can
 * get close to, rather than a magnified crop of a PNG.
 *
 * `tone="light"` is a product surface (a card in the app). `tone="dark"` is a
 * system surface (a terminal, a parser, a log) and reads as machinery.
 */
export const Panel: React.FC<{
	children: React.ReactNode;
	width: number;
	tone?: 'light' | 'dark';
	pad?: number;
	shadow?: boolean;
	style?: React.CSSProperties;
}> = ({ children, width, tone = 'light', pad = 34, shadow = true, style }) => {
	const brand = useBrand();
	const light = tone === 'light';

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width,
				marginLeft: -width / 2,
				transformStyle: 'preserve-3d'
			}}
		>
			{shadow ? <ContactShadow width={width} height={width * 0.6} lift={1.5} /> : null}
			<div
				style={{
					position: 'relative',
					width,
					background: light
						? brand.palette.surface
						: `linear-gradient(160deg, ${brand.palette.ink}, ${brand.palette.stage})`,
					color: light ? brand.palette.textOnLight : brand.palette.text,
					border: `1px solid ${light ? brand.palette.lineOnLight : brand.palette.line}`,
					borderRadius: brand.radii.panel,
					padding: pad,
					boxShadow: light
						? 'inset 0 1px 0 rgba(255,255,255,0.8)'
						: `inset 0 1px 0 ${alpha(brand.palette.text, 0.08)}`,
					overflow: 'hidden',
					...style
				}}
			>
				{children}
				<Sheen radius={brand.radii.panel} strength={light ? 0.5 : 0.8} />
			</div>
		</div>
	);
};

/** A small labelled chip — matched keyword, status, tag. */
export const Chip: React.FC<{
	children: React.ReactNode;
	tone?: 'accent' | 'positive' | 'neutral';
	size?: number;
	style?: React.CSSProperties;
}> = ({ children, tone = 'positive', size = 21, style }) => {
	const brand = useBrand();
	const c = {
		accent: { fg: brand.palette.accentDeep, bg: brand.palette.accentSoft },
		positive: { fg: brand.palette.positive, bg: brand.palette.positiveSoft },
		neutral: { fg: brand.palette.textOnLightMuted, bg: brand.palette.surfaceSunk }
	}[tone];

	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 9,
				padding: `${size * 0.5}px ${size * 0.95}px`,
				borderRadius: 999,
				background: c.bg,
				color: c.fg,
				border: `1px solid ${alpha(c.fg, 0.22)}`,
				fontFamily: brand.fonts.body,
				fontSize: size,
				fontWeight: 600,
				whiteSpace: 'nowrap',
				...style
			}}
		>
			{children}
		</span>
	);
};
