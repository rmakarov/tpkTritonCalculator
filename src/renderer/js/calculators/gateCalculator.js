import { BaseCalculator } from "./baseCalculator.js";
import { calculateGateFrameByType, calculateGatePartitionsByType } from "./gateCalculatorUtils.js";
import { showNotification } from "../utils/notification";
import { getValidatedNumber, attachNumericValidation } from "../utils/inputValidators";

class GateCalculator extends BaseCalculator {
	constructor(rootElement, priceManager) {
		super(rootElement, priceManager);
		this.gateFrameParts = {
			frame: {
				name: "Каркас рамы",
				items: [],
			},
			partitions: {
				name: " Перегородки",
				items: [],
			},
			posts: {
				name: "Столбы",
				items: [],
			},
		};
		this._cachedInputs = {};
	}

	async init() {
		await super.init();
		this._setupInputs();
	}

	_setupInputs() {
		const getAndValidateMarkup = (materialFieldId) => {
			const materialInput = this.element.querySelector(materialFieldId);
			if (!materialInput) return null;

			const markupInput = materialInput.parentElement.querySelector(".calculator-markup");
			if (markupInput && !markupInput.dataset.validationAttached) {
				attachNumericValidation(markupInput, 0, 1000, { allowFloat: false });
				markupInput.dataset.validationAttached = "true";
			}
			return markupInput;
		};

		this._cachedInputs = {
			width: this.element.querySelector("#gate-width"),
			height: this.element.querySelector("#gate-height"),
			trimmingsMarkup: this.element.querySelector("#gate-markup-on-trimmings"),
			claddingStep: this.element.querySelector("#gate-cladding-step"),

			bothSides: this.element.querySelector('input[name="gate-both-sides-sheathing"]'),
			techPart: this.element.querySelector('input[name="gate-technological-part"]'),
			openingSliding: this.element.querySelector('input[id="sliding-gate"]'),

			postsMaterial: this.element.querySelector("#gate-posts"),
			frameMaterial: this.element.querySelector("#gate-frame-material"),
			partitionsMaterial: this.element.querySelector("#gate-partitions-material"),
			claddingMaterial: this.element.querySelector("#gate-cladding"),
			paintMaterial: this.element.querySelector("#gate-paint"),
			rollers: this.element.querySelector("#gate-rollers"),
			rack: this.element.querySelector("#gate-rack"),
			drive: this.element.querySelector("#gate-drive"),
			slidingGateMaterial: this.element.querySelector("#sliding-gate"),

			postsMarkup: getAndValidateMarkup("#gate-posts"),
			frameMarkup: getAndValidateMarkup("#gate-frame-material"),
			partitionsMarkup: getAndValidateMarkup("#gate-partitions-material"),
			claddingMarkup: getAndValidateMarkup("#gate-cladding"),
			paintMarkup: getAndValidateMarkup("#gate-paint"),
			rollersMarkup: getAndValidateMarkup("#gate-rollers"),
			rackMarkup: getAndValidateMarkup("#gate-rack"),
			driveMarkup: getAndValidateMarkup("#gate-drive"),
			slidingGateMarkup: getAndValidateMarkup("#sliding-gate"),
		};
	}

	_getValue(key) {
		const el = this._cachedInputs[key];
		return el ? el.value?.trim() : null;
	}

	_getMarkupValue(key) {
		const el = this._cachedInputs[`${key}Markup`];
		return getValidatedNumber(el, 0, 1000, { allowFloat: false });
	}

	// метод для получения выбранного типа ворот
	getSelectedType() {
		const checkedInput = this.element.querySelector('input[name="gate-type"]:checked');
		return checkedInput ? checkedInput.value : null;
	}

	getBothSidesSheathing() {
		return this._cachedInputs.bothSides?.checked ?? false;
	}

	getRectangularTechPart() {
		return this._cachedInputs.techPart?.checked ?? false;
	}

	isSlidingGate() {
		return this._cachedInputs.openingSliding?.checked ?? false;
	}

