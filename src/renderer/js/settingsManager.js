export const CALCULATOR_DEFAULTS = {
	distanceBetweenPlanks: 60,
	wicketClearanceBetweenGround: 100,
	wicketClearanceInFrame: 6,
	wicketClearanceBetweenPosts: 14,
	gateClearanceBetweenGround: 100,
	gateClearanceBetweenPosts: 18,
	corrugatedSheetWidth: 1100,
	threeDmeshWidth: 2500,
	fenceWidth: 110,
	wicketPostDepth: 1200,
	gatePostDepth: 1500,
};
class SettingsManager {
	constructor() {
		this.settings = {};
		this.isLoaded = false;
		this.loadPromise = null;
		this._changeHandlers = []; // ⬅️ массив вместо одной функции
	}

	/**
	 * Зарегистрировать обработчик изменений.
	 * @returns {Function} функция отписки
	 */
	onChange(handler) {
		this._changeHandlers.push(handler);
		return () => {
			this._changeHandlers = this._changeHandlers.filter((h) => h !== handler);
		};
	}

	_notifyUI(payload) {
		for (const handler of this._changeHandlers) {
			try {
				handler(payload);
			} catch (err) {
				console.error("[SettingsManager] Ошибка в обработчике onChange:", err);
			}
		}
	}

	_isSettingsValid(settings) {
		return settings && typeof settings === "object" && settings.sections && typeof settings.sections === "object" && Object.keys(settings.sections).length > 0;
	}

	async ensureLoaded() {
		if (this.isLoaded && this._isSettingsValid(this.settings)) {
			return this.settings;
		}

		if (this.loadPromise) {
			return this.loadPromise;
		}

		this.loadPromise = (async () => {
			try {
				console.log("[SettingsManager] 🔄 Запрос данных из Main процесса...");
				const loadedSettings = await window.settings.get();

				if (!this._isSettingsValid(loadedSettings)) {
					console.warn("[SettingsManager] ⚠️ Настройки пусты или невалидны.");
					this.settings = {};
					this.isLoaded = false;
					return this.settings;
				}

				this.settings = loadedSettings;
				this.isLoaded = true;
				console.log("[SettingsManager] ✅ Настройки успешно загружены.");
				return this.settings;
			} catch (error) {
				console.error("[SettingsManager] ❌ Ошибка загрузки:", error);
				this.isLoaded = false;
				throw error;
			} finally {
				this.loadPromise = null;
			}
		})();

		return this.loadPromise;
	}

	getAllSettings() {
		return this.settings;
	}

	getValue(sectionKey, fieldKey) {
		return this.settings?.sections?.[sectionKey]?.fields?.[fieldKey]?.value;
	}

	getField(sectionKey, fieldKey) {
		return this.settings?.sections?.[sectionKey]?.fields?.[fieldKey];
	}

	getCalculatorConstant(fieldKey) {
		return this.getValue("calculatorConstants", fieldKey) ?? CALCULATOR_DEFAULTS[fieldKey];
	}

	/**
	 * Установить значение поля и сразу обновить локальный кеш.
	 */
	async setValue(sectionKey, fieldKey, value) {
		// IPC-вызов в main, возвращает обновлённые данные
		const updatedData = await window.settings.setValue(sectionKey, fieldKey, value);

		// ⬇️ защита от затирания кеша
		if (this._isSettingsValid(updatedData)) {
			this.settings = updatedData;
		} else {
			console.warn("[SettingsManager] ⚠️ Main вернул невалидные данные, кеш не обновлён");
			// При желании можно сделать reload:
			// this.isLoaded = false;
			// await this.ensureLoaded();
		}

		// Обновляем кеш сразу из ответа main-процесса
		this._notifyUI({ type: "value", sectionKey, fieldKey, value });
		this.isLoaded = true;
		this.loadPromise = null;

		console.log(`[SettingsManager] ✅ Кеш обновлён после setValue: ${sectionKey}.${fieldKey}`);
		return this.settings;
	}

	/**
	 * Установить элемент options и сразу обновить локальный кеш.
	 */
	async setOptionValue(sectionKey, fieldKey, optionIndex, value) {
		const updatedData = await window.settings.setOptionValue(sectionKey, fieldKey, optionIndex, value);

		// ⬇️ защита от затирания кеша
		if (this._isSettingsValid(updatedData)) {
			this.settings = updatedData;
		} else {
			console.warn("[SettingsManager] ⚠️ Main вернул невалидные данные, кеш не обновлён");
			// При желании можно сделать reload:
			// this.isLoaded = false;
			// await this.ensureLoaded();
		}

		this._notifyUI({
			type: "option",
			sectionKey,
			fieldKey,
			optionIndex,
			value,
		});
		this.isLoaded = true;
		this.loadPromise = null;

		console.log(`[SettingsManager] ✅ Кеш обновлён после setOptionValue: ${sectionKey}.${fieldKey}[${optionIndex}]`);
		return this.settings;
	}

	/**
	 * Сбросить все настройки и обновить кеш.
	 */
	async reset() {
		const updatedData = await window.settings.reset();

		if (this._isSettingsValid(updatedData)) {
			this.settings = updatedData;
		}
		this.isLoaded = true;
		this.loadPromise = null;
		this._notifyUI({ type: "reset" });

		console.log("[SettingsManager] ✅ Кеш обновлён после reset");
		return this.settings;
	}

	/**
	 * Принудительно инвалидировать кеш (на случай, если что-то пошло не так).
	 */
	invalidateCache() {
		this.isLoaded = false;
		this.settings = {};
		this.loadPromise = null;
		this._notifyUI({ type: "invalidate" });
		console.log("[SettingsManager] 🗑️ Кеш инвалидирован");
	}
}

export const settingsManager = new SettingsManager();
