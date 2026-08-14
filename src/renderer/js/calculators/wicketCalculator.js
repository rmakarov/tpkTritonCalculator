import { BaseCalculator } from "./baseCalculator.js";
import { calculateWicketFrameByType } from "./wicketCalculatorUtils.js";

/**
 * Калькулятор калитки
 */
class WicketCalculator extends BaseCalculator {
	constructor(rootElement, priceManager) {
		super(rootElement, priceManager);
	}

	// метод для получения выбранного типа калитки
	getSelectedType() {
		const checkedInput = this.element.querySelector('input[name="wicket-type"]:checked');
		return checkedInput ? checkedInput.value : null;
	}

	calculateRawMaterials() {
		const materials = [];

		// выбранный тип
		this.selectedType = this.getSelectedType();
		console.log("Выбран тип калитки:", this.selectedType);

		// 1. Получаем размеры в миллиметрах из выпадающего списка
		const widthMm = parseFloat(this.getVal("#wicket-width")) || 0;
		const heightMm = parseFloat(this.getVal("#wicket-height")) || 0;

		// ВАЖНО: Проверяем, выбрал ли пользователь размеры (защита от пустого placeholder)
		if (widthMm === 0 || heightMm === 0) {
			this.showNotification("Пожалуйста, выберите ширину и высоту калитки!");
		}

		// 2. Конвертируем в метры для инженерных расчетов
		const width = widthMm / 1000;
		const height = heightMm / 1000;

		// 3. Получаем выбранные материалы
		const frameMaterial = this.getVal("#wicket-frame-material");
		const postsMaterial = this.getVal("#wicket-posts");
		const claddingMaterial = this.getVal("#wicket-cladding");
		const claddingMaterialStep = this.getVal("#wicket-cladding-step");
		const paintMaterial = this.getVal("#wicket-paint");
		const inFrame = document.getElementById("wicked-in-frame");

		// 4. Считаем количества (Формулы теперь работают с метрами!)
		if (frameMaterial) {
			// Периметр (в метрах) + внутренняя 1 перемычка
			//const frameLength = width * 2 + height * 2 + width;
			const frameLength = calculateWicketFrameByType(width, height, this.selectedType);
			materials.push({
				name: frameMaterial,
				quantity: Math.ceil(frameLength),
			});
		}

		if (postsMaterial) {
			let postsLength;
			if (inFrame.checked) {
				// рама калитки + 10см на саму раму
				postsLength = (width + 0.1) * 2 + (height + 0.1) * 2;
				materials.push({
					name: postsMaterial,
					quantity: Math.ceil(postsLength),
				});
			} else {
				// 2 столба по высоте + 1.2 м на заглубление
				postsLength = (height + BaseCalculator.CALCULATOR_CONSTANTS.wicketPostDepth) * 2;
				materials.push({
					name: postsMaterial,
					quantity: Math.ceil(postsLength),
				});
			}
		}

		if (claddingMaterial) {
			// Количество материала обшивки
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep);
			const finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width + claddingMaterialStep / 1000 : width;
			const claddingCount = finalWidth / materialWidth;
			// Количество  материала  округляем в  большую  сторону
			materials.push({
				name: claddingMaterial,
				quantity: Math.ceil(claddingCount),
			});
		}

		if (paintMaterial) {
			materials.push({ name: paintMaterial, quantity: 1 });
		}

		// Фильтруем материалы, у которых есть цена в прайсе
		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { WicketCalculator };
