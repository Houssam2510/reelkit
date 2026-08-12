import { defineBrand } from 'reelkit';
import { loadFont as loadDisplay } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as loadBody } from '@remotion/google-fonts/SourceSans3';

/**
 * Carriv's brand, as the film sees it.
 *
 * Every hex here exists in the product's own `@theme` block. Nothing is
 * invented for the video — a film that improves on the brand's colours is a
 * film that does not look like the product it is selling.
 *
 * This is the entire skin. Point it at another palette and the same nine
 * scenes render as another company's film.
 */

const display = loadDisplay('normal', { weights: ['600', '700', '800'], subsets: ['latin'] });
const body = loadBody('normal', { weights: ['400', '600'], subsets: ['latin'] });

export const fontsReady = Promise.all([display.waitUntilDone(), body.waitUntilDone()]);

export const carriv = defineBrand({
	name: 'Carriv',
	palette: {
		// The room: espresso, nearly black.
		stage: '#140e08',
		inkDeep: '#1a130c',
		ink: '#241b12',
		// Product surfaces: warm sand, never pure white in the shadows.
		surface: '#ffffff',
		surfaceSunk: '#fbf7f1',
		line: 'rgba(231,219,204,0.16)',
		lineOnLight: '#e7dbcc',
		text: '#fbf7f1',
		textMuted: '#d6c5b0',
		textFaint: '#b0a18c',
		textOnLight: '#241b12',
		textOnLightMuted: '#6e6051',
		// Terracotta. The film is allowed to shout exactly this one colour.
		accent: '#d4682e',
		accentDeep: '#b9551f',
		accentSoft: '#fae5d5',
		positive: '#4c7a3f',
		positiveSoft: '#c2d6b4',
		warning: '#c98a1e'
	},
	fonts: {
		display: display.fontFamily,
		body: body.fontFamily,
		mono: 'ui-monospace, SFMono-Regular, Menlo, monospace'
	},
	radii: { control: 10, card: 14, panel: 20 },
	// Key light from the upper left, warm; the fill is the brown of the room
	// bouncing back. Both are used by every sheen and every cast shadow.
	light: { angle: 34, warm: '212,104,46', cool: '124,90,67' },
	grade: { grain: 0.05, vignette: 0.6, bloom: 0.55, aberration: 0.3 }
});
