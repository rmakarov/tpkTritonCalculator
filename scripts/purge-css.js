const { PurgeCSS } = require("purgecss");
const { writeFileSync, readdirSync, existsSync } = require("fs");
const { join } = require("path");

const distDir = "./dist";

// Находим все CSS-файлы в dist
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
		console.error("Папка dist не найдена. Сначала запустите npm run build");
		process.exit(1);
	}

	const cssFiles = findCssFiles(distDir);
	console.log(`Найдено CSS-файлов: ${cssFiles.length}`);

	if (cssFiles.length === 0) {
		console.log("CSS-файлы не найдены в dist");
		return;
	}

	const purgeCSSResults = await new PurgeCSS().purge({
		content: ["./index.html", "./dist/**/*.html", "./dist/**/*.js"],
		css: cssFiles,
		defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
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
	});

	// Собираем все rejected селекторы
	const allRejected = [];

	purgeCSSResults.forEach(({ css, file, rejected }) => {
		// Перезаписываем оригинальный CSS очищенной версией
		if (file && css) {
			writeFileSync(file, css);
			console.log(`✂️ Очищен: ${file}`);
		}

		if (rejected && rejected.length > 0) {
			console.log(`  ❌ Удалено: ${rejected.length} селекторов`);
			allRejected.push(...rejected);
		}
	});

	// Сохраняем rejected.css в dist
	if (allRejected.length > 0) {
		const rejectedPath = join(distDir, "purgecss-rejected.css");
		const content =
			`/* Удалённые селекторы (${allRejected.length} шт.) */\n\n` +
			`/*\n${allRejected.join("\n")}\n*/`;
		writeFileSync(rejectedPath, content);
		console.log(`\n💾 Список удалённых селекторов сохранён: ${rejectedPath}`);
	} else {
		console.log("\n✅ Неиспользуемых селекторов не найдено!");
	}
})();
