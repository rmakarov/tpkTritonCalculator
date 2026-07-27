// Выбор файла
document.getElementById("xlf").addEventListener("change", async (e) => {
	const file = e.target.files[0];
	if (!file) return;

	console.log("[RENDERER] Файл выбран:", file.name);

	try {
		const buffer = await file.arrayBuffer();

		// Импортируем с опцией слияния
		const result = await window.excelAPI.importPriceList(buffer, {
			merge: true,
		});

		console.log("[RENDERER] Результат импорта:", result);

		// Показываем статистику
		alert(`
    ✅ Прайс обновлен!
    Добавлено: ${result.stats.added}
    Обновлено: ${result.stats.updated}
    Без изменений: ${result.stats.unchanged}
    Ошибок: ${result.stats.errors}
    Всего позиций: ${result.totalItems}
    Обновлено: ${new Date(result.lastUpdate).toLocaleString("ru-RU")}
    `);
	} catch (err) {
		console.error("[RENDERER] Ошибка:", err);
		alert("❌ Ошибка импорта:\n" + err.message);
	}
});
