export declare const DEFAULT_LEAD_IN: number;
export declare const DEFAULT_TAIL: number;
export declare const ORPHAN_SECONDS: number;

export type Beat = {
	id: string;
	leadIn?: number;
	tail?: number;
	min?: number;
	seconds?: number;
};

export type Placed = {
	id: string;
	from: number;
	dur: number;
	voFrom: number | null;
	voDur: number;
};

export declare const layout: (opts: {
	fps?: number;
	grid?: number;
	beats: readonly Beat[];
	durations?: Record<string, number>;
}) => Placed[];

export declare const srtTime: (seconds: number) => string;

export declare const toSrt: (
	placed: readonly Placed[],
	lines: Record<string, { words: Array<{ w: string; start: number; end: number }> }>,
	fps: number,
	maxChars?: number
) => string;
