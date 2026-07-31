const path = require("path");
const crypto = require("crypto");
const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs").promises;

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TRIAL_STATE_FILE = "trial-state.json";
const TRIAL_TEST_STATE_FILE = "trial-state-test.json";
const TRIAL_STATE_SECRET = "tpk-triton-calculator-trial-v1";

let activeExpirationTime = null;

async function ensureTrialAccess() {
	const developmentTrialDuration = getDevelopmentTrialDuration();

	// Обычный npm run dev не расходует тестовый период.
	if (!app.isPackaged && developmentTrialDuration === null) {
		return true;
	}

	const isDevelopmentTrial =
		!app.isPackaged && developmentTrialDuration !== null;
	const trialDuration = isDevelopmentTrial
		? developmentTrialDuration
		: TRIAL_DURATION_MS;
	const statePath = isDevelopmentTrial
		? getTrialStatePath(TRIAL_TEST_STATE_FILE)
		: getTrialStatePath(TRIAL_STATE_FILE);

	const now = Date.now();
	const stateResult = await loadOrCreateTrialState(
		now,
		trialDuration,
		statePath,
	);

	if (!stateResult.valid) {
		await dialog.showMessageBox({
			type: "error",
			title: "Ошибка тестовой лицензии",
			message: "Не удалось проверить тестовый период",
			detail: stateResult.message,
			buttons: ["Закрыть"],
			noLink: true,
		});
		return false;
	}

	const state = stateResult.state;

	if (now + CLOCK_TOLERANCE_MS < state.lastSeenAt) {
		await dialog.showMessageBox({
			type: "error",
			title: "Неверная системная дата",
			message: "Обнаружено изменение системного времени",
			detail:
				"Верните корректные дату и время Windows, затем запустите приложение снова.",
			buttons: ["Закрыть"],
			noLink: true,
		});
		return false;
	}

	if (now >= state.expiresAt) {
		await showTrialExpiredDialog();
		return false;
	}

	state.lastSeenAt = Math.max(now, state.lastSeenAt);
	await saveTrialState(state, statePath);
	activeExpirationTime = state.expiresAt;

	if (isDevelopmentTrial) {
		console.log(
			`[Trial] Тестовая блокировка через ${Math.max(0, state.expiresAt - now)} мс.`,
		);
		return true;
	}

	const daysRemaining = Math.max(
		1,
		Math.ceil((state.expiresAt - now) / MILLISECONDS_PER_DAY),
	);

	await dialog.showMessageBox({
		type: "info",
		title: "Тестовая версия",
		message: `Тестовый период: осталось ${daysRemaining} дн.`,
		detail: `Приложение будет доступно до ${formatExpirationDate(state.expiresAt)}.`,
		buttons: ["Продолжить"],
		noLink: true,
	});

	return true;
}

function scheduleTrialExpiration() {
	if (activeExpirationTime === null) return;

	const millisecondsUntilExpiration = activeExpirationTime - Date.now();
	if (millisecondsUntilExpiration <= 0) {
		void expireTrialAndQuit();
		return;
	}

	const timer = setTimeout(
		() => void expireTrialAndQuit(),
		millisecondsUntilExpiration,
	);
	timer.unref();
}

async function loadOrCreateTrialState(now, trialDuration, statePath) {
	try {
		const storedState = JSON.parse(await fs.readFile(statePath, "utf8"));
		if (!isValidTrialState(storedState, trialDuration)) {
			return {
				valid: false,
				message:
					"Данные тестовой лицензии повреждены. Обратитесь к разработчику.",
			};
		}
		return { valid: true, state: storedState };
	} catch (error) {
		if (error.code !== "ENOENT") {
			return {
				valid: false,
				message: "Не удалось прочитать данные тестовой лицензии.",
			};
		}

		const newState = {
			startedAt: now,
			expiresAt: now + trialDuration,
			lastSeenAt: now,
		};
		await saveTrialState(newState, statePath);
		return { valid: true, state: newState };
	}
}

async function saveTrialState(state, statePath) {
	const signedState = {
		...state,
		signature: createStateSignature(state),
	};

	await fs.mkdir(path.dirname(statePath), { recursive: true });
	await fs.writeFile(statePath, JSON.stringify(signedState), "utf8");
}

function isValidTrialState(state, trialDuration) {
	if (
		!state ||
		!Number.isFinite(state.startedAt) ||
		!Number.isFinite(state.expiresAt) ||
		!Number.isFinite(state.lastSeenAt) ||
		typeof state.signature !== "string" ||
		state.expiresAt - state.startedAt !== trialDuration
	) {
		return false;
	}

	const expectedSignature = createStateSignature(state);
	const storedBuffer = Buffer.from(state.signature, "hex");
	const expectedBuffer = Buffer.from(expectedSignature, "hex");

	return (
		storedBuffer.length === expectedBuffer.length &&
		crypto.timingSafeEqual(storedBuffer, expectedBuffer)
	);
}

function createStateSignature(state) {
	const payload = `${state.startedAt}:${state.expiresAt}:${state.lastSeenAt}`;
	return crypto
		.createHmac("sha256", TRIAL_STATE_SECRET)
		.update(payload)
		.digest("hex");
}

function getDevelopmentTrialDuration() {
	if (app.isPackaged) return null;

	const duration = Number(process.env.TRIAL_TEST_DURATION_MS);
	return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function getTrialStatePath(fileName) {
	return path.join(app.getPath("userData"), fileName);
}

async function expireTrialAndQuit() {
	// Block access immediately. A native message box can be minimized, so the
	// application windows must no longer exist while the warning is displayed.
	for (const window of BrowserWindow.getAllWindows()) {
		window.destroy();
	}

	try {
		await showTrialExpiredDialog();
	} finally {
		app.exit(0);
	}
}

async function showTrialExpiredDialog() {
	await dialog.showMessageBox({
		type: "warning",
		title: "Тестовый период завершён",
		message: "Срок действия тестовой версии закончился",
		detail:
			"Для продолжения работы обратитесь к разработчику и приобретите полную версию.",
		buttons: ["Закрыть"],
		noLink: true,
	});
}

function formatExpirationDate(expirationTime) {
	return new Intl.DateTimeFormat("ru-RU", {
		dateStyle: "long",
		timeStyle: "short",
		timeZone: "Europe/Moscow",
	}).format(new Date(expirationTime));
}

module.exports = {
	ensureTrialAccess,
	scheduleTrialExpiration,
};
