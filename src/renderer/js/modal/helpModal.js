import { openModal } from "./modalManager.js";

const helpDialog = document.getElementById("helpDialog");
const helpButton = document.getElementById("help-btn");

helpButton?.addEventListener("click", () => {
	openModal(helpDialog);
});
