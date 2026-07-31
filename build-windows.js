const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = __dirname;
const packageJson = require(path.join(projectRoot, "package.json"));
const productName = packageJson.build.productName;
const unpackedDirectory = path.join(projectRoot, "release", "win-unpacked");
const executablePath = path.join(unpackedDirectory, `${productName}.exe`);
const iconPath = path.join(projectRoot, "public", "assets", "icon.ico");
const viteCliPath = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const electronBuilderCliPath = path.join(
	projectRoot,
	"node_modules",
	"electron-builder",
	"out",
	"cli",
	"cli.js",
);

async function buildWindowsInstaller() {
	runNodeScript(viteCliPath, ["build"]);
	runNodeScript(electronBuilderCliPath, ["--win", "dir"]);

	const { rcedit } = await import("rcedit");
	await rcedit(executablePath, {
		icon: iconPath,
		"file-version": packageJson.version,
		"product-version": packageJson.version,
		"version-string": {
			ProductName: productName,
			FileDescription: productName,
			InternalName: productName,
			OriginalFilename: `${productName}.exe`,
			CompanyName: "TPK Triton",
		},
	});

	runNodeScript(electronBuilderCliPath, [
		"--win",
		"nsis",
		"--prepackaged",
		unpackedDirectory,
	]);
}

function runNodeScript(scriptPath, args = []) {
	const result = spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: projectRoot,
		stdio: "inherit",
	});

	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${path.basename(scriptPath)} завершился с кодом ${result.status}`);
	}
}

buildWindowsInstaller().catch((error) => {
	console.error("Не удалось собрать Windows-инсталлятор:", error);
	process.exitCode = 1;
});
