// settings.storage.js

const path = require("path");
const fs = require("fs").promises;
const { app } = require("electron/main");

// ==========================================
// ДЕФОЛТНЫЕ НАСТРОЙКИ
// ==========================================
function createDefaultSettings() {
	return {
		version: 1,
		sections: {
			calculatorConstants: {
				title: "Константы расчётов",
				fields: {
					wicketPostDepth: {
						title: "Заглубление столба калитки",
						type: "number",
						defaultValue: 1200,
						value: 1200,
					},
					gatePostDepth: {
						title: "Заглубление столба ворот",
						type: "number",
						defaultValue: 1500,
						value: 1500,
					},
					threeDmeshWidth: {
						title: "Ширина листа 3D сетки",
						type: "number",
						defaultValue: 2500,
						value: 2500,
					},
					corrugatedSheetWidth: {
						title: "Ширина профлиста",
						type: "number",
						defaultValue: 1100,
						value: 1100,
					},
					fenceWidth: {
						title: "Ширина штакетника",
						type: "number",
						defaultValue: 110,
						value: 110,
					},
					fenceSteps: {
						title: "Шаг между штакетником",
						type: "select",
						options: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
						defaultValue: 30,
						value: 30,
					},
				},
			},
			wicketSettings: {
				title: "Параметры калитки",
				fields: {
					wicketWidth: {
						title: "Ширина калитки",
						type: "select",
						options: [1000, 1250, 1500, 1750, 2000],
						value: null,
					},
					wicketHeight: {
						title: "Высота калитки",
						type: "select",
						options: [1030, 1230, 1530, 1730, 1930, 2030, 2230, 2430],
						value: null,
					},
				},
			},
			gateSettings: {
				title: "Параметры ворот",
				fields: {
					gateWidth: {
						title: "Ширина ворот",
						type: "select",
						options: [
							2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000,
							7500, 8000, 8500, 9000, 9500, 10000,
						],
						value: null,
					},
					gateHeight: {
						title: "Высота ворот",
						type: "select",
						options: [1030, 1230, 1530, 1730, 1930, 2030, 2230, 2430],
						value: null,
					},
				},
			},
		},
	};
}

// ==========================================
// КЛАСС МЕНЕДЖЕРА НАСТРОЕК
// ==========================================
class SettingsManager {
	constructor() {
		this.filePath = path.join(app.getPath("userData"), "settings.json");
		this.data = null;
		this._initialised = false;
	}

	/**
	 * Гарантированная инициализация.
	 * Вызывается один раз при старте приложения.
	 * После вызова this.data ТОЧНО содержит валидные настройки.
	 */
	async init() {
		if (this._initialised) {
			return this.data;
		}

		// 1. Убеждаемся, что папка существует
		await fs.mkdir(path.dirname(this.filePath), { recursive: true });

		// 2. Пытаемся прочитать существующий файл
		try {
			const raw = await fs.readFile(this.filePath, "utf-8");
			this.data = JSON.parse(raw);
			const sectionCount = Object.keys(this.data.sections || {}).length;
			console.log(`[Settings] ✅ Загружено разделов: ${sectionCount}`);

			// 2a. Проверяем, что структура валидна
			if (!this._isValidStructure(this.data)) {
				throw new Error("Файл настроек имеет некорректную структуру");
			}
		} catch (err) {
			if (err.code === "ENOENT") {
				console.log(
					"[Settings] ⚠️ settings.json не найден — создаём дефолтный",
				);
			} else {
				console.warn(
					"[Settings] ⚠️ settings.json повреждён — делаем backup и создаём новый",
				);

				try {
					const backupPath = `${this.filePath}.corrupt-${Date.now()}.bak`;
					await fs.copyFile(this.filePath, backupPath);
					console.log(`[Settings] 💾 Backup сохранён: ${backupPath}`);
				} catch (backupErr) {
					console.warn(
						"[Settings] Не удалось сделать backup:",
						backupErr.message,
					);
				}
			}

			// 3. Создаём дефолтные настройки
			this.data = createDefaultSettings();
			await this._saveNow();
			console.log("[Settings] ✅ Дефолтные настройки записаны на диск");
		}

		this._initialised = true;
		return this.data;
	}

	/**
	 * Получить текущие настройки.
	 * Автоматически инициализирует хранилище, если ещё не сделано.
	 */
	async get() {
		if (!this._initialised) {
			await this.init();
		}
		return this.data;
	}

	/**
	 * Получить значение одной настройки по ключам раздела и поля.
	 * Удобно для расчётов.
	 */
	getValue(sectionKey, fieldKey) {
		if (!this.data) return undefined;

		const section = this.data.sections[sectionKey];
		if (!section) return undefined;

		const field = section.fields[fieldKey];
		if (!field) return undefined;

		return field.value;
	}

	/**
	 * Получить числовое значение. Если значение не число — возвращает 0.
	 */
	getNumberValue(sectionKey, fieldKey) {
		const value = this.getValue(sectionKey, fieldKey);
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : 0;
	}

	/**
	 * Проверка, заполнены ли обязательные поля для расчёта.
	 * Возвращает true, если во всех разделах выбраны значения (не null).
	 */
	canCalculate() {
		if (!this.data) return false;

		// Список разделов и полей, которые должны быть выбраны
		const required = [
			["wicketSettings", "wicketWidth"],
			["wicketSettings", "wicketHeight"],
			["gateSettings", "gateWidth"],
			["gateSettings", "gateHeight"],
		];

		return required.every(([sectionKey, fieldKey]) => {
			const value = this.getValue(sectionKey, fieldKey);
			return value != null;
		});
	}

