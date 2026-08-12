/**
 * reelkit — a Remotion toolkit for cinematic product films.
 *
 * The whole library is four ideas:
 *
 *   1. A BRAND is the only place a colour or a typeface is decided.
 *   2. A CAMERA moves through one world; scenes place objects in it.
 *   3. A GRADE is applied once, to everything, at the end.
 *   4. The EDIT is derived from the recorded voice, not typed in by hand.
 *
 * Everything exported below serves one of those four. If you find yourself
 * reaching for a fifth idea, it probably belongs in your film, not here.
 */

export {
	defineBrand,
	BrandProvider,
	useBrand,
	alpha,
	rgb,
	lightVector,
	DEFAULT_BRAND,
	type Brand,
	type BrandInput,
	type Palette
} from './brand/brand';

export {
	curve,
	springs,
	ramp,
	track,
	stagger,
	springAt,
	presence,
	clamp,
	interpolate,
	spring,
	Easing,
	type CurveName,
	type SpringName,
	type Key
} from './motion/curves';

export { noise1, fbm } from './motion/noise';
export { useSceneClock, useBeat } from './motion/clock';

export {
	World,
	Obj,
	CameraBlur,
	useCamera,
	useCameraRig,
	usePlacement,
	resolveCamera,
	cameraSpeed,
	defocus,
	placementTransform,
	NEUTRAL_CAMERA,
	type Camera,
	type Shot,
	type Placement,
	type HandheldConfig
} from './motion/camera';

export { Stage, Scrim } from './stage/Stage';
export { Grade, Grain, Vignette, Halation, Aberration, MotionBlur, Letterbox } from './stage/Grade';

export { Kicker, Headline, Body, Pill, Odometer, Rule } from './type/Text';
export { Captions } from './type/Captions';

export { Sheen, ContactShadow, useRimLight } from './objects/Surface';
export { BrowserFrame } from './objects/BrowserFrame';
export { Paper } from './objects/Paper';
export { Panel, Chip } from './objects/Panel';

export { Voiceover, Music } from './audio/Voiceover';

export {
	resolveFilm,
	lineAt,
	filmSummary,
	type Film,
	type FilmSpec,
	type SceneSpec,
	type ResolvedScene,
	type Script,
	type ScriptLine,
	type VoTimings,
	type VoLine,
	type VoWord
} from './film/film';
export { layout, toSrt, srtTime } from './film/timeline.mjs';
export { FilmRoot, SceneSolo, FilmCompositions } from './film/Film';
