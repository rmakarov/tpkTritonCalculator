let tabs;

// Выполняется сразу при импорте
function initTabs() {
	tabs = [...document.querySelectorAll(".tab")];
	if (tabs.length) {
		tabs.forEach((tab) => {
			tab.addEventListener("click", () => openTab(tab));
		});
	} else {
		console.error("Tabs element not found!");
	}
}

const openTab = (selectedTab) => {
	tabs.forEach((tab) => {
		const isSelected = tab === selectedTab;
		tab.classList.toggle("is-active", isSelected);
		document.getElementById(tab.dataset.tab).hidden = !isSelected;
	});
};

// 🔥 Вызов сразу
initTabs();
