// priceManager.js

import { CustomAutocomplete } from './customAutocomplete.js';

class PriceManager {
    constructor() {
        this.itemsMap = new Map();
        this.autocompletes = new Map(); 
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
                // Убедитесь, что window.excelAPI доступен в вашем контексте Electron
                const items = await window.excelAPI.getAllItems();

                this.itemsArray = items;
                this.itemsMap.clear();

                items.forEach((item) => {
                    this.itemsMap.set(item.name, item.price);
                });

                this.isLoaded = true;
                console.log(`[PriceManager] ✅ Загружено ${items.length} позиций.`);
                return this.itemsArray;
            } catch (error) {
                console.error("[PriceManager] ❌ Ошибка загрузки прайса:", error);
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

    resetCache() {
        this.isLoaded = false;
        this.loadPromise = null;
        this.itemsArray = [];
        this.itemsMap.clear();
        // Также очищаем инстансы автокомплита при сбросе кэша
        this.autocompletes.forEach(autocomplete => autocomplete.destroy());
        this.autocompletes.clear();
        console.log("[PriceManager] 🔄 Кэш и автокомплиты очищены.");
    }

    populateAutocomplete(inputId, context = document) {
        const inputElement = context.getElementById ? context.getElementById(inputId) : context.querySelector(`#${inputId}`);
        if (!inputElement) return console.warn(`[PriceManager] ⚠️ Input "${inputId}" не найден`);

        if (this.autocompletes.has(inputId)) {
            this.autocompletes.get(inputId).updateOptions(this.itemsArray);
        } else {
            const autocomplete = new CustomAutocomplete(inputElement, this.itemsArray);
            this.autocompletes.set(inputId, autocomplete);
        }
        console.log(`[PriceManager] ✅ Autocomplete "${inputId}" инициализирован (${this.itemsArray.length} опций)`);
    }

    populateFilteredAutocomplete(inputId, context = document, filterParams = []) {
        const inputElement = context.getElementById ? context.getElementById(inputId) : context.querySelector(`#${inputId}`);
        if (!inputElement) return console.warn(`[PriceManager] ⚠️ Input "${inputId}" не найден`);

        const normalizedParams = Array.isArray(filterParams) 
            ? filterParams.map(param => param.toLowerCase()) 
            : [];

        const filteredItems = this.itemsArray.filter(item => {
            if (normalizedParams.length === 0) return true; 
            const lowerName = item.name.toLowerCase();
            return normalizedParams.some(param => lowerName.includes(param));
        });

        if (this.autocompletes.has(inputId)) {
            this.autocompletes.get(inputId).updateOptions(filteredItems);
        } else {
            const autocomplete = new CustomAutocomplete(inputElement, filteredItems);
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
}

export const priceManager = new PriceManager();