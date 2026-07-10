
document.getElementById("xlf").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('[RENDERER] Файл выбран:', file.name); // 👈 проверка

  try {
    // Читаем файл как ArrayBuffer
    const buffer = await file.arrayBuffer();
    console.log('[RENDERER] ArrayBuffer получен, размер:', buffer.byteLength);

    // Отправляем в main process
    const data = await window.excelAPI.readFile(buffer);
    console.log('[RENDERER] Данные из main:', data);

    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error('[RENDERER] Ошибка:', err);
    document.getElementById("output").textContent = 'Ошибка: ' + err.message;
  }
});