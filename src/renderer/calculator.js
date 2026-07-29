import { priceManager } from "./priceManager.js";
import { addMaterialToTable } from "./tableManager.js"; 

function cloneCalculatorTemplate(templateId) {
	const template = document.getElementById(templateId);
	return template.content.firstElementChild.cloneNode(true);
}

class WicketCalculatorView {
	async render() {
		this.element = cloneCalculatorTemplate("wicket-calculator-template");

		// ✅ Заполняем списки ВНУТРИ клонированного элемента (он еще не в DOM!)
		await this.populateDatalists();
		this.calcButton = this.element.querySelector(".calculator-card__button");
        
        if (this.calcButton) {
            this.calcButton.addEventListener("click", () => this.handleCalculate());
        }

		return this.element;
	}

	// 🚀 Новый метод для обработки клика
    handleCalculate() {
        const itemsToAdd = [];

        // Пример получения данных (ЗАМЕНИТЕ селекторы на ваши реальные id/class из HTML!)
        const frameMaterial = this.element.querySelector('#wicket-frame-material')?.value;
        const postsMaterial = this.element.querySelector('#wicket-posts')?.value;
        const claddingMaterial = this.element.querySelector('#wicket-cladding')?.value;

        // Собираем только заполненные поля
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

        // 3. Добавляем каждую найденную позицию в общую таблицу
        if (itemsToAdd.length === 0) {
            alert("Пожалуйста, выберите хотя бы один материал!");
            return;
        }

        itemsToAdd.forEach(item => {
            addMaterialToTable(item.name, item.price, item.quantity);
        });
    }

	async populateDatalists() {
		await priceManager.ensureLoaded();

		// ✅ Передаем this.element как контекст поиска
		priceManager.populateFilteredAutocomplete("wicket-frame-material", this.element, ['профиль']);
		priceManager.populateFilteredAutocomplete("wicket-posts", this.element, ['профиль']);
		priceManager.populateFilteredAutocomplete("wicket-cladding", this.element, ['сетка', 'штакетник', 'панель', 'профнастил', 'профлист']);
		priceManager.populateAutocomplete("wicket-paint", this.element);
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
		
        this.calcButton = this.element.querySelector(".calculator-card__button");
        if (this.calcButton) {
            this.calcButton.addEventListener("click", () => this.handleCalculate());
        }

		return this.element;
	}

	// 🚀 Новый метод для обработки клика (аналогично калитке, но со своими полями)
    handleCalculate() {
        const itemsToAdd = [];

        // ЗАМЕНИТЕ селекторы на ваши реальные!
        const frameMaterial = this.element.querySelector('#gate-frame-material')?.value;
        const postsMaterial = this.element.querySelector('#gate-posts')?.value;
        const rollers = this.element.querySelector('#gate-rollers')?.value;

        if (frameMaterial) {
            const price = priceManager.getPrice(frameMaterial);
            if (price) itemsToAdd.push({ name: frameMaterial, price, quantity: 1 });
        }

        if (postsMaterial) {
            const price = priceManager.getPrice(postsMaterial);
            if (price) itemsToAdd.push({ name: postsMaterial, price, quantity: 1 });
        }

        if (rollers) {
            const price = priceManager.getPrice(rollers);
            if (price) itemsToAdd.push({ name: rollers, price, quantity: 1 });
        }

        if (itemsToAdd.length === 0) {
            alert("Пожалуйста, выберите материалы для ворот!");
            return;
        }

        itemsToAdd.forEach(item => {
            addMaterialToTable(item.name, item.price, item.quantity);
        });
    };

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
		priceManager.populateAutocomplete("gate-posts-price-data", this.element);
		priceManager.populateAutocomplete(
			"gate-frame-material-price-data",
			this.element,
		);
		priceManager.populateAutocomplete("gate-cladding-price-data", this.element);
		priceManager.populateAutocomplete("gate-paint-price-data", this.element);
		priceManager.populateAutocomplete("gate-rollers-price-data", this.element);
		priceManager.populateAutocomplete("gate-rack-price-data", this.element);
		priceManager.populateAutocomplete("gate-drive-price-data", this.element);
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
