/**
 * Универсальный менеджер модальных окон.
 * Автоматически вешает обработчики открытия/закрытия на все .modal-close внутри диалога.
 */

const openModals = new Map(); // для хранения коллбэков при закрытии

/**
 * Открывает модальное окно.
 * @param {string|HTMLDialogElement} dialog - id или элемент
 * @param {Object} options - опции
 * @param {Function} [options.onOpen] - вызывается после открытия
 * @param {Function} [options.onClose] - вызывается перед закрытием (после очистки)
 */
export function openModal(dialog, options = {}) {
	const dialogEl =
		typeof dialog === "string" ? document.getElementById(dialog) : dialog;
	if (!dialogEl) {
		console.error(`Модалка не найдена:`, dialog);
		return;
	}

	dialogEl.showModal();

	// Вешаем закрытие на все .modal-close внутри диалога
	const closeButtons = dialogEl.querySelectorAll(".modal-close");
	const closeHandler = () => closeModal(dialogEl);
	closeButtons.forEach((btn) => {
		btn.removeEventListener("click", closeHandler); // избегаем дублей
		btn.addEventListener("click", closeHandler);
	});

	// Закрытие по клику на затемнённый фон (backdrop)
	const backdropHandler = (e) => {
		if (e.target === dialogEl) {
			closeModal(dialogEl);
		}
	};
	dialogEl.removeEventListener("click", backdropHandler);
	dialogEl.addEventListener("click", backdropHandler);

	openModals.set(dialogEl, {
		onClose: options.onClose,
		backdropHandler,
	});

	if (typeof options.onOpen === "function") {
		options.onOpen();
	}
}

/**
 * Закрывает модальное окно и очищает его форму.
 * @param {HTMLDialogElement} dialogEl
 */
export function closeModal(dialogEl) {
	const dialog =
		typeof dialogEl === "string" ? document.getElementById(dialogEl) : dialogEl;
	if (!dialog) return;

	const meta = openModals.get(dialog) || {};

	// Сброс формы, если есть
	const form = dialog.querySelector("form");
	if (form) {
		form.reset();
	}

	if (typeof meta.onClose === "function") {
		meta.onClose();
	}

	dialog.close();
	openModals.delete(dialog);
}

/**
 * Закрывает все открытые модалки.
 */
export function closeAllModals() {
	openModals.forEach((_, dialog) => closeModal(dialog));
}
