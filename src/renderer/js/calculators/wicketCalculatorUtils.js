import { settingsManager } from "../settingsManager";

const WICKET_TYPES = {
	WICKET_TYPE1: "wicket-type1",
	WICKET_TYPE2: "wicket-type2",
	WICKET_TYPE3: "wicket-type3",
	WICKET_TYPE4: "wicket-type4",
	WICKET_TYPE5: "wicket-type5",
	WICKET_TYPE6: "wicket-type6",
	WICKET_TYPE7: "wicket-type7",
	WICKET_TYPE8: "wicket-type8",
	WICKET_TYPE9: "wicket-type9",
	WICKET_TYPE10: "wicket-type10",
};

/**
 * Извлекает ширину и высоту профиля из текстового описания.
 * Игнорирует толщину стенки и цвет.
 *
 * @param {string} materialString - Например: "Профиль 40 х 20 х 1.5 черный"
 * @returns {Object|null} - { width: 40, height: 20 } или null, если не удалось распознать
 */
export const parseProfileDimensions = (materialString) => {
	if (!materialString || typeof materialString !== "string") {
		return null;
	}

	// Регулярное выражение:
	// (\d+)       -> захватывает первое число (ширина)
	// \s*         -> допускает любые пробелы (или их отсутствие)
	// [xх*хХ]     -> допускает разделитель: латинскую x, кириллическую х, звездочку * (в любом регистре)
	// \s*         -> снова допускает пробелы
	// (\d+)       -> захватывает второе число (высота)
	const regex = /(\d+)\s*[xх*хХ]\s*(\d+)/;

	const match = materialString.match(regex);

	if (match) {
		return {
			width: parseInt(match[1], 10), // Первое число (например, 40)
			height: parseInt(match[2], 10), // Второе число (например, 20)
		};
	}

	return null;
};

const getWicketPartitionsType1 = () => {
	return { parts: [], totalLengthMm: 0 };
};

const getWicketPartitionsType2 = ({ frameWidthMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;
	const markupMm = (partitionLengthMm / 100) * markupOnTrimmings;
	const totalLengthMm = partitionLengthMm + markupMm;

	return {
		parts: [{ name: materialName, lengthMm: partitionLengthMm, count: 1, pn: 3 }],
		totalLengthMm: totalLengthMm,
	};
};

const getWicketPartitionsType3 = ({ frameWidthMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;
	const markupMm = ((partitionLengthMm * 2) / 100) * markupOnTrimmings;
	const totalLengthMm = partitionLengthMm * 2 + markupMm;

	return {
		parts: [{ name: materialName, lengthMm: partitionLengthMm, count: 2, pn: 3 }],
		totalLengthMm: totalLengthMm,
	};
};

const getWicketPartitionsType4 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;

	let diagonal = getDiagonal(partitionLengthMm, frameHeightMm / 2 - profileWidth);
	const totalPartitiosLength = partitionLengthMm + diagonal * 2;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partitionLengthMm, count: 1, pn: 3 },
			{ name: materialName, lengthMm: diagonal, count: 2, pn: 4 },
		],
		totalLengthMm: totalLengthMm,
	};
};

const getWicketPartitionsType5 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;
	const GAP_BETVEEN_PARTITIONS = settingsManager.getCalculatorConstant("distanceBetweenPlanks");

	let diagonal = getDiagonal(partitionLengthMm, frameHeightMm / 2 - profileWidth - GAP_BETVEEN_PARTITIONS);
	const totalPartitiosLength = partitionLengthMm * 2 + diagonal * 2;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partitionLengthMm, count: 2, pn: 3 },
			{ name: materialName, lengthMm: diagonal, count: 2, pn: 4 },
		],
		totalLengthMm: totalLengthMm,
	};
};

//Рассчеты проверены с 2 по 5 тип! Остальные пока не активны! Для активации какого либо типа нужен чертеж деталей!

const getWicketPartitionsType6 = ({ frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameHeightMm - profileWidth * 2;
	const markup = (partitionLengthMm / 100) * markupOnTrimmings;
	const totalLengthWithMarkupMm = partitionLengthMm + markup;

	return {
		parts: [{ name: materialName, lengthMm: partitionLengthMm, count: 1 }],
		totalLengthMm: totalLengthWithMarkupMm,
	};
};

const getWicketPartitionsType7 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partition1 = frameWidthMm - profileWidth * 2;
	const partition2 = frameHeightMm - profileWidth * 2;
	const partitionLengthMm = partition1 + partition2;
	const markup = (partitionLengthMm / 100) * markupOnTrimmings;
	const totalLengthWithMarkupMm = partitionLengthMm + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partition1, count: 1 },
			{ name: materialName, lengthMm: partition2, count: 1 },
		],
		totalLengthMm: totalLengthWithMarkupMm,
	};
};

