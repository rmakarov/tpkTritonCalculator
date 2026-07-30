
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

export function addMaterialToTable(name, price, quantity = 1, summ = price * quantity) {
    const tbody = document.querySelector(".mainTable tbody");
    if (!tbody) {
        console.warn("Таблица .mainTable tbody не найдена!");
        return;
    }

    const newRow = document.createElement("tr");

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

    // Навешиваем обработчик удаления
    const deleteBtn = newRow.querySelector(".deleteItemButton");
    deleteBtn.addEventListener("click", () => {
        newRow.remove();
        // Убедитесь, что updateRowNumbers доступна (импортирована или глобальная)
        if (typeof updateRowNumbers === 'function') {
            updateRowNumbers();
        }
    });

    // Пересчитываем номера после добавления
    if (typeof updateRowNumbers === 'function') {
        updateRowNumbers();
    }
}