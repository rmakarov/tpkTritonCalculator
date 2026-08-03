import { priceManager } from "./priceManager.js";
import {
	addMaterialToTable,
	removeAllMaterialsFromTable,
} from "./tableManager.js";
import {
	WicketCalculator,
	GateCalculator,
} from "./calculators/wickedAndGateCalculation.js";

function cloneCalculatorTemplate(templateId) {
	const template = document.getElementById(templateId);
	return template.content.firstElementChild.cloneNode(true);
}

class BaseCalculatorView {
	constructor() {
		this.element = null;
		this.claddingInput = null;
		this.stepSelect = null;
		this.stepLabel = null;
	}

	// Универсальный метод, который подойдет и для Wicket, и для Gate
	initCladdingToggle(claddingSelector, stepSelector) {
		this.claddingInput = this.element.querySelector(claddingSelector);
		this.stepSelect = this.element.querySelector(stepSelector);
		this.stepLabel = this.stepSelect?.closest(".calculator-field");

		if (this.claddingInput) {
			this.claddingInput.addEventListener("input", () =>
				this.toggleStepFieldState(),
			);
			this.claddingInput.addEventListener("change", () =>
				this.toggleStepFieldState(),
			);
		}
	}

	toggleStepFieldState() {
		if (!this.claddingInput || !this.stepSelect || !this.stepLabel) return;
		const isWicket = this.claddingInput.value
			.toLowerCase()
			.includes("штакетник");

		if (isWicket) {
			this.stepLabel.classList.remove("calculator-field--inactive");
			this.stepSelect.disabled = false;
		} else {
			this.stepLabel.classList.add("calculator-field--inactive");
			this.stepSelect.disabled = true;
		}
	}

	initCalcButtonState(
		widthSelector,
		heightSelector,
		buttonSelector = ".calculator-card__button",
	) {
		this.widthSelect = this.element.querySelector(widthSelector);
		this.heightSelect = this.element.querySelector(heightSelector);
		this.calcButton = this.element.querySelector(buttonSelector);

		if (!this.calcButton) {
			console.warn("Кнопка расчёта не найдена:", buttonSelector);
			return;
		}

		const handleUpdate = () => this.toggleCalcButtonState();

		if (this.widthSelect) {
			this.widthSelect.addEventListener("input", handleUpdate);
			this.widthSelect.addEventListener("change", handleUpdate);
		}

		if (this.heightSelect) {
			this.heightSelect.addEventListener("input", handleUpdate);
			this.heightSelect.addEventListener("change", handleUpdate);
		}

		// Вызываем при инициализации, чтобы учесть состояние при перезагрузке страницы
		this.toggleCalcButtonState();
	}

	toggleCalcButtonState() {
		if (!this.calcButton) return;

		const widthSelected =
			this.widthSelect && this.widthSelect.value.trim() !== "";
		const heightSelected =
			this.heightSelect && this.heightSelect.value.trim() !== "";

		const isReady = widthSelected && heightSelected;

		this.calcButton.disabled = !isReady;
	}
}

class WicketCalculatorView extends BaseCalculatorView {
	constructor() {
		super();
		this.element = null;
	}

	// 1. Только создаем и настраиваем DOM (без await)
	createDOM() {
		this.element = cloneCalculatorTemplate("wicket-calculator-template");

		this.calcButton = this.element.querySelector(".calculator-card__button");
		if (this.calcButton) {
			this.calcButton.addEventListener("click", () => this.handleCalculate());
		}

		return this.element;
	}

	// 2. Инициализируем данные (вызывается ПОСЛЕ вставки элемента в реальный DOM!)
	async populateDatalists() {
		await priceManager.ensureLoaded();

		this.initCladdingToggle("#wicket-cladding", "#wicket-cladding-step");
		this.initCalcButtonState("#wicket-width", "#wicket-height");

		priceManager.populateFilteredAutocomplete(
			"wicket-frame-material",
			this.element,
			["профиль"],
		);
		priceManager.populateFilteredAutocomplete("wicket-posts", this.element, [
			"профиль",
		]);
		priceManager.populateFilteredAutocomplete("wicket-cladding", this.element, [
			"сетка",
			"штакетник",
			"панель",
			"профнастил",
			"профлист",
		]);
		priceManager.populateFilteredAutocomplete("wicket-paint", this.element, [
			"краска",
		]);

		this.toggleStepFieldState();
	}

	handleCalculate() {
		try {
			let calculator = new WicketCalculator(this.element, priceManager);
			const calculatedItems = calculator.calculate();

			removeAllMaterialsFromTable();
			calculatedItems.forEach((item) => {
				addMaterialToTable(item.name, item.price, item.quantity);
			});
		} catch (error) {
			alert(error.message);
		}
	}
}

