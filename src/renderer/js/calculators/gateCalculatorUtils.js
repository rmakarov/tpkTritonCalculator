import { parseProfileDimensions, WICKET_CONSTANTS } from "./wicketCalculatorUtils.js";
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

const getGatePartitionsType2 = ({ width }) => {
	return width;
};

const getGatePartitionsType3 = ({ width }) => {
	return width * 2;
};

const getGatePartitionsType4 = ({ width, height }) => {
	let diagonal = getDiagonal(width / 2, height / 2);
	return width + diagonal * 4;
};

const getGatePartitionsType5 = ({ width, height }) => {
	let diagonal = getDiagonal(width / 2, height / 2);
	return width * 2 + diagonal * 4;
};

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

const getSlidingGatePartitionsType1 = ({ width, height }) => {
	//  вертикальная поперечина + 2 диагонали (на потовину ворот) + усилители хвостовой части (2  шт равны  как  раз высоте ворот)
	let diagonal = getDiagonal(width / 2, height);
	return diagonal * 2 + height * 2;
};

const getSlidingGateFrameType2 = ({ width, height }) => {
	// 1 длина + 1 высота
	// + 2  диагонали (на потовину ворот) + 3 диагонали (на потовину высоты и 1.4 ширины)
	// + 3 половины высоты (height + height/2)
	let diagonal1 = getDiagonal(width / 2, height);
	let diagonal2 = getDiagonal(width / 4, height / 2);
	return width + height + diagonal1 * 2 + diagonal2 * 3 + (height / 2) * 3;
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const calcTechPart2D = (W, H, isRectangular = false) => {
	// Ограничения
	if (W < 2000) W = 2000;
	if (W > 12000) W = 12000;
	if (H < 1500) H = 1500;
	if (H > 2500) H = 2500;

	// Функция для расчета при конкретной высоте
	function calcForHeight(W, H, isRectangular) {
		if (H === 1500) {
			if (!isRectangular) {
				// Треугольная, H=1500
				if (W <= 3000) return 0.2 * W + 460;
				if (W <= 5000) return 0.33 * W + 40;
				if (W <= 5400) return 0.9 * W - 2770;
				if (W <= 7000) return 0.465 * W - 235;
				if (W <= 9000) return 0.345 * W + 225;
				return 0.49 * W - 1110;
			} else {
				// Прямоугольная, H=1500
				if (W <= 3000) return 0.267 * W + 300;
				if (W <= 5000) return 0.35 * W + 50;
				if (W <= 5400) return 0.95 * W - 2850;
				if (W <= 7000) return 0.49 * W - 270;
				if (W <= 9000) return 0.355 * W + 245;
				return 0.51 * W - 1220;
			}
		} else if (H === 2000) {
			if (!isRectangular) {
				// Треугольная, H=2000 (основная формула из прошлого расчета)
				if (W <= 3000) return 0.2 * W + 540;
				if (W <= 5000) return 0.355 * W + 75;
				if (W <= 5400) return 1.025 * W - 3275;
				if (W <= 7000) return 0.00002794 * W * W + 0.14726 * W + 645.67;
				if (W <= 9000) return 0.00007667 * W * W - 0.88167 * W + 5455;
				return 0.52 * W - 950;
			} else {
				// Прямоугольная, H=2000
				if (W <= 3000) return 0.25 * W + 440;
				if (W <= 5000) return 0.375 * W + 65;
				if (W <= 5400) return 1.05 * W - 3310;
				if (W <= 7000) return 0.00003968 * W * W + 0.0337 * W + 1016.28;
				if (W <= 9000) return 0.0001 * W * W - 1.25 * W + 7040;
				return 0.55 * W - 1060;
			}
		} else if (H === 2500) {
			if (!isRectangular) {
				// Треугольная, H=2500
				if (W <= 3000) return 0.27 * W + 400;
				if (W <= 5000) return 0.38 * W + 70;
				if (W <= 5400) return 1.1 * W - 3470;
				if (W <= 7000) return 0.000032 * W * W + 0.135 * W + 620;
				if (W <= 9000) return 0.000085 * W * W - 0.92 * W + 5680;
				return 0.55 * W - 1070;
			} else {
				// Прямоугольная, H=2500
				if (W <= 3000) return 0.34 * W + 260;
				if (W <= 5000) return 0.405 * W + 65;
				if (W <= 5400) return 1.15 * W - 3590;
				if (W <= 7000) return 0.000042 * W * W + 0.028 * W + 1050;
				if (W <= 9000) return 0.00011 * W * W - 1.3 * W + 7280;
				return 0.58 * W - 1170;
			}
		}
	}

	// Определяем между какими высотами интерполировать
	if (H <= 1500) return calcForHeight(W, 1500, isRectangular);
	if (H >= 2500) return calcForHeight(W, 2500, isRectangular);

	if (H <= 2000) {
		// Интерполяция между 1500 и 2000
		const L1 = calcForHeight(W, 1500, isRectangular);
		const L2 = calcForHeight(W, 2000, isRectangular);
		const ratio = (H - 1500) / 500;
		return L1 + ratio * (L2 - L1);
	} else {
		// Интерполяция между 2000 и 2500
		const L1 = calcForHeight(W, 2000, isRectangular);
		const L2 = calcForHeight(W, 2500, isRectangular);
		const ratio = (H - 2000) / 500;
		return L1 + ratio * (L2 - L1);
	}
};

const frameCalculators = {
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
	[GATE_TYPES.SLIDING_GATE_TYPE2]: getSlidingGateFrameType2,
};

// Return by default partitions lenght for wicket type2
export const calculateGatePartitionsByType = (width, height, gateType, markupOnTrimmings) => {
	let partitipnsLength;
	const calculator = frameCalculators[gateType];

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип ворот: "${gateType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		partitipnsLength = getGatePartitionsType2({ width, height });
	}
	partitipnsLength = calculator({ width, height });
	const partitionsMarkupOnTrimmings = (partitipnsLength / 100) * markupOnTrimmings;

	return partitipnsLength + partitionsMarkupOnTrimmings;
};

export const calculateGateFrameByType = ({ widthMm, heightMm, slidingGate, markupOnTrimmings, materialName, rectangularTechPart }) => {
	console.log("calculateGateFrameByType! ");

	if (slidingGate) {
		const slidingFrameResult = calcSlideGateFrame(heightMm, widthMm, rectangularTechPart);
		console.log("slidingFrameResult: ", slidingFrameResult);

	} else {
		const frameWidthMm = widthMm / 2 - WICKET_CONSTANTS.GAP_BETWEEN_POSTS;
		const frameHeightMm = heightMm - WICKET_CONSTANTS.GAP_BETWEEN_GROUND;

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
