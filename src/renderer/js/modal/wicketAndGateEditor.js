export const initCustomEditor = () => {
	const typeInputs = [...document.querySelectorAll('input[name="calculator-type"]')];

	typeInputs.forEach((input) => {
		input.addEventListener("change", () => {
			if (input.checked) {
				console.log("selected type: ", input.value);
			}
		});
	});
};
