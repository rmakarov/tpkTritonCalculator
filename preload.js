console.log('[PRELOAD] Запуск preload.js'); // 👈 появится в терминале (main process)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('excelAPI', {
  // Принимаем ArrayBuffer из renderer и отправляем в main
  readFile: (buffer) => ipcRenderer.invoke('read-excel', buffer)
});
console.log('[PRELOAD] excelAPI зарегистрирован');