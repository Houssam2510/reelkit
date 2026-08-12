import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, Composition, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BrandProvider } from '../brand/brand';
import { Stage } from '../stage/Stage';
import { Grade } from '../stage/Grade';
import { Captions } from '../type/Captions';
import { Music, Voiceover } from '../audio/Voiceover';
import { track } from '../motion/curves';
import type { Film } from './film';

/**
 * The assembled film.
 *
 * Note what is mounted here and nowhere else: the room, the grade, the audio.
 * A scene that paints its own background or its own grain breaks the illusion
 * that all of this was shot in one take, and no amount of animation quality
 * recovers from that.
 */
export const FilmRoot: React.FC<{ film: Film }> = ({ film }) => {
	const frame = useCurrentFrame();
	const lift = track(frame, film.lift);

	return (
		<BrandProvider brand={film.brand}>
			<AbsoluteFill style={{ backgroundColor: film.brand.palette.stage }}>
				<Stage lift={lift} />

				{film.scenes.map((s) => (
					<Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.title} layout="none">
						<s.component />
					</Sequence>
				))}

				<Voiceover film={film} />
				<Music film={film} />

				<Grade />
				{film.captions ? <Captions film={film} /> : null}

				<Progress film={film} />
			</AbsoluteFill>
		</BrandProvider>
	);
};

/** Edge-to-edge progress hairline. Reads as player chrome and, more usefully,
 *  gives the eye a constant tempo reference. */
const Progress: React.FC<{ film: Film }> = ({ film }) => {
	const frame = useCurrentFrame();
	const { palette } = film.brand;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				bottom: 0,
				height: 3,
				background: 'rgba(255,255,255,0.07)'
			}}
		>
			<div
				style={{
					width: `${(frame / film.total) * 100}%`,
					height: '100%',
					background: `linear-gradient(90deg, ${palette.accentDeep}, ${palette.accent})`
				}}
			/>
		</div>
	);
};

/**
 * One scene, alone in the room, at its real length and its real brightness.
 * This is the composition you actually work in — on a 70-second film, being
 * able to iterate on one beat without scrubbing is the difference between ten
 * revisions in a day and two.
 */
export const SceneSolo: React.FC<{ film: Film; index: number }> = ({ film, index }) => {
	const s = film.scenes[index];
	if (!s) return null;
	const lift = track(s.from + s.dur / 2, film.lift);
	return (
		<BrandProvider brand={film.brand}>
			<AbsoluteFill style={{ backgroundColor: film.brand.palette.stage }}>
				<Stage lift={lift} />
				<s.component />
				{s.voFrom !== null ? (
					<Sequence from={s.voFrom - s.from} layout="none">
						<Audio src={staticFile(`audio/vo/${s.id}.mp3`)} />
					</Sequence>
				) : null}
				<Grade />
			</AbsoluteFill>
		</BrandProvider>
	);
};

/**
 * All compositions for a film: the master, plus one per scene.
 *
 * The film is closed over rather than passed as `defaultProps` on purpose —
 * it holds React components, which the Studio's props editor cannot serialise.
 */
export const FilmCompositions: React.FC<{ film: Film }> = ({ film }) => {
	const master = useMemo(() => {
		const C: React.FC = () => <FilmRoot film={film} />;
		C.displayName = `Film(${film.id})`;
		return C;
	}, [film]);

	const solos = useMemo(
		() =>
			film.scenes.map((s, i) => {
				const C: React.FC = () => <SceneSolo film={film} index={i} />;
				C.displayName = `Scene(${s.id})`;
				return { id: s.id, dur: s.dur, C };
			}),
		[film]
	);

	return (
		<>
			<Composition
				id={film.id}
				component={master}
				durationInFrames={film.total}
				fps={film.fps}
				width={film.width}
				height={film.height}
			/>
			{solos.map((s) => (
				<Composition
					key={s.id}
					id={`scene-${s.id}`}
					component={s.C}
					durationInFrames={s.dur}
					fps={film.fps}
					width={film.width}
					height={film.height}
				/>
			))}
		</>
	);
};
