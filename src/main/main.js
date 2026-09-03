const path = require("path");
const { app, BrowserWindow } = require("electron/main");
const { ipcMain } = require("electron");
const { PriceListManager } = require("./priceListManager");
const { SettingsManager } = require("./settingsManager");
const { registerPdfPreview } = require("./pdfPreview");
const { registerPdfDrawingPreview } = require("./pdfDrawingPreview");
const { ensureTrialAccess, scheduleTrialExpiration } = require("./trialLicense");
const { ensureTrialTestAccess, scheduleTrialTestExpiration } = require("./trialLicenseTest");

// КРИТИЧНО: Обработчик ошибок main process
process.on("uncaughtException", (error) => {
	console.error("❌ [Main Process] Uncaught Exception:", error);
	console.error("Stack:", error.stack);

	// НЕ показываем alert — просто логируем
	// В production можно отправлять в Sentry/лог-файл
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ [Main Process] Unhandled Rejection:", reason);
});

// ==========================================
// 1. СОЗДАНИЕ ЭКЗЕМПЛЯРА (ОДИН РАЗ НА ВСЁ ПРИЛОЖЕНИЕ)
// ==========================================
const priceManager = new PriceListManager();
const settingsManager = new SettingsManager();
registerPdfPreview();
registerPdfDrawingPreview();

// ==========================================
// 2. НАСТРОЙКА IPC (МОСТЫ ДЛЯ RENDERER)
// ==========================================
ipcMain.handle("pricelist:load", async () => {
	return await priceManager.load();
});

ipcMain.handle("pricelist:import", async (event, buffer, options) => {
	return await priceManager.importFromBuffer(buffer, options);
});

ipcMain.handle("pricelist:getAll", async () => {
	const items = priceManager.getAll();
	console.log(`[MAIN] pricelist:getAll вызван. Возвращаю ${items.length} позиций.`); // <-- ДОБАВИТЬ ЭТО
	return items;
});

ipcMain.handle("pricelist:clear", async () => {
	try {
		await priceManager.clear();
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("settings:get", async () => {
	return await settingsManager.get();
});

ipcMain.handle("settings:getValue", async (_event, sectionKey, fieldKey) => {
	return settingsManager.getValue(sectionKey, fieldKey);
});

ipcMain.handle("settings:setValue", async (_event, sectionId, fieldKey, value) => {
	return await settingsManager.setValue(sectionId, fieldKey, value);
});

ipcMain.handle("settings:setOptionValue", async (_, sectionKey, fieldKey, optionIndex, value) => {
	return await settingsManager.setOptionValue(sectionKey, fieldKey, optionIndex, value);
});

ipcMain.handle("settings:reset", async () => settingsManager.resetToDefaults());

ipcMain.handle("settings:canCalculate", async () => settingsManager.canCalculate());

ipcMain.handle("settings:removeSection", async (_e, key) => settingsManager.removeSection(key));
ipcMain.handle("settings:removeField", async (_e, s, f) => settingsManager.removeField(s, f));

const createWindow = () => {
	const iconPath = path.join(__dirname, "../public/assets", "icon.ico");
	const win = new BrowserWindow({
		show: false, // 👈 ВАЖНО: скрываем окно до полной загрузки, чтобы не было "мигания"
		minWidth: 940,
		minHeight: 600,
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"), // 👈 ВАЖНО!
			contextIsolation: true,
			nodeIntegration: false,
		},
	});
	// Разворачиваем окно на весь экран (с учетом панели задач)
	win.maximize();

	// Показываем окно только когда оно готово к отображению
	win.once("ready-to-show", () => {
		win.show();
	});

	// 1. РЕЖИМ РАЗРАБОТКИ (npm run dev)
	// Vite автоматически подставляет этот URL, если запущен dev-сервер
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		win.webContents.openDevTools(); // Открываем консоль для удобства
	}
	// 2. РЕЖИМ ПРОДАКШЕНА (npm run build)
	else {
		// index.html лежит в КОРНЕ проекта, а main.js скомпилирован в dist-electron/
		// Поэтому мы поднимаемся на одну папку вверх (../)
		win.loadFile(path.join(__dirname, "../dist/index.html"));
	}
};

app.whenReady().then(async () => {
	if (!(await ensureTrialAccess())) {
		app.quit();
		return;
	}
	if (!(await ensureTrialTestAccess())) {
		app.quit();
		return;
	}
	scheduleTrialExpiration();
	scheduleTrialTestExpiration();

	/*const userDataPath = app.getPath('userData'); //Информация о пути к папке с данными на диске
console.log('📁 Папка данных пользователя:', userDataPath);
console.log(' Файл базы будет здесь:', path.join(userDataPath, 'pricelist.json'));*/

	// 🔥 1. ГАРАНТИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ НАСТРОЕК (ВСЕГДА ПЕРВЫМ)
	try {
		await settingsManager.init();
		console.log("[Main] ✅ settings.json готов к использованию");
	} catch (err) {
		// Даже если что-то пошло совсем не так — пытаемся создать дефолт
		console.error("[Main] ❌ Критическая ошибка настроек:", err);
		// Здесь приложение не должно стартовать без настроек — они критичны
		// Либо можно решить иначе, если настройки не критичны
	}

	// 🔥 АВТОМАТИЧЕСКАЯ ЗАГРУЗКА КЭША ПРИ СТАРТЕ
	try {
		await priceManager.load();
		console.log("[Main] ✅ Кэш прайс-листа успешно загружен с диска.");
	} catch (err) {
		console.log("[Main] ℹ️ Кэш не найден (это нормально при самом первом запуске).");
	}

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