	/**
	 * Установить значение одного поля и сохранить на диск.
	 */
	async setValue(sectionKey, fieldKey, rawValue) {
		console.log(
			"setValue sectionKey: ",
			sectionKey,
			"  fieldKey: ",
			fieldKey,
			"  rawValue: ",
			rawValue,
		);
		if (!this._initialised) await this.init();

		const section = this.data.sections[sectionKey];
		if (!section) throw new Error(`Раздел "${sectionKey}" не найден`);

		const field = section.fields[fieldKey];
		if (!field)
			throw new Error(
				`Поле "${fieldKey}" не найдено в разделе "${sectionKey}"`,
			);

		field.value = this._validateValue(field, rawValue);

		await this._saveNow();
		return this.data;
	}

	/**
	 * Установить значение одного элемента массива options и сохранить на диск.
	 */
	async setOptionValue(sectionKey, fieldKey, optionIndex, rawValue) {
		if (!this._initialised) await this.init();

		const section = this.data.sections[sectionKey];
		if (!section) throw new Error(`Раздел "${sectionKey}" не найден`);

		const field = section.fields[fieldKey];
		if (!field)
			throw new Error(
				`Поле "${fieldKey}" не найдено в разделе "${sectionKey}"`,
			);

		if (!Array.isArray(field.options)) {
			throw new Error(`Поле "${fieldKey}" не имеет массива options`);
		}
		if (optionIndex < 0 || optionIndex >= field.options.length) {
			throw new Error(`Неверный индекс варианта: ${optionIndex}`);
		}

		// Валидация как для основного значения
		const validated = this._validateValue(field, rawValue, {
			skipOptionsCheck: true,
		});
		field.options[optionIndex] = validated;

		await this._saveNow();
		return this.data;
	}

	/**
	 * Сбросить все значения к значениям по умолчанию.
	 * Структура разделов и полей не меняется.
	 */
	async resetToDefaults() {
		if (!this._initialised) await this.init();

		// Получаем "чистые" дефолты из функции
		const defaults = createDefaultSettings();

		// Заменяем каждую секцию и каждое поле на дефолтное (глубокое копирование)
		for (const sectionKey of Object.keys(defaults.sections)) {
			const defaultSection = defaults.sections[sectionKey];
			const currentSection = this.data.sections[sectionKey];

			if (!currentSection) continue;

			for (const fieldKey of Object.keys(defaultSection.fields)) {
				const defaultField = defaultSection.fields[fieldKey];
				const currentField = currentSection.fields[fieldKey];

				if (!currentField) continue;

				// ⬇️ Сбрасываем И value, И options, И любые другие поля
				// Глубокое клонирование через JSON, чтобы не было ссылок
				currentField.value = JSON.parse(
					JSON.stringify(
						defaultField.value ?? defaultField.defaultValue ?? null,
					),
				);

				if (Array.isArray(defaultField.options)) {
					currentField.options = JSON.parse(
						JSON.stringify(defaultField.options),
					);
				}
			}
		}

		await this._saveNow();
		console.log(
			"[Settings] 🔄 Настройки полностью сброшены к значениям по умолчанию",
		);

		return JSON.parse(JSON.stringify(this.data));
	}

	// ==========================================
	// ВНУТРЕННИЕ МЕТОДЫ
	// ==========================================

	_isValidStructure(data) {
		if (!data || typeof data !== "object") return false;
		if (typeof data.version !== "number") return false;
		if (
			!data.sections ||
			typeof data.sections !== "object" ||
			Array.isArray(data.sections)
		) {
			return false;
		}

		// Проверяем каждый раздел
		for (const section of Object.values(data.sections)) {
			if (!section || typeof section !== "object") return false;
			if (typeof section.title !== "string") return false;
			if (
				!section.fields ||
				typeof section.fields !== "object" ||
				Array.isArray(section.fields)
			) {
				return false;
			}
		}

		return true;
	}

	_validateValue(field, rawValue, { skipOptionsCheck = false } = {}) {
		switch (field.type) {
			case "number": {
				const value =
					typeof rawValue === "number" ? rawValue : Number(rawValue);
				if (!Number.isFinite(value)) {
					throw new Error(`Поле "${field.title}" должно быть числом`);
				}
				return value;
			}

			case "select": {
				// Разрешаем null — значит "не выбрано"
				if (rawValue === null || rawValue === undefined || rawValue === "") {
					return null;
				}

				// Пытаемся привести к числу, если options содержат числа
				let value = rawValue;
				if (Array.isArray(field.options) && field.options.length > 0) {
					// Если опции числовые — приводим значение к числу
					if (typeof field.options[0] === "number") {
						value = Number(rawValue);
					}

					if (!field.options.includes(value) && !skipOptionsCheck) {
						throw new Error(
							`Поле "${field.title}": значение ${rawValue} отсутствует в списке доступных`,
						);
					}
				}

				return value;
			}

			case "boolean":
				return Boolean(rawValue);

			case "text":
				return String(rawValue ?? "");

			default:
				return rawValue;
		}
	}

	async _saveNow() {
		const json = JSON.stringify(this.data, null, 2);

		// Атомарная запись через tmp-файл:
		// если приложение упадёт во время записи, основной файл не повредится
		const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;

		await fs.writeFile(tmpPath, json, "utf-8");

		try {
			await fs.rename(tmpPath, this.filePath);
		} catch (err) {
			// Windows иногда ругается на rename, если файл занят
			await fs.copyFile(tmpPath, this.filePath);
			await fs.unlink(tmpPath).catch(() => {});
		}
	}
}

module.exports = { SettingsManager };
