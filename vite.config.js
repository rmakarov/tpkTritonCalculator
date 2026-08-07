import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import purgecss from "vite-plugin-purgecss";

export default defineConfig(({ mode }) => ({
	plugins: [
		electron([
			{
				entry: "src/main/main.js",
				onstart: (options) => options.reload(),
			},
			{
				entry: "src/main/preload.js",
				onstart: (options) => options.reload(),
			},
		]),
		renderer(),

		// PurgeCSS - только для production сборки
		mode === "production" &&
			purgecss({
				content: [
					"./index.html",
					"./src/renderer/**/*.{js,jsx,ts,tsx,html}",
					"./src/components/**/*.{js,jsx,ts,tsx,html}",
				],
				defaultExtractor: (content) => {
					const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
					const innerMatches =
						content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
					return broadMatches.concat(innerMatches);
				},
				safelist: {
					standard: [
						"active",
						"hidden",
						"visible",
						"disabled",
						"is-active",
						"is-hidden",
						"is-visible",
						"has-error",
						"notification",
						"show",
						"hide",
						"fade-in",
						"fade-out",
					],
					deep: [/modal/, /tooltip/, /dropdown/, /notification/, /accordion/],
					greedy: [/tab-panel/, /grey-panel/, /settings-/, /calculator-/],
					keyframes: true,
				},
				rejected: true,
				rejectedCss: true,
				output: "./dist/purgecss-rejected.css",
			}),
	].filter(Boolean),

	build: {
		outDir: "dist",
		emptyOutDir: true,
		minify: mode === "production",
	},
}));
