// Получаем элементы
const dialog = document.getElementById("addItemDialog");
const addItemButton = document.getElementById("addItemButton");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const addItemForm = document.getElementById("addItemForm");
const itemNameInput = document.getElementById("itemName");
const itemQuantityInput = document.getElementById("itemQuantity");

addItemButton.addEventListener("click", () => {
	loadItemsToModalDropdown();
	dialog.showModal();
	itemNameInput.focus();
});

closeModalBtn.addEventListener("click", () => {
	dialog.close();
});

cancelBtn.addEventListener("click", () => {
	dialog.close();
});

addItemForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const name = itemNameInput.value.trim();
	const quantity = parseInt(itemQuantityInput.value);

	if (name && quantity > 0) {
		// Здесь добавьте свою логику для добавления строки в таблицу
		console.log("Добавление позиции:", { name, quantity });

		// Пример: добавление строки в таблицу
		addRowToTable(name, quantity);

		// Очистка формы и закрытие модалки
		addItemForm.reset();
		dialog.close();
	}
});

// Закрытие по клавише Escape (работает автоматически с <dialog>)
// Также закрытие по клику на backdrop (нужно добавить вручную)
dialog.addEventListener("click", (e) => {
	// Если клик был по самому dialog (вне формы), закрываем
	if (e.target === dialog) {
		dialog.close();
	}
});

async function loadItemsToModalDropdown() {
	const priceData = document.getElementById("priceData");

	// 👇 ЗАЩИТА: если элемента нет, выходим из функции и пишем в консоль
	if (!priceData) {
		console.error("❌ Ошибка: Элемент с id='priceData' не найден в HTML!");
		return;
	}

	const items = await window.excelAPI.getAllItems();
	priceData.innerHTML = '<option value="">Выберите товар...</option>';

	items.forEach((item) => {
		const option = document.createElement("option");
		option.value = item.name;
		option.textContent = `${item.price.toLocaleString("ru-RU")} руб.`;
		option.dataset.price = item.price;
		priceData.appendChild(option);
	});
}

// Функция добавления строки в таблицу (пример)
function addRowToTable(name, quantity) {
	const tbody = document.querySelector(".mainTable tbody");
	if (!tbody) return;

	// Получаем количество строк для порядкового номера
	const rowCount = tbody.rows.length + 1;

	// Создаём новую строку
	const newRow = document.createElement("tr");
	newRow.innerHTML = `
        <td>${rowCount}</td>
        <td>${name}</td>
        <td>${quantity}</td>
        <td>0</td>
        <td>0</td>
        <td><button class="delete-btn">✕</button></td>
    `;

	tbody.appendChild(newRow);
}
