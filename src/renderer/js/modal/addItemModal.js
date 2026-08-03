import { BaseCalculator } from "../calculators/baseCalculator.js";
import { priceManager } from "../priceManager.js";
import { addMaterialToTable } from "../tableManager.js";
import { openModal } from "./modalManager.js";

const dialog = document.getElementById("addItemDialog");
const addItemButton = document.getElementById("addItemButton");
const addItemForm = document.getElementById("addItemForm");
const itemNameInput = document.getElementById("itemName");
const itemQuantityInput = document.getElementById("itemQuantity");

addItemButton.addEventListener("click", async () => {
	await priceManager.ensureLoaded();

	openModal(dialog, {
		onOpen: () => {
			// Небольшая задержка, чтобы DOM успел отрисоваться
			setTimeout(() => {
				priceManager.populateAutocomplete("itemName", dialog);
			}, 50);
		},
		onClose: () => {
			// Уничтожаем автокомплит при закрытии
			priceManager.destroyAutocomplete("itemName");
		},
	});
});

addItemForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const name = itemNameInput.value.trim();
	const baseCalculator = new BaseCalculator(dialog, priceManager);
	const finalPrice = baseCalculator.getPriceWithMarkup(name);

	if (!finalPrice) {
		alert("Пожалуйста, выберите товар из выпадающего списка!");
		return;
	}

	const quantity = parseInt(itemQuantityInput.value, 10);

	if (isNaN(quantity) || quantity <= 0) {
		alert("Пожалуйста, укажите корректное количество!");
		return;
	}

	addMaterialToTable(name, finalPrice, quantity);

	// closeDialog() больше не нужен — его вызовет менеджер
	// Но форму сбросить нужно перед закрытием (менеджер сам её сбросит)
	priceManager.destroyAutocomplete("itemName");
	// Закрываем через менеджер
	import("./modalManager.js").then(({ closeModal }) => closeModal(dialog));
});
