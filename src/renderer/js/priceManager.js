// priceManager.js

import { CustomAutocomplete } from "./customAutocomplete.js";

class PriceManager {
	constructor() {
		this.itemsMap = new Map();
		this.autocompletes = new Map();
		this.itemsArray = [];
		this.isLoaded = false;
		this.loadPromise = null;
	}

	async ensureLoaded() {
		// 1. Если данные уже успешно загружены И они не пустые, возвращаем их мгновенно
		if (this.isLoaded && this.itemsArray.length > 0) {
			return this.itemsArray;
		}

		// 2. Если загрузка прямо сейчас идет в фоне, ждем её завершения
		if (this.loadPromise) {
			return this.loadPromise;
		}

		// 3. Иначе запускаем загрузку
		this.loadPromise = (async () => {
			try {
				console.log("[PriceManager] 🔄 Запрос свежих данных из Main процесса...");
				const rawItems = await window.excelAPI.getAllItems();

				// 4. КРИТИЧЕСКИ ВАЖНО: Если данных нет, НЕ помечаем isLoaded как true
				if (!rawItems || rawItems.length === 0) {
					console.warn("[PriceManager] ⚠️ Прайс-лист пуст. Ожидаем загрузки Excel-файла пользователем.");
					this.itemsArray = [];
					this.itemsMap.clear();
					this.isLoaded = false; // <-- Позволяет попробовать снова позже!
					return this.itemsArray;
				}

				// Фильтрация битых строк
				this.itemsArray = rawItems.filter((item) => item && typeof item.name === "string" && item.name.trim() !== "");

				this.itemsMap.clear();
				this.itemsArray.forEach((item) => {
					this.itemsMap.set(item.name, item.price);
				});

				this.isLoaded = true;
				console.log(`[PriceManager] ✅ Успешно загружено ${this.itemsArray.length} позиций.`);
				return this.itemsArray;
			} catch (error) {
				console.error("[PriceManager] ❌ Ошибка загрузки прайса:", error);
				this.isLoaded = false;
				throw error;
			} finally {
				// 5. ВСЕГДА сбрасываем промис.
				// Если результат был пустым или произошла ошибка, следующий вызов
				// ensureLoaded() создаст новый промис и попытается загрузить данные снова.
				this.loadPromise = null;
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

	async resetCache() {
		// 1. Удаляем файл с диска через бэкенд
		try {
			const result = await window.excelAPI.clearPriceList();
			if (!result.success) {
				console.error("[PriceManager] ❌ Ошибка удаления файла:", result.error);
				throw new Error(result.error);
			}
			console.log("[PriceManager] ✅ Файл pricelist.json удалён с диска");
		} catch (error) {
			console.error("[PriceManager] ❌ Ошибка при очистке файла:", error);
			throw error;
		}

		// 2. Очищаем кэш в памяти
		this.isLoaded = false;
		this.loadPromise = null;
		this.itemsArray = [];
		this.itemsMap.clear();

		// 3. Очищаем автокомплиты, но НЕ уничтожаем их
		for (const [inputId, autocomplete] of this.autocompletes.entries()) {
			autocomplete.updateOptions([]); // Просто очищаем список опций
		}

		console.log("[PriceManager] 🔄 Кэш очищен, автокомплиты опустошены");
	}

	clearAutocompleteInputs() {
		this.autocompletes.forEach((autocomplete) => {
			if (autocomplete.input) {
				autocomplete.input.value = "";
			}
		});
	}

	// 🔥 НОВЫЙ МЕТОД: Мягкое обновление данных без уничтожения интерфейса
	async refreshAll() {
		console.log("[PriceManager] 🔄 Загрузка свежих данных и обновление всех списков...");
		try {
			const rawItems = await window.excelAPI.getAllItems();

			this.itemsArray = rawItems.filter((item) => item && typeof item.name === "string" && item.name.trim() !== "");

			this.itemsMap.clear();
			this.itemsArray.forEach((item) => {
				this.itemsMap.set(item.name, item.price);
			});

			this.isLoaded = true;
			this.loadPromise = null;

			// 🔥 Магия: проходим по всем живым автокомплитам и обновляем их
			// с учетом их СОБСТВЕННЫХ сохраненных фильтров!
			for (const [inputId, autocomplete] of this.autocompletes.entries()) {
				const filteredItems = this.itemsArray.filter((item) => {
					if (autocomplete.filterParams.length === 0) return true;
					const lowerName = item.name.toLowerCase();
					return autocomplete.filterParams.some((param) => lowerName.includes(param));
				});
				autocomplete.updateOptions(filteredItems);
			}

			console.log(`[PriceManager] ✅ Данные обновлены. Списки перестроены (${this.autocompletes.size} шт.)`);
		} catch (error) {
			console.error("[PriceManager] ❌ Ошибка при обновлении данных:", error);
		}
	}

	// 🔥 Очистка зомби
	_cleanupZombie(inputId) {
		if (this.autocompletes.has(inputId)) {
			const autocomplete = this.autocompletes.get(inputId);
			// Если инпут удален из DOM или не совпадает — удаляем зомби
			if (!autocomplete.input || !document.contains(autocomplete.input)) {
				console.log(`[PriceManager] 🧹 Удален зомби-autocomplete "${inputId}"`);
				autocomplete.destroy();
				this.autocompletes.delete(inputId);
			}
		}
	}

	// 🔥 ОБНОВЛЕННЫЙ МЕТОД: + сохранение filterParams
	populateAutocomplete(inputId, context = document) {
		const inputElement = context.getElementById ? context.getElementById(inputId) : context.querySelector(`#${inputId}`);

		if (!inputElement) return console.warn(`[PriceManager] ⚠️ Input "${inputId}" не найден`);

		// 1. Сначала очищаем зомби (ОЧЕНЬ ВАЖНО для переключения вкладок)
		this._cleanupZombie(inputId);

		// 2. Обновляем или создаем, передавая пустой массив фильтров []
		if (this.autocompletes.has(inputId)) {
			const ac = this.autocompletes.get(inputId);
			ac.filterParams = []; // Сбрасываем фильтр, так как это полный список
			ac.updateOptions(this.itemsArray);
		} else {
			const autocomplete = new CustomAutocomplete(inputElement, this.itemsArray, []); // <-- передаем []
			this.autocompletes.set(inputId, autocomplete);
		}

		console.log(`[PriceManager] ✅ Autocomplete "${inputId}" инициализирован (${this.itemsArray.length} опций)`);
	}

	// 🔥 ОБНОВЛЕННЫЙ МЕТОД: + сохранение filterParams
	populateFilteredAutocomplete(inputId, context = document, filterParams = []) {
		const inputElement = context.getElementById ? context.getElementById(inputId) : context.querySelector(`#${inputId}`);

		if (!inputElement) return console.warn(`[PriceManager] ⚠️ Input "${inputId}" не найден`);

		const normalizedParams = Array.isArray(filterParams) ? filterParams.map((param) => param.toLowerCase()) : [];

		const filteredItems = this.itemsArray.filter((item) => {
			if (normalizedParams.length === 0) return true;
			const lowerName = item.name.toLowerCase();
			return normalizedParams.some((param) => lowerName.includes(param));
		});

		// 1. Сначала очищаем зомби (ОЧЕНЬ ВАЖНО)
		this._cleanupZombie(inputId);

		// 2. Обновляем или создаем, сохраняя нормализованные параметры фильтра
		if (this.autocompletes.has(inputId)) {
			const ac = this.autocompletes.get(inputId);
			ac.filterParams = normalizedParams; // 🔥 СОХРАНЯЕМ для будущего refreshAll()
			ac.updateOptions(filteredItems);
		} else {
			const autocomplete = new CustomAutocomplete(inputElement, filteredItems, normalizedParams); // <-- передаем
			this.autocompletes.set(inputId, autocomplete);
		}

		console.log(`[PriceManager] ✅ Autocomplete "${inputId}" обновлен (отфильтровано: ${filteredItems.length} из ${this.itemsArray.length})`);
	}

	destroyAutocomplete(inputId) {
		if (this.autocompletes.has(inputId)) {
			this.autocompletes.get(inputId).destroy();
			this.autocompletes.delete(inputId);
		}
	}

	// 🔥 НОВЫЙ МЕТОД: массовая очистка
	destroyAll() {
		this.autocompletes.forEach((autocomplete) => autocomplete.destroy());
		this.autocompletes.clear();
		console.log("[PriceManager]  Все экземпляры автокомплита уничтожены.");
	}
}

export const priceManager = new PriceManager();
