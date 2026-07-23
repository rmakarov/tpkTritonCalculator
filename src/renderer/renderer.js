/*document.getElementById("xlf").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log("[RENDERER] Файл выбран:", file.name); // 👈 проверка

  try {
    // Читаем файл как ArrayBuffer
    const buffer = await file.arrayBuffer();
    console.log("[RENDERER] ArrayBuffer получен, размер:", buffer.byteLength);

    // Отправляем в main process
    const data = await window.excelAPI.readFile(buffer);
    console.log("[RENDERER] Данные из main:", data);

    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("[RENDERER] Ошибка:", err);
    document.getElementById("output").textContent = "Ошибка: " + err.message;
  }
});*/



// Выбор файла
document.getElementById("xlf").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log("[RENDERER] Файл выбран:", file.name);

  try {
    const buffer = await file.arrayBuffer();
    
    // Импортируем с опцией слияния
    const result = await window.excelAPI.importPriceList(buffer, { merge: true });
    
    console.log("[RENDERER] Результат импорта:", result);
    
    // Показываем статистику
    alert(`
      ✅ Прайс обновлен!
      
      Добавлено: ${result.stats.added}
      Обновлено: ${result.stats.updated}
      Без изменений: ${result.stats.unchanged}
      Ошибок: ${result.stats.errors}
      
      Всего позиций: ${result.totalItems}
      Обновлено: ${new Date(result.lastUpdate).toLocaleString('ru-RU')}
    `);

    // Обновляем список товаров в UI
    await loadItemsToDropdown();
    
  } catch (err) {
    console.error("[RENDERER] Ошибка:", err);
    alert("❌ Ошибка импорта:\n" + err.message);
  }
});

// Загрузка списка в выпадающий список (С ЗАЩИТОЙ)
async function loadItemsToDropdown() {
  const select = document.getElementById('itemSelect');
  
  // 👇 ЗАЩИТА: если элемента нет, выходим из функции и пишем в консоль
  if (!select) {
    console.error("❌ Ошибка: Элемент с id='itemSelect' не найден в HTML!");
    return;
  }

  const items = await window.excelAPI.getAllItems();
  select.innerHTML = '<option value="">Выберите товар...</option>';
  
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.id}. ${item.name} — ${item.price.toLocaleString('ru-RU')} руб.`;
    option.dataset.price = item.price;
    select.appendChild(option);
  });
}

// Расчет стоимости (С ЗАЩИТОЙ)
const itemSelectElement = document.getElementById('itemSelect');
const quantityElement = document.getElementById('quantity');
const totalPriceElement = document.getElementById('totalPrice');

if (itemSelectElement && quantityElement && totalPriceElement) {
  // Пересчет при изменении товара
  itemSelectElement.addEventListener('change', calculateTotal);
  
  // Пересчет при изменении количества
  quantityElement.addEventListener('input', calculateTotal);
} else {
  console.warn("⚠️ Элементы калькулятора не найдены в HTML. Расчет стоимости неактивен.");
}

function calculateTotal() {
  const selectedOption = itemSelectElement.options[itemSelectElement.selectedIndex];
  const price = parseFloat(selectedOption.dataset.price) || 0;
  const quantity = parseInt(quantityElement.value) || 1;
  const total = price * quantity;
  
  totalPriceElement.textContent = total.toLocaleString('ru-RU');
}
