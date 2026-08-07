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
 * Открывает модальное окно подтверждения и возвращает Promise<boolean>.
 * Использует единственный dialog #confirmDialog из DOM.
 *
 * @param {object} options
 * @param {string} [options.title="Подтверждение"]
 * @param {string} [options.message=""]
 * @param {string} [options.okText="Подтвердить"]
 * @param {string} [options.cancelText="Отмена"]
 * @returns {Promise<boolean>} true — подтверждено, false — отменено
 */
export function confirmModal({
	title = "Подтверждение",
	message = "",
	okText = "Подтвердить",
	cancelText = "Отмена",
} = {}) {
	return new Promise((resolve) => {
		const dialog = document.getElementById("confirmDialog");
		if (!dialog) {
			console.warn(
				"[confirmModal] #confirmDialog не найден, использую window.confirm",
			);
			resolve(window.confirm(message));
			return;
		}

		// Заполняем содержимое
		dialog.querySelector(".modal-header h3").textContent = title;
		dialog.querySelector(".modal-body p").textContent = message;

		const cancelBtn = dialog.querySelector(".modal-footer .modal-close");
		const okBtn = dialog.querySelector("#confirm-modal-ok");
		if (cancelBtn) cancelBtn.textContent = cancelText;
		if (okBtn) okBtn.textContent = okText;

		// Флаг, чтобы не резолвить Promise дважды
		let resolved = false;
		const finish = (result) => {
			if (resolved) return;
			resolved = true;
			okBtn?.removeEventListener("click", onOk);
			resolve(result);
		};

		const onOk = () => {
			finish(true);
			closeModal(dialog);
		};

		okBtn?.addEventListener("click", onOk);

		openModal(dialog, {
			// onClose срабатывает при любом закрытии: крестик, фон, Escape, кнопка "Отмена"
			onClose: () => finish(false),
		});
	});
}

/**
 * Закрывает все открытые модалки.
 */
export function closeAllModals() {
	openModals.forEach((_, dialog) => closeModal(dialog));
}
