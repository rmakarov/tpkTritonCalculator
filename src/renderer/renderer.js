// Выбор файла
document.getElementById("xlf").addEventListener("change", async (e) => {
	const file = e.target.files[0];
	if (!file) return;

	console.log("[RENDERER] Файл выбран:", file.name);

	// Очищаем предыдущий вывод
	const outputEl = document.getElementById("output");
	outputEl.textContent = "⏳ Идет импорт и обработка прайс-листа...";

	try {
		const buffer = await file.arrayBuffer();

		const result = await window.excelAPI.importPriceList(buffer, {
			merge: true,
		});

		console.log("[RENDERER] Результат импорта:", result);

		// Выводим результат в DOM вместо alert
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

		// Сбрасываем value инпута, чтобы можно было выбрать тот же файл повторно
		e.target.value = "";
	} catch (err) {
		console.error("[RENDERER] Ошибка:", err);
		outputEl.textContent = `❌ Ошибка импорта:\n${err.message}`;
		outputEl.style.color = "red";
		e.target.value = "";
	}
});
