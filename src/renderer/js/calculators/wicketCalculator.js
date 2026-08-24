import { BaseCalculator } from "./baseCalculator.js";
import { calculateWicketPartitionsByType, calculateWicketFrame } from "./wicketCalculatorUtils.js";
import { showNotification } from "../utils/notification";

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

	getBothSidesSheathing() {
		const checkbox = document.querySelector('input[name="wicket-both-sides-sheathing"]');

		return checkbox?.checked ?? false;
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
			showNotification("Пожалуйста, выберите ширину и высоту калитки!");
		}

		// 2. Конвертируем в метры для инженерных расчетов
		const width = widthMm / 1000;
		const height = heightMm / 1000;

		const bothSideSheathing = this.getBothSidesSheathing();

		// 3. Получаем выбранные материалы
		const markupOnTrimmings = this.getVal("#wicket-markup-on-trimmings");
		const frameMaterial = this.getVal("#wicket-frame-material");
		const frameMaterialSubName = frameMaterial?.previousElementSibling?.textContent.trim();
		const frameMarkup = this.getMarkupByFieldId("#wicket-frame-material");
		const partitionsMaterial = this.getVal("#wicket-partitions-material");
		const partitionsMaterialSubName = partitionsMaterial?.previousElementSibling?.textContent.trim();
		const partitionsMarkup = this.getMarkupByFieldId("#wicket-partitions-material");
		const postsMaterial = this.getVal("#wicket-posts");
		const postsMaterialSubName = postsMaterial?.previousElementSibling?.textContent.trim();
		const postsMarkup = this.getMarkupByFieldId("#wicket-posts");
		const claddingMaterial = this.getVal("#wicket-cladding");
		const caddingMarkup = this.getMarkupByFieldId("#wicket-cladding");
		const claddingMaterialStep = this.getVal("#wicket-cladding-step");
		const paintMaterial = this.getVal("#wicket-paint");
		const paintMarkup = this.getMarkupByFieldId("#wicket-paint");
		const inFrame = document.getElementById("wicked-in-frame");

		// 4. Считаем количества (Формулы теперь работают с метрами!)
		if (frameMaterial) {
			// Периметр (в метрах)
			//const frameLength = width * 2 + height * 2 + наценка  на  обрезь;
			const frameLength = calculateWicketFrame(width, height, markupOnTrimmings);
			materials.push({
				name: frameMaterial,
				subName: ` (${frameMaterialSubName})`,
				quantity: Math.ceil(frameLength),
				markup: frameMarkup,
			});
		}

		if (partitionsMaterial) {
			//partitionsLength расчитываем от выбранного типа + наценка  на  обрезь;
			const partitionsLength = calculateWicketPartitionsByType(width, height, this.selectedType, markupOnTrimmings);
			materials.push({
				name: partitionsMaterial,
				subName: ` (${partitionsMaterialSubName})`,
				quantity: Math.ceil(partitionsLength),
				markup: partitionsMarkup,
			});
		}

		if (postsMaterial) {
			let postsLength;
			if (inFrame.checked) {
				// рама калитки + 10см на саму раму
				postsLength = (width + 0.1) * 2 + (height + 0.1) * 2;
				const finalPostsLength = postsLength + (postsLength / 100) * markupOnTrimmings;
				materials.push({
					name: postsMaterial,
					subName: `( ${postsMaterialSubName})`,
					quantity: Math.ceil(finalPostsLength),
					markup: postsMarkup,
				});
			} else {
				// 2 столба по высоте + 1.2 м на заглубление
				postsLength = (height + BaseCalculator.CALCULATOR_CONSTANTS.wicketPostDepth) * 2;
				const finalPostsLength = postsLength + (postsLength / 100) * markupOnTrimmings;
				materials.push({
					name: postsMaterial,
					subName: `( ${postsMaterialSubName})`,
					quantity: Math.ceil(finalPostsLength),
					markup: postsMarkup,
				});
			}
		}

		if (claddingMaterial) {
			// Количество материала обшивки
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep);
			const finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width + claddingMaterialStep / 1000 : width;
			let claddingCount = finalWidth / materialWidth;
			if (bothSideSheathing) {
				claddingCount = claddingCount * 2;
			}
			// Количество  материала  округляем в  большую  сторону, если не сетка - то до целого числа
			materials.push({
				name: claddingMaterial,
				quantity: claddingMaterial.includes("3D") || claddingMaterial.includes("сетк") ? Math.ceil(claddingCount * 100) / 100 : Math.ceil(claddingCount),
				markup: caddingMarkup,
			});
		}

		if (paintMaterial) {
			materials.push({ name: paintMaterial, quantity: 1, markup: paintMarkup });
		}

		// Фильтруем материалы, у которых есть цена в прайсе
		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { WicketCalculator };
