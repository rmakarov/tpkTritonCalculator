class TabSearch {
  constructor(searchSelector, tabSelector, emptyResultSelector) {
    this.searchInput = document.querySelector(searchSelector);
    this.tabs = [...document.querySelectorAll(tabSelector)];
    this.emptyResult = document.querySelector(emptyResultSelector);

    this.bindEvents();
  }

  bindEvents() {
    this.searchInput.addEventListener("input", (event) => {
      this.filter(event.target.value);
    });
  }

  filter(value) {
    const query = value.trim().toLocaleLowerCase("ru");

  }
}

new TabSearch("#tab-search", ".tab", "#empty-search");
