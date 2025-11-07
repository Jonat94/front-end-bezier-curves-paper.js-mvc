export default class ToolbarView {
  constructor() {
    this.toggleHandlesCbx = document.getElementById("toggleHandlesCbx");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
    this.addOffsetCbxBtn = document.getElementById("offsetCbx");
    this.offsetSlider = document.getElementById("offsetSlider");
    this.offsetValue = document.getElementById("offsetValue");
    this.export = document.getElementById("exportBtn");
    this.toggleBackgroundCbx = document.getElementById("toggleBackgroundCbx");
    this.save = document.getElementById("saveBtn");
    this.importInput = document.getElementById("importFile");
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
    this.addOffsetCbxBtn.addEventListener("click", handler);
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
    this.offsetSlider.value = offsetValue;
    this.offsetValue.value = offsetValue;
    this.offsetValue.innerText = offsetValue;
  }
  updateOffsetViewCbx(visible) {
    this.addOffsetCbxBtn.checked = visible;
  }

  setSelectedCurve(index) {
    this.curveSelect.value = index;
  }

  bindExport(handler) {
    this.export.addEventListener("click", handler);
  }
  bindSave(handler) {
    this.save.addEventListener("click", handler);
  }
  bindImport(handler) {
    this.importInput.addEventListener("change", handler);
  }
}
