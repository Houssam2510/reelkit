import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useBrand, alpha } from '../brand/brand';
import { lineAt, type Film } from '../film/film';
import { clamp } from '../motion/curves';

/**
 * Word-synchronised captions.
 *
 * This is the payoff for asking ElevenLabs for timestamps instead of just
 * audio: the caption is not a guess timed to the clip, it is the engine's own
 * per-character alignment. Every word lights on the syllable it is spoken on,
 * which is the look every silent-autoplay social cut is copying and almost
 * none of them get right.
 *
 * Off by default. A narrated film playing with sound does not want these.
 */
export const Captions: React.FC<{
	film: Film;
	/** Distance from the bottom of the frame. */
	bottom?: number;
	size?: number;
	/** How many words are visible at once. Keep it short — this is not a script. */
	window?: number;
}> = ({ film, bottom = 96, size = 40, window: win = 7 }) => {
	const brand = useBrand();
	const frame = useCurrentFrame();

	const scene = lineAt(film, frame);
	if (!scene || scene.voFrom === null || !film.timings) return null;
	const line = film.timings.lines[scene.id];
	if (!line || line.words.length === 0) return null;

	const t = (frame - scene.voFrom) / film.fps;

	// The word being spoken right now, or the last one that was.
	let current = 0;
	for (let i = 0; i < line.words.length; i++) {
		if (t >= (line.words[i] as { start: number }).start) current = i;
	}

	// Slide a fixed window so the caption never reflows mid-sentence.
	const start = Math.max(0, Math.min(line.words.length - win, current - Math.floor(win / 2)));
	const visible = line.words.slice(start, start + win);

	return (
		<AbsoluteFill
			style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom }}
		>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'center',
					gap: `${size * 0.1}px ${size * 0.3}px`,
					maxWidth: 1400,
					padding: `${size * 0.45}px ${size * 0.8}px`,
					borderRadius: brand.radii.panel,
					background: alpha(brand.palette.stage, 0.62),
					border: `1px solid ${brand.palette.line}`,
					fontFamily: brand.fonts.display,
					fontSize: size,
					fontWeight: 700,
					letterSpacing: '-0.02em'
				}}
			>
				{visible.map((w, i) => {
					const spoken = t >= w.start;
					const dur = Math.max(0.06, w.end - w.start);
					const hit = clamp((t - w.start) / dur);
					return (
						<span
							key={`${start + i}-${w.w}`}
							style={{
								color: spoken ? brand.palette.text : brand.palette.textFaint,
								transform: `translateY(${spoken ? -2 * (1 - hit) : 0}px)`,
								textShadow: spoken
									? `0 0 26px ${alpha(brand.palette.accent, 0.35 * (1 - hit))}`
									: undefined
							}}
						>
							{w.w}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
