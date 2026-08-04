console.log("[PRELOAD] Запуск preload.js"); // 👈 появится в терминале (main process)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("excelAPI", {
	// Старый метод (для совместимости)
	readFile: (buffer) => ipcRenderer.invoke("read-excel", buffer),

	// Новые методы для работы с прайсом
	importPriceList: (buffer, options) =>
		ipcRenderer.invoke("pricelist:import", buffer, options),
	loadPriceList: () => ipcRenderer.invoke("pricelist:load"),
	getAllItems: () => ipcRenderer.invoke("pricelist:getAll"),
	searchItems: (query) => ipcRenderer.invoke("pricelist:search", query),
	getItemById: (id) => ipcRenderer.invoke("pricelist:getById", id),
	clearPriceList: () => ipcRenderer.invoke("pricelist:clear"),
});

contextBridge.exposeInMainWorld("pdfAPI", {
	openPreview: () => ipcRenderer.invoke("pdf:preview"),
});

contextBridge.exposeInMainWorld("settings", {
	get: () => ipcRenderer.invoke("settings:get"),
	getValue: (sectionKey, fieldKey) =>
		ipcRenderer.invoke("settings:getValue", sectionKey, fieldKey),
	setValue: (sectionKey, fieldKey, value) =>
		ipcRenderer.invoke("settings:setValue", sectionKey, fieldKey, value),
	reset: () => ipcRenderer.invoke("settings:reset"),
	canCalculate: () => ipcRenderer.invoke("settings:canCalculate"),
});
