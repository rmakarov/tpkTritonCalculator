const path = require("path");
const fs = require("fs").promises;
const XLSX = require("xlsx");
const { app } = require("electron/main");

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
		return Object.values(this.data.items).sort((a, b) => {
			const idA = parseInt(a.id) || 0;
			const idB = parseInt(b.id) || 0;
			return idA - idB;
		});
	}

	getById(id) {
		return this.data.items[id] || null;
	}
}
module.exports = { PriceListManager };
