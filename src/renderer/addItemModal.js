import { priceManager } from "./priceManager.js";
import { addMaterialToTable } from "./tableManager.js";


// Получаем элементы
const dialog = document.getElementById("addItemDialog");
const addItemButton = document.getElementById("addItemButton");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const addItemForm = document.getElementById("addItemForm");
const itemNameInput = document.getElementById("itemName");
const itemQuantityInput = document.getElementById("itemQuantity");

addItemButton.addEventListener("click", async () => {
	await priceManager.ensureLoaded(); // Ждем загрузки (если еще не загружено)
	priceManager.populateDatalist("modal-price-data"); // Заполняем наш datalist
	dialog.showModal();
	itemNameInput.focus();
});

closeModalBtn.addEventListener("click", () => dialog.close());
cancelBtn.addEventListener("click", () => dialog.close());

// Закрытие по клику на затемненный фон (backdrop)
dialog.addEventListener("click", (e) => {
	if (e.target === dialog) {
		dialog.close();
	}
});

addItemForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const name = itemNameInput.value.trim();

	// Берем цену из нашего общего кэша!
	const price = priceManager.getPrice(name);

	// Защита от ручного ввода несуществующего товара
	if (!price) {
		alert("Пожалуйста, выберите товар из выпадающего списка!");
		return;
	}

	const quantity = parseInt(itemQuantityInput.value, 10);
	const summ = price * quantity;

	if (name && quantity > 0) {
		addMaterialToTable(name, price, quantity);
		addItemForm.reset();
		dialog.close();
	}
});
