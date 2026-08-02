const crypto = require("crypto");
const path = require("path");
const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs").promises;

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;
const STATE_FILE_NAME = "trial-state.json";
const SIGNING_KEY = "tpk-triton-calculator-trial-v1";

let trialExpiresAt = null;

async function ensureTrialAccess() {
	if (!(await isTrialBuild())) return true;

	const statePath = path.join(app.getPath("userData"), STATE_FILE_NAME);
	const now = Date.now();
	const result = await loadOrCreateState(statePath, now);

	if (!result.valid) {
		await showBlockedMessage(
			"Не удалось проверить тестовый период",
			result.message,
		);
		return false;
	}

	const state = result.state;

	if (now + CLOCK_ROLLBACK_TOLERANCE_MS < state.lastSeenAt) {
		await showBlockedMessage(
			"Обнаружено изменение системного времени",
			"Верните корректные дату и время Windows, затем запустите приложение снова.",
		);
		return false;
	}

	if (now >= state.expiresAt) {
		await showExpiredMessage();
		return false;
	}

	state.lastSeenAt = Math.max(now, state.lastSeenAt);
	await saveState(statePath, state);
	trialExpiresAt = state.expiresAt;

	const daysLeft = Math.max(
		1,
		Math.ceil((state.expiresAt - now) / (24 * 60 * 60 * 1000)),
	);

	await dialog.showMessageBox({
		type: "info",
		title: "Тестовая версия",
		message: `Тестовый период: осталось ${daysLeft} дн.`,
		detail: `Приложение будет доступно до ${formatDate(state.expiresAt)}.`,
		buttons: ["Продолжить"],
		noLink: true,
	});

	return true;
}

function scheduleTrialExpiration() {
	if (trialExpiresAt === null) return;

	const timeLeft = trialExpiresAt - Date.now();
	if (timeLeft <= 0) {
		void closeExpiredTrial();
		return;
	}

	setTimeout(() => void closeExpiredTrial(), timeLeft);
}

async function isTrialBuild() {
	try {
		const packagePath = path.join(app.getAppPath(), "package.json");
		const packageData = JSON.parse(await fs.readFile(packagePath, "utf8"));
		return packageData.trialBuild === true || packageData.trialBuild === "true";
	} catch (error) {
		console.error("[Trial] Не удалось прочитать метаданные сборки:", error);
		return false;
	}
}

async function loadOrCreateState(statePath, now) {
	try {
		const state = JSON.parse(await fs.readFile(statePath, "utf8"));
		return isValidState(state)
			? { valid: true, state }
			: { valid: false, message: "Данные тестовой лицензии повреждены." };
	} catch (error) {
		if (error.code !== "ENOENT") {
			return {
				valid: false,
				message: "Не удалось прочитать данные тестовой лицензии.",
			};
		}

		const state = {
			startedAt: now,
			expiresAt: now + TRIAL_DURATION_MS,
			lastSeenAt: now,
		};
		await saveState(statePath, state);
		return { valid: true, state: { ...state, signature: signState(state) } };
	}
}

async function saveState(statePath, state) {
	const signedState = { ...state, signature: signState(state) };
	await fs.mkdir(path.dirname(statePath), { recursive: true });
	await fs.writeFile(statePath, JSON.stringify(signedState), "utf8");
}

function isValidState(state) {
	if (
		!state ||
		!Number.isFinite(state.startedAt) ||
		!Number.isFinite(state.expiresAt) ||
		!Number.isFinite(state.lastSeenAt) ||
		typeof state.signature !== "string" ||
		state.expiresAt - state.startedAt !== TRIAL_DURATION_MS
	) {
		return false;
	}

	const actualSignature = Buffer.from(state.signature, "hex");
	const expectedSignature = Buffer.from(signState(state), "hex");
	return (
		actualSignature.length === expectedSignature.length &&
		crypto.timingSafeEqual(actualSignature, expectedSignature)
	);
}

function signState(state) {
	const payload = `${state.startedAt}:${state.expiresAt}:${state.lastSeenAt}`;
	return crypto.createHmac("sha256", SIGNING_KEY).update(payload).digest("hex");
}

async function closeExpiredTrial() {
	await showExpiredMessage();
	for (const window of BrowserWindow.getAllWindows()) window.destroy();
	app.quit();
}

async function showExpiredMessage() {
	await showBlockedMessage(
		"Тестовый период завершён",
		"Для продолжения работы приобретите полную версию приложения.",
	);
}

async function showBlockedMessage(message, detail) {
	await dialog.showMessageBox({
		type: "warning",
		title: "Triton Calculator Trial",
		message,
		detail,
		buttons: ["Закрыть"],
		noLink: true,
	});
}

function formatDate(timestamp) {
	return new Intl.DateTimeFormat("ru-RU", {
		dateStyle: "long",
		timeStyle: "short",
	}).format(new Date(timestamp));
}

module.exports = { ensureTrialAccess, scheduleTrialExpiration };
