import { settingsManager } from "../settingsManager";
import { showNotification } from "../utils/notification";
import { getValidatedNumber, attachNumericValidation } from "../utils/inputValidators";

export default class BaseCalculator {
	/*static DEFAULT_CALCULATOR_CONSTANTS = {
		distanceBetweenPlanks: 60,
		wicketClearanceBetweenGround: 100,
		wicketClearanceInFrame: 6,
		wicketClearanceBetweenPosts: 14,
		gateClearanceBetweenGround: 100,
		gateClearanceBetweenPosts: 18,
		corrugatedSheetWidth: 1100, // профлист
		threeDmeshWidth: 2500, // 3D сетка
		fenceWidth: 110, // штакетник
		wicketPostDepth: 1200, //заглубление столба калитки
		gatePostDepth: 1500, //заглубление столба ворот
	};

	// Getter: возвращает актуальные значения из настроек
	static get CALCULATOR_CONSTANTS() {
		const get = (fieldKey) => settingsManager.getValue("calculatorConstants", fieldKey);

		const D = BaseCalculator.DEFAULT_CALCULATOR_CONSTANTS;

		const settingValue = (mmValue, defaultValue) => (mmValue != null ? mmValue : defaultValue);

		return {
			distanceBetweenPlanks: settingValue(get("distanceBetweenPlanks"), D.distanceBetweenPlanks),
			wicketClearanceBetweenGround: settingValue(get("wicketClearanceBetweenGround"), D.wicketClearanceBetweenGround),
			wicketClearanceInFrame: settingValue(get("wicketClearanceInFrame"), D.wicketClearanceInFrame),
			wicketClearanceBetweenPosts: settingValue(get("wicketClearanceBetweenPosts"), D.wicketClearanceBetweenPosts),
			gateClearanceBetweenGround: settingValue(get("gateClearanceBetweenGround"), D.gateClearanceBetweenGround),
			gateClearanceBetweenPosts: settingValue(get("gateClearanceBetweenPosts"), D.gateClearanceBetweenPosts),
			corrugatedSheetWidth: settingValue(get("corrugatedSheetWidth"), D.corrugatedSheetWidth),
			threeDmeshWidth: settingValue(get("threeDmeshWidth"), D.threeDmeshWidth),
			fenceWidth: settingValue(get("fenceWidth"), D.fenceWidth),
			wicketPostDepth: settingValue(get("wicketPostDepth"), D.wicketPostDepth),
			gatePostDepth: settingValue(get("gatePostDepth"), D.gatePostDepth),
		};
	}*/

	/**
	 * @param {HTMLElement} rootElement - Корневой элемент формы калькулятора
	 * @param {Object} priceManager - Объект для получения базовых цен
	 */
	constructor(rootElement, priceManager) {
		this.element = rootElement;
		this.priceManager = priceManager;
		// 1. Находим глобальное поле наценки
		this._globalMarkupInput = this.element.querySelector("#calculator-markup") || document.querySelector("#calculator-markup");

		// 2. Вешаем на него валидацию (только один раз при создании)
		if (this._globalMarkupInput) {
			attachNumericValidation(this._globalMarkupInput, 0, 1000, {
				allowFloat: false,
				defaultValue: 0,
			});
		}
	}

	async init() {
		await settingsManager.ensureLoaded();
	}

	/**
	 * Безопасное получение значения из input по селектору
	 */
	getVal(selector) {
		return this.element.querySelector(selector)?.value?.trim() || null;
	}

	getMarkupByFieldId(fieldId) {
		const materialInput = this.element.querySelector(`${fieldId}`);
		if (!materialInput) return null;

		const markupInput = materialInput.parentElement.querySelector(".calculator-markup");
		if (!markupInput) return null;

		const validatedMarkup = getValidatedNumber(markupInput, 0, 1000, {
			allowFloat: false,
		});

		return validatedMarkup;
	}

	// расчет ширины материала
	/*getMaterialWidth(materialName, fenceStep) {
		if (materialName.includes("штакет")) {
			const fenceStepFinal = fenceStep ? fenceStep : 0;
			return BaseCalculator.CALCULATOR_CONSTANTS.fenceWidth + fenceStepFinal;
		}
		if (materialName.includes("3D") || materialName.includes("сетк")) {
			return BaseCalculator.CALCULATOR_CONSTANTS.threeDmeshWidth;
		}
		return BaseCalculator.CALCULATOR_CONSTANTS.corrugatedSheetWidth;
	}*/

	getMaterialWidth(materialName, fenceStep = 0) {
		if (materialName.includes("штакет")) {
			const fenceWidth = settingsManager.getCalculatorConstant("fenceWidth");
			return fenceWidth + fenceStep;
		}
		if (materialName.includes("3D") || materialName.includes("сетк")) {
			return settingsManager.getCalculatorConstant("threeDmeshWidth");
		}
		return settingsManager.getCalculatorConstant("corrugatedSheetWidth");
	}

	/**
	 * Получает значение наценки из поля #calculator-markup.
	 * Если поле пустое, возвращает 0.
	 * Если значение вне диапазона 1-1000, корректирует его и обновляет поле ввода.
	 */
	getMarkup() {
		return getValidatedNumber(this._globalMarkupInput, 0, 1000, {
			allowFloat: false,
			defaultValue: 0,
		});
	}

	/**
	 * Возвращает цену материала с учетом наценки
	 */
	getPriceWithMarkup(materialName, markup) {
		const basePrice = this.priceManager.getPrice(materialName);
		if (!basePrice) return null;

		const baseMarkup = this.getMarkup();

		// Если fieldPrice есть  - то наценку добавляем fieldPrice (даже если 0)
		const finalMarkup = markup ?? baseMarkup;
		// Округляем до 2 знаков после запятой (или до целых, если у вас так принято: Math.round(...))
		return parseFloat((basePrice * (1 + finalMarkup / 100)).toFixed(2));
	}

	/**
	 * Абстрактный метод. Должен быть переопределен в наследниках.
	 * @returns {Array<{name: string, quantity: number}>}
	 */
	calculateRawMaterials() {
		showNotification("Метод calculateRawMaterials() должен быть реализован в классе-наследнике");
	}

	/**
	 * Главный метод расчета. Возвращает массив готовых к добавлению в таблицу объектов.
	 * @returns {Array<{name: string, price: number, quantity: number}>}
	 */
	calculate() {
		const rawMaterials = this.calculateRawMaterials();

		if (rawMaterials.length === 0) {
			showNotification("Пожалуйста, выберите хотя бы один материал!");
		}

		return rawMaterials.map((mat) => {
			const finalPrice = this.getPriceWithMarkup(mat.name, mat.markup);

			return {
				name: mat.name,
				subName: mat.subName,
				price: finalPrice,
				quantity: mat.quantity,
			};
		});
	}
}

export { BaseCalculator };
