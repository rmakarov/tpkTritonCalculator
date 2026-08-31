import { BaseCalculator } from "./baseCalculator.js";
import { calculateWicketPartitionsByType, calculateWicketFrame, calculatePosts } from "./wicketCalculatorUtils.js";
import { showNotification } from "../utils/notification";
import { getValidatedNumber, attachNumericValidation } from "../utils/inputValidators";

/**
 * Калькулятор калитки
 */
class WicketCalculator extends BaseCalculator {
	constructor(rootElement, priceManager) {
		super(rootElement, priceManager);
		this.wicketFrameParts = {
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
				attachNumericValidation(markupInput, 1, 1000, { allowFloat: false });
				markupInput.dataset.validationAttached = "true";
			}
			return markupInput;
		};

		this._cachedInputs = {
			width: this.element.querySelector("#wicket-width"),
			height: this.element.querySelector("#wicket-height"),
			trimmingsMarkup: this.element.querySelector("#wicket-markup-on-trimmings"),
			claddingStep: this.element.querySelector("#wicket-cladding-step"),
			inFrame: this.element.querySelector("#wicket-in-frame"), // Проверьте, что в HTML именно wicket-in-frame
			bothSides: this.element.querySelector('input[name="wicket-both-sides-sheathing"]'),

			// ⚠️ ДОБАВЛЕНО: Кэшируем сами поля выбора материалов
			frameMaterial: this.element.querySelector("#wicket-frame-material"),
			partitionsMaterial: this.element.querySelector("#wicket-partitions-material"),
			postsMaterial: this.element.querySelector("#wicket-posts"),
			claddingMaterial: this.element.querySelector("#wicket-cladding"),
			paintMaterial: this.element.querySelector("#wicket-paint"),

			// Поля наценки
			frameMarkup: getAndValidateMarkup("#wicket-frame-material"),
			partitionsMarkup: getAndValidateMarkup("#wicket-partitions-material"),
			postsMarkup: getAndValidateMarkup("#wicket-posts"),
			claddingMarkup: getAndValidateMarkup("#wicket-cladding"),
			paintMarkup: getAndValidateMarkup("#wicket-paint"),
		};
	}

	/**
	 * Безопасный геттер для обычных текстовых/числовых полей
	 */
	_getValue(key) {
		const el = this._cachedInputs[key];
		return el ? el.value?.trim() : null;
	}

	/**
	 * Безопасный геттер для полей наценки (возвращает валидное число)
	 */
	_getMarkupValue(key) {
		const el = this._cachedInputs[`${key}Markup`];
		return getValidatedNumber(el, 0, 1000, { allowFloat: false });
	}

	// метод для получения выбранного типа калитки
	getSelectedType() {
		const checkedInput = this.element.querySelector('input[name="wicket-type"]:checked');
		return checkedInput ? checkedInput.value : null;
	}

	getBothSidesSheathing() {
		return this._cachedInputs.bothSides?.checked ?? false;
	}

	calculateRawMaterials() {
		const materials = [];
		this.wicketFrameParts.frame.items = [];
		this.wicketFrameParts.partitions.items = [];
		this.wicketFrameParts.posts.items = [];

		this.selectedType = this.getSelectedType();

		// 1. Получаем размеры (используем кэшированные геттеры)
		const widthMm = parseFloat(this._getValue("width")) || 0;
		const heightMm = parseFloat(this._getValue("height")) || 0;

		if (widthMm === 0 || heightMm === 0) {
			showNotification("Пожалуйста, выберите ширину и высоту калитки!");
			return []; // Прерываем расчет, если нет размеров
		}

		const bothSideSheathing = this.getBothSidesSheathing();
		const markupOnTrimmings = this._getValue("trimmingsMarkup");
		const inFrameChecked = this._cachedInputs.inFrame?.checked ?? false;

		// 2. Каркас
		const frameMaterial = this._getValue("frameMaterial") || this.element.querySelector("#wicket-frame-material")?.value?.trim(); // Fallback на случай динамического autocomplete
		const frameMaterialSubName = this.element.querySelector("#wicket-frame-material")?.previousElementSibling?.textContent.trim() || "";

		if (frameMaterial) {
			const frameResult = calculateWicketFrame({
				widthMm,
				heightMm,
				inFrame: inFrameChecked,
				markupOnTrimmings,
				materialName: `${frameMaterial} (${frameMaterialSubName})`,
			});
			this.wicketFrameParts.frame.items.push(...frameResult.parts);

			materials.push({
				name: frameMaterial,
				subName: ` (${frameMaterialSubName})`,
				quantity: Math.ceil((frameResult.totalLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("frame"),
			});
		}

		// 3. Перегородки
		const partitionsMaterial = this._getValue("partitionsMaterial") || this.element.querySelector("#wicket-partitions-material")?.value?.trim();
		const partitionsMaterialSubName = this.element.querySelector("#wicket-partitions-material")?.previousElementSibling?.textContent.trim() || "";

		if (partitionsMaterial) {
			const partitionsResult = calculateWicketPartitionsByType({
				widthMm,
				heightMm,
				wicketType: this.selectedType,
				inFrame: inFrameChecked,
				markupOnTrimmings,
				materialName: `${partitionsMaterial} (${partitionsMaterialSubName})`,
				materialFrameName: frameMaterial,
			});
			this.wicketFrameParts.partitions.items.push(...partitionsResult.parts);

			materials.push({
				name: partitionsMaterial,
				subName: ` (${partitionsMaterialSubName})`,
				quantity: Math.ceil((partitionsResult.totalLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("partitions"),
			});
		}

		// 4. Столбы
		const postsMaterial = this._getValue("postsMaterial") || this.element.querySelector("#wicket-posts")?.value?.trim();
		const postsMaterialSubName = this.element.querySelector("#wicket-posts")?.previousElementSibling?.textContent.trim() || "";

		if (postsMaterial) {
			const postsResult = calculatePosts({
				widthMm,
				heightMm,
				inFrame: inFrameChecked,
				wicketPostDepth: BaseCalculator.CALCULATOR_CONSTANTS.wicketPostDepth,
				markupOnTrimmings,
				materialName: `${postsMaterial} (${postsMaterialSubName})`, // Исправлена ошибка: было partitionsMaterial
			});
			this.wicketFrameParts.posts.items.push(...postsResult.parts);

			materials.push({
				name: postsMaterial,
				subName: ` (${postsMaterialSubName})`,
				quantity: Math.ceil((postsResult.totalLengthMm / 1000) * 10) / 10,
				markup: this._getMarkupValue("posts"),
			});
		}

		// 5. Обшивка (Cladding)
		const claddingMaterial = this._getValue("claddingMaterial") || this.element.querySelector("#wicket-cladding")?.value?.trim();
		if (claddingMaterial) {
			const claddingMaterialStep = parseFloat(this._getValue("claddingStep")) || 0;
			const materialWidth = this.getMaterialWidth(claddingMaterial, claddingMaterialStep);

			const finalWidth = claddingMaterial.includes("штакет") && claddingMaterialStep ? widthMm + claddingMaterialStep : widthMm;
			let claddingCount = finalWidth / materialWidth;

			if (bothSideSheathing) {
				claddingCount = claddingCount * 2;
			}

			materials.push({
				name: claddingMaterial,
				quantity: claddingMaterial.includes("3D") || claddingMaterial.includes("сетк") ? Math.ceil(claddingCount * 100) / 100 : Math.ceil(claddingCount),
				markup: this._getMarkupValue("cladding"), // Исправлена опечатка: было caddingMarkup
			});
		}

		// 6. Краска
		const paintMaterial = this._getValue("paintMaterial") || this.element.querySelector("#wicket-paint")?.value?.trim();
		console.log("paintMaterial: ", paintMaterial);
		if (paintMaterial) {
			materials.push({
				name: paintMaterial,
				quantity: 1,
				markup: this._getMarkupValue("paint"),
			});
		}

		console.log("materials.length: ", materials.length);
		// Фильтруем материалы, у которых есть цена в прайсе
		return materials.filter((m) => this.priceManager.getPrice(m.name));
	}
}

export { WicketCalculator };
