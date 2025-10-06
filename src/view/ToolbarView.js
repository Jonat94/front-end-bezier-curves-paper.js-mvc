export default class ToolbarView {
  constructor() {
    this.toolButtons = document.querySelectorAll("#toolbar button[data-tool]");
    this.colorPicker = document.getElementById("colorPicker");
    this.clearBtn = document.getElementById("clearBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
  }

  bindToolChange(handler) {
    this.toolButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.toolButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        handler(btn.dataset.tool);
      });
    });
  }

  bindColorChange(handler) {
    this.colorPicker.addEventListener("input", (e) => handler(e.target.value));
  }

  bindClear(handler) {
    this.clearBtn.addEventListener("click", handler);
  }

  bindDelete(handler) {
    this.deleteBtn.addEventListener("click", handler);
  }
}
