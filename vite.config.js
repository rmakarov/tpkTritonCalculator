import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

const appEdition =
	process.env.APP_EDITION === "trial" || process.env.TRIAL_TEST_DURATION_MS
		? "trial"
		: "full";
const editionDefinitions = {
	__APP_EDITION__: JSON.stringify(appEdition),
};

export default defineConfig({
	define: editionDefinitions,
	plugins: [
		electron([
			{
				// Главный процесс
				entry: "src/main/main.js",
				vite: {
					define: editionDefinitions,
				},
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
