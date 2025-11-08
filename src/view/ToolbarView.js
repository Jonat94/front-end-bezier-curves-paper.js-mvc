"use strict";

/**
 * Classe gérant la barre d'outils pour l'édition des courbes.
 * Elle lie les éléments HTML aux callbacks et fournit des méthodes de mise à jour.
 */
export default class ToolbarView {
  constructor() {
    // Références vers les éléments DOM
    this.toggleHandlesCbx = document.getElementById("toggleHandlesCbx");
    this.deletePointBtn = document.getElementById("deletePointBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.addCurveBtn = document.getElementById("addCurveBtn");
    this.curveSelect = document.getElementById("curveSelect");
    this.addOffsetCbxBtn = document.getElementById("offsetCbx");

    this.offsetSlider1 = document.getElementById("offsetSlider1");
    this.offsetValue1 = document.getElementById("offsetValue1");
    this.toggleOffset1Cbx = document.getElementById("toggleOffset1Cbx");

    this.offsetSlider2 = document.getElementById("offsetSlider2");
    this.offsetValue2 = document.getElementById("offsetValue2");
    this.offsetSlider3 = document.getElementById("offsetSlider3");
    this.offsetValue3 = document.getElementById("offsetValue3");

    this.export = document.getElementById("exportBtn");
    this.toggleBackgroundCbx = document.getElementById("toggleBackgroundCbx");
    this.save = document.getElementById("saveBtn");
    this.importInput = document.getElementById("importFile");
  }

  // ---------------------------
  // --- Méthodes de binding ---
  // ---------------------------

  bindToggleBackground(handler) {
    this.toggleBackgroundCbx.addEventListener("click", handler);
  }

  bindSlider1(handler) {
    this.offsetSlider1.addEventListener("input", handler);
  }
  bindSlider2(handler) {
    this.offsetSlider2.addEventListener("input", handler);
  }
  bindSlider3(handler) {
    this.offsetSlider3.addEventListener("input", handler);
  }

  bindToggleOffset1Cbx(handler) {
    this.toggleOffset1Cbx.addEventListener("click", handler);
  }

  updateOffset1Cbx(Offset1Visible) {
    console.log("update", Offset1Visible);
    this.toggleOffset1Cbx.checked = Offset1Visible;
  }

  bindOffset(handler) {
    this.addOffsetCbxBtn.addEventListener("click", handler);
  }

  bindToggleHandles(handler) {
    this.toggleHandlesCbx.addEventListener("click", handler);
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

  bindExport(handler) {
    this.export.addEventListener("click", handler);
  }

  bindSave(handler) {
    this.save.addEventListener("click", handler);
  }

  bindImport(handler) {
    this.importInput.addEventListener("change", handler);
  }

  // ---------------------------
  // --- Méthodes de mise à jour ---
  // ---------------------------

  updateBackgroundCbx(backgroundVisible) {
    this.toggleBackgroundCbx.checked = backgroundVisible;
  }

  updateHandlesViewCbx(handlesVisible) {
    this.toggleHandlesCbx.checked = handlesVisible;
  }

  updateCurveList(curveNames) {
    // Vide la liste avant de la remplir
    this.curveSelect.innerHTML = "";
    curveNames.forEach((curve, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = curve.name;
      this.curveSelect.appendChild(option);
    });
  }

  updateOffsetValue(index, value) {
    const slider = this[`offsetSlider${index}`];
    const display = this[`offsetValue${index}`];

    if (!slider || !display) return; // Sécurité

    slider.value = value;
    display.textContent = value;
  }

  updateOffsetViewCbx(visible) {
    this.addOffsetCbxBtn.checked = visible;
  }

  setSelectedCurve(index) {
    this.curveSelect.value = index;
  }
}
