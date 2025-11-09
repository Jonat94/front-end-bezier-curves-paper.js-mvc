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
    this.offsetElements = [];
    // Gestion dynamique des sliders et checkboxes pour les offsets
    // this.offsetElements = [1, 2, 3].map((i) => ({
    //   slider: document.getElementById(`offsetSlider${i}`),
    //   valueDisplay: document.getElementById(`offsetValue${i}`),
    //   checkbox: document.getElementById(`toggleOffset${i}Cbx`),
    // }));
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
  // 🧠 Event Delegation pour les offsets dynamiques
  // ---------------------------

  /**
   * Lie un seul écouteur au conteneur pour gérer sliders et checkboxes d'offset
   * Les nouveaux éléments ajoutés seront automatiquement pris en compte
   */
  bindDynamicOffsetControls(handlerSlider, handlerCheckbox) {
    const container = document.getElementById("offsetControlsContainer");
    if (!container) return;

    // Slider
    container.addEventListener("input", (e) => {
      if (e.target.matches("input[type='range']")) {
        const index = parseInt(e.target.id.replace("offsetSlider", ""), 10);
        const value = parseFloat(e.target.value);
        handlerSlider(index, value);
      }
    });

    // Checkbox
    container.addEventListener("click", (e) => {
      if (
        e.target.matches("input[type='checkbox']") &&
        e.target.id.startsWith("toggleOffset")
      ) {
        const index = parseInt(
          e.target.id.replace("toggleOffset", "").replace("Cbx", ""),
          10
        );
        const checked = e.target.checked;
        handlerCheckbox(index, checked);
      }
    });
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
  addOffsetControls(index) {
    // Conteneur des contrôles d’offset (à définir dans ton HTML)
    const container = document.getElementById("offsetControlsContainer");
    if (!container) {
      console.warn("⚠️ Conteneur des contrôles d'offset introuvable.");
      return;
    }

    // Empêche la duplication d’un offset déjà existant
    if (document.getElementById(`offsetSlider${index}`)) {
      console.warn(`⚠️ Les contrôles pour l’offset ${index} existent déjà.`);
      return;
    }

    // Création d’un wrapper pour l’ensemble des contrôles
    const wrapper = document.createElement("div");
    wrapper.classList.add("offset-control");
    wrapper.innerHTML = `
    <label>
      <input type="checkbox" id="toggleOffset${index}Cbx" checked />
      Offset ${index}
    </label>
    <input type="range" id="offsetSlider${index}" min="0" max="200" value="0" step="1" />
    <span id="offsetValue${index}">0</span>
  `;

    // Ajoute les éléments au conteneur
    container.appendChild(wrapper);

    // Stocke les références dans la structure interne
    const newOffset = {
      slider: document.getElementById(`offsetSlider${index}`),
      valueDisplay: document.getElementById(`offsetValue${index}`),
      checkbox: document.getElementById(`toggleOffset${index}Cbx`),
    };

    this.offsetElements[index - 1] = newOffset;

    console.info(`✅ Contrôles pour l’offset ${index} ajoutés.`);
  }
}
