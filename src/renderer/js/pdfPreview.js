import { showNotification } from "./utils/notification";

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
		const drawingHtml = `
        <div class="drawing-title">Чертёж изделия №12345</div>
        <img class="drawing-image" src="file:///path/to/drawing.png" />
        <table>
            <tr><td>Размер:</td><td>100x200x50 мм</td></tr>
            <tr><td>Материал:</td><td>Сталь 45</td></tr>
            <tr><td>Масса:</td><td>2.5 кг</td></tr>
        </table>
    `;

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
