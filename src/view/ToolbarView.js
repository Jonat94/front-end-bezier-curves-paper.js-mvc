"use strict";

/**
 * Classe gérant la barre d'outils pour l'édition des courbes.
 * Elle lie les éléments HTML aux callbacks et fournit des méthodes de mise à jour.
 */
export default class ToolbarView {
  constructor() {
    // ⚡ Vérification existence des éléments DOM
    this.toggleHandlesCbx = document.getElementById("toggleHandlesCbx") || null;
    this.deletePointBtn = document.getElementById("deletePointBtn") || null;
    this.deleteBtn = document.getElementById("deleteBtn") || null;
    this.addCurveBtn = document.getElementById("addCurveBtn") || null;
    this.curveSelect = document.getElementById("curveSelect") || null;
    this.addOffsetCbxBtn = document.getElementById("offsetCbx") || null;

    this.offsetSlider1 = document.getElementById("offsetSlider1") || null;
    this.offsetValue1 = document.getElementById("offsetValue1") || null;
    this.toggleOffset1Cbx = document.getElementById("toggleOffset1Cbx") || null;

    this.offsetSlider2 = document.getElementById("offsetSlider2") || null;
    this.offsetValue2 = document.getElementById("offsetValue2") || null;
    this.toggleOffset2Cbx = document.getElementById("toggleOffset2Cbx") || null;

    this.offsetSlider3 = document.getElementById("offsetSlider3") || null;
    this.offsetValue3 = document.getElementById("offsetValue3") || null;
    this.toggleOffset3Cbx = document.getElementById("toggleOffset3Cbx") || null;

    this.export = document.getElementById("exportBtn") || null;
    this.toggleBackgroundCbx =
      document.getElementById("toggleBackgroundCbx") || null;
    this.save = document.getElementById("saveBtn") || null;
    this.importBtn = document.getElementById("importBtn") || null;
    this.importFile = document.getElementById("importFile") || null;
  }

  // ---------------------------
  // --- Méthodes de binding ---
  // ---------------------------

  bindToggleBackground(handler) {
    if (this.toggleBackgroundCbx)
      this.toggleBackgroundCbx.addEventListener("click", handler);
  }

  bindSlider1(handler) {
    if (this.offsetSlider1)
      this.offsetSlider1.addEventListener("input", handler);
  }

  bindSlider2(handler) {
    if (this.offsetSlider2)
      this.offsetSlider2.addEventListener("input", handler);
  }

  bindSlider3(handler) {
    if (this.offsetSlider3)
      this.offsetSlider3.addEventListener("input", handler);
  }

  bindToggleOffset1Cbx(handler) {
    if (this.toggleOffset1Cbx)
      this.toggleOffset1Cbx.addEventListener("click", handler);
  }

  bindToggleOffset2Cbx(handler) {
    if (this.toggleOffset2Cbx)
      this.toggleOffset2Cbx.addEventListener("click", handler);
  }

  bindToggleOffset3Cbx(handler) {
    if (this.toggleOffset3Cbx)
      this.toggleOffset3Cbx.addEventListener("click", handler);
  }

  bindOffset(handler) {
    if (this.addOffsetCbxBtn)
      this.addOffsetCbxBtn.addEventListener("click", handler);
  }

  bindToggleHandles(handler) {
    if (this.toggleHandlesCbx)
      this.toggleHandlesCbx.addEventListener("click", handler);
  }

  bindAddCurve(handler) {
    if (this.addCurveBtn) this.addCurveBtn.addEventListener("click", handler);
  }

  bindCurveSelect(handler) {
    if (this.curveSelect) {
      this.curveSelect.addEventListener("change", (e) => {
        handler(parseInt(e.target.value));
      });
    }
  }

  bindDeletePoint(handler) {
    if (this.deletePointBtn)
      this.deletePointBtn.addEventListener("click", handler);
  }

  bindDeleteCurve(handler) {
    if (this.deleteBtn) this.deleteBtn.addEventListener("click", handler);
  }

  bindExport(handler) {
    if (this.export) this.export.addEventListener("click", handler);
  }

  bindSave(handler) {
    if (this.save) this.save.addEventListener("click", handler);
  }

  bindImportButton(handler) {
    this.importBtn.addEventListener("click", handler);
  }

  bindImport(handler) {
    console.log("bindImport", handler);
    if (this.importFile) this.importFile.addEventListener("change", handler);
  }

  // ---------------------------
  // --- Méthodes de mise à jour ---
  // ---------------------------

  updateBackgroundCbx(backgroundVisible) {
    if (this.toggleBackgroundCbx)
      this.toggleBackgroundCbx.checked = backgroundVisible;
  }

  updateHandlesViewCbx(handlesVisible) {
    if (this.toggleHandlesCbx) this.toggleHandlesCbx.checked = handlesVisible;
  }

  updateCurveList(curveNames) {
    if (!this.curveSelect) return;
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
    if (!slider || !display) return;
    slider.value = value;
    display.textContent = value;
  }

  updateOffsetViewCbx(index, visible) {
    const cbx = this[`toggleOffset${index}Cbx`];
    if (!cbx) return;
    cbx.checked = visible;
  }

  updateOffsetViewCbxGlobal(visible) {
    if (this.addOffsetCbxBtn) this.addOffsetCbxBtn.checked = visible;
  }

  setSelectedCurve(index) {
    if (this.curveSelect) this.curveSelect.value = index;
  }
}
