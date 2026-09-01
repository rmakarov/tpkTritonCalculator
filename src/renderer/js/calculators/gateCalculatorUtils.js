import { settingsManager } from "../settingsManager";
import { parseProfileDimensions, customMaterialRound } from "./wicketCalculatorUtils.js";
import { calcSlideGateFrame } from "./slideGateCalculatorUtils.js";

const GATE_TYPES = {
	GATE_TYPE1: "gate-type1",
	GATE_TYPE2: "gate-type2",
	GATE_TYPE3: "gate-type3",
	GATE_TYPE4: "gate-type4",
	GATE_TYPE5: "gate-type5",
	GATE_TYPE6: "gate-type6",
	GATE_TYPE7: "gate-type7",
	GATE_TYPE8: "gate-type8",
	GATE_TYPE9: "gate-type9",
	GATE_TYPE10: "gate-type10",
	SLIDING_GATE_TYPE1: "sliding-gate-type1",
	SLIDING_GATE_TYPE2: "sliding-gate-type2",
};

const getGatePartitionsType1 = () => {
	return 0;
};

const getGatePartitionsType2 = ({ frameWidthMm, markupOnTrimmings, materialName, materialFrameName }) => {
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

const getGatePartitionsType3 = ({ frameWidthMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;
	const markupMm = ((partitionLengthMm * 4) / 100) * markupOnTrimmings;
	const totalLengthMm = partitionLengthMm * 4 + markupMm;

	return {
		parts: [{ name: materialName, lengthMm: partitionLengthMm, count: 4, pn: 4 }],
		totalLengthMm: totalLengthMm,
	};
};

const getGatePartitionsType4 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;

	let diagonal = getDiagonal(partitionLengthMm, frameHeightMm / 2 - profileWidth);
	const totalPartitiosLength = partitionLengthMm * 2 + diagonal * 4;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partitionLengthMm, count: 2, pn: 3 },
			{ name: materialName, lengthMm: diagonal, count: 4, pn: 4 },
		],
		totalLengthMm: totalLengthMm,
	};
};

const getGatePartitionsType5 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const partitionLengthMm = frameWidthMm - profileWidth * 2;
	const GAP_BETVEEN_PARTITIONS = settingsManager.getCalculatorConstant("distanceBetweenPlanks");

	let diagonal = getDiagonal(partitionLengthMm, frameHeightMm / 2 - profileWidth - GAP_BETVEEN_PARTITIONS);
	const totalPartitiosLength = partitionLengthMm * 4 + diagonal * 4;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: partitionLengthMm, count: 4, pn: 3 },
			{ name: materialName, lengthMm: diagonal, count: 2, pn: 4 },
		],
		totalLengthMm: totalLengthMm,
	};
};

//Рассчеты проверены с 2 по 5 тип! Остальные пока не активны! Для активации какого либо типа нужен чертеж деталей!
const getGatePartitionsType6 = ({ height }) => {
	return height * 2;
};

const getGatePartitionsType7 = ({ width, height }) => {
	return width + height * 2;
};

const getGatePartitionsType8 = ({ width, height }) => {
	return width + height * 4;
};

const getGatePartitionsType9 = ({ width, height }) => {
	let diagonal = getDiagonal(width / 2, height);
	return diagonal * 2;
};

const getGatePartitionsType10 = ({ width, height }) => {
	let diagonal = getDiagonal(width / 2, height);
	return width + diagonal * 2;
};

const getSlidingGatePartitionsType1 = ({ frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	//  вертикальная поперечина + 2 диагонали (на потовину ворот) + усилители хвостовой части (2  шт равны  как  раз высоте ворот)
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const innerFrameWidth = frameWidthMm - profileWidth * 2;
	const innerFrameHeight = frameHeightMm - profileWidth * 2;
	let diagonal = getDiagonal(innerFrameWidth / 2, innerFrameHeight);

	const totalPartitiosLength = innerFrameWidth * 2 + innerFrameHeight * 2 + diagonal * 4;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: innerFrameWidth, count: 2 },
			{ name: materialName, lengthMm: innerFrameHeight, count: 2 },
			{ name: materialName, lengthMm: diagonal, count: 2 },
		],
		totalLengthMm: totalLengthMm,
	};
};

