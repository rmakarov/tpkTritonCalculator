# 🏗️ TPK Triton Calculator

Калькулятор для расчёта калиток и ворот с возможностью импорта прайс-листов из Excel и экспорта результатов в PDF.

---

## 📋 Содержание

- [Быстрый старт](#-быстрый-старт)
- [Основные команды](#-основные-команды)
- [Сборка приложения](#-сборка-приложения)
- [Trial-версии](#-trial-версии)
- [Тестовые Trial-версии](#-тестовые-trial-версии)
- [Полезные заметки](#-полезные-заметки)
- [Технологии](#-технологии)

---

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение откроется в окне Electron с hot-reload.

### Production-сборка веб-части

```bash
npm run build
```

---

## 📦 Основные команды

| Команда | Описание |
|---|---|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Production-сборка веб-части (Vite) |
| `npm run build:prod` | Сборка + очистка CSS через PurgeCSS |
| `npm run preview` | Предпросмотр production-сборки в браузере |

---

## 🏗️ Сборка приложения

### Создание установщика Windows (основная версия)

```bash
npm run build:exe
```

Результат сборки будет в папке `release/`.

### Создание trial-версии

```bash
npm run build:trial
```

Результат сборки будет в папке `release-trial/`.

---

## 🔑 Trial-версии

### Команды для trial-версии

| Команда | Описание |
|---|---|
| `npm run build:trial` | Сборка trial-версии приложения |

---

## 🧪 Тестовые Trial-версии

### Сборка тестовой trial-версии

```bash
npm run build:trial:test
```

**Что делает команда:**

```bash
npm run build && electron-builder --win \
  --config.appId=com.triton.calculator.trialtest \
  --config.productName="Triton Calculator Trial Test" \
  --config.directories.output=release-trial-test \
  --config.extraMetadata.name=tpktritoncalculator-trial-test \
  --config.extraMetadata.trialTestBuild=true
```

Результат сборки будет в папке `release-trial-test/`.

### Сброс лицензии тестовой trial-версии

```bash
npm run reset:trial:test
```

**Что делает команда:**

```bash
node src/main/trialLicenseTest.js --reset
```

Используйте эту команду, если нужно сбросить лицензию тестовой версии для повторного тестирования.

---

## 💡 Полезные заметки

### Ручная сборка через electron-builder

Если нужно собрать приложение напрямую, без npm-скриптов:

```bash
npx electron-builder --win
```

### Очистка CSS при сборке

При запуске `npm run build:prod` происходит:
1. Production-сборка Vite
2. Анализ CSS через PurgeCSS
3. Удаление неиспользуемых селекторов
4. Сохранение списка удалённых селекторов в `dist/purgecss-rejected.css`

### Сброс кэша и пересборка

Если что-то пошло не так:

```bash
rm -rf node_modules dist dist-electron release release-trial
npm install
npm run build:exe
```

Для Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, dist, dist-electron, release, release-trial
npm install
npm run build:exe
```

---

## 🛠️ Технологии

- **[Electron](https://www.electronjs.org/)** — для создания desktop-приложения
- **[Vite](https://vitejs.dev/)** — сборщик фронтенда
- **[vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)** — интеграция Electron с Vite
- **[PurgeCSS](https://purgecss.com/)** — удаление неиспользуемых CSS-правил
- **Vanilla JavaScript** — без фреймворков

---

## 📁 Структура проекта

```
tpkTritonCalculator/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.js
│   │   ├── preload.js
│   │   └── trialLicenseTest.js
│   ├── renderer/              # Frontend (UI)
│   │   ├── renderer.js
│   │  
npm run reset:trial:test