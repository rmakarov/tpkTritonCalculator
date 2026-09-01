let notificationTimeout; // Переменная для хранения ID таймера

export function showNotification(message, type = "error", duration = 3000) {
	const notif = document.getElementById("notification");
	if (!notif) {
		console.warn("Элемент #notification не найден в DOM");
		return;
	}

	// 🔥 ВАЖНО: Сбрасываем предыдущий таймер, чтобы уведомление не скрылось раньше времени
	if (notificationTimeout) {
		clearTimeout(notificationTimeout);
	}

	notif.textContent = message;
	notif.className = `notification ${type}`;

	// Убеждаемся, что класс hidden удален перед показом
	notif.classList.remove("hidden");

	notificationTimeout = setTimeout(() => {
		notif.classList.add("hidden");
	}, duration);
}
