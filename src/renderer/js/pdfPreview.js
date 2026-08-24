import { showNotification } from "./utils/notification";

const previewPdfButton = document.getElementById("printButton");

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