	calculateRawMaterials() {
		const materials = [];
		this.gateFrameParts.frame.items = [];
		this.gateFrameParts.partitions.items = [];
		this.gateFrameParts.posts.items = [];

		this.selectedType = this.getSelectedType();

		// 1. Получаем размеры СТРОГО в миллиметрах
		const widthMm = parseFloat(this._getValue("width")) || 0;
		const heightMm = parseFloat(this._getValue("height")) || 0;

		if (widthMm === 0 || heightMm === 0) {
			showNotification("Пожалуйста, выберите ширину и высоту ворот!");
			return [];
		}

		const bothSideSheathing = this.getBothSidesSheathing();
		const rectangularTechPart = this.getRectangularTechPart();
		const isSliding = this.isSlidingGate();
		const markupOnTrimmings = parseFloat(this._getValue("trimmingsMarkup")) || 0;

		// 2. Каркас (функция утилиты должна принимать мм)
		const frameMaterial = this._getValue("frameMaterial");
		const frameMaterialSubName = this._cachedInputs.frameMaterial?.previousElementSibling?.textContent.trim() || "";

		if (frameMaterial) {
			const frameResult = calculateGateFrameByType({
				widthMm,
				heightMm,
				slidingGate: isSliding,
				markupOnTrimmings,
				materialName: `${frameMaterial} (${frameMaterialSubName})`,
				rectangularTechPart,
			});

			this.gateFrameParts.frame.items.push(...frameResult.parts);

			materials.push({
				name: frameMaterial,
				subName: ` (${frameMaterialSubName})`,
				// Конвертация в метры только для quantity
				quantity: Math.ceil((frameResult.totalLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("frame"),
			});
		}

		// 3. Перегородки (передаем мм, функция утилиты должна работать с мм)
		const partitionsMaterial = this._getValue("partitionsMaterial");
		const partitionsMaterialSubName = this._cachedInputs.partitionsMaterial?.previousElementSibling?.textContent.trim() || "";

		if (partitionsMaterial) {
			const partitionsLengthMm = calculateGatePartitionsByType(widthMm, heightMm, this.selectedType, markupOnTrimmings);

			materials.push({
				name: partitionsMaterial,
				subName: ` (${partitionsMaterialSubName})`,
				quantity: Math.ceil((partitionsLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("partitions"),
			});
		}

		// 4. Столбы (ВСЕ РАСЧЕТЫ В ММ)
		const postsMaterial = this._getValue("postsMaterial");
		const postsMaterialSubName = this._cachedInputs.postsMaterial?.previousElementSibling?.textContent.trim() || "";

		if (postsMaterial) {
			let postLengthMm = 0;

			if (isSliding) {
				// 2 двойных столба выше высоты на 20см (200мм) с перемычкой 20см (400мм на два конца или как в оригинале)
				// Оригинальная формула в метрах: (height + 0.2) * 4 + 0.4
				// Перевод в мм:
				postLengthMm = (heightMm + 200) * 4 + 400;
			} else {
				// 2 столба по высоте + заглубление (уже в мм в константах)
				postLengthMm = (heightMm + BaseCalculator.CALCULATOR_CONSTANTS.gatePostDepth) * 2;
			}

			// Применяем наценку на подрезку к длине в мм
			const markupMultiplier = 1 + markupOnTrimmings / 100;
			const finalPostsLengthMm = postLengthMm * markupMultiplier;

			materials.push({
				name: postsMaterial,
				subName: ` (${postsMaterialSubName})`,
				quantity: Math.ceil((finalPostsLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("posts"),
			});
		}

		// 5. Обшивка (Cladding) - ВСЕ РАСЧЕТЫ В ММ
		const claddingMaterial = this._getValue("claddingMaterial");
		if (claddingMaterial) {
			const claddingMaterialStep = parseFloat(this._getValue("claddingStep")) || 0;
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep); // возвращает мм

			let finalWidthMm;
			let claddingCount;

			if (isSliding) {
				// расчет на всю ширину ворот
				finalWidthMm = claddingMaterial.includes("штакет") && claddingMaterialStep ? widthMm + claddingMaterialStep : widthMm;
				claddingCount = finalWidthMm / materialWidth; // Делим мм на мм, получаем штуки
			} else {
				// расчет на одну створку и * 2
				finalWidthMm = claddingMaterial.includes("штакет") && claddingMaterialStep ? widthMm / 2 + claddingMaterialStep : widthMm / 2;
				claddingCount = (finalWidthMm / materialWidth) * 2;
			}

			if (bothSideSheathing) {
				claddingCount = claddingCount * 2;
			}

			materials.push({
				name: claddingMaterial,
				quantity: claddingMaterial.includes("3D") || claddingMaterial.includes("сетк") ? Math.ceil(claddingCount * 100) / 100 : Math.ceil(claddingCount),
				markup: this._getMarkupValue("cladding"),
			});
		}

		// 6. Краска
		const paintMaterial = this._getValue("paintMaterial");
		if (paintMaterial) {
			materials.push({
				name: paintMaterial,
				quantity: 1,
				markup: this._getMarkupValue("paint"),
			});
		}

		// 7. Комплектующие для откатных ворот
		const rollers = this._getValue("rollers");
		if (rollers) {
			materials.push({ name: rollers, quantity: 2, markup: this._getMarkupValue("rollers") });
		}

		const rack = this._getValue("rack");
		if (rack) {
			// Длина ворот + 1 метр (1000 мм) запаса. Расчет в мм.
			const rackLengthMm = widthMm + 1000;
			materials.push({
				name: rack,
				quantity: Math.ceil((rackLengthMm / 1000) * 10) / 10, // Конвертация в метры для quantity
				markup: this._getMarkupValue("rack"),
			});
		}

		const drive = this._getValue("drive");
		if (drive) {
			materials.push({ name: drive, quantity: 1, markup: this._getMarkupValue("drive") });
		}

		// Фильтруем материалы, у которых есть цена в прайсе
		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { GateCalculator };
