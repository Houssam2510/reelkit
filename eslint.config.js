import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
	{ ignores: ['**/node_modules/**', '**/out/**', '**/dist/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		plugins: { 'react-hooks': reactHooks },
		rules: {
			...reactHooks.configs.recommended.rules,
			// Remotion components are pure functions of `useCurrentFrame()`; a
			// deps-array miss shows up as a frame that renders the wrong thing, so
			// this stays an error rather than a warning.
			'react-hooks/exhaustive-deps': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['tools/**/*.mjs'],
		languageOptions: {
			globals: {
				process: 'readonly',
				console: 'readonly',
				Buffer: 'readonly',
				fetch: 'readonly',
				URL: 'readonly',
				// `window` appears only inside Playwright `page.evaluate()` callbacks,
				// which are serialised and run in the browser, not in Node.
				window: 'readonly'
			}
		}
	}
);
