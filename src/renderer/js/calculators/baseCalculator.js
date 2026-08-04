import { settingsManager } from "../settingsManager";

export default class BaseCalculator {
	static DEFAULT_CALCULATOR_CONSTANTS = {
		corrugatedSheetWidth: 1.1, // профлист
		threeDmeshWidth: 2.5, // 3D сетка
		fenceWidth: 0.11, // штакетник
		wicketPostDepth: 1.2, //заглубление столба калитки
		gatePostDepth: 1.5, //заглубление столба ворот
	};

	// Getter: возвращает актуальные значения из настроек, конвертируя мм → м
	static get CALCULATOR_CONSTANTS() {
		const get = (fieldKey) =>
			settingsManager.getValue("calculatorConstants", fieldKey);

		const D = BaseCalculator.DEFAULT_CALCULATOR_CONSTANTS;

		// Хелпер: получает значение в мм, возвращает в м (или дефолт)
		const mmToMeters = (mmValue, defaultMeters) =>
			mmValue != null ? mmValue / 1000 : defaultMeters;

		return {
			corrugatedSheetWidth: mmToMeters(
				get("corrugatedSheetWidth"),
				D.corrugatedSheetWidth,
			),
			threeDmeshWidth: mmToMeters(get("threeDmeshWidth"), D.threeDmeshWidth),
			fenceWidth: mmToMeters(get("fenceWidth"), D.fenceWidth),
			wicketPostDepth: mmToMeters(get("wicketPostDepth"), D.wicketPostDepth),
			gatePostDepth: mmToMeters(get("gatePostDepth"), D.gatePostDepth),
		};
	}

	/**
	 * @param {HTMLElement} rootElement - Корневой элемент формы калькулятора
	 * @param {Object} priceManager - Объект для получения базовых цен
	 */
	constructor(rootElement, priceManager) {
		this.element = rootElement;
		this.priceManager = priceManager;
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

	// расчет ширины материала
	getMaterialWidth(materialName, fenceStep) {
		if (materialName.includes("штакет")) {
			const fenceStepInMeter = fenceStep ? fenceStep / 1000 : 0;
			return BaseCalculator.CALCULATOR_CONSTANTS.fenceWidth + fenceStepInMeter;
		}
		if (materialName.includes("3D") || materialName.includes("сетк")) {
			return BaseCalculator.CALCULATOR_CONSTANTS.threeDmeshWidth;
		}
		return BaseCalculator.CALCULATOR_CONSTANTS.corrugatedSheetWidth;
	}

	/**
	 * Получает значение наценки из поля #calculator-markup.
	 * Если поле пустое, возвращает 0.
	 * Если значение вне диапазона 1-1000, корректирует его и обновляет поле ввода.
	 */
	getMarkup() {
		// Ищем поле в текущей форме, если нет - ищем во всем документе (на случай глобального расположения)
		const markupInput =
			this.element.querySelector("#calculator-markup") ||
			document.querySelector("#calculator-markup");
		console.log("markupInput: ", markupInput);
		if (markupInput) {
			markupInput.addEventListener("input", function () {
				// Если поле очистили полностью - ничего не делаем, пусть будет пустым
				if (this.value === "") return;

				let val = parseFloat(this.value);

				// Если введено не число (например, пользователь начал печатать буквы), игнорируем
				if (isNaN(val)) return;

				// Жестко ограничиваем диапазон
				if (val > 1000) {
					this.value = 1000;
				} else if (val < 1) {
					this.value = 1;
				}
			});

			// Дополнительно: запрещаем ввод точки/запятой, если вам нужны только целые числа
			// (Если проценты могут быть дробными, например 15.5%, удалите этот блок)
			markupInput.addEventListener("keydown", function (e) {
				if (e.key === "." || e.key === ",") {
					e.preventDefault();
				}
			});
		}

		if (!markupInput || markupInput.value === "") {
			return 0; // Если не заполнено, наценка 0%
		}

		let value = parseFloat(markupInput.value);

		if (isNaN(value)) {
			return 0;
		}

		// Ограничиваем диапазон от 1 до 1000
		if (value < 1 || value > 1000) {
			value = Math.min(Math.max(value, 1), 1000);
			// Опционально: сразу исправляем значение в поле ввода, чтобы пользователь видел ограничение
			markupInput.value = value;
		}

		return value;
	}

	showNotification(message, type = "error", duration = 3000) {
		const notif = document.getElementById("notification");
		if (!notif) return;

		notif.textContent = message;
		notif.className = `notification ${type}`;

		// Автоскрытие через duration мс
		setTimeout(() => {
			notif.classList.add("hidden");
		}, duration);
	}

	/**
	 * Возвращает цену материала с учетом наценки
	 */
	getPriceWithMarkup(materialName) {
		const basePrice = this.priceManager.getPrice(materialName);
		if (!basePrice) return null;

		const markup = this.getMarkup();
		// Округляем до 2 знаков после запятой (или до целых, если у вас так принято: Math.round(...))
		return parseFloat((basePrice * (1 + markup / 100)).toFixed(2));
	}

	/**
	 * Абстрактный метод. Должен быть переопределен в наследниках.
	 * @returns {Array<{name: string, quantity: number}>}
	 */
	calculateRawMaterials() {
		this.showNotification(
			"Метод calculateRawMaterials() должен быть реализован в классе-наследнике",
		);
	}

	/**
	 * Главный метод расчета. Возвращает массив готовых к добавлению в таблицу объектов.
	 * @returns {Array<{name: string, price: number, quantity: number}>}
	 */
	calculate() {
		const rawMaterials = this.calculateRawMaterials();

		if (rawMaterials.length === 0) {
			this.showNotification("Пожалуйста, выберите хотя бы один материал!");
		}

		return rawMaterials.map((mat) => {
			const finalPrice = this.getPriceWithMarkup(mat.name);

			return {
				name: mat.name,
				price: finalPrice,
				quantity: mat.quantity,
			};
		});
	}
}

export { BaseCalculator };
