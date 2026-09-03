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
	// 1. Пытаемся загрузить SVG как текст
	let drawingHtml = '<p style="text-align:center; color:gray; margin: 10px 0;">Чертеж не найден</p>';

	if (data.screen) {
		try {
			const response = await fetch(data.screen);
			const svgText = await response.text();

			// Внедряем стили прямо в открывающий тег <svg>
			const styledSvgText = svgText.replace(/<svg\b([^>]*)>/i, (match, attributes) => {
				const cleanAttributes = attributes.replace(/\bwidth\s*=\s*["'][^"']*["']/gi, "").replace(/\bheight\s*=\s*["'][^"']*["']/gi, "");

				// ДОБАВЛЕНО: vertical-align: top и line-height: 0 в родителе убирают "призрачные" отступы
				return `<svg${cleanAttributes} style="height: 500px; width: auto; max-width: 100%; display: block; margin: 0 auto; vertical-align: top;">`;
			});

			// ИЗМЕНЕНО: margin: 0 сверху, 10px снизу. line-height: 0 убивает отступ под/над SVG
			drawingHtml = `<div style="text-align:center; margin: 0 auto 10px auto; line-height: 0;">${styledSvgText}</div>`;
		} catch (e) {
			// Для fallback-картинки применяем те же правила
			drawingHtml = `<div style="text-align:center; margin: 0 auto 10px auto; line-height: 0;"><img src="${data.screen}" style="height: 500px; width: auto; max-width: 100%; display: block; margin: 0 auto; vertical-align: top;" /></div>`;
		}
	}

	// 2. Генерируем строки таблицы
	const frameItems = data.frame?.items || [];
	const partitionItems = data.partitions?.items || [];

	const rowsFrame = frameItems
		.map(
			(part) => `
		<tr>
			<td>${part.name || "—"}</td>
			<td style="text-align:center;">${part.lengthMm || "—"} мм</td>
			<td style="text-align:center;">${part.count || "—"} шт.</td>
			<td style="text-align:center;">${part.pn || "—"}</td>
		</tr>
	`,
		)
		.join("");

	const rowsPartitions = partitionItems
		.map(
			(part) => `
		<tr>
			<td>${part.name || "—"}</td>
			<td style="text-align:center;">${part.lengthMm || "—"} мм</td>
			<td style="text-align:center;">${part.count || "—"} шт.</td>
			<td style="text-align:center;">${part.pn || "—"}</td>
		</tr>
	`,
		)
		.join("");

	// 3. Собираем HTML для печати
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<style>
				body { font-family: Arial, sans-serif; font-size: 11pt; padding: 12mm; color: #000; }
				
				/* ИЗМЕНЕНО: жестко задаем отступы для заголовка */
				h2 { text-align: center; margin: 0 0 2mm 0; font-size: 14pt; }
				
				h3 { margin-top: 5mm; border-bottom: 1px solid #000; padding-bottom: 2mm; }
				table { width: 100%; border-collapse: collapse; }
				th, td { border: 1px solid #333; padding: 6px; }
				th { background-color: #f0f0f0 !important; text-align: center; font-weight: bold; }
				
				@page { size: A4 portrait; margin: 12mm; }
			</style>
		</head>
		<body>
			<h2>${data.name || "Без названия"}</h2>
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
