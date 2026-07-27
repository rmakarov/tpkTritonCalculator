import { priceManager } from "./priceManager.js";

// 1. Создаем хранилище для цен (имя товара -> цена)
//const itemsPriceMap = new Map();

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
		addRowToTable(name, price, summ, quantity);
		addItemForm.reset();
		dialog.close();
	}
});

// ==========================================
// Пересчет порядковых номеров
// ==========================================
function updateRowNumbers() {
	const tbody = document.querySelector(".mainTable tbody");
	if (!tbody) return;

	const rows = tbody.querySelectorAll("tr");

	rows.forEach((row, index) => {
		// index начинается с 0, поэтому прибавляем 1
		// row.cells[0] обращается к первой ячейке (<td>) в строке
		if (row.cells[0]) {
			row.cells[0].textContent = index + 1;
		}
	});
}

// ==========================================
// Функция добавления строки в таблицу
// ==========================================
function addRowToTable(name, price, summ, quantity) {
	const tbody = document.querySelector(".mainTable tbody");
	if (!tbody) return;

	const newRow = document.createElement("tr");

	// В первую ячейку ставим временный "0", функция updateRowNumbers его исправит
	newRow.innerHTML = `
        <td>0</td>
        <td>${name}</td>
        <td>${quantity}</td>
        <td>${price.toLocaleString("ru-RU")}</td>
        <td>${summ.toLocaleString("ru-RU")}</td>
        <td class="delete-item-column">
            <button class="iconButton deleteItemButton" type="button" title="Удалить позицию">
                <img src="/assets/deleteIcon.svg" alt="Удалить"/>
            </button>
        </td>
    `;

	tbody.appendChild(newRow);

	// Навешиваем обработчик удаления НА КОНКРЕТНУЮ кнопку в этой строке
	const deleteBtn = newRow.querySelector(".deleteItemButton");
	deleteBtn.addEventListener("click", () => {
		// С анимацией или без, просто удаляем строку из DOM
		newRow.remove();

		// 🚀 ВОТ ОНО: Пересчитываем номера после удаления!
		updateRowNumbers();
	});

	// Пересчитываем номера и после добавления (на случай, если логика усложнится)
	updateRowNumbers();
}
