import { Config } from '@remotion/cli/config';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// swangle is the software GL path. It is the one that works everywhere — WSL,
// containers, CI — and for a composite made of CSS 3D rather than real WebGL,
// the hardware path buys almost nothing.
Config.setChromiumOpenGlRenderer('swangle');

/**
 * Resolve `reelkit` to its TypeScript source.
 *
 * npm links the workspace into node_modules and webpack would follow the
 * symlink and find the source anyway — but only by accident of how the loader
 * rules happen to be scoped. Pointing at it explicitly means editing a core
 * component hot-reloads the Studio, with no build step between you and the
 * change you are trying to see.
 *
 * `process.cwd()` rather than `import.meta.url`: Remotion compiles this config
 * to CommonJS, where `import.meta` is empty. Every Remotion command runs with
 * the project directory as the working directory, so this is stable.
 */
const CORE = path.resolve(process.cwd(), '../../packages/core/src/index.ts');

Config.overrideWebpackConfig((config) => ({
	...config,
	resolve: {
		...config.resolve,
		alias: { ...config.resolve?.alias, reelkit: CORE }
	}
}));
