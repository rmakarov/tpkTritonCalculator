import { priceManager } from "./priceManager.js";

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
                fileNameDisplay.style.color = '#333';
            }
            console.log("[RENDERER] Файл выбран:", file.name);
        } else {
            // Если пользователь нажал "Отмена" в окне выбора файла
            if (fileNameDisplay) {
                fileNameDisplay.textContent = 'Файл не выбран';
                fileNameDisplay.style.color = '#666';
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