import { BaseCalculator } from './baseCalculator.js';
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

// 🔥 ЕДИНАЯ ФУНКЦИЯ ЗАКРЫТИЯ С ОЧИСТКОЙ
const closeDialog = () => {
    dialog.close();
    addItemForm.reset(); // Сбрасываем значения полей
    
    // 🔥 УНИЧТОЖАЕМ экземпляр автокомплита, чтобы удалить слушатели событий
    // и предотвратить утечку памяти при следующем открытии
    priceManager.destroyAutocomplete("itemName");
};

addItemButton.addEventListener("click", async () => {
    await priceManager.ensureLoaded();
	dialog.showModal();

    setTimeout(() => {
        priceManager.populateAutocomplete("itemName", dialog);
    }, 50); 
});

// Используем единую функцию закрытия везде
closeModalBtn.addEventListener("click", closeDialog);
cancelBtn.addEventListener("click", closeDialog);

// Закрытие по клику на затемненный фон (backdrop)
dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
        closeDialog();
    }
});

addItemForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    

    // Берем цену из нашего общего кэша (c наценкой)!
    const baseCalculator = new BaseCalculator(dialog, priceManager);
    const finalPrice = baseCalculator.getPriceWithMarkup(name);

    // Защита от ручного ввода несуществующего товара
    if (!finalPrice) {
        alert("Пожалуйста, выберите товар из выпадающего списка!");
        return;
    }

    const quantity = parseInt(itemQuantityInput.value, 10);
    
    // Проверка на корректность количества
    if (isNaN(quantity) || quantity <= 0) {
        alert("Пожалуйста, укажите корректное количество!");
        return;
    }

    addMaterialToTable(name, finalPrice, quantity);
    
    // Закрываем с полной очисткой
    closeDialog();
});
