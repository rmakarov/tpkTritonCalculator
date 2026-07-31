const path = require("path");

exports.default = async function applyWindowsExecutableMetadata(context) {
	if (context.electronPlatformName !== "win32") return;

	const packageJson = require(path.join(__dirname, "package.json"));
	const productName = packageJson.build.productName;
	const executablePath = path.join(context.appOutDir, `${productName}.exe`);
	const iconPath = path.join(__dirname, "public", "assets", "icon.ico");
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
};
