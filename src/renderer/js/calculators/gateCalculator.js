import { BaseCalculator } from "./baseCalculator.js";
import { calculateGateFrameByType } from "./gateCalculatorUtils.js";

class GateCalculator extends BaseCalculator {
	constructor(rootElement, priceManager) {
		super(rootElement, priceManager);
	}

	// метод для получения выбранного типа ворот
	getSelectedType() {
		const checkedInput = this.element.querySelector('input[name="gate-type"]:checked');
		return checkedInput ? checkedInput.value : null;
	}

	calculateRawMaterials() {
		const materials = [];

		// выбранный тип
		this.selectedType = this.getSelectedType();
		console.log("Выбран тип ворот:", this.selectedType);

		// 1. Получаем размеры в миллиметрах из выпадающего списка
		const widthMm = parseFloat(this.getVal("#gate-width")) || 0;
		const heightMm = parseFloat(this.getVal("#gate-height")) || 0;

		// ВАЖНО: Проверяем, выбрал ли пользователь размеры (защита от пустого placeholder)
		if (widthMm === 0 || heightMm === 0) {
			this.showNotification("Пожалуйста, выберите ширину и высоту ворот!");
		}

		// 2. Конвертируем в метры для инженерных расчетов
		const width = widthMm / 1000;
		const height = heightMm / 1000;

		const postsMaterial = this.getVal("#gate-posts");
		const frameMaterial = this.getVal("#gate-frame-material");
		const claddingMaterial = this.getVal("#gate-cladding");
		const claddingMaterialStep = this.getVal("#gate-cladding-step");
		const paintMaterial = this.getVal("#gate-paint");
		const rollers = this.getVal("#gate-rollers");
		const rack = this.getVal("#gate-rack");
		const drive = this.getVal("#gate-drive");
		const slidingGate = document.getElementById("sliding-gate");

		// --- СПЕЦИФИКА ВОРОТ ---
		if (frameMaterial) {
			const frameLength = calculateGateFrameByType(width, height, this.selectedType);

			materials.push({
				name: frameMaterial,
				quantity: Math.ceil(frameLength),
			});
		}

		if (postsMaterial) {
			let postLength;
			if (slidingGate.checked) {
				// 2 двойных столба выше высоты на 20см с перемычкой 20 см (не заглубляются)
				postLength = (height + 0.2) * 4 + 0.4;
				materials.push({
					name: postsMaterial,
					quantity: Math.ceil(postLength),
				});
			} else {
				// 2 столба по высоте + 1.5 м на заглубление
				postLength = (height + BaseCalculator.CALCULATOR_CONSTANTS.gatePostDepth) * 2;
				materials.push({
					name: postsMaterial,
					quantity: Math.ceil(postLength),
				});
			}
		}

		if (claddingMaterial) {
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep);

			let finalWidth;
			let claddingCount;
			if (slidingGate.checked) {
				// расчет штакетника на всю ширину ворот
				finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width + claddingMaterialStep / 1000 : width;
				claddingCount = Math.ceil(finalWidth / materialWidth);
			} else {
				// расчет штакетника на одну  створку ворот и * 2;
				finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width / 2 + claddingMaterialStep / 1000 : width / 2;
				claddingCount = Math.ceil(finalWidth / materialWidth) * 2;
			}
			// Количество  материала  округляем в  большую  сторону
			materials.push({
				name: claddingMaterial,
				quantity: Math.ceil(claddingCount),
			});
		}

		if (paintMaterial) {
			materials.push({ name: paintMaterial, quantity: 1, finalPrice: true });
		}

		// Ролики, зуб. рейка, привод обычно идут в штуках
		if (rollers) {
			materials.push({ name: rollers, quantity: 2 }); // 2 роликовые тележки
		}

		if (rack) {
			const rackLength = width + 1; // Длина ворот +  метр запаса
			materials.push({ name: rack, quantity: rackLength });
		}

		if (drive) {
			materials.push({ name: drive, quantity: 1 }); // 1 привод
		}

		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { GateCalculator };