const getWicketPartitionsType8 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partition1 = frameWidthMm - profileWidth * 2;
	const partition2 = frameHeightMm - profileWidth * 2;
	const partitionLengthMm = partition1 + partition2 + partition2;
	const markup = (partitionLengthMm / 100) * markupOnTrimmings;
	const totalLengthWithMarkupMm = partitionLengthMm + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partition1, count: 1 },
			{ name: materialName, lengthMm: partition2, count: 2 },
		],
		totalLengthMm: totalLengthWithMarkupMm,
	};
};

const getWicketPartitionsType9 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionWidth = frameWidthMm - profileWidth * 2;
	const partitionHeight = frameHeightMm - profileWidth * 2;

	let diagonal = getDiagonal(partitionWidth, partitionHeight);
	const markup = (diagonal / 100) * markupOnTrimmings;
	const totalLengthWithMarkupMm = diagonal + markup;

	return {
		parts: [{ name: materialName, lengthMm: diagonal, count: 1 }],
		totalLengthMm: totalLengthWithMarkupMm,
	};
};

const getWicketPartitionsType10 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionWidth = frameWidthMm - profileWidth * 2;
	const partitionHeight = frameHeightMm - profileWidth * 2;

	let diagonal = getDiagonal(partitionWidth, partitionHeight);
	const partitionLengthMm = partitionWidth + diagonal;
	const markup = (partitionLengthMm / 100) * markupOnTrimmings;
	const totalLengthWithMarkupMm = partitionLengthMm + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partitionWidth, count: 1 },
			{ name: materialName, lengthMm: diagonal, count: 2 },
		],
		totalLengthMm: totalLengthWithMarkupMm,
	};
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const wicketPartitionsCalculators = {
	[WICKET_TYPES.WICKET_TYPE1]: getWicketPartitionsType1,
	[WICKET_TYPES.WICKET_TYPE2]: getWicketPartitionsType2,
	[WICKET_TYPES.WICKET_TYPE3]: getWicketPartitionsType3,
	[WICKET_TYPES.WICKET_TYPE4]: getWicketPartitionsType4,
	[WICKET_TYPES.WICKET_TYPE5]: getWicketPartitionsType5,
	[WICKET_TYPES.WICKET_TYPE6]: getWicketPartitionsType6,
	[WICKET_TYPES.WICKET_TYPE7]: getWicketPartitionsType7,
	[WICKET_TYPES.WICKET_TYPE8]: getWicketPartitionsType8,
	[WICKET_TYPES.WICKET_TYPE9]: getWicketPartitionsType9,
	[WICKET_TYPES.WICKET_TYPE10]: getWicketPartitionsType10,
};

// Return by default partitions lenght for wicket type2
export const calculateWicketPartitionsByType = ({ widthMm, heightMm, wicketType, inFrame, markupOnTrimmings, materialName, materialFrameName }) => {
	const GAP_IN_FRAME = settingsManager.getCalculatorConstant("wicketClearanceInFrame");
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("wicketClearanceBetweenPosts");
	const GAP_BETWEEN_GROUND = settingsManager.getCalculatorConstant("wicketClearanceBetweenGround");
	const calculator = wicketPartitionsCalculators[wicketType];
	const frameWidthMm = inFrame ? widthMm - GAP_IN_FRAME : widthMm - GAP_BETWEEN_POSTS;
	const frameHeightMm = inFrame ? heightMm - GAP_IN_FRAME : heightMm - GAP_BETWEEN_GROUND;

	let result;

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип калитки: "${wicketType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		result = getWicketPartitionsType2({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName });
	}

	result = calculator({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName });

	return result;
};

