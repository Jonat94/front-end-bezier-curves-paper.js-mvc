export default class ToolbarView {
  constructor() {
    this.toggleHandlesBtn = document.getElementById("toggleHandlesBtn");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
    this.offsetBtn = document.getElementById("addOffsetBtn");
    this.offsetSlider = document.getElementById("offsetSlider");
    this.offsetValue = document.getElementById("offsetValue");
    this.export = document.getElementById("exportBtn");
    this.toggleBackgroundBtn = document.getElementById("toggleBackgroundBtn");
  }

  bindToggleBackground(handler) {
    this.toggleBackgroundBtn.addEventListener("click", handler);
  }

  bindSlider(handler) {
    this.offsetSlider.addEventListener("input", handler);
  }

  bindOffset(handler) {
    this.offsetBtn.addEventListener("click", handler);
  }

  bindToggleHandles(handler) {
    this.toggleHandlesBtn.addEventListener("click", handler);
  }

  bindAddCurve(handler) {
    this.addCurveBtn.addEventListener("click", handler);
  }

  bindCurveSelect(handler) {
    this.curveSelect.addEventListener("change", (e) => {
      handler(parseInt(e.target.value));
    });
  }

  bindDeletePoint(handler) {
    this.deletePointBtn.addEventListener("click", handler);
    //console.log("clic delete");
  }

  bindDeleteCurve(handler) {
    this.deleteBtn.addEventListener("click", handler);
  }

  updateCurveList(curveNames) {
    this.curveSelect.innerHTML = "";

    // Add new options

    curveNames.forEach((curve, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = curve.name;
      this.curveSelect.appendChild(option);
    });
  }

  updateOffsetValue(offsetValue) {
    // this.curveSelect.innerHTML = "";
    this.offsetSlider.value = offsetValue;
    this.offsetValue.value = offsetValue;
    this.offsetValue.innerText = offsetValue;
    // Add new options
  }

  setSelectedCurve(index) {
    this.curveSelect.value = index;
  }

  bindExport(handler) {
    this.export.addEventListener("click", handler);
  }
}
