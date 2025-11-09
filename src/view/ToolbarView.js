"use strict";

/**
 * Classe gérant la barre d'outils pour l'édition des courbes.
 * Elle lie les éléments HTML aux callbacks et fournit des méthodes de mise à jour.
 */
export default class ToolbarView {
  constructor() {
    // ---------------------------
    // ⚡ Récupération des éléments DOM
    // ---------------------------
    this.elements = {
      toggleHandles: document.getElementById("toggleHandlesCbx"),
      deletePointBtn: document.getElementById("deletePointBtn"),
      deleteCurveBtn: document.getElementById("deleteBtn"),
      addCurveBtn: document.getElementById("addCurveBtn"),
      curveSelect: document.getElementById("curveSelect"),
      addOffsetCheckbox: document.getElementById("offsetCbx"),
      exportBtn: document.getElementById("exportBtn"),
      toggleBackground: document.getElementById("toggleBackgroundCbx"),
      saveBtn: document.getElementById("saveBtn"),
      importBtn: document.getElementById("importBtn"),
      importFile: document.getElementById("importFile"),
      addOffsetBtn: document.getElementById("addOffsetBtn"),
    };

    // Gestion dynamique des sliders et checkboxes pour les offsets
    this.offsetElements = [1, 2, 3].map((i) => ({
      slider: document.getElementById(`offsetSlider${i}`),
      valueDisplay: document.getElementById(`offsetValue${i}`),
      checkbox: document.getElementById(`toggleOffset${i}Cbx`),
    }));
  }

  // ---------------------------
  // --- Méthodes de binding ---
  // ---------------------------

  /**
   * Ajoute un écouteur pour un élément si celui-ci existe
   */
  _bindEvent(element, event, handler) {
    if (element) element.addEventListener(event, handler);
  }

  bindToggleBackground(handler) {
    this._bindEvent(this.elements.toggleBackground, "click", handler);
  }

  bindHandlesToggle(handler) {
    this._bindEvent(this.elements.toggleHandles, "click", handler);
  }

  bindAddCurve(handler) {
    this._bindEvent(this.elements.addCurveBtn, "click", handler);
  }

  bindCurveSelect(handler) {
    if (!this.elements.curveSelect) return;
    this.elements.curveSelect.addEventListener("change", (e) => {
      handler(parseInt(e.target.value, 10));
    });
  }

  bindDeletePoint(handler) {
    this._bindEvent(this.elements.deletePointBtn, "click", handler);
  }

  bindDeleteCurve(handler) {
    this._bindEvent(this.elements.deleteCurveBtn, "click", handler);
  }

  bindExport(handler) {
    this._bindEvent(this.elements.exportBtn, "click", handler);
  }

  bindSave(handler) {
    this._bindEvent(this.elements.saveBtn, "click", handler);
  }

  bindImportButton(handler) {
    this._bindEvent(this.elements.importBtn, "click", handler);
  }

  bindAddOffsetBtn(handler) {
    this._bindEvent(this.elements.addOffsetBtn, "click", handler);
  }
  bindImportFile(handler) {
    this._bindEvent(this.elements.importFile, "change", handler);
  }

  bindOffsetAdd(handler) {
    this._bindEvent(this.elements.addOffsetCheckbox, "click", handler);
  }

  /**
   * Bind sliders et checkboxes d'offset dynamiquement selon l'index
   */
  bindOffsetSlider(index, handler) {
    const offset = this.offsetElements[index - 1];
    if (offset?.slider) offset.slider.addEventListener("input", handler);
  }

  bindOffsetCheckbox(index, handler) {
    const offset = this.offsetElements[index - 1];
    if (offset?.checkbox) offset.checkbox.addEventListener("click", handler);
  }

  // ---------------------------
  // --- Méthodes de mise à jour ---
  // ---------------------------

  updateBackgroundToggle(isVisible) {
    if (this.elements.toggleBackground)
      this.elements.toggleBackground.checked = isVisible;
  }

  updateHandlesToggle(isVisible) {
    if (this.elements.toggleHandles)
      this.elements.toggleHandles.checked = isVisible;
  }

  updateCurveList(curveNames) {
    const select = this.elements.curveSelect;
    if (!select) return;

    select.innerHTML = "";
    curveNames.forEach((curve, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = curve.name;
      select.appendChild(option);
    });
  }

  updateSelectedCurve(index) {
    if (this.elements.curveSelect) this.elements.curveSelect.value = index;
  }

  updateOffsetValue(index, value) {
    const offset = this.offsetElements[index - 1];
    if (!offset) return;
    if (offset.slider) offset.slider.value = value;
    if (offset.valueDisplay) offset.valueDisplay.textContent = value;
  }

  updateOffsetCheckbox(index, isVisible) {
    const offset = this.offsetElements[index - 1];
    if (offset?.checkbox) offset.checkbox.checked = isVisible;
  }

  updateOffsetGlobalCheckbox(isVisible) {
    if (this.elements.addOffsetCheckbox)
      this.elements.addOffsetCheckbox.checked = isVisible;
  }
}
