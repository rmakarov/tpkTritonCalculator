const path = require("path");
const { pathToFileURL } = require("url");
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs").promises;

const previewWindows = new Set();
const TEMP_FILE_PREFIX = "tpk_preview";

function registerPdfPreview() {
	ipcMain.handle("pdf:preview", async (event) => {
		const parentWindow = BrowserWindow.fromWebContents(event.sender);
		let tempFilePath = null;
		let previewWindow = null;

		try {
			const pdfData = await event.sender.printToPDF({
				printBackground: true,
				pageSize: "A4",
				preferCSSPageSize: true,
			});
			const pdfBuffer = Buffer.from(pdfData);
			assertPdfBuffer(pdfBuffer);

			tempFilePath = createTempFilePath();
			await fs.writeFile(tempFilePath, pdfBuffer);

			previewWindow = createPreviewWindow(parentWindow);
			previewWindows.add(previewWindow);

			previewWindow.on("closed", () => {
				previewWindows.delete(previewWindow);
				void removeTempFile(tempFilePath);
			});

			await previewWindow.loadURL(pathToFileURL(tempFilePath).href);
			previewWindow.show();

			return { success: true };
		} catch (error) {
			console.error("[PDF Preview] Ошибка генерации предпросмотра:", error);

			if (previewWindow && !previewWindow.isDestroyed()) {
				previewWindow.destroy();
			} else if (tempFilePath) {
				await removeTempFile(tempFilePath);
			}

			return {
				success: false,
				message: error.message || "Не удалось сформировать PDF",
			};
		}
	});
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
		title: "Предпросмотр расчёта",
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

function createTempFilePath() {
	const uniqueSuffix = `${Date.now()}_${process.pid}_${Math.random().toString(16).slice(2)}`;
	return path.join(
		app.getPath("temp"),
		`${TEMP_FILE_PREFIX}_${uniqueSuffix}.pdf`,
	);
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

		console.warn(
			`[PDF Preview] Не удалось удалить временный файл: ${filePath}`,
			error,
		);
	}
}

function delay(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = { registerPdfPreview };
