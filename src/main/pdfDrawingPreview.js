const path = require("path");
const { pathToFileURL } = require("url");
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs").promises;

const previewWindows = new Set();
const TEMP_FILE_PREFIX = "tpk_drawing_preview";

function registerPdfDrawingPreview() {
	ipcMain.handle("pdf:drawingPreview", async (event, htmlContent) => {
		const parentWindow = BrowserWindow.fromWebContents(event.sender);
		let tempPdfPath = null;
		let tempHtmlPath = null;
		let previewWindow = null;
		let hiddenWindow = null;

		try {
			// 1. Создаём временный HTML-файл с контентом
			tempHtmlPath = createTempHtmlPath();
			const fullHtml = wrapHtmlWithStyles(htmlContent);
			await fs.writeFile(tempHtmlPath, fullHtml, "utf8");

			// 2. Создаём СКРЫТОЕ окно для рендеринга HTML
			hiddenWindow = new BrowserWindow({
				show: false,
				webPreferences: {
					offscreen: true, // Экономия ресурсов
					contextIsolation: true,
					nodeIntegration: false,
				},
			});

			// 3. Загружаем HTML в скрытое окно
			await hiddenWindow.loadFile(tempHtmlPath);

			// 4. Ждём полной загрузки (шрифты, изображения)
			await delay(500); // Можно заменить на более умное ожидание

			// 5. Генерируем PDF из скрытого окна
			const pdfData = await hiddenWindow.webContents.printToPDF({
				printBackground: true,
				pageSize: "A4",
				preferCSSPageSize: true,
			});

			const pdfBuffer = Buffer.from(pdfData);
			assertPdfBuffer(pdfBuffer);

			// 6. Закрываем скрытое окно
			hiddenWindow.destroy();
			hiddenWindow = null;

			// 7. Сохраняем PDF во временный файл
			tempPdfPath = createTempPdfPath();
			await fs.writeFile(tempPdfPath, pdfBuffer);

			// 8. Создаём окно превью (как в вашем оригинальном коде)
			previewWindow = createPreviewWindow(parentWindow);
			previewWindows.add(previewWindow);

			previewWindow.on("closed", () => {
				previewWindows.delete(previewWindow);
				void removeTempFile(tempPdfPath);
				void removeTempFile(tempHtmlPath);
			});

			await previewWindow.loadURL(pathToFileURL(tempPdfPath).href);
			previewWindow.show();

			return { success: true };
		} catch (error) {
			console.error("[PDF Drawing Preview] Ошибка:", error);

			if (previewWindow && !previewWindow.isDestroyed()) {
				previewWindow.destroy();
			}
			if (hiddenWindow && !hiddenWindow.isDestroyed()) {
				hiddenWindow.destroy();
			}
			if (tempPdfPath) await removeTempFile(tempPdfPath);
			if (tempHtmlPath) await removeTempFile(tempHtmlPath);

			return {
				success: false,
				message: error.message || "Не удалось сформировать PDF чертежа",
			};
		}
	});
}

// Оборачиваем HTML в полноценную страницу со стилями
function wrapHtmlWithStyles(htmlContent) {
	return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        /* Здесь можно добавить специфичные стили для чертежей */
        .drawing-container {
            width: 100%;
        }
        .drawing-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 10mm;
        }
        .drawing-image {
            max-width: 100%;
            height: auto;
        }
        /* Добавьте сюда любые другие стили для чертежей */
    </style>
</head>
<body>
    <div class="drawing-container">
        ${htmlContent}
    </div>
</body>
</html>`;
}

function createPreviewWindow(parentWindow) {
	const iconPath = path.join(__dirname, "../public/assets", "icon.ico");

	const previewWindow = new BrowserWindow({
		...(parentWindow ? { parent: parentWindow } : {}),
		modal: Boolean(parentWindow),
		show: false,
		width: 1000,
		height: 800,
		minWidth: 720,
		minHeight: 560,
		title: "Предпросмотр чертежа",
		icon: iconPath,
		autoHideMenuBar: true,
		webPreferences: {
			plugins: true,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	previewWindow.on("page-title-updated", (event) => {
		event.preventDefault();
	});
	previewWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

	return previewWindow;
}

function createTempPdfPath() {
	const uniqueSuffix = `${Date.now()}_${process.pid}_${Math.random().toString(16).slice(2)}`;
	return path.join(app.getPath("temp"), `${TEMP_FILE_PREFIX}_${uniqueSuffix}.pdf`);
}

function createTempHtmlPath() {
	const uniqueSuffix = `${Date.now()}_${process.pid}_${Math.random().toString(16).slice(2)}`;
	return path.join(app.getPath("temp"), `tpk_drawing_${uniqueSuffix}.html`);
}

function assertPdfBuffer(pdfBuffer) {
	const signature = pdfBuffer.subarray(0, 5).toString("ascii");
	if (pdfBuffer.length < 5 || signature !== "%PDF-") {
		throw new Error("Electron сформировал некорректный PDF");
	}
}

async function removeTempFile(filePath, attemptsLeft = 5) {
	try {
		await fs.unlink(filePath);
	} catch (error) {
		if (error.code === "ENOENT") return;
		if (attemptsLeft > 1) {
			await delay(200);
			await removeTempFile(filePath, attemptsLeft - 1);
			return;
		}
		console.warn(`[PDF Drawing Preview] Не удалось удалить: ${filePath}`, error);
	}
}

function delay(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = { registerPdfDrawingPreview };
