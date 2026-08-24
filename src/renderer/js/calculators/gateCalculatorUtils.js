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

// Return by default frame lenght for wicket type2
export const calculateGatePartitionsByType = (width, height, gateType, markupOnTrimmings) => {
	const calculator = frameCalculators[gateType];

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип ворот: "${gateType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		return getGatePartitionsType2({ width, height });
	}

	return calculator({ width, height });
};

export const calculateGateFrameByType = (width, height, slidingGate, markupOnTrimmings) => {
	const diagonal = getDiagonal(width / 2, height);
	let frameLength;
	if (slidingGate) {
		frameLength = width * 2 + height * 2 + width / 2 + diagonal;
	} else {
		frameLength = width * 2 + height * 4;
	}
	const frameMarkupOnTrimmings = (frameLength / 100) * markupOnTrimmings;

	return frameLength + frameMarkupOnTrimmings;
};
