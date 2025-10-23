export default class ToolbarView {
  constructor() {
    this.toggleHandlesCbx = document.getElementById("toggleHandlesCbx");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
    this.offsetBtn = document.getElementById("addOffsetBtn");
    this.offsetSlider = document.getElementById("offsetSlider");
    this.offsetValue = document.getElementById("offsetValue");
    this.export = document.getElementById("exportBtn");
    this.toggleBackgroundCbx = document.getElementById("toggleBackgroundCbx");
  }

  bindToggleBackground(handler) {
    this.toggleBackgroundCbx.addEventListener("click", handler);
  }
  updateBackgroundCbx(backgroundVisible) {
    this.toggleBackgroundCbx.checked = backgroundVisible;
  }

  bindSlider(handler) {
    this.offsetSlider.addEventListener("input", handler);
  }

  bindOffset(handler) {
    this.offsetBtn.addEventListener("click", handler);
  }

  bindToggleHandles(handler) {
    this.toggleHandlesCbx.addEventListener("click", handler);
  }

  updateHandlesViewCbx(handlesVisible) {
    this.toggleHandlesCbx.checked = handlesVisible;
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
