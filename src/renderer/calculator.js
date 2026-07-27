import { priceManager } from "./priceManager.js";

function cloneCalculatorTemplate(templateId) {
	const template = document.getElementById(templateId);
	return template.content.firstElementChild.cloneNode(true);
}

class WicketCalculatorView {
	async render() {
		this.element = cloneCalculatorTemplate("wicket-calculator-template");

		// ✅ Заполняем списки ВНУТРИ клонированного элемента (он еще не в DOM!)
		await this.populateDatalists();

		return this.element;
	}

	async populateDatalists() {
		await priceManager.ensureLoaded();

		// ✅ Передаем this.element как контекст поиска
		priceManager.populateDatalist(
			"wicket-frame-material-price-data",
			this.element,
		);
		priceManager.populateDatalist("wicket-posts-price-data", this.element);
		priceManager.populateDatalist("wicket-cladding-price-data", this.element);
		priceManager.populateDatalist("wicket-paint-price-data", this.element);
	}
}

class GateCalculatorView {
	async render() {
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

		await this.populateDatalists();

		return this.element;
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

	async populateDatalists() {
		await priceManager.ensureLoaded();

		// ✅ Передаем this.element как контекст поиска
		priceManager.populateDatalist("gate-posts-price-data", this.element);
		priceManager.populateDatalist(
			"gate-frame-material-price-data",
			this.element,
		);
		priceManager.populateDatalist("gate-cladding-price-data", this.element);
		priceManager.populateDatalist("gate-paint-price-data", this.element);
		priceManager.populateDatalist("gate-rollers-price-data", this.element);
		priceManager.populateDatalist("gate-rack-price-data", this.element);
		priceManager.populateDatalist("gate-drive-price-data", this.element);
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
		const Calculator = this.calculators[type];
		if (!Calculator) return;

		const calculator = new Calculator();
		const renderedElement = await calculator.render();

		this.mount.replaceChildren(renderedElement);
	}
}

new CalculatorViewSwitcher();
