import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useBrand, alpha } from '../brand/brand';
import { presence, springAt, stagger, ramp, clamp } from '../motion/curves';

/**
 * Typography.
 *
 * Two rules, both non-negotiable:
 *
 * 1. Nothing appears. Every word is REVEALED — it rises out of a mask, the way
 *    a title card is exposed. Fading text in is the single most common tell of
 *    a template, because it is the one thing physical type cannot do.
 *
 * 2. Line breaks are authored, never automatic. Write `\n` where the line
 *    should turn. A headline that rewraps because someone changed a word is a
 *    headline nobody set.
 */

type Common = {
	/** Frame (relative to the sequence) where the reveal starts. */
	delay?: number;
	/** Frame where the exit starts. Omit to hold to the end of the sequence. */
	exitAt?: number;
	style?: React.CSSProperties;
};

/** The eyebrow label above a headline, with the rule that draws itself. */
export const Kicker: React.FC<Common & { children: string; tone?: 'accent' | 'muted' }> = ({
	children,
	delay = 0,
	exitAt,
	tone = 'accent',
	style
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = presence(frame, fps, { delay, exitAt });
	const color = tone === 'accent' ? brand.palette.accent : brand.palette.textMuted;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 16,
				fontFamily: brand.fonts.body,
				fontSize: 23,
				fontWeight: 600,
				letterSpacing: '0.24em',
				textTransform: 'uppercase',
				color,
				opacity: p.v,
				transform: `translateY(${(1 - p.in) * 10 - p.out * 8}px)`,
				...style
			}}
		>
			<span
				style={{
					display: 'block',
					width: 36 * p.in,
					height: 2,
					background: color,
					borderRadius: 2,
					flexShrink: 0
				}}
			/>
			{children}
		</div>
	);
};

/**
 * A single word inside a reveal mask. The negative-margin/padding pair keeps
 * descenders from being clipped by the very mask that reveals them.
 */
const MaskedWord: React.FC<{
	word: string;
	t: number;
	exit: number;
	color?: string;
	size: number;
}> = ({ word, t, exit, color, size }) => (
	<span
		style={{
			display: 'inline-block',
			overflow: 'hidden',
			paddingBottom: '0.16em',
			marginBottom: '-0.16em',
			verticalAlign: 'bottom'
		}}
	>
		<span
			style={{
				display: 'inline-block',
				color,
				transform: `translateY(${(1 - t) * (size * 1.05) - exit * size * 0.5}px)`,
				opacity: exit > 0 ? 1 - exit : 1
			}}
		>
			{word}
		</span>
	</span>
);

/**
 * Display headline. Revealed word by word, line by line.
 *
 * `accent` paints matching words in the brand accent. Matching ignores case
 * and trailing punctuation, so `accent={['free']}` also catches "free.".
 */
export const Headline: React.FC<
	Common & {
		children: string;
		size?: number;
		accent?: readonly string[];
		lineHeight?: number;
		weight?: number;
		/** Frames between consecutive words. Raise it for a slower read. */
		rhythm?: number;
	}
