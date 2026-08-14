import { settingsManager } from "./settingsManager.js";
import { priceManager } from "./priceManager.js";
import { confirmModal } from "./modal/modalManager.js";

export function initSettingsAccordion() {
	const toggleBtn = document.getElementById("settings-toggle-btn");
	const accordion = document.getElementById("settings-accordion");
	const content = accordion?.querySelector(".settings-accordion__content");
	const toggleText = toggleBtn?.querySelector(".settings-toggle-btn__text");
	const resetBtn = document.getElementById("settings-reset-btn");
	const priceResetBtn = document.getElementById("price-reset-btn");

	if (!toggleBtn || !accordion || !content) {
		console.warn("[SettingsAccordion] Элементы не найдены");
		return;
	}

	// Toggle аккордеона
	toggleBtn.addEventListener("click", async () => {
		const isOpen = accordion.classList.toggle("settings-accordion--open");
		toggleBtn.classList.toggle("settings-toggle-btn--active", isOpen);

		if (toggleText) {
			toggleText.textContent = isOpen ? "Скрыть настройки" : "Показать настройки";
		}

		if (isOpen && !accordion.dataset.rendered) {
			await renderSettings(content);
			accordion.dataset.rendered = "true";
		}
	});

	// Кнопка сброса кэша прайса
	priceResetBtn?.addEventListener("click", async () => {
		const confirmed = await confirmModal({
			title: "Очистка прайс листа",
			message: "После данной операции необходимо загрузить новый прайс лист! \n Очистить кэш прайс листа?",
			okText: "Очистить",
			cancelText: "Отмена",
		});

		if (!confirmed) return;

		try {
			await priceManager.resetCache();
			console.log("✅ Кэш прайс листа очищен");
		} catch (error) {
			console.error("Ошибка очистки кэша прайс листа:", error);
			// alert(`Ошибка: ${error.message}`);
		}
	});

	// Кнопка сброса
	resetBtn?.addEventListener("click", async () => {
		const confirmed = await confirmModal({
			title: "Сброс настроек",
			message: "Сбросить все настройки к значениям по умолчанию?",
			okText: "Сбросить",
			cancelText: "Отмена",
		});

		if (!confirmed) return;

		try {
			await settingsManager.reset();
			console.log("✅ Настройки сброшены");
			delete accordion.dataset.rendered;
			await renderSettings(content);
			accordion.dataset.rendered = "true";
		} catch (error) {
			console.error("Ошибка сброса настроек:", error);
			// alert(`Ошибка: ${error.message}`);
		}
	});
}

// ==========================================
// Рендер
// ==========================================
async function renderSettings(container) {
	try {
		const settings = settingsManager.getAllSettings();
		container.innerHTML = "";

		const sections = settings?.sections;
		if (!sections) {
			container.innerHTML = '<p class="settings-placeholder">Настройки пусты</p>';
			return;
		}

		for (const [sectionKey, section] of Object.entries(sections)) {
			container.appendChild(createSectionElement(sectionKey, section));
		}
	} catch (error) {
		console.error("Ошибка загрузки настроек:", error);
		container.innerHTML = `<p class="settings-placeholder">Ошибка: ${error.message}</p>`;
	}
}

function createSectionElement(sectionKey, section) {
	const wrapper = document.createElement("section");
	wrapper.className = "settings-section";

	const title = document.createElement("h4");
	title.className = "settings-section__title";
	title.textContent = section.title || sectionKey;
	wrapper.appendChild(title);

	const list = document.createElement("ul");
	list.className = "settings-section__list";

	for (const [fieldKey, field] of Object.entries(section.fields)) {
		list.appendChild(createFieldElement(sectionKey, fieldKey, field));
	}

	wrapper.appendChild(list);
	return wrapper;
}

// ==========================================
// Создание строки поля
// ==========================================
function createFieldElement(sectionKey, fieldKey, field) {
	const li = document.createElement("li");
	li.className = "settings-field";

	// Заголовок поля
	const label = document.createElement("span");
	label.className = "settings-field__label";
	label.textContent = field.title || fieldKey;

	// Если есть текущее значение (не null), показываем его
	if (field.value !== null && field.value !== undefined && field.type !== "select") {
		const valueWrap = document.createElement("span");
		valueWrap.className = "settings-field__value";
		const valueText = document.createElement("span");
		valueText.className = "settings-field__text";
		valueText.textContent = formatValue(field.value, field);

		const editBtn = createEditButton(field.title);
		editBtn.addEventListener("click", () => {
			enterEditMode(sectionKey, fieldKey, field, valueWrap, valueText, editBtn);
		});

		valueWrap.appendChild(valueText);
		valueWrap.appendChild(editBtn);

		li.appendChild(label);
		li.appendChild(valueWrap);
		return li;
	}

	// ===== Для select: показываем все options отдельными строками =====
	if (field.type === "select" && Array.isArray(field.options)) {
		li.classList.add("settings-field--group");

		const header = document.createElement("div");
		header.className = "settings-field__header";
		header.appendChild(label);

		// Показываем текущее значение, если задано
		if (field.value !== null && field.value !== undefined) {
			const currentBadge = document.createElement("span");
			currentBadge.className = "settings-field__current";
			currentBadge.textContent = `Активно: ${field.value}`;
			header.appendChild(currentBadge);
		}

		li.appendChild(header);

		// Контейнер для всех вариантов
		const optionsContainer = document.createElement("div");
		optionsContainer.className = "settings-field__options";

		field.options.forEach((optionValue, index) => {
			const optionRow = createOptionRow(sectionKey, fieldKey, field, optionValue, index, li);
			optionsContainer.appendChild(optionRow);
		});

		li.appendChild(optionsContainer);
		return li;
	}

	// Простое поле без значения
	li.appendChild(label);
	const emptyText = document.createElement("span");
	emptyText.className = "settings-field__text settings-field__text--empty";
	emptyText.textContent = "— не задано —";
	li.appendChild(emptyText);

	return li;
}

