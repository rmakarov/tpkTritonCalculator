import { BaseCalculator } from "./baseCalculator.js";
import { calculateGateFrameByType, calculateGatePartitionsByType } from "./gateCalculatorUtils.js";
import { showNotification } from "../utils/notification";

class GateCalculator extends BaseCalculator {
	constructor(rootElement, priceManager) {
		super(rootElement, priceManager);
	}

	// метод для получения выбранного типа ворот
	getSelectedType() {
		const checkedInput = this.element.querySelector('input[name="gate-type"]:checked');
		return checkedInput ? checkedInput.value : null;
	}

	getBothSidesSheathing() {
		const checkbox = document.querySelector('input[name="gate-both-sides-sheathing"]');

		return checkbox?.checked ?? false;
	}

	getBothSidesSheathing() {
		const checkbox = document.querySelector('input[name="gate-both-sides-sheathing"]');

		return checkbox?.checked ?? false;
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
			showNotification("Пожалуйста, выберите ширину и высоту ворот!");
		}

		// 2. Конвертируем в метры для инженерных расчетов
		const width = widthMm / 1000;
		const height = heightMm / 1000;

		const bothSideSheathing = this.getBothSidesSheathing();

		const isSliding = document.querySelector('input[id="sliding-gate"]');

		const markupOnTrimmings = this.getVal("#gate-markup-on-trimmings");
		const postsMaterial = this.getVal("#gate-posts");
		const postsMaterialSubName = postsMaterial?.previousElementSibling?.textContent.trim();
		const postsMarkup = this.getMarkupByFieldId("#gate-posts");
		const frameMaterial = this.getVal("#gate-frame-material");
		const frameMaterialSubName = frameMaterial?.previousElementSibling?.textContent.trim();
		const frameMarkup = this.getMarkupByFieldId("#gate-frame-material");
		const partitionsMaterial = this.getVal("#gate-partitions-material");
		const partitionsMaterialSubName = partitionsMaterial?.previousElementSibling?.textContent.trim();
		const partitionsMarkup = this.getMarkupByFieldId("#gate-partitions-material");
		const claddingMaterial = this.getVal("#gate-cladding");
		const claddingMarkup = this.getMarkupByFieldId("#gate-cladding");
		const claddingMaterialStep = this.getVal("#gate-cladding-step");
		const paintMaterial = this.getVal("#gate-paint");
		const paintMarkup = this.getMarkupByFieldId("#gate-paint");
		const rollers = this.getVal("#gate-rollers");
		const rollersMarkup = this.getMarkupByFieldId("#gate-rollers");
		const rack = this.getVal("#gate-rack");
		const rackMarkup = this.getMarkupByFieldId("#gate-rack");
		const drive = this.getVal("#gate-drive");
		const driveMarkup = this.getMarkupByFieldId("#gate-drive");
		const slidingGate = document.getElementById("sliding-gate");
		const sligingGateMarkup = this.getMarkupByFieldId("#sliding-gate");

		// --- СПЕЦИФИКА ВОРОТ ---
		if (frameMaterial) {
			const frameLength = calculateGateFrameByType(width, height, isSliding.checked, markupOnTrimmings);

			materials.push({
				name: frameMaterial,
				subName: ` (${frameMaterialSubName})`,
				quantity: Math.ceil(frameLength),
				markup: frameMarkup,
			});
		}

		if (partitionsMaterial) {
			const partitionsLength = calculateGatePartitionsByType(width, height, this.selectedType, markupOnTrimmings);
			materials.push({
				name: partitionsMaterial,
				subName: ` (${partitionsMaterialSubName})`,
				quantity: Math.ceil(partitionsLength),
				markup: partitionsMarkup,
			});
		}

		if (postsMaterial) {
			let postLength;
			if (slidingGate.checked) {
				// 2 двойных столба выше высоты на 20см с перемычкой 20 см (не заглубляются)
				postLength = (height + 0.2) * 4 + 0.4;
				const finalPostsLength = postsLength + (postsLength / 100) * markupOnTrimmings;
				materials.push({
					name: postsMaterial,
					subName: `( ${postsMaterialSubName})`,
					quantity: Math.ceil(finalPostsLength),
					markup: postsMarkup,
				});
			} else {
				// 2 столба по высоте + 1.5 м на заглубление
				postLength = (height + BaseCalculator.CALCULATOR_CONSTANTS.gatePostDepth) * 2;
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
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep);

			let finalWidth;
			let claddingCount;
			if (slidingGate.checked) {
				// расчет штакетника на всю ширину ворот
				finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width + claddingMaterialStep / 1000 : width;
				claddingCount = finalWidth / materialWidth;
			} else {
				// расчет штакетника на одну  створку ворот и * 2;
				finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? width / 2 + claddingMaterialStep / 1000 : width / 2;
				claddingCount = (finalWidth / materialWidth) * 2;
			}
			if (bothSideSheathing) {
				claddingCount = claddingCount * 2;
			}
			// Количество  материала  округляем в  большую  сторону
			materials.push({
				name: claddingMaterial,
				quantity: claddingMaterial.includes("3D") || claddingMaterial.includes("сетк") ? Math.ceil(claddingCount * 100) / 100 : Math.ceil(claddingCount),
				markup: claddingMarkup,
			});
		}

		if (paintMaterial) {
			materials.push({ name: paintMaterial, quantity: 1, markup: paintMarkup });
		}

		// Ролики, зуб. рейка, привод обычно идут в штуках
		if (rollers) {
			materials.push({ name: rollers, quantity: 2, markup: rollersMarkup }); // 2 роликовые тележки
		}

		if (rack) {
			const rackLength = width + 1; // Длина ворот +  метр запаса
			materials.push({ name: rack, quantity: rackLength, markup: rackMarkup });
		}

		if (drive) {
			materials.push({ name: drive, quantity: 1, markup: driveMarkup }); // 1 привод
		}

		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { GateCalculator };
