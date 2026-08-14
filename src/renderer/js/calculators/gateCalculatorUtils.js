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

const getGateFrameType1 = (width, height) => {
	return width * 2 + height * 4;
};

const getGateFrameType2 = (width, height) => {
	return width * 3 + height * 4;
};

const getGateFrameType3 = (width, height) => {
	return width * 4 + height * 4;
};

const getGateFrameType4 = (width, height) => {
	let diagonal = getDiagonal(width / 2, height / 2);
	return width * 2 + height * 4 + width + diagonal * 4;
};

const getGateFrameType5 = (width, height) => {
	let diagonal = getDiagonal(width / 2, height / 2);
	return width * 2 + height * 4 + width * 2 + diagonal * 4;
};

const getGateFrameType6 = (width, height) => {
	return width * 2 + height * 6;
};

const getGateFrameType7 = (width, height) => {
	return width * 3 + height * 6;
};

const getGateFrameType8 = (width, height) => {
	return width * 3 + height * 8;
};

const getGateFrameType9 = (width, height) => {
	let diagonal = getDiagonal(width / 2, height);
	return width * 2 + height * 4 + diagonal * 2;
};

const getGateFrameType10 = (width, height) => {
	let diagonal = getDiagonal(width / 2, height);
	return width * 3 + height * 4 + diagonal * 2;
};

const getSlidingGateFrameType1 = (width, height) => {
	// Периметр (в метрах) + вертикальная поперечина + хвостовая часть ворот для противовеса (50% от проема)
	// + 3 диагонали (на потовину ворот) + усилители хвостовой части (2  шт равны  как  раз высоте ворот)
	let diagonal = getDiagonal(width / 2, height);
	return width * 2 + height * 2 + height + width / 2 + diagonal * 3 + height;
};

const getSlidingGateFrameType2 = (width, height) => {
	// 3 длины + 3 высоты + половина длины( хвостовая  часть)
	// + 3  диагонали (на потовину ворот) + 3 диагонали (на потовину высоты и 1.4 ширины)
	// + 3 половины высоты (height + height/2)
	let diagonal1 = getDiagonal(width / 2, height);
	let diagonal2 = getDiagonal(width / 4, height / 2);
	return width * 3 + height * 3 + diagonal1 * 3 + diagonal2 + 3 + height + height / 2;
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const frameCalculators = {
	[GATE_TYPES.GATE_TYPE1]: getGateFrameType1,
	[GATE_TYPES.GATE_TYPE2]: getGateFrameType2,
	[GATE_TYPES.GATE_TYPE3]: getGateFrameType3,
	[GATE_TYPES.GATE_TYPE4]: getGateFrameType4,
	[GATE_TYPES.GATE_TYPE5]: getGateFrameType5,
	[GATE_TYPES.GATE_TYPE6]: getGateFrameType6,
	[GATE_TYPES.GATE_TYPE7]: getGateFrameType7,
	[GATE_TYPES.GATE_TYPE8]: getGateFrameType8,
	[GATE_TYPES.GATE_TYPE9]: getGateFrameType9,
	[GATE_TYPES.GATE_TYPE10]: getGateFrameType10,
	[GATE_TYPES.SLIDING_GATE_TYPE1]: getSlidingGateFrameType1,
	[GATE_TYPES.SLIDING_GATE_TYPE2]: getSlidingGateFrameType2,
};

// Return by default frame lenght for wicket type2
export const calculateGateFrameByType = (width, height, gateType) => {
	const calculator = frameCalculators[gateType];

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип ворот: "${gateType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		return getGateFrameType2(width, height);
	}

	return calculator(width, height);
};
