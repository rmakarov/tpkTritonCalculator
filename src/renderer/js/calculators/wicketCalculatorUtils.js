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

const getWicketFrameType1 = (width, height) => {
	return width * 2 + height * 2;
};

const getWicketFrameType2 = (width, height) => {
	return width * 2 + height * 2 + width;
};

const getWicketFrameType3 = (width, height) => {
	return width * 2 + height * 2 + width * 2;
};

const getWicketFrameType4 = (width, height) => {
	let diagonal = getDiagonal(width, height / 2);
	return width * 2 + height * 2 + width + diagonal * 2;
};

const getWicketFrameType5 = (width, height) => {
	let diagonal = getDiagonal(width, height / 2);
	return width * 2 + height * 2 + width * 2 + diagonal * 2;
};

const getWicketFrameType6 = (width, height) => {
	return width * 2 + height * 2 + height;
};

const getWicketFrameType7 = (width, height) => {
	return width * 2 + height * 2 + width + height;
};

const getWicketFrameType8 = (width, height) => {
	return width * 2 + height * 2 + width + height * 2;
};

const getWicketFrameType9 = (width, height) => {
	let diagonal = getDiagonal(width, height);
	return width * 2 + height * 2 + diagonal;
};

const getWicketFrameType10 = (width, height) => {
	let diagonal = getDiagonal(width, height);
	return width * 2 + height * 2 + width + diagonal;
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const frameCalculators = {
	[WICKET_TYPES.WICKET_TYPE1]: getWicketFrameType1,
	[WICKET_TYPES.WICKET_TYPE2]: getWicketFrameType2,
	[WICKET_TYPES.WICKET_TYPE3]: getWicketFrameType3,
	[WICKET_TYPES.WICKET_TYPE4]: getWicketFrameType4,
	[WICKET_TYPES.WICKET_TYPE5]: getWicketFrameType5,
	[WICKET_TYPES.WICKET_TYPE6]: getWicketFrameType6,
	[WICKET_TYPES.WICKET_TYPE7]: getWicketFrameType7,
	[WICKET_TYPES.WICKET_TYPE8]: getWicketFrameType8,
	[WICKET_TYPES.WICKET_TYPE9]: getWicketFrameType9,
	[WICKET_TYPES.WICKET_TYPE10]: getWicketFrameType10,
};

// Return by default frame lenght for wicket type2
export const calculateWicketFrameByType = (width, height, wicketType) => {
	const calculator = frameCalculators[wicketType];

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип калитки: "${wicketType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		return getWicketFrameType2(width, height);
	}

	return calculator(width, height);
};
