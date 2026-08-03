const previewPdfButton = document.getElementById("printButton");

previewPdfButton?.addEventListener("click", async () => {
	previewPdfButton.disabled = true;
	previewPdfButton.setAttribute("aria-busy", "true");

	try {
		const result = await window.pdfAPI.openPreview();

		if (!result.success) {
			alert(`Не удалось открыть предпросмотр PDF:\n${result.message}`);
		}
	} catch (error) {
		console.error("[PDF Preview] Непредвиденная ошибка:", error);
		alert("Произошла непредвиденная ошибка при создании PDF.");
	} finally {
		previewPdfButton.disabled = false;
		previewPdfButton.removeAttribute("aria-busy");
	}
});