const getSlidingGatePartitionsType2 = ({ widthMm, frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName }) => {
	const profile = parseProfileDimensions(materialFrameName);
	const profileWidth = profile ? profile.width : 40;
	const profileInner = parseProfileDimensions(materialName);
	const profileInnerWidth = profileInner ? profileInner.width : 40;
	const innerFrameWidth = frameWidthMm - profileWidth * 2; // деталь 12
	const innerFrameHeight = frameHeightMm - profileWidth * 2; // деталь 5
	const sections = getSectionsSlidingGateType2(widthMm, innerFrameWidth); // количество секций
	const innerVertFull = innerFrameHeight - profileInnerWidth * 2; //деталь 10
	const innerFulldiagonal = getDiagonal(innerFrameWidth / sections - profileInnerWidth * sections, innerVertFull); //деталь 11
	const innerVertHalf = innerVertFull * 0.45; //деталь 9
	const innerHalfdiagonal = getDiagonal(innerFrameWidth / (sections * 2) - profileInnerWidth * sections, innerVertHalf); //деталь 8
	const innerHorizontalSections = innerFrameWidth / sections - profileInnerWidth * (sections - 1); //детали 13 и 14 общая  длина

	const totalPartitiosLength =
		innerFrameWidth * 2 +
		innerFrameHeight * 2 +
		innerVertFull * (sections - 1) +
		innerFulldiagonal * sections +
		innerVertHalf * sections +
		innerHalfdiagonal * sections +
		innerHorizontalSections * sections;
	const markup = (totalPartitiosLength / 100) * markupOnTrimmings;
	const totalLengthMm = totalPartitiosLength + markup;

	return {
		parts: [
			{ name: materialName, lengthMm: innerFrameWidth, count: 2 },
			{ name: materialName, lengthMm: innerFrameHeight, count: 2 },
			{ name: materialName, lengthMm: innerVertFull, count: sections - 1 },
			{ name: materialName, lengthMm: innerFulldiagonal, count: sections },
			{ name: materialName, lengthMm: innerVertHalf, count: sections },
			{ name: materialName, lengthMm: innerHalfdiagonal, count: sections },
			{ name: materialName, lengthMm: innerHorizontalSections, count: sections },
		],
		totalLengthMm: totalLengthMm,
	};
};

const getSectionsSlidingGateType2 = (widthMm) => {
	if (widthMm < 4200) {
		return 2;
	} else if (widthMm >= 4200 && widthMm < 5080) {
		return 3;
	} else if (widthMm >= 5080 && widthMm < 6040) {
		return 4;
	} else if (widthMm >= 6040 && widthMm < 7180) {
		return 5;
	} else if (widthMm >= 7180 && widthMm < 8000) {
		return 6;
	} else if (widthMm >= 8000) {
		return 6;
	}
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const gatePartitionsCalculators = {
	[GATE_TYPES.GATE_TYPE1]: getGatePartitionsType1,
	[GATE_TYPES.GATE_TYPE2]: getGatePartitionsType2,
	[GATE_TYPES.GATE_TYPE3]: getGatePartitionsType3,
	[GATE_TYPES.GATE_TYPE4]: getGatePartitionsType4,
	[GATE_TYPES.GATE_TYPE5]: getGatePartitionsType5,
	[GATE_TYPES.GATE_TYPE6]: getGatePartitionsType6,
	[GATE_TYPES.GATE_TYPE7]: getGatePartitionsType7,
	[GATE_TYPES.GATE_TYPE8]: getGatePartitionsType8,
	[GATE_TYPES.GATE_TYPE9]: getGatePartitionsType9,
	[GATE_TYPES.GATE_TYPE10]: getGatePartitionsType10,
	[GATE_TYPES.SLIDING_GATE_TYPE1]: getSlidingGatePartitionsType1,
	[GATE_TYPES.SLIDING_GATE_TYPE2]: getSlidingGatePartitionsType2,
};

// Return by default partitions lenght for wicket type2
export const calculateGatePartitionsByType = ({ widthMm, heightMm, gateType, slidingGate, markupOnTrimmings, materialName, materialFrameName, rectangularTechPart }) => {
	const calculator = gatePartitionsCalculators[gateType];
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("gateClearanceBetweenPosts");
	const GAP_BETWEEN_GROUND = settingsManager.getCalculatorConstant("gateClearanceBetweenGround");
	let frameWidthMm;
	let frameHeightMm;
	let result;

	if (slidingGate) {
		const slidingFrameResult = calcSlideGateFrame(heightMm, widthMm, rectangularTechPart);
		frameWidthMm = rectangularTechPart ? slidingFrameResult.topWidth - slidingFrameResult.catet : slidingFrameResult.topWidth;
		frameHeightMm = slidingFrameResult.height;
	} else {
		frameWidthMm = (widthMm - GAP_BETWEEN_POSTS) / 2;
		frameHeightMm = heightMm - GAP_BETWEEN_GROUND;
	}

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип ворот: "${gateType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		result = getGatePartitionsType2({ widthMm, frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName });
	}
	result = calculator({ widthMm, frameWidthMm, frameHeightMm, markupOnTrimmings, materialName, materialFrameName });

	return result;
};