export const calculateWicketFrame = ({ widthMm, heightMm, inFrame, markupOnTrimmings, materialName }) => {
	// 1. Расчет чистых размеров
	const GAP_IN_FRAME = settingsManager.getCalculatorConstant("wicketClearanceInFrame");
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("wicketClearanceBetweenPosts");
	const GAP_BETWEEN_GROUND = settingsManager.getCalculatorConstant("wicketClearanceBetweenGround");
	const frameWidthMm = inFrame ? widthMm - GAP_IN_FRAME : widthMm - GAP_BETWEEN_POSTS;
	const frameHeightMm = inFrame ? heightMm - GAP_IN_FRAME : heightMm - GAP_BETWEEN_GROUND;

	// 2. Расчет длины с наценкой на подрезку
	const rawLengthMm = frameWidthMm * 2 + frameHeightMm * 2;
	const markupMm = (rawLengthMm / 100) * markupOnTrimmings;
	const totalLengthMm = rawLengthMm + markupMm;

	// 3. Возвращаем структурированный результат
	return {
		parts: [
			{ name: materialName, lengthMm: frameWidthMm, count: 2, pn: 1 },
			{ name: materialName, lengthMm: frameHeightMm, count: 2, pn: 2 },
		],
		totalLengthMm: totalLengthMm,
	};
};

export const calculatePosts = ({ widthMm, heightMm, inFrame, markupOnTrimmings, materialName }) => {
	if (inFrame) {
		const postsLength = widthMm * 2 + heightMm * 2;
		const markupMm = (postsLength / 100) * markupOnTrimmings;
		const totalLengthMm = postsLength + markupMm;
		return {
			parts: [
				{ name: materialName, lengthMm: widthMm, count: 2 },
				{ name: materialName, lengthMm: heightMm, count: 2 },
			],
			totalLengthMm: totalLengthMm,
		};
	} else {
		const WICKET_POST_DEPTH = settingsManager.getCalculatorConstant("wicketPostDepth");
		const postLength = heightMm + WICKET_POST_DEPTH;
		const postsLength = postLength * 2;
		const markupMm = (postsLength / 100) * markupOnTrimmings;
		const totalLengthMm = postsLength + markupMm;

		return {
			parts: [{ name: materialName, lengthMm: postsLength, count: 2 }],
			totalLengthMm: totalLengthMm,
		};
	}
};

/*
	Если материал: профиль - количество = общая ширина / ширину профиля и округляем до целого. Если  обшивка с  2-х сторон, то количество = (общая ширина / ширину профиля) * 2 и округляем до целого.
	Если материал: штакетник - количество = общая ширина / ширину штакетника (приходит уже с шагом между штакетником) и округляем до целого. Если  обшивка с  2-х сторон, то количество = (общая ширина / ширину штакетника и округляем до целого) * 2.
	Если материал: 3Д сетка - количество = общая ширина / ширину сетки. Если  обшивка с  2-х сторон, то количество = (общая ширина / ширину сетки) * 2. Округляем до 1 цифры  после  запятой (в большую сторону)
*/
export const calculateWicketMaterials = (widthMm, materialWidth, claddingMaterial, inFrame, bothSideSheathing) => {
	let materialCount;
	const GAP_IN_FRAME = settingsManager.getCalculatorConstant("wicketClearanceInFrame");
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("wicketClearanceBetweenPosts");
	const materialFense = claddingMaterial.includes("штакет");
	const material3DGrid = claddingMaterial.includes("3D") || claddingMaterial.includes("3Д") || claddingMaterial.includes("сетк");
	const frameWidthMm = inFrame ? widthMm - GAP_IN_FRAME : widthMm - GAP_BETWEEN_POSTS;

	if (materialFense) {
		materialCount = customMaterialRound(frameWidthMm / materialWidth);
		if (bothSideSheathing) {
			materialCount = materialCount * 2;
		}
	} else if (material3DGrid) {
		materialCount = frameWidthMm / materialWidth;
		if (bothSideSheathing) {
			materialCount = materialCount * 2;
		}
		materialCount = Math.ceil(materialCount * 10) / 10;
	} else {
		materialCount = frameWidthMm / materialWidth;
		if (bothSideSheathing) {
			materialCount = Math.round(materialCount * 2);
		} else {
			materialCount = Math.round(materialCount);
		}
	}
	return materialCount;
};

export function customMaterialRound(num) {
	if (num === null || num === undefined || isNaN(num)) return 0;

	// Получаем первую цифру после запятой.
	// Умножаем на 10, берем остаток от деления на 10 и округляем вниз.
	// Пример: 5.29 * 10 = 52.9 -> 52.9 % 10 = 2.9 -> Math.floor(2.9) = 2
	const firstDecimalDigit = Math.floor((num * 10) % 10);

	if (firstDecimalDigit <= 2) {
		return Math.round(num);
	} else {
		return Math.ceil(num);
	}
}
