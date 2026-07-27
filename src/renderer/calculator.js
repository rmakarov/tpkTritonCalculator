function cloneCalculatorTemplate(templateId) {
  const template = document.getElementById(templateId);
  return template.content.firstElementChild.cloneNode(true);
}

class WicketCalculatorView {
  render() {
    return cloneCalculatorTemplate("wicket-calculator-template");
  }
}

class GateCalculatorView {
  render() {
    this.element = cloneCalculatorTemplate("gate-calculator-template");
    this.openingInputs = [
      ...this.element.querySelectorAll('input[name="gate-opening"]')
    ];
    this.slidingRows = [
      ...this.element.querySelectorAll(".calculator-field--sliding")
    ];

    this.openingInputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.updateSlidingFields();
      });
    });

    this.updateSlidingFields();
    return this.element;
  }

  updateSlidingFields() {
    const selectedType = this.openingInputs.find((input) => input.checked);
    const isSliding = selectedType.value === "sliding";

    this.slidingRows.forEach((row) => {
      row.classList.toggle("calculator-field--inactive", !isSliding);
      row.querySelector("select").disabled = !isSliding;
    });
  }
}

class CalculatorViewSwitcher {
  constructor() {
    this.mount = document.getElementById("calculator-mount");
    this.markupSelect = document.getElementById("markup");
    this.typeInputs = [
      ...document.querySelectorAll('input[name="calculator-type"]')
    ];
    this.calculators = {
      wicket: WicketCalculatorView,
      gate: GateCalculatorView
    };

    this.typeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          this.showCalculator(input.value);
        }
      });
    });

    this.showCalculator("wicket");
  }

  getMarkupMultiplier() {
    return Number.parseFloat(this.markupSelect.value) || 1;
  }

  showCalculator(type) {
    const Calculator = this.calculators[type];
    if (!Calculator) return;

    const calculator = new Calculator();
    this.mount.replaceChildren(calculator.render());
  }
}

new CalculatorViewSwitcher();
