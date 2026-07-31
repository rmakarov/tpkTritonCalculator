const path = require("path");
const { spawnSync } = require("child_process");

exports.default = function buildApplicationBeforePack() {
	const projectRoot = __dirname;
	const viteCliPath = path.join(
		projectRoot,
		"node_modules",
		"vite",
		"bin",
		"vite.js",
	);
	const edition = process.env.APP_EDITION === "trial" ? "trial" : "full";

	console.log(`[Build] Собирается редакция: ${edition.toUpperCase()}`);

	const result = spawnSync(process.execPath, [viteCliPath, "build"], {
		cwd: projectRoot,
		stdio: "inherit",
		env: { ...process.env, APP_EDITION: edition },
	});

	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`Vite завершился с кодом ${result.status}`);
	}
};
