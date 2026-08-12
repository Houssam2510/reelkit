import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Kicker, Headline, Body, useSceneClock } from 'reelkit';

/**
 * The film's one text layout.
 *
 * Nine scenes, one column, always in the same place, always with the same
 * three delays between the three elements. A viewer stops reading the layout
 * after the second scene and starts reading the words — which is the entire
 * job of a title design and the reason it should be boring.
 */
export const Copy: React.FC<{
	kicker: string;
	title: string;
	body?: string;
	accent?: readonly string[];
	size?: number;
	width?: number;
	bodyWidth?: number;
	/** Push the column down for scenes whose object sits high in frame. */
	top?: number;
	delay?: number;
}> = ({
	kicker,
	title,
	body,
	accent = [],
	size = 70,
	width = 900,
	bodyWidth,
	top = 96,
	delay = 8
}) => {
	const { outAt } = useSceneClock();
	return (
		<AbsoluteFill style={{ padding: `${top}px 0 0 118px`, pointerEvents: 'none' }}>
			<div style={{ width }}>
				<Kicker delay={delay} exitAt={outAt - 4}>
					{kicker}
				</Kicker>
				<Headline
					delay={delay + 6}
					exitAt={outAt - 2}
					size={size}
					accent={accent}
					style={{ marginTop: 22 }}
				>
					{title}
				</Headline>
				{body ? (
					<Body
						delay={delay + 26}
						exitAt={outAt - 2}
						size={27}
						width={bodyWidth ?? width * 0.78}
						style={{ marginTop: 22 }}
					>
						{body}
					</Body>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