// Создаёт строку для одного элемента options (select-поля)
function createOptionRow(sectionKey, fieldKey, field, optionValue, index, fieldLi) {
	const row = document.createElement("div");
	row.className = "settings-field__option-row";

	const valueWrap = document.createElement("span");
	valueWrap.className = "settings-field__value";

	const valueText = document.createElement("span");
	valueText.className = "settings-field__text";
	valueText.textContent = formatValue(optionValue, field);

	const editBtn = createEditButton(`Вариант ${index + 1}`);
	editBtn.addEventListener("click", () => {
		enterSelectOptionEditMode(sectionKey, fieldKey, field, index, valueWrap, valueText, editBtn, fieldLi);
	});

	valueWrap.appendChild(valueText);
	valueWrap.appendChild(editBtn);
	row.appendChild(valueWrap);

	return row;
}

function createEditButton(title = "Редактировать") {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "settings-field__edit";
	btn.title = title;
	btn.setAttribute("aria-label", title);
	btn.innerHTML = "✏️";
	return btn;
}

function formatValue(value, field) {
	if (value === null || value === undefined || value === "") {
		return "— не задано —";
	}
	return String(value);
}

// ==========================================
// Редактирование обычных полей
// ==========================================
function enterEditMode(sectionKey, fieldKey, field, valueWrap, valueText, editBtn) {
	valueText.style.display = "none";
	editBtn.style.display = "none";

	const editor = document.createElement("input");
	editor.type = field.type === "number" ? "number" : "text";
	editor.className = "settings-field__input";
	editor.value = field.value ?? "";

	const exitEdit = async (save) => {
		if (save) {
			const newValue = field.type === "number" ? Number(editor.value) : editor.value;
			if (String(newValue) !== String(field.value)) {
				field.value = newValue;
				valueText.textContent = formatValue(field.value, field);
				await saveValue(sectionKey, fieldKey, newValue);
			}
		}
		editor.remove();
		valueText.style.display = "";
		editBtn.style.display = "";
	};

	editor.addEventListener("keydown", (e) => {
		if (e.key === "Enter") exitEdit(true);
		if (e.key === "Escape") exitEdit(false);
	});
	editor.addEventListener("blur", () => exitEdit(true));

	valueWrap.insertBefore(editor, valueText);
	editor.focus();
	editor.select();
}

// ==========================================
// Редактирование элемента options (для select-полей)
// ==========================================
function enterSelectOptionEditMode(sectionKey, fieldKey, field, optionIndex, valueWrap, valueText, editBtn, fieldLi) {
	valueText.style.display = "none";
	editBtn.style.display = "none";

	const editor = document.createElement("input");
	editor.type = "number";
	editor.className = "settings-field__input";
	editor.value = field.options[optionIndex];

	const exitEdit = async (save) => {
		if (save) {
			const newValue = Number(editor.value);

			if (isNaN(newValue)) {
				alert("Значение должно быть числом");
			} else if (newValue !== field.options[optionIndex]) {
				field.options[optionIndex] = newValue;
				valueText.textContent = formatValue(newValue, field);

				try {
					await saveOptionValue(sectionKey, fieldKey, optionIndex, newValue);
					console.log(`✅ Вариант обновлён: ${fieldKey}[${optionIndex}] = ${newValue}`);

					// ⬇️ Обновляем бейдж «Активно», если поле имеет текущее значение
					if (field.value !== null && field.value !== undefined) {
						updateActiveBadge(fieldLi, field);
					}
				} catch (error) {
					console.error(`❌ Ошибка сохранения варианта:`, error);
					valueText.textContent = formatValue(field.options[optionIndex], field);
				}
			}
		}
		editor.remove();
		valueText.style.display = "";
		editBtn.style.display = "";
	};

	editor.addEventListener("keydown", (e) => {
		if (e.key === "Enter") exitEdit(true);
		if (e.key === "Escape") exitEdit(false);
	});
	editor.addEventListener("blur", () => exitEdit(true));

	valueWrap.insertBefore(editor, valueText);
	editor.focus();
	editor.select();
}

// Функция обновления бейджа «Активно: …»
function updateActiveBadge(fieldLi, field) {
	const header = fieldLi.querySelector(".settings-field__header");
	if (!header) return;

	let badge = header.querySelector(".settings-field__current");

	if (field.value !== null && field.value !== undefined) {
		if (!badge) {
			badge = document.createElement("span");
			badge.className = "settings-field__current";
			header.appendChild(badge);
		}
		badge.textContent = `Активно: ${field.value}`;
	} else if (badge) {
		badge.remove();
	}
}

// ==========================================
// Сохранение
// ==========================================
// Сохранение обычного поля
async function saveValue(sectionKey, fieldKey, newValue) {
	try {
		await settingsManager.setValue(sectionKey, fieldKey, newValue);
		console.log(`✅ Сохранено: ${sectionKey}.${fieldKey} = ${newValue}`);
	} catch (error) {
		console.error(`❌ Ошибка сохранения ${sectionKey}.${fieldKey}:`, error);
	}
}

// Сохранение элемента options
async function saveOptionValue(sectionKey, fieldKey, optionIndex, newValue) {
	try {
		await settingsManager.setOptionValue(sectionKey, fieldKey, optionIndex, newValue);
		console.log(`✅ Сохранён вариант: ${sectionKey}.${fieldKey}[${optionIndex}] = ${newValue}`);
	} catch (error) {
		console.error(`❌ Ошибка сохранения варианта:`, error);
	}
}