export const calculateGateFrameByType = ({ widthMm, heightMm, slidingGate, markupOnTrimmings, materialName, rectangularTechPart }) => {
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("gateClearanceBetweenPosts");
	const GAP_BETWEEN_GROUND = settingsManager.getCalculatorConstant("gateClearanceBetweenGround");

	if (slidingGate) {
		const slidingFrameResult = calcSlideGateFrame(heightMm, widthMm, rectangularTechPart);
		let rawLengthMm =
			slidingFrameResult.topWidth + slidingFrameResult.bottomWidth + slidingFrameResult.height + slidingFrameResult.diagonal + slidingFrameResult.stiffener1 + slidingFrameResult.stiffener2;
		if (rectangularTechPart) {
			rawLengthMm += slidingFrameResult.height;
		}
		const markupMm = (rawLengthMm / 100) * markupOnTrimmings;
		const totalLengthMm = rawLengthMm + markupMm;
		return {
			parts: [
				{ name: materialName, lengthMm: slidingFrameResult.topWidth, count: 1 },
				{ name: materialName, lengthMm: slidingFrameResult.bottomWidth, count: 1 },
				{ name: materialName, lengthMm: slidingFrameResult.height, count: rectangularTechPart ? 2 : 1 },
				{ name: materialName, lengthMm: slidingFrameResult.diagonal, count: 1 },
				{ name: materialName, lengthMm: slidingFrameResult.stiffener1, count: 1 },
				{ name: materialName, lengthMm: slidingFrameResult.stiffener2, count: 1 },
			],
			totalLengthMm: totalLengthMm,
		};
	} else {
		const frameWidthMm = (widthMm - GAP_BETWEEN_POSTS) / 2;
		const frameHeightMm = heightMm - GAP_BETWEEN_GROUND;

		const rawLengthMm = frameWidthMm * 4 + frameHeightMm * 4;
		const markupMm = (rawLengthMm / 100) * markupOnTrimmings;
		const totalLengthMm = rawLengthMm + markupMm;
		return {
			parts: [
				{ name: materialName, lengthMm: frameWidthMm, count: 4 },
				{ name: materialName, lengthMm: frameHeightMm, count: 4 },
			],
			totalLengthMm: totalLengthMm,
		};
	}
};

export const calculateGatePosts = (heightMm, slidingGate, markupOnTrimmings, materialName) => {
	if (slidingGate) {
		const postLength = heightMm + 100;
		const markupMm = ((postLength * 2) / 100) * markupOnTrimmings;
		const totalLengthMm = postLength * 2 + markupMm;
		return {
			parts: [{ name: materialName, lengthMm: postLength, count: 2 }],
			totalLengthMm: totalLengthMm,
		};
	} else {
		const GATE_POST_DEPTH = settingsManager.getCalculatorConstant("gatePostDepth");
		const postLength = heightMm + GATE_POST_DEPTH;
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
export const calculateGateMaterials = (widthMm, materialWidth, claddingMaterial, slidingGate, rectangularTechPart, bothSideSheathing) => {
	let materialCount;
	let frameWidthMm;
	const GAP_BETWEEN_POSTS = settingsManager.getCalculatorConstant("gateClearanceBetweenPosts");
	const materialFense = claddingMaterial.includes("штакет");
	const material3DGrid = claddingMaterial.includes("3D") || claddingMaterial.includes("3Д") || claddingMaterial.includes("сетк");

	if (slidingGate) {
		const slidingFrameResult = calcSlideGateFrame(heightMm, widthMm, rectangularTechPart);
		frameWidthMm = slidingFrameResult.topWidth;
	} else {
		frameWidthMm = (widthMm - GAP_BETWEEN_POSTS) / 2;
	}

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

	return !slidingGate ? materialCount * 2 : materialCount;
};
