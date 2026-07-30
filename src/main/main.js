const path = require("path");
const { app, BrowserWindow } = require("electron/main");
const { ipcMain } = require("electron");
const XLSX = require("xlsx");
const fs = require("fs").promises;
const { registerPdfPreview } = require("./pdfPreview");

// ==========================================
// 1. КЛАСС МЕНЕДЖЕРА ПРАЙС-ЛИСТА
// ==========================================
class PriceListManager {
	constructor() {
		// Сохраняем базу в папке данных пользователя (AppData на Windows, Library на Mac)
		this.dbPath = path.join(app.getPath("userData"), "pricelist.json");
		this.data = { lastUpdate: null, items: {} };
	}

	async load() {
		try {
			const fileData = await fs.readFile(this.dbPath, "utf-8");
			this.data = JSON.parse(fileData);
			console.log(
				`[PriceList] ✅ Загружено ${Object.keys(this.data.items).length} позиций`,
			);
		} catch (err) {
			console.log("[PriceList] ⚠️ База не найдена, создаем новую");
			this.data = { lastUpdate: null, items: {} };
		}
		return this.data;
	}

	async save() {
		await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
		await fs.writeFile(
			this.dbPath,
			JSON.stringify(this.data, null, 2),
			"utf-8",
		);
		console.log("[PriceList] 💾 Данные сохранены на диск");
	}

	async importFromBuffer(buffer, options = { merge: true }) {
		try {
			console.log("[PriceList] 📥 Начинаем импорт Excel...");

			const workbook = XLSX.read(new Uint8Array(buffer), {
				type: "array",
				defval: "",
				raw: false,
			});
			const worksheet = workbook.Sheets[workbook.SheetNames[0]];
			const jsonData = XLSX.utils.sheet_to_json(worksheet, {
				defval: "",
				raw: false,
				header: 1,
			});

			if (jsonData.length === 0) throw new Error("Файл пустой");

			const headers = jsonData[0].map((h) => String(h).trim().toLowerCase());
			const idIndex = headers.findIndex(
				(h) => h.includes("п.н") || h === "п.н.",
			);
			const nameIndex = headers.findIndex((h) => h.includes("наименование"));
			const priceIndex = headers.findIndex((h) => h.includes("цена"));

			if (idIndex === -1 || nameIndex === -1 || priceIndex === -1) {
				throw new Error(
					`Не найдены колонки "п.н", "Наименование" или "цена". Найдено: ${headers.join(", ")}`,
				);
			}

			const stats = { added: 0, updated: 0, unchanged: 0, errors: 0 };
			const newItems = {};

			for (let i = 1; i < jsonData.length; i++) {
				const row = jsonData[i];
				if (!row || row.every((cell) => !cell)) continue; // Пропуск пустых строк

				try {
					const id = String(row[idIndex]).trim();
					const name = String(row[nameIndex]).trim();
					const price = parseFloat(
						String(row[priceIndex]).replace(/,/g, ".").replace(/\s/g, ""),
					);

					if (!id || !name || isNaN(price))
						throw new Error("Некорректные данные");

					const existingItem = this.data.items[id];
					if (existingItem) {
						if (existingItem.price !== price || existingItem.name !== name) {
							newItems[id] = {
								id,
								name,
								price,
								updatedAt: new Date().toISOString(),
								previousPrice: existingItem.price,
							};
							stats.updated++;
						} else {
							newItems[id] = existingItem;
							stats.unchanged++;
						}
					} else {
						newItems[id] = {
							id,
							name,
							price,
							createdAt: new Date().toISOString(),
						};
						stats.added++;
					}
				} catch (e) {
					stats.errors++;
					console.warn(`[PriceList] Пропуск строки ${i + 1}:`, e.message);
				}
			}

			if (options.merge) {
				this.data.items = { ...this.data.items, ...newItems };
			} else {
				this.data.items = newItems;
			}

			this.data.lastUpdate = new Date().toISOString();
			await this.save();

			return {
				stats,
				totalItems: Object.keys(this.data.items).length,
				lastUpdate: this.data.lastUpdate,
			};
		} catch (err) {
			console.error("[PriceList] ❌ Ошибка импорта:", err);
			throw err;
		}
	}

	getAll() {
		return Object.values(this.data.items).sort(
			(a, b) => parseInt(a.id) - parseInt(b.id),
		);
	}
}

// ==========================================
// 2. СОЗДАНИЕ ЭКЗЕМПЛЯРА (ОДИН РАЗ НА ВСЁ ПРИЛОЖЕНИЕ)
// ==========================================
const priceManager = new PriceListManager();
registerPdfPreview();

// ==========================================
// 3. НАСТРОЙКА IPC (МОСТЫ ДЛЯ RENDERER)
// ==========================================
ipcMain.handle("pricelist:load", async () => {
	return await priceManager.load();
});

ipcMain.handle("pricelist:import", async (event, buffer, options) => {
	return await priceManager.importFromBuffer(buffer, options);
});

ipcMain.handle("pricelist:getAll", async () => {
	const items = priceManager.getAll();
	console.log(
		`[MAIN] pricelist:getAll вызван. Возвращаю ${items.length} позиций.`,
	); // <-- ДОБАВИТЬ ЭТО
	return items;
});

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
		win.loadFile(path.join(__dirname, "../index.html"));
	}

	win.webContents.openDevTools(); // REMOVE FOR BUILDING !!!
};

/*ipcMain.handle('read-excel', async (event, buffer) => {
  try {
    console.log(path.join(__dirname, 'assets', 'icon.ico'))
    // buffer — это ArrayBuffer, передаём его напрямую в XLSX
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('[MAIN] Данные прочитаны:', data); // 👈 лог в консоли main
    return data;
  } catch (err) {
    console.error('[MAIN] Ошибка чтения:', err);
    throw err;
  }
});*/

app.whenReady().then(() => {
	/*const userDataPath = app.getPath('userData'); //Информация о пути к папке с данными на диске
  console.log('📁 Папка данных пользователя:', userDataPath);
  console.log(' Файл базы будет здесь:', path.join(userDataPath, 'pricelist.json'));*/

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
