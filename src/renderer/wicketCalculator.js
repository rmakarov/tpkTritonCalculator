class WicketCalculator {
    constructor() {
        this.items = await window.excelAPI.getAllItems();
    }
}