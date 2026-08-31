/**
 * 1. ТОЛЬКО ЧТЕНИЕ: Безопасно получает и валидирует число из input.
 * Не вешает слушатели событий, можно вызывать сколько угодно раз.
 */
export function getValidatedNumber(input, min, max, options = {}) {
	if (!input) return options.defaultValue ?? undefined;

	const rawValue = input.value?.toString().trim();
	if (rawValue === "") return options.defaultValue ?? undefined;

	const cleanValue = rawValue.replace(",", ".");
	const allowFloat = options.allowFloat ?? false;
	let val = allowFloat ? parseFloat(cleanValue) : parseInt(cleanValue, 10);

	if (isNaN(val)) return options.defaultValue ?? undefined;

	// Ограничиваем диапазон
	return Math.min(Math.max(val, min), max);
}

/**
 * 2. НАСТРОЙКА: Вешает слушатели событий на input для валидации в реальном времени.
 * Должна вызываться ТОЛЬКО ОДИН РАЗ для каждого элемента (например, при его создании).
 */
export function attachNumericValidation(input, min, max, options = {}) {
	if (!input) return;

	const { allowFloat = false } = options;

	// Валидация при вводе
	input.addEventListener("input", function () {
		if (this.value === "") return;

		let cleanValue = this.value.replace(",", ".");
		let val = allowFloat ? parseFloat(cleanValue) : parseInt(cleanValue, 10);

		if (isNaN(val)) return;

		if (val > max) this.value = max;
		else if (val < min) this.value = min;
	});

	// Блокировка точки/запятой для целых чисел
	if (!allowFloat) {
		input.addEventListener("keydown", function (e) {
			if (e.key === "." || e.key === ",") {
				e.preventDefault();
			}
		});
	}
}
