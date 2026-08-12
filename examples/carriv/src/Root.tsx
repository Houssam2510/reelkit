import React from 'react';
import { FilmCompositions } from 'reelkit';
import { film } from './film';
import './brand';

/**
 * Compositions: the film, plus one per scene.
 *
 * The per-scene ones are not a nicety. On a 75-second piece, scrubbing to the
 * beat you are working on costs more than the edit does — `scene-05-ats` opens
 * on the shot itself, at its real length and its real room brightness.
 */
export const RemotionRoot: React.FC = () => <FilmCompositions film={film} />;
