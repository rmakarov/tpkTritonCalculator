const crypto = require("crypto");
const path = require("path");
const fs = require("fs").promises;

const TRIAL_DURATION_MS = 10 * 1000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;
const TEST_APP_NAME = "tpktritoncalculator-trial-test";
const STATE_FILE_NAME = "trial-test-state.json";
const SIGNING_KEY = "tpk-triton-calculator-trial-test-v1";

let trialExpiresAt = null;

async function ensureTrialTestAccess() {
	const { app, dialog } = require("electron");
	if (!(await isTrialTestBuild(app))) return true;

	const statePath = path.join(app.getPath("userData"), STATE_FILE_NAME);
	const now = Date.now();
	const result = await loadOrCreateState(statePath, now);

	if (!result.valid) {
		await showBlockedMessage(
			dialog,
			"Не удалось проверить тестовый период",
			result.message,
		);
		return false;
	}

	const state = result.state;

	if (now + CLOCK_ROLLBACK_TOLERANCE_MS < state.lastSeenAt) {
		await showBlockedMessage(
			dialog,
			"Обнаружено изменение системного времени",
			"Верните корректные дату и время Windows, затем запустите приложение снова.",
		);
		return false;
	}

	if (now >= state.expiresAt) {
		await showExpiredMessage(dialog);
		return false;
	}

	if (!result.created) {
		state.lastSeenAt = Math.max(now, state.lastSeenAt);
		await saveState(statePath, state);
	}

	const secondsLeft = Math.max(1, Math.ceil((state.expiresAt - now) / 1000));
	await dialog.showMessageBox({
		type: "info",
		title: "Тест 10-секундной trial-версии",
		message: `До блокировки осталось ${secondsLeft} сек.`,
		detail: "После окончания таймера приложение закроется и перестанет запускаться до сброса теста.",
		buttons: ["Запустить тест"],
		noLink: true,
	});

	if (result.created) {
		const startedAt = Date.now();
		state.startedAt = startedAt;
		state.expiresAt = startedAt + TRIAL_DURATION_MS;
		state.lastSeenAt = startedAt;
		await saveState(statePath, state);
	}
	trialExpiresAt = state.expiresAt;

	return true;
}

function scheduleTrialTestExpiration() {
	if (trialExpiresAt === null) return;

	const timeLeft = trialExpiresAt - Date.now();
	if (timeLeft <= 0) {
		void closeExpiredTrial();
		return;
	}

	setTimeout(() => void closeExpiredTrial(), timeLeft);
}

async function isTrialTestBuild(app) {
	try {
		const packagePath = path.join(app.getAppPath(), "package.json");
		const packageData = JSON.parse(await fs.readFile(packagePath, "utf8"));
		return (
			packageData.trialTestBuild === true ||
			packageData.trialTestBuild === "true"
		);
	} catch (error) {
		console.error("[Trial Test] Не удалось прочитать метаданные сборки:", error);
		return false;
	}
}

async function loadOrCreateState(statePath, now) {
	try {
		const state = JSON.parse(await fs.readFile(statePath, "utf8"));
		return isValidState(state)
			? { valid: true, state }
			: { valid: false, message: "Данные тестового таймера повреждены." };
	} catch (error) {
		if (error.code !== "ENOENT") {
			return {
				valid: false,
				message: "Не удалось прочитать данные тестового таймера.",
			};
		}

		const state = {
			startedAt: now,
			expiresAt: now + TRIAL_DURATION_MS,
			lastSeenAt: now,
		};
		return {
			valid: true,
			created: true,
			state: { ...state, signature: signState(state) },
		};
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
	const { app, BrowserWindow, dialog } = require("electron");
	await showExpiredMessage(dialog);
	for (const window of BrowserWindow.getAllWindows()) window.destroy();
	app.quit();
}

async function showExpiredMessage(dialog) {
	await showBlockedMessage(
		dialog,
		"Тестовый период завершён",
		"Для повторного теста выполните в терминале: npm run reset:trial:test",
	);
}

async function showBlockedMessage(dialog, message, detail) {
	await dialog.showMessageBox({
		type: "warning",
		title: "Triton Calculator Trial Test",
		message,
		detail,
		buttons: ["Закрыть"],
		noLink: true,
	});
}

async function resetTrialTest() {
	if (process.platform !== "win32" || !process.env.APPDATA) {
		throw new Error("Команда сброса настроена для Windows.");
	}

	const statePath = path.join(
		process.env.APPDATA,
		TEST_APP_NAME,
		STATE_FILE_NAME,
	);

	try {
		await fs.unlink(statePath);
		console.log(`[Trial Test] Таймер сброшен: ${statePath}`);
	} catch (error) {
		if (error.code === "ENOENT") {
			console.log("[Trial Test] Таймер уже сброшен. Можно запускать приложение.");
			return;
		}
		throw error;
	}
}

if (require.main === module && process.argv.includes("--reset")) {
	resetTrialTest().catch((error) => {
		console.error("[Trial Test] Ошибка сброса:", error.message);
		process.exitCode = 1;
	});
}

module.exports = {
	ensureTrialTestAccess,
	scheduleTrialTestExpiration,
	resetTrialTest,
};
