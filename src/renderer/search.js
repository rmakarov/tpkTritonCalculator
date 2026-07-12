class TabSearch {
  constructor(searchSelector, tabSelector, emptyResultSelector) {
    this.searchInput = document.querySelector(searchSelector);
    this.tabs = [...document.querySelectorAll(tabSelector)];
    this.emptyResult = document.querySelector(emptyResultSelector);

    this.bindEvents();
  }

  bindEvents() {
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.openTab(tab));
    });

    this.searchInput.addEventListener("input", (event) => {
      this.filter(event.target.value);
    });
  }

  openTab(selectedTab) {
    this.tabs.forEach((tab) => {
      const isSelected = tab === selectedTab;

      tab.classList.toggle("is-active", isSelected);
      document.getElementById(tab.dataset.tab).hidden = !isSelected;
    });
  }

  filter(value) {
    const query = value.trim().toLocaleLowerCase("ru");

    this.tabs.forEach((tab) => {
      tab.hidden = !tab.textContent.toLocaleLowerCase("ru").includes(query);
    });

    const visibleTabs = this.tabs.filter((tab) => !tab.hidden);
    this.emptyResult.hidden = visibleTabs.length !== 0;

    const exactMatch = visibleTabs.find(
      (tab) => tab.textContent.trim().toLocaleLowerCase("ru") === query,
    );
    const activeTab = visibleTabs.find((tab) =>
      tab.classList.contains("is-active"),
    );
    const tabToOpen = exactMatch ?? activeTab ?? visibleTabs[0];

    if (tabToOpen) {
      this.openTab(tabToOpen);
    } else {
      this.tabs.forEach((tab) => {
        document.getElementById(tab.dataset.tab).hidden = true;
      });
    }
  }
}

new TabSearch("#tab-search", ".tab", "#empty-search");
