// src/renderer/js/populateSelects.js
import { settingsManager } from "./settingsManager.js";

/**
 * Маппинг: id <select> → путь к настройкам + id шаблона, где он находится.
 * selectId ищется внутри template с заданным templateId.
 */
const SELECT_MAPPING = {
	// Ворота — в шаблоне gate-calculator-template
	/*"gate-width": {
		templateId: "gate-calculator-template",
		section: "gateSettings",
		field: "gateWidth",
	},
	"gate-height": {
		templateId: "gate-calculator-template",
		section: "gateSettings",
		field: "gateHeight",
	},*/
	"gate-cladding-step": {
		templateId: "gate-calculator-template",
		section: "calculatorConstants",
		field: "fenceSteps",
	},

	// Калитка — в шаблоне wicket-calculator-template
	/*"wicket-width": {
		templateId: "wicket-calculator-template",
		section: "wicketSettings",
		field: "wicketWidth",
	},
	"wicket-height": {
		templateId: "wicket-calculator-template",
		section: "wicketSettings",
		field: "wicketHeight",
	},*/
	"wicket-cladding-step": {
		templateId: "wicket-calculator-template",
		section: "calculatorConstants",
		field: "fenceSteps",
	},
};

/**
 * Заполняет <select> опциями из настроек.
 */
function fillSelectFromSettings(selectElement, sectionKey, fieldKey) {
	const field = settingsManager.getField(sectionKey, fieldKey);

	// Отладка: проверяем, что приходит
	console.log(`[populateSelects] ${sectionKey}.${fieldKey}:`, {
		field: field,
		value: field?.value,
		defaultValue: field?.defaultValue,
		options: field?.options,
	});

	if (!field || field.type !== "select" || !Array.isArray(field.options)) {
		console.warn(
			`[populateSelects] Поле ${sectionKey}.${fieldKey} не найдено или не select`,
		);
		return;
	}

	// Определяем, какое значение должно быть выбрано
	const selectedValue =
		field.value !== null && field.value !== undefined
			? field.value
			: field.defaultValue;

	console.log(
		`[populateSelects] Выбранное значение для ${fieldKey}:`,
		selectedValue,
	);

	// Сохраняем placeholder (первый option)
	const placeholder = selectElement.querySelector("option:first-child");

	// Очищаем select, оставляя только placeholder
	selectElement.innerHTML = "";
	if (placeholder) {
		selectElement.appendChild(placeholder);
	}

	// Заполняем options из настроек
	for (const value of field.options) {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = value;

		// ВАЖНО: используем defaultSelected вместо selected!
		// defaultSelected устанавливает HTML-атрибут, который копируется при cloneNode
		if (value === selectedValue) {
			option.defaultSelected = true;
			option.selected = true; // На всякий случай ставим оба
		}

		selectElement.appendChild(option);
	}
}
/**
 * Главная функция — заполняет select'ы внутри <template>.
 * Работает ДО клонирования template, поэтому при каждом клонировании
 * select'ы уже будут заполнены.
 */
export function populateSelectsFromSettings() {
	for (const [selectId, config] of Object.entries(SELECT_MAPPING)) {
		const { templateId, section, field } = config;

		// 1. Находим <template> в DOM
		const template = document.getElementById(templateId);
		if (!template) {
			console.warn(`[populateSelects] Template #${templateId} не найден в DOM`);
			continue;
		}

		// 2. Ищем select внутри content шаблона
		const selectElement = template.content.getElementById(selectId);
		if (!selectElement) {
			console.warn(
				`[populateSelects] Элемент #${selectId} не найден в шаблоне #${templateId}`,
			);
			continue;
		}

		// 3. Заполняем select из настроек
		fillSelectFromSettings(selectElement, section, field);
	}

	console.log("✅ Select'ы в шаблонах заполнены из настроек");
}

/**
 * Дополнительно: заполняет select'ы, которые УЖЕ в активном DOM
 * (например, если template уже склонирован и вставлен).
 */
export function populateLiveSelectsFromSettings() {
	for (const [selectId, config] of Object.entries(SELECT_MAPPING)) {
		const { section, field } = config;

		const selectElement = document.getElementById(selectId);
		if (selectElement) {
			fillSelectFromSettings(selectElement, section, field);
		}
	}

	console.log("✅ Select'ы в активном DOM заполнены из настроек");
}
