import { showNotification } from "./utils/notification";
import { calculatorSwitcher } from "./calculatorTemplates";

const previewPdfButton = document.getElementById("printButton");
const previewDrawingPdfButton = document.getElementById("printDrawingButton");

previewPdfButton?.addEventListener("click", async () => {
	previewPdfButton.disabled = true;
	previewPdfButton.setAttribute("aria-busy", "true");

	try {
		const result = await window.pdfAPI.openPreview();

		if (!result.success) {
			showNotification(`Не удалось открыть предпросмотр PDF:\n${result.message}`);
			console.error(`Не удалось открыть предпросмотр PDF:\n${result.message}`);
		}
	} catch (error) {
		showNotification("[PDF Preview] Непредвиденная ошибка:", error);
		console.error("[PDF Preview] Непредвиденная ошибка:", error);
	} finally {
		previewPdfButton.disabled = false;
		previewPdfButton.removeAttribute("aria-busy");
	}
});

previewDrawingPdfButton?.addEventListener("click", async () => {
	previewDrawingPdfButton.disabled = true;
	previewDrawingPdfButton.setAttribute("aria-busy", "true");

	try {
		const drawingData = calculatorSwitcher.getCurrentReportData();
		const drawingHtml = await generateSimpleDrawingHtml(drawingData);

		const result = await window.pdfDrawingAPI.openDrawingPreview(drawingHtml);

		if (!result.success) {
			showNotification(`Не удалось открыть предпросмотр PDF:\n${result.message}`);
			console.error(`Не удалось открыть предпросмотр PDF:\n${result.message}`);
		}
	} catch (error) {
		showNotification("[PDF Preview] Непредвиденная ошибка:", error.message);
		console.error("[PDF Preview] Непредвиденная ошибка:", error.message);
	} finally {
		previewDrawingPdfButton.disabled = false;
		previewDrawingPdfButton.removeAttribute("aria-busy");
	}
});

async function generateSimpleDrawingHtml(data) {
	// 1. Пытаемся загрузить SVG как текст (это самый надежный способ для PDF в Electron)
	let drawingHtml = '<p style="text-align:center; color:gray;">Чертеж не найден</p>';
	console.log('data.screen: ',data.screen);
	if (data.screen) {
		try {
			const response = await fetch(data.screen);
			const svgText = await response.text();
			// Вставляем SVG прямо в HTML, чтобы он точно отобразился в PDF
			drawingHtml = `<div style="text-align:center; margin: 15px 0;">${svgText}</div>`;
		} catch (e) {
			// Если fetch не сработал, пробуем как обычную картинку
			drawingHtml = `<img src="${data.screen}" style="max-width:100%; height:auto; display:block; margin: 0 auto;" />`;
		}
	}

	// 2. Генерируем строки таблицы для каркаса
	const rowsFrame = data.frame.items
		.map(
			(part) => `
		<tr>
			<td>${part.name}</td>
			<td style="text-align:center;">${part.lengthMm} мм</td>
			<td style="text-align:center;">${part.count} шт.</td>
			<td style="text-align:center;">${part.pn || "—"}</td>
		</tr>
	`,
		)
		.join("");
	const rowsPartitions = data.partitions.items
		.map(
			(part) => `
		<tr>
			<td>${part.name}</td>
			<td style="text-align:center;">${part.lengthMm} мм</td>
			<td style="text-align:center;">${part.count} шт.</td>
			<td style="text-align:center;">${part.pn || "—"}</td>
		</tr>
	`,
		)
		.join("");

	// 3. Собираем минималистичный HTML для печати
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<style>
				body { font-family: Arial, sans-serif; font-size: 11pt; padding: 12mm; color: #000; }
				h2 { text-align: center; margin-bottom: 5mm; }
				h3 { margin-top: 10mm; border-bottom: 1px solid #000; padding-bottom: 2mm; }
				table { width: 100%; border-collapse: collapse; }
				th, td { border: 1px solid #333; padding: 6px; }
				th { background-color: #f0f0f0 !important; text-align: center; font-weight: bold; }
				@page { size: A4 portrait; margin: 12mm; }
			</style>
		</head>
		<body>
			<h2>${data.name}</h2>
			${drawingHtml}
			<h3>Детали каркаса</h3>
			<table>
				<thead>
					<tr>
						<th>Наименование</th>
						<th>Длина</th>
						<th>Кол-во</th>
						<th>ПН</th>
					</tr>
				</thead>
				<tbody>
					${rowsFrame.length > 0 ? rowsFrame : '<tr><td colspan="4" style="text-align:center;">Нет данных</td></tr>'}
					${rowsPartitions.length > 0 ? rowsPartitions : '<tr><td colspan="4" style="text-align:center;">Нет данных</td></tr>'}
				</tbody>
			</table>
		</body>
		</html>
	`;
}
