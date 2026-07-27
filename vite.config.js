import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
	plugins: [
		electron([
			{
				// Главный процесс
				entry: "src/main/main.js",
				onstart: (options) => options.reload(),
			},
			{
				// Preload скрипт (убедитесь, что путь src/main/preload.js верный!)
				entry: "src/main/preload.js",
				onstart: (options) => options.reload(),
			},
		]),
		renderer(),
	],
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
