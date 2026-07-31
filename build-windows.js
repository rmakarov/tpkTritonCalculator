const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = __dirname;
const packageJson = require(path.join(projectRoot, "package.json"));
const productName = packageJson.build.productName;
const electronBuilderCliPath = path.join(
	projectRoot,
	"node_modules",
	"electron-builder",
	"out",
	"cli",
	"cli.js",
);

function buildWindowsInstaller() {
	const edition = process.argv[2] === "trial" ? "trial" : "full";
	const artifactName = `${productName} ${edition === "trial" ? "Trial" : "Full"} Setup.\${ext}`;

	runNodeScript(
		electronBuilderCliPath,
		["--win", `--config.artifactName=${artifactName}`],
		{ ...process.env, APP_EDITION: edition },
	);
}

function runNodeScript(scriptPath, args = [], environment = process.env) {
	const result = spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: projectRoot,
		stdio: "inherit",
		env: environment,
	});

	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${path.basename(scriptPath)} завершился с кодом ${result.status}`);
	}
}

try {
	buildWindowsInstaller();
} catch (error) {
	console.error("Не удалось собрать Windows-инсталлятор:", error);
	process.exitCode = 1;
}
