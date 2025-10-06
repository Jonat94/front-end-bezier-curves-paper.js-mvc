export default class ToolbarView {
  constructor() {
    this.clearBtn = document.getElementById("clearBtn");
    this.toggleHandlesBtn = document.getElementById("toggleHandlesBtn");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
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
