// src/renderer/priceManager.js

class PriceManager {
	constructor() {
		this.itemsMap = new Map();
		this.itemsArray = [];
		this.isLoaded = false;
		this.loadPromise = null;
	}

	async ensureLoaded() {
		if (this.isLoaded || this.loadPromise) {
			return this.loadPromise;
		}

		this.loadPromise = (async () => {
			try {
				console.log("[PriceManager] Загрузка прайс-листа...");
				const items = await window.excelAPI.getAllItems();

				this.itemsArray = items;
				this.itemsMap.clear();

				items.forEach((item) => {
					this.itemsMap.set(item.name, item.price);
				});

				this.isLoaded = true;
				console.log(`[PriceManager] Загружено ${items.length} позиций.`);
				return this.itemsArray;
			} catch (error) {
				console.error("[PriceManager] Ошибка загрузки прайса:", error);
				throw error;
			}
		})();

		return this.loadPromise;
	}

	getPrice(itemName) {
		return this.itemsMap.get(itemName);
	}

	getAllItems() {
		return this.itemsArray;
	}

	/**
	 * Заполнить <datalist> данными из прайса
	 * @param {string} datalistId - ID элемента datalist
	 * @param {HTMLElement|Document} context - Контейнер, в котором искать (по умолчанию document)
	 */
	populateDatalist(datalistId, context = document) {
		// ✅ Теперь ищем внутри context, а не только в document
		const datalist = context.getElementById
			? context.getElementById(datalistId)
			: context.querySelector(`#${datalistId}`);

		if (!datalist) {
			console.warn(`[PriceManager] Datalist с id="${datalistId}" не найден`);
			return;
		}

		datalist.innerHTML =
			'<option value="">Выберите или введите товар...</option>';

		this.itemsArray.forEach((item) => {
			const option = document.createElement("option");
			option.value = item.name;
			option.textContent = `${item.price.toLocaleString("ru-RU")} руб.`;
			datalist.appendChild(option);
		});
	}
}

export const priceManager = new PriceManager();
