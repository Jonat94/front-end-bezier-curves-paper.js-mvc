export default class ToolbarView {
  constructor() {
    this.clearBtn = document.getElementById("clearBtn");
    this.toggleHandlesBtn = document.getElementById("toggleHandlesBtn");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
  }

  bindToggleHandles(handler) {
    this.toggleHandlesBtn.addEventListener("click", handler);
  }

  bindAddCurve(handler) {
    this.addCurveBtn.addEventListener("click", handler);
  }

  bindCurveSelect(handler) {
    this.curveSelect.addEventListener("change", (e) => {
      console.log("Curve selected:", e.target.value);
      handler(parseInt(e.target.value));
    });
  }

  bindDeletePoint(handler) {
    this.deletePointBtn.addEventListener("click", handler);
    console.log("clic delete");
  }

  bindDeleteCurve(handler) {
    this.deleteBtn.addEventListener("click", handler);
  }

  updateCurveList(curveNames) {
    // Clear existing options
    this.curveSelect.innerHTML = "";

    // Add new options
    console.log("Updating curve list:", curveNames);
    curveNames.forEach((curve, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = curve.name;
      this.curveSelect.appendChild(option);
      console.log("");
    });
  }

  setSelectedCurve(index) {
    this.curveSelect.value = index;
  }

  // bindToolChange(handler) {
  //   this.toolButtons.forEach((btn) => {
  //     btn.addEventListener("click", () => {
  //       this.toolButtons.forEach((b) => b.classList.remove("active"));
  //       btn.classList.add("active");
  //       handler(btn.dataset.tool);
  //     });
  //   });
  // }

  // bindColorChange(handler) {
  //   this.colorPicker.addEventListener("input", (e) => handler(e.target.value));
  // }

  // bindClear(handler) {
  //   this.clearBtn.addEventListener("click", handler);
  // }

  // bindDelete(handler) {
  //   this.deleteBtn.addEventListener("click", handler);
  // }
}