> = ({
	children,
	delay = 0,
	exitAt,
	size = 84,
	accent = [],
	lineHeight = 1.08,
	weight = 700,
	rhythm = 2.4,
	style
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const outStart = exitAt ?? durationInFrames - 12;
	const exit = ramp(frame, [outStart, outStart + 14], [0, 1], 'exit');

	const wanted = new Set(accent.map((a) => a.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')));
	const lines = children.split('\n');
	let index = 0;

	return (
		<div
			style={{
				fontFamily: brand.fonts.display,
				fontSize: size,
				fontWeight: weight,
				lineHeight,
				letterSpacing: '-0.028em',
				color: brand.palette.text,
				...style
			}}
		>
			{lines.map((line, li) => (
				<div key={li} style={{ display: 'flex', flexWrap: 'wrap', columnGap: size * 0.24 }}>
					{line.split(' ').map((word, wi) => {
						const t = springAt(frame, fps, stagger(index++, rhythm, delay), 'arrive');
						const key = word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
						return (
							<MaskedWord
								key={`${li}-${wi}`}
								word={word}
								t={t}
								exit={exit}
								size={size}
								color={wanted.has(key) ? brand.palette.accent : undefined}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
};

/** Supporting copy. One block, revealed as a unit — it is not the star. */
export const Body: React.FC<
	Common & { children: React.ReactNode; size?: number; width?: number }
> = ({ children, delay = 0, exitAt, size = 28, width = 700, style }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = presence(frame, fps, { delay, exitAt });

	return (
		<div
			style={{
				fontFamily: brand.fonts.body,
				fontSize: size,
				lineHeight: 1.5,
				color: brand.palette.textMuted,
				maxWidth: width,
				opacity: p.v,
				transform: `translateY(${(1 - p.in) * 16 - p.out * 10}px)`,
				...style
			}}
		>
			{children}
		</div>
	);
};

/** A call-out that floats over the product. Always on a light chip, so it
 *  survives being placed over a screenshot of unknown brightness. */
export const Pill: React.FC<
	Common & {
		children: React.ReactNode;
		tone?: 'accent' | 'positive' | 'neutral';
		/** Gentle vertical float, so a held pill never freezes. */
		float?: boolean;
	}
> = ({ children, delay = 0, exitAt, tone = 'accent', float = true, style }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = presence(frame, fps, { delay, exitAt, preset: 'pop' });
	const drift = float ? Math.sin((frame - delay) / 27) * 5 : 0;

	const dot = {
		accent: brand.palette.accent,
		positive: brand.palette.positive,
		neutral: brand.palette.textOnLightMuted
	}[tone];

	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 12,
				padding: '13px 22px',
				borderRadius: 999,
				background: brand.palette.surface,
				color: brand.palette.textOnLight,
				fontFamily: brand.fonts.body,
				fontSize: 23,
				fontWeight: 600,
				whiteSpace: 'nowrap',
				boxShadow: `0 18px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.6)`,
				opacity: p.v,
				transform: `translateY(${(1 - p.in) * 20 + drift - p.out * 14}px) scale(${
					0.92 + p.in * 0.08
				})`,
				...style
			}}
		>
			<span style={{ width: 10, height: 10, borderRadius: 999, background: dot, flexShrink: 0 }} />
			{children}
		</div>
	);
};

/**
 * A mechanical odometer. Digits roll into place instead of being re-rendered,
 * which is the difference between a number that is counting and a number that
 * is being replaced thirty times a second.
 */
export const Odometer: React.FC<{
	value: number;
	digits?: number;
	size?: number;
	color?: string;
	weight?: number;
	style?: React.CSSProperties;
}> = ({ value, digits, size = 76, color, weight = 700, style }) => {
	const brand = useBrand();
	const v = Math.max(0, value);
	const places = digits ?? Math.max(1, String(Math.floor(v)).length);
	const cellH = size * 1.06;

	return (
		<div
			style={{
				display: 'inline-flex',
				fontFamily: brand.fonts.display,
				fontSize: size,
				fontWeight: weight,
				lineHeight: `${cellH}px`,
				letterSpacing: '-0.04em',
				fontVariantNumeric: 'tabular-nums',
				color: color ?? brand.palette.text,
				height: cellH,
				overflow: 'hidden',
				...style
			}}
		>
			{Array.from({ length: places }, (_, i) => {
				const place = places - 1 - i;
				const scaled = v / 10 ** place;
				const digit = Math.floor(scaled) % 10;
				const frac = scaled - Math.floor(scaled);
				// Only the last tenth of a place's travel actually turns the wheel.
				const roll = clamp((frac - 0.9) / 0.1);
				const offset = (digit + roll) * cellH;
				return (
					<span key={place} style={{ display: 'block', height: cellH, overflow: 'hidden' }}>
						<span style={{ display: 'block', transform: `translateY(${-offset}px)` }}>
							{Array.from({ length: 11 }, (_, d) => (
								<span key={d} style={{ display: 'block', height: cellH, textAlign: 'center' }}>
									{d % 10}
								</span>
							))}
						</span>
					</span>
				);
			})}
		</div>
	);
};

/** A hairline that draws itself. Good for underlining a beat. */
export const Rule: React.FC<Common & { width?: number; thickness?: number }> = ({
	delay = 0,
	exitAt,
	width = 200,
	thickness = 2,
	style
}) => {
	const brand = useBrand();
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = presence(frame, fps, { delay, exitAt });
	return (
		<div
			style={{
				width: width * p.in,
				height: thickness,
				borderRadius: thickness,
				background: `linear-gradient(90deg, ${brand.palette.accent}, ${alpha(
					brand.palette.accent,
					0
				)})`,
				opacity: p.v,
				...style
			}}
		/>
	);
};
