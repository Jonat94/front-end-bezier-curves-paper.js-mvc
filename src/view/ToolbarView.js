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
  bindDynamicOffsetControls(handlerSlider, handlerCheckbox, handlerRemove) {
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

    container.addEventListener("click", (e) => {
      if (
        e.target.matches("button") &&
        e.target.id.startsWith("removeOffsetBtn")
      ) {
        const index = parseInt(e.target.id.replace("removeOffsetBtn", ""), 10);
        handlerRemove(index);
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

  addOffsetControls(curv) {
    let index = this.offsetElements.length + 1;
    // Conteneur des contrôles d’offset (à définir dans ton HTML)
    const container = document.getElementById("offsetControlsContainer");
    if (!container) {
      return;
    }

    // Empêche la duplication d’un offset déjà existant
    if (document.getElementById(`offsetSlider${index}`)) {
      return;
    }

    // Création d’un wrapper pour l’ensemble des contrôles
    const wrapper = document.createElement("div");
    wrapper.classList.add("slider-group");
    wrapper.innerHTML = `
 <button id="removeOffsetBtn${index}" class="remove-button" title="Supprimer l'offset ${index}">X</button>
                    <input type="checkbox" id="toggleOffset${index}Cbx">
                    <label for="offsetSlider">Offset&nbsp;${index}</label>
                    <input type="range" id="offsetSlider${index}" min="00" max="200" step="1">
                    <span id="offsetValue${index}">0</span>
  `;

    // Ajoute les éléments au conteneur
    container.appendChild(wrapper);

    // Stocke les références dans la structure interne
    const newOffset = {
      slider: document.getElementById(`offsetSlider${index}`),
      valueDisplay: document.getElementById(`offsetValue${index}`),
      checkbox: document.getElementById(`toggleOffset${index}Cbx`),
      remove: document.getElementById(`removeOffsetBtn${index}`),
    };

    this.offsetElements[index - 1] = newOffset;
  }

  removeOffsetControls(index) {
    // Récupérer les références de l'offset à supprimer
    const offset = this.offsetElements[index - 1];
    if (!offset) return;

    // Supprimer le wrapper (div.parentElement du slider)
    const wrapper = offset.slider?.closest(".slider-group");
    if (wrapper) wrapper.remove();

    // Supprimer l'élément du tableau et décaler les suivants
    this.offsetElements.splice(index - 1, 1);

    // Réindexer les IDs dans le DOM pour garder la cohérence
    this.offsetElements.forEach((el, i) => {
      if (!el) return;

      // Met à jour les IDs DOM
      el.slider.id = `offsetSlider${i + 1}`;
      el.valueDisplay.id = `offsetValue${i + 1}`;
      el.checkbox.id = `toggleOffset${i + 1}Cbx`;
      el.remove.id = `removeOffsetBtn${i + 1}`;

      // Met aussi à jour les labels visibles, pour afficher "Offset X"
      const label = el.slider?.closest(".slider-group")?.querySelector("label");
      if (label) label.innerHTML = `Offset&nbsp;${i + 1}`;
    });
  }

  renderOffsetsControls(curve) {
    this.clearOffsetsControls();

    const container = document.getElementById("offsetControlsContainer");
    if (!container) {
      return;
    }

    // Pour chaque offset de la courbe, on recrée un bloc de contrôle d'offsets
    curve.offsetsData.forEach((offsetData, i) => {
      this.addOffsetControls(i + 1);
      // Met à jour la valeur du slider selon le modèle
      this.updateOffsetValue(i + 1, offsetData.offset);
      this.updateOffsetCheckbox(i + 1, offsetData.visible);
    });
  }

  clearOffsetsControls() {
    this.offsetElements = [];
    const container = document.getElementById("offsetControlsContainer");
    if (container) container.innerHTML = "<h2>Offsets</h2>";
  }
}