class GateCalculatorView extends BaseCalculatorView {
	constructor() {
		super();
		this.element = null;
		this.openingInputs = [];
		this.slidingRows = [];
	}

	// 1. Только создаем и настраиваем DOM
	createDOM() {
		this.element = cloneCalculatorTemplate("gate-calculator-template");

		this.openingInputs = [
			...this.element.querySelectorAll('input[name="gate-opening"]'),
		];
		this.slidingRows = [
			...this.element.querySelectorAll(".calculator-field--sliding"),
		];

		this.openingInputs.forEach((input) => {
			input.addEventListener("change", () => {
				this.updateSlidingFields();
			});
		});

		this.updateSlidingFields();

		this.calcButton = this.element.querySelector(".calculator-card__button");
		if (this.calcButton) {
			this.calcButton.addEventListener("click", () => this.handleCalculate());
		}

		return this.element;
	}

	// 2. Инициализируем данные ПОСЛЕ вставки в DOM
	async populateDatalists() {
		await priceManager.ensureLoaded();

		this.initCladdingToggle("#gate-cladding", "#gate-cladding-step");
		this.initCalcButtonState("#gate-width", "#gate-height");

		priceManager.populateFilteredAutocomplete("gate-posts", this.element, [
			"профиль",
		]);
		priceManager.populateFilteredAutocomplete(
			"gate-frame-material",
			this.element,
			["профиль"],
		);
		priceManager.populateFilteredAutocomplete("gate-cladding", this.element, [
			"сетка",
			"штакетник",
			"панель",
			"профнастил",
			"профлист",
		]);
		priceManager.populateFilteredAutocomplete("gate-paint", this.element, [
			"краска",
		]);
		priceManager.populateFilteredAutocomplete("gate-rollers", this.element, [
			"ролик",
		]);
		priceManager.populateAutocomplete("gate-rack", this.element);
		priceManager.populateFilteredAutocomplete("gate-drive", this.element, [
			"привод",
			"механизм",
			"двигатель",
			"мотор",
		]);

		this.toggleStepFieldState();
	}

	updateSlidingFields() {
		const selectedType = this.openingInputs.find((input) => input.checked);
		const isSliding = selectedType.value === "sliding";

		this.slidingRows.forEach((row) => {
			row.classList.toggle("calculator-field--inactive", !isSliding);
			const inputElement = row.querySelector("input");
			if (inputElement) {
				inputElement.disabled = !isSliding;
			}
		});
	}

	handleCalculate() {
		try {
			let calculator = new GateCalculator(this.element, priceManager);
			const calculatedItems = calculator.calculate();

			removeAllMaterialsFromTable();
			calculatedItems.forEach((item) => {
				addMaterialToTable(item.name, item.price, item.quantity);
			});
		} catch (error) {
			console.log(error.message);
		}
	}
}

class CalculatorViewSwitcher {
	constructor() {
		this.mount = document.getElementById("calculator-mount");
		this.markupInput = document.getElementById("markup");
		this.typeInputs = [
			...document.querySelectorAll('input[name="calculator-type"]'),
		];

		this.calculators = {
			wicket: WicketCalculatorView,
			gate: GateCalculatorView,
		};

		this.currentCalculator = null; // Сохраняем ссылку на текущий активный калькулятор

		this.typeInputs.forEach((input) => {
			input.addEventListener("change", () => {
				if (input.checked) {
					this.showCalculator(input.value);
				}
			});
		});

		this.showCalculator("wicket");
	}

	getMarkupMultiplier() {
		return Number.parseFloat(this.markupInput?.value) || 1;
	}

	async showCalculator(type) {
		// 1. Очищаем старые автокомплиты
		priceManager.destroyAll();

		const CalculatorClass = this.calculators[type];
		if (!CalculatorClass) return;

		// 2. Создаем экземпляр и получаем DOM-элемент
		this.currentCalculator = new CalculatorClass();
		const domElement = this.currentCalculator.createDOM();

		// 3. СРАЗУ вставляем элемент в реальный DOM!
		this.mount.replaceChildren(domElement);

		// 4. Теперь, когда элемент на странице, инициализируем списки
		await this.currentCalculator.populateDatalists();
	}

	// 🔥 Метод для обновления списков без переключения вкладок
	// (Вызывайте его из вашего кода загрузки Excel после успешного импорта!)
	async refreshCurrentCalculator() {
		if (this.currentCalculator) {
			await this.currentCalculator.populateDatalists();
		}
	}
}

new CalculatorViewSwitcher();
