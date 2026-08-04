// src/renderer/js/settingsAccordion.js
import { settingsManager } from "./settingsManager.js";

export function initSettingsAccordion() {
	const toggleBtn = document.getElementById("settings-toggle-btn");
	const accordion = document.getElementById("settings-accordion");
	const content = accordion?.querySelector(".settings-accordion__content");
	const toggleText = toggleBtn?.querySelector(".settings-toggle-btn__text");
	const resetBtn = document.getElementById("settings-reset-btn");

	if (!toggleBtn || !accordion || !content) {
		console.warn("[SettingsAccordion] Элементы не найдены");
		return;
	}

	// Рендерим настройки при инициализации
	renderSettingsContent(content);

	// Toggle аккордеона
	toggleBtn.addEventListener("click", () => {
		const isOpen = accordion.classList.toggle("settings-accordion--open");
		toggleBtn.classList.toggle("settings-toggle-btn--active", isOpen);

		if (toggleText) {
			toggleText.textContent = isOpen
				? "Скрыть настройки"
				: "Показать настройки";
		}
	});

	// Кнопка сброса
	resetBtn?.addEventListener("click", async () => {
		if (confirm("Сбросить все настройки к значениям по умолчанию?")) {
			try {
				await window.settings.reset();
				await renderSettingsContent(content);
				console.log("✅ Настройки сброшены");
			} catch (error) {
				console.error("Ошибка сброса настроек:", error);
				alert(`Ошибка: ${error.message}`);
			}
		}
	});
}

// ==========================================
// Рендеринг настроек
// ==========================================

async function renderSettingsContent(container) {
	container.innerHTML = '<p class="settings-loading">Загрузка настроек...</p>';

	try {
		const settings = await settingsManager.ensureLoaded();
		container.innerHTML = "";

		if (!settings.sections || Object.keys(settings.sections).length === 0) {
			container.innerHTML =
				'<p class="settings-empty">Настройки не найдены</p>';
			return;
		}

		for (const [sectionKey, section] of Object.entries(settings.sections)) {
			container.appendChild(renderSection(sectionKey, section, container));
		}
	} catch (error) {
		console.error("[SettingsAccordion] Ошибка загрузки настроек:", error);
		container.innerHTML = `<p class="settings-error">Ошибка: ${error.message}</p>`;
	}
}

function renderSection(sectionKey, section, container) {
	const sectionEl = document.createElement("div");
	sectionEl.className = "settings-section";

	// Заголовок раздела с кнопками
	const header = document.createElement("div");
	header.className = "settings-section__header";

	const title = document.createElement("h4");
	title.className = "settings-section__title";
	title.textContent = section.title;

	const actions = document.createElement("div");
	actions.className = "settings-section__actions";

	// Кнопка удаления раздела
	const deleteSectionBtn = document.createElement("button");
	deleteSectionBtn.className = "btn btn--small btn--icon";
	deleteSectionBtn.textContent = "Удалить раздел";
	deleteSectionBtn.title = "Удалить раздел";
	deleteSectionBtn.addEventListener("click", async () => {
		if (confirm(`Удалить раздел "${section.title}" и все его поля?`)) {
			try {
				await window.settings.removeSection(sectionKey);
				await renderSettingsContent(container);
			} catch (error) {
				alert(`Ошибка: ${error.message}`);
			}
		}
	});

	actions.appendChild(deleteSectionBtn);
	header.append(title, actions);
	sectionEl.appendChild(header);

	// Поля раздела
	const fieldsContainer = document.createElement("div");
	fieldsContainer.className = "settings-section__fields";

	for (const [fieldKey, field] of Object.entries(section.fields)) {
		fieldsContainer.appendChild(
			renderField(sectionKey, fieldKey, field, container),
		);
	}

	sectionEl.appendChild(fieldsContainer);
	return sectionEl;
}

function renderField(sectionKey, fieldKey, field, container) {
	const fieldEl = document.createElement("div");
	fieldEl.className = "settings-field";

	// Label
	const label = document.createElement("label");
	label.className = "settings-field__label";
	label.textContent = field.title;
	label.htmlFor = `settings-${sectionKey}-${fieldKey}`;

	// Input
	const input = createInput(sectionKey, fieldKey, field);
	input.id = `settings-${sectionKey}-${fieldKey}`;
	input.className = "settings-field__input";

	// Кнопка удаления поля
	const deleteBtn = document.createElement("button");
	deleteBtn.className = "settings-field__delete";
	deleteBtn.textContent = "×";
	deleteBtn.title = "Удалить поле";
	deleteBtn.addEventListener("click", async () => {
		if (confirm(`Удалить поле "${field.title}"?`)) {
			try {
				await window.settings.removeField(sectionKey, fieldKey);
				await renderSettingsContent(container);
			} catch (error) {
				alert(`Ошибка: ${error.message}`);
			}
		}
	});

	fieldEl.append(label, input, deleteBtn);
	return fieldEl;
}

function createInput(sectionKey, fieldKey, field) {
	// SELECT
	if (field.type === "select") {
		const select = document.createElement("select");

		if (field.value == null) {
			const placeholder = document.createElement("option");
			placeholder.value = "";
			placeholder.disabled = true;
			placeholder.selected = true;
			placeholder.textContent = "Выберите значение";
			select.appendChild(placeholder);
		}

		for (const opt of field.options || []) {
			const option = document.createElement("option");
			option.value = opt;
			option.textContent = opt;
			if (String(opt) === String(field.value)) {
				option.selected = true;
			}
			select.appendChild(option);
		}

		select.addEventListener("change", () => {
			const value = select.value === "" ? null : Number(select.value);
			saveValue(sectionKey, fieldKey, value);
		});

		return select;
	}

	// NUMBER
	if (field.type === "number") {
		const input = document.createElement("input");
		input.type = "number";
		input.value = field.value ?? "";

		input.addEventListener("change", () => {
			const value = input.value === "" ? null : Number(input.value);
			saveValue(sectionKey, fieldKey, value);
		});

		return input;
	}

	// BOOLEAN
	if (field.type === "boolean") {
		const input = document.createElement("input");
		input.type = "checkbox";
		input.checked = Boolean(field.value);

		input.addEventListener("change", () => {
			saveValue(sectionKey, fieldKey, input.checked);
		});

		return input;
	}

	// TEXT
	const input = document.createElement("input");
	input.type = "text";
	input.value = field.value ?? "";

	input.addEventListener("change", () => {
		saveValue(sectionKey, fieldKey, input.value);
	});

	return input;
}

// ==========================================
// Сохранение
// ==========================================

async function saveValue(sectionKey, fieldKey, value) {
	try {
		await window.settings.setValue(sectionKey, fieldKey, value);
		console.log(`✅ Сохранено: ${sectionKey}.${fieldKey} = ${value}`);
	} catch (error) {
		console.error(`❌ Ошибка сохранения ${sectionKey}.${fieldKey}:`, error);
	}
}
