class SettingsManager {
	constructor() {
		this.settings = {};
		this.isLoaded = false;
	}

	_isSettingsValid(settings) {
		return (
			settings &&
			typeof settings === "object" &&
			settings.sections &&
			typeof settings.sections === "object" &&
			Object.keys(settings.sections).length > 0
		);
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
}

export const settingsManager = new SettingsManager();
