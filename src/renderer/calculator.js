import { priceManager } from "./priceManager.js";
import { addMaterialToTable } from "./tableManager.js"; 

function cloneCalculatorTemplate(templateId) {
	const template = document.getElementById(templateId);
	return template.content.firstElementChild.cloneNode(true);
}

class WicketCalculatorView {
	constructor() {
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

		priceManager.populateFilteredAutocomplete("wicket-frame-material", this.element, ['профиль']);
		priceManager.populateFilteredAutocomplete("wicket-posts", this.element, ['профиль']);
		priceManager.populateFilteredAutocomplete("wicket-cladding", this.element, ['сетка', 'штакетник', 'панель', 'профнастил', 'профлист']);
		priceManager.populateAutocomplete("wicket-paint", this.element);
	}

	handleCalculate() {
		const itemsToAdd = [];
		const frameMaterial = this.element.querySelector('#wicket-frame-material')?.value;
		const postsMaterial = this.element.querySelector('#wicket-posts')?.value;
		const claddingMaterial = this.element.querySelector('#wicket-cladding')?.value;
		const wickedPaint = this.element.querySelector('#wicket-paint')?.value;

		if (frameMaterial) {
			const price = priceManager.getPrice(frameMaterial);
			if (price) itemsToAdd.push({ name: frameMaterial, price, quantity: 1 });
		}
		if (postsMaterial) {
			const price = priceManager.getPrice(postsMaterial);
			if (price) itemsToAdd.push({ name: postsMaterial, price, quantity: 1 });
		}
		if (claddingMaterial) {
			const price = priceManager.getPrice(claddingMaterial);
			if (price) itemsToAdd.push({ name: claddingMaterial, price, quantity: 1 });
		}
		if (wickedPaint) {
			const price = priceManager.getPrice(wickedPaint);
			if (price) itemsToAdd.push({ name: wickedPaint, price, quantity: 1 });
		}

		if (itemsToAdd.length === 0) {
			alert("Пожалуйста, выберите хотя бы один материал!");
			return;
		}

		itemsToAdd.forEach(item => {
			addMaterialToTable(item.name, item.price, item.quantity);
		});
	}
}

class GateCalculatorView {
	constructor() {
		this.element = null;
		this.openingInputs = [];
		this.slidingRows = [];
	}

	// 1. Только создаем и настраиваем DOM
	createDOM() {
		this.element = cloneCalculatorTemplate("gate-calculator-template");

		this.openingInputs = [...this.element.querySelectorAll('input[name="gate-opening"]')];
		this.slidingRows = [...this.element.querySelectorAll(".calculator-field--sliding")];

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

		priceManager.populateFilteredAutocomplete("gate-posts", this.element, ['профиль']);
		priceManager.populateFilteredAutocomplete("gate-frame-material", this.element, ['профиль']);
		priceManager.populateAutocomplete("gate-cladding", this.element);
		priceManager.populateAutocomplete("gate-paint", this.element);
		priceManager.populateAutocomplete("gate-rollers", this.element);
		priceManager.populateAutocomplete("gate-rack", this.element);
		priceManager.populateAutocomplete("gate-drive", this.element);
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
		const itemsToAdd = [];

		const postsMaterial = this.element.querySelector('#gate-posts')?.value;
		const frameMaterial = this.element.querySelector('#gate-frame-material')?.value;
		const gateCadding = this.element.querySelector('#gate-cadding')?.value;
		const gatePaint = this.element.querySelector('#gate-paint')?.value;
		const rollers = this.element.querySelector('#gate-rollers')?.value;
		const gateRack = this.element.querySelector('#gate-rack')?.value;
		const gateDrive = this.element.querySelector('#gate-drive')?.value;

		if (postsMaterial) {
			const price = priceManager.getPrice(postsMaterial);
			if (price) itemsToAdd.push({ name: postsMaterial, price, quantity: 1 });
		}
		if (frameMaterial) {
			const price = priceManager.getPrice(frameMaterial);
			if (price) itemsToAdd.push({ name: frameMaterial, price, quantity: 1 });
		}
		if (gateCadding) {
			const price = priceManager.getPrice(gateCadding);
			if (price) itemsToAdd.push({ name: gateCadding, price, quantity: 1 });
		}
		if (gatePaint) {
			const price = priceManager.getPrice(gatePaint);
			if (price) itemsToAdd.push({ name: gatePaint, price, quantity: 1 });
		}
		if (rollers) {
			const price = priceManager.getPrice(rollers);
			if (price) itemsToAdd.push({ name: rollers, price, quantity: 1 });
		}
		
		if (gateRack) {
			const price = priceManager.getPrice(gateRack);
			if (price) itemsToAdd.push({ name: gateRack, price, quantity: 1 });
		}
		
		if (gateDrive) {
			const price = priceManager.getPrice(gateDrive);
			if (price) itemsToAdd.push({ name: gateDrive, price, quantity: 1 });
		}

		if (itemsToAdd.length === 0) {
			alert("Пожалуйста, выберите материалы для ворот!");
			return;
		}

		itemsToAdd.forEach(item => {
			addMaterialToTable(item.name, item.price, item.quantity);
		});
	}
}

class CalculatorViewSwitcher {
	constructor() {
		this.mount = document.getElementById("calculator-mount");
		this.markupInput = document.getElementById("markup");
		this.typeInputs = [...document.querySelectorAll('input[name="calculator-type"]')];
		
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

	// 🔥 БОНУС: Метод для обновления списков без переключения вкладок
	// (Вызывайте его из вашего кода загрузки Excel после успешного импорта!)
	async refreshCurrentCalculator() {
		if (this.currentCalculator) {
			await this.currentCalculator.populateDatalists();
		}
	}
}

new CalculatorViewSwitcher();