import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
// import purgecss from "vite-plugin-purgecss"; // ← можно удалить

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
	],
	build: {
		outDir: "dist",
		emptyOutDir: true,
		minify: mode === "production",
	},
}));
