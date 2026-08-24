// Импортируем HTML-фрагменты как строки (Vite magic ✨)
import addItemDialogHTML from "./components/modals/addItemDialog.html?raw";
import wicketAndGateEditorHTML from "./components/modals/wicketAndGateEditor.html?raw";
import helpDialogHTML from "./components/modals/helpDialog.html?raw";
import confirmDialogHTML from "./components/modals/confirmDialog.html?raw";
import wicketTemplateHTML from "./components/templates/wicketCalculator.html?raw";
import gateTemplateHTML from "./components/templates/gateCalculator.html?raw";

// Импортируем стили (Vite обработает их автоматически)
import "./styles/variables.css";
import "./styles/styles.css";
import "./styles/settingsAccordion.css";
import "./styles/modal.css";
import "./styles/calculatorTemplates.css";
import "./styles/print.css";
import "./styles/customAutocomplete.css";
import "./styles/notification.css";
import "./styles/wicketAndGateEditor.css";

import { priceManager } from "./js/priceManager.js";
import { settingsManager } from "./js/settingsManager.js";
import { populateSelectsFromSettings, populateLiveSelectsFromSettings } from "./js/populateSelects.js";

// ============================================
// Функции инициализации
// ============================================

window.onerror = function (message, source, lineno, colno, error) {
	console.error("❌ [Renderer] Error:", {
		message,
		source,
		lineno,
		colno,
		stack: error?.stack,
	});
	// Возвращаем false, чтобы предотвратить стандартный alert
	return false;
};

window.addEventListener("unhandledrejection", (event) => {
	console.error("❌ [Renderer] Unhandled Promise Rejection:", event.reason);
	event.preventDefault(); // Предотвращаем alert
});

function mountComponents() {
	// 1. HTML в DOM
	document.body.insertAdjacentHTML("beforeend", addItemDialogHTML + helpDialogHTML + confirmDialogHTML + wicketAndGateEditorHTML);
	document.body.insertAdjacentHTML("beforeend", wicketTemplateHTML + gateTemplateHTML);
}

// 2. Динамические импорты JS — выполнятся ПОСЛЕ mountComponents
async function loadJSModules() {
	await Promise.all([
		import("./js/modal/addItemModal.js"),
		import("./js/modal/helpModal.js"),
		import("./js/modal/wicketAndGateEditor.js"),
		import("./js/tabs.js"),
		import("./js/calculatorTemplates.js"),
		import("./js/pdfPreview.js"),
		import("./js/customAutocomplete.js"),
		import("./js/settingsAccordion.js").then((m) => m.initSettingsAccordion()),
	]);
}

function initFileImport() {
	const fileInput = document.getElementById("xlf");
	const fileNameDisplay = document.getElementById("file-name");
	const outputEl = document.getElementById("output");

	if (fileInput) {
		fileInput.addEventListener("change", async (e) => {
			const file = e.target.files[0];

			// 1. СРАЗУ обновляем имя файла в UI (синхронно, до начала загрузки)
			if (file) {
				if (fileNameDisplay) {
					fileNameDisplay.textContent = file.name;
					fileNameDisplay.style.color = "#333";
				}
				console.log("[RENDERER] Файл выбран:", file.name);
			} else {
				// Если пользователь нажал "Отмена" в окне выбора файла
				if (fileNameDisplay) {
					fileNameDisplay.textContent = "Файл не выбран";
					fileNameDisplay.style.color = "#666";
				}
				return;
			}

			if (outputEl) {
				outputEl.textContent = "⏳ Идет импорт и обработка прайс-листа...";
				outputEl.style.color = "black"; // Сбрасываем красный цвет, если была прошлая ошибка
			}

			try {
				const buffer = await file.arrayBuffer();

				const result = await window.excelAPI.importPriceList(buffer, {
					merge: true,
				});

				console.log("[RENDERER] Результат импорта:", result);

				// 🔥 МЯГКОЕ ОБНОВЛЕНИЕ
				await priceManager.refreshAll();

				if (outputEl) {
					outputEl.textContent = `
					✅ Прайс успешно обновлен!
					-----------------------------------
					Добавлено: ${result.stats.added}
					Обновлено: ${result.stats.updated}
					Без изменений: ${result.stats.unchanged}
					Ошибок: ${result.stats.errors}
					-----------------------------------
					Всего позиций: ${result.totalItems}
					Последнее обновление: ${new Date(result.lastUpdate).toLocaleString("ru-RU")}
									`.trim();
				}
			} catch (err) {
				console.error("[RENDERER] Ошибка:", err);
				if (outputEl) {
					outputEl.textContent = `❌ Ошибка импорта:\n${err.message}`;
					outputEl.style.color = "red";
				}
			} finally {
				// 3. Сбрасываем value инпута в самом конце.
				// Имя файла в fileNameDisplay при этом ОСТАНЕТСЯ видимым, так как мы его задали в шаге 1.
				e.target.value = "";
			}
		});
	}
}

async function bootstrap() {
	mountComponents(); // HTML в DOM
	await settingsManager.ensureLoaded();
	settingsManager.onChange(() => {
		populateSelectsFromSettings();
		populateLiveSelectsFromSettings();
	});
	populateSelectsFromSettings();
	await loadJSModules(); // JS модули находят элементы и работают
	populateLiveSelectsFromSettings();
	initFileImport();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bootstrap);
} else {
	bootstrap();
}
