const { PurgeCSS } = require("purgecss");
const { readdirSync, existsSync } = require("fs");
const { join } = require("path");

const distDir = "./dist";

function findCssFiles(dir) {
	const files = [];
	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findCssFiles(fullPath));
		} else if (
			entry.name.endsWith(".css") &&
			!entry.name.includes("rejected")
		) {
			files.push(fullPath);
		}
	}
	return files;
}

(async () => {
	if (!existsSync(distDir)) {
		console.error("Папка dist не найдена");
		process.exit(1);
	}

	const cssFiles = findCssFiles(distDir);
	console.log(`Найдено CSS-файлов: ${cssFiles.length}\n`);

	// Запуск БЕЗ safelist — только для анализа
	const purgeCSSResults = await new PurgeCSS().purge({
		content: ["./index.html", "./dist/**/*.html", "./dist/**/*.js"],
		css: cssFiles,
		defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
		rejected: true,
		// safelist убран для теста
	});

	const allRejected = [];

	purgeCSSResults.forEach(({ rejected }) => {
		if (rejected && rejected.length > 0) {
			allRejected.push(...rejected);
		}
	});

	if (allRejected.length > 0) {
		console.log(
			`Найдено ${allRejected.length} потенциально неиспользуемых селекторов:\n`,
		);
		allRejected.slice(0, 30).forEach((sel) => console.log(`  • ${sel}`));
		if (allRejected.length > 30) {
			console.log(`  ... и ещё ${allRejected.length - 30}`);
		}
	} else {
		console.log(
			"✅ Даже без safelist ничего не найдено — CSS действительно чистый!",
		);
	}
})();
