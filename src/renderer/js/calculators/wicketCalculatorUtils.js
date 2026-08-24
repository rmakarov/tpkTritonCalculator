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

const getWicketPartitionsType1 = () => {
	return 0;
};

const getWicketPartitionsType2 = ({ width }) => {
	return width;
};

const getWicketPartitionsType3 = ({ width }) => {
	return width * 2;
};

const getWicketPartitionsType4 = ({ width, height }) => {
	console.log("getWicketPartitionsType4: ", width, height);
	let diagonal = getDiagonal(width, height / 2);
	console.log("getWicketPartitionsType4 diagonal: ", diagonal);
	console.log("getWicketPartitionsType4  width + diagonal * 2: ", width + diagonal * 2);
	return width + diagonal * 2;
};

const getWicketPartitionsType5 = ({ width, height }) => {
	let diagonal = getDiagonal(width, height / 2);
	return width * 2 + diagonal * 2;
};

const getWicketPartitionsType6 = ({ height }) => {
	return height;
};

const getWicketPartitionsType7 = ({ width, height }) => {
	return width + height;
};

const getWicketPartitionsType8 = ({ width, height }) => {
	return width + height * 2;
};

const getWicketPartitionsType9 = ({ width, height }) => {
	let diagonal = getDiagonal(width, height);
	return diagonal;
};

const getWicketPartitionsType10 = ({ width, height }) => {
	let diagonal = getDiagonal(width, height);
	return width + diagonal;
};

export const getDiagonal = (width, height) => {
	return Math.sqrt(height * height + width * width);
};

const frameCalculators = {
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
export const calculateWicketPartitionsByType = (width, height, wicketType, markupOnTrimmings) => {
	const calculator = frameCalculators[wicketType];

	if (!calculator) {
		console.warn(`⚠️ Неизвестный тип калитки: "${wicketType}". Используется Type2 по умолчанию.`);
		console.log("Доступные типы:", Object.keys(frameCalculators));
		return getWicketPartitionsType2({ width, height });
	}

	const partitionsLength = calculator({ width, height });
	const partitionsMarkupOnTrimmings = (partitionsLength / 100) * markupOnTrimmings;

	return partitionsLength + partitionsMarkupOnTrimmings;
};

export const calculateWicketFrame = (width, height, markupOnTrimmings) => {
	const frameLength = width * 2 + height * 2;
	const frameMarkupOnTrimmings = (frameLength / 100) * markupOnTrimmings;

	return frameLength + frameMarkupOnTrimmings;
};
