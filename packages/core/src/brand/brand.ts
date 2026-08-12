import React, { createContext, useContext } from 'react';

/**
 * A brand is the ONLY place a colour, a radius, a typeface or a light
 * direction is allowed to be decided. Every component in reelkit reads from
 * here, so re-skinning a whole film is one object — not a search-and-replace.
 *
 * The default below is deliberately neutral (graphite + a single blue accent):
 * it looks intentional out of the box, and it looks nothing like anyone's
 * brand, so you are never tempted to ship it.
 */

export type Palette = {
	/** The room. `stage` is the furthest back, `inkDeep` the shaded corners. */
	stage: string;
	inkDeep: string;
	ink: string;
	/** Light surfaces — anything that reads as paper, glass or a UI card. */
	surface: string;
	surfaceSunk: string;
	/** Hairlines and dividers, on dark and on light respectively. */
	line: string;
	lineOnLight: string;
	/** Type on the dark stage. */
	text: string;
	textMuted: string;
	textFaint: string;
	/** Type on light surfaces. */
	textOnLight: string;
	textOnLightMuted: string;
	/** The one colour the film is allowed to shout with. */
	accent: string;
	accentDeep: string;
	accentSoft: string;
	/** Semantics — used sparingly, mostly inside product UI. */
	positive: string;
	positiveSoft: string;
	warning: string;
};

export type Brand = {
	name: string;
	palette: Palette;
	fonts: {
		/** Headlines. Should be the brand's display face. */
		display: string;
		/** Everything else. */
		body: string;
		/** Numbers, code, parser output. Optional — falls back to `body`. */
		mono: string;
	};
	radii: { control: number; card: number; panel: number };
	/**
	 * The key light. Every sheen, every contact shadow and every panel highlight
	 * in the kit derives its direction from this one angle, which is what stops
	 * a 3D composite from reading as a collage of stickers.
	 *
	 * `angle` is in degrees, 0 = light coming from screen-left, 90 = from above.
	 */
	light: {
		angle: number;
		/** rgb triplet, as a bare "r,g,b" string so it can be dropped into rgba(). */
		warm: string;
		/** The cooler bounce light filling the shadow side. */
		cool: string;
	};
	/** Grade applied to the finished frame. See `<Grade/>`. */
	grade: {
		grain: number;
		vignette: number;
		bloom: number;
		aberration: number;
	};
};

/** Everything is optional; anything you leave out falls back to the default. */
export type BrandInput = {
	name?: string;
	palette?: Partial<Palette>;
	fonts?: Partial<Brand['fonts']>;
	radii?: Partial<Brand['radii']>;
	light?: Partial<Brand['light']>;
	grade?: Partial<Brand['grade']>;
};

export const DEFAULT_BRAND: Brand = {
	name: 'Reelkit',
	palette: {
		stage: '#0b0d10',
		inkDeep: '#111419',
		ink: '#171b21',
		surface: '#ffffff',
		surfaceSunk: '#f2f4f7',
		line: 'rgba(226,232,240,0.16)',
		lineOnLight: '#e2e8f0',
		text: '#f8fafc',
		textMuted: '#a8b3c2',
		textFaint: '#6b7787',
		textOnLight: '#0f141a',
		textOnLightMuted: '#5b6675',
		accent: '#3b82f6',
		accentDeep: '#1d4ed8',
		accentSoft: '#dbeafe',
		positive: '#15803d',
		positiveSoft: '#bbf7d0',
		warning: '#b45309'
	},
	fonts: {
		display: 'system-ui, sans-serif',
		body: 'system-ui, sans-serif',
		mono: 'ui-monospace, SFMono-Regular, monospace'
	},
	radii: { control: 10, card: 14, panel: 20 },
	light: { angle: 35, warm: '96,132,255', cool: '90,110,140' },
	grade: { grain: 0.05, vignette: 0.55, bloom: 0.5, aberration: 0.35 }
};

export const defineBrand = (input: BrandInput): Brand => ({
	name: input.name ?? DEFAULT_BRAND.name,
	palette: { ...DEFAULT_BRAND.palette, ...input.palette },
	fonts: { ...DEFAULT_BRAND.fonts, ...input.fonts },
	radii: { ...DEFAULT_BRAND.radii, ...input.radii },
	light: { ...DEFAULT_BRAND.light, ...input.light },
	grade: { ...DEFAULT_BRAND.grade, ...input.grade }
});

const BrandContext = createContext<Brand>(DEFAULT_BRAND);

export const BrandProvider: React.FC<{ brand: Brand; children: React.ReactNode }> = ({
	brand,
	children
}) => React.createElement(BrandContext.Provider, { value: brand }, children);

export const useBrand = (): Brand => useContext(BrandContext);

/**
 * A hex colour as a bare `"r, g, b"` triplet, ready to drop inside `rgba()`
 * or a gradient stop. Returns null for anything that is not `#rgb`/`#rrggbb`.
 */
export const rgb = (color: string): string | null => {
	if (!color.startsWith('#')) return null;
	const hex = color.slice(1);
	const full =
		hex.length === 3
			? hex
					.split('')
					.map((c) => c + c)
					.join('')
			: hex;
	if (full.length !== 6) return null;
	const n = parseInt(full, 16);
	return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/**
 * `rgba()` for the palette. Accepts `#rgb`, `#rrggbb` and an already-rgba()
 * string (returned unchanged, so passing a token through twice is harmless).
 */
export const alpha = (color: string, a: number): string => {
	const triplet = rgb(color);
	return triplet === null ? color : `rgba(${triplet}, ${a})`;
};

/** The key light as an (x, y) unit vector — shadows fall the opposite way. */
export const lightVector = (brand: Brand): { x: number; y: number } => {
	const rad = (brand.light.angle * Math.PI) / 180;
	return { x: Math.cos(rad), y: -Math.sin(rad) };
};
