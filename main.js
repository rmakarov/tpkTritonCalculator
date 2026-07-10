const { app, BrowserWindow } = require('electron/main')
const { ipcMain } = require('electron');
const path = require('path');
const XLSX = require('xlsx');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 👈 ВАЖНО!
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('index.html')
  win.webContents.openDevTools();
}

ipcMain.handle('read-excel', async (event, buffer) => {
  try {
    // buffer — это ArrayBuffer, передаём его напрямую в XLSX
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('[MAIN] Данные прочитаны:', data); // 👈 лог в консоли main
    return data;
  } catch (err) {
    console.error('[MAIN] Ошибка чтения:', err);
    throw err;
  }
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})