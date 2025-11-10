"use strict";

export default class ToolController {
  /**
   * Contrôleur principal pour gérer l'interface de dessin des courbes.
   * @param {Object} model - Le modèle contenant les données des courbes.
   * @param {Object} toolbarView - La vue de la barre d'outils.
   * @param {Object} canvasView - La vue du canevas.
   * @param {Object} drawController - Contrôleur de dessin pour gérer les offsets et handles.
   */
  constructor(model, toolbarView, canvasView, drawController) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.drawController = drawController;

    // Initialiser la visibilité des offsets pour chaque courbe
    this.drawController.offsetsVisibleByCurve = {};

    // Mettre à jour les sliders pour la courbe courante
    this._updateSlidersAndCheckboxes();

    // Mettre à jour la liste des courbes dans la barre d'outils
    this.toolbarView.updateCurveList(this.model.curves);

    this.drawController.handlesVisible = true;
    this.toolbarView.updateHandlesToggle(true);

    // Lier tous les événements UI
    this._bindUIEvents();
  }

  // ---------------------------
  // ---- Gestion sliders et checkboxes ----
  // ---------------------------

  /**
   * Met à jour les sliders et les checkboxes de visibilité pour la courbe courante.
   * Les sliders sont mappés sur offsetsData : slider1 → offsetsData[2], slider2 → offsetsData[1], slider3 → offsetsData[0]
   */
  _updateSlidersAndCheckboxes() {
    const currentCurve = this.model.curves[this.model.currentCurveIndex];
    if (!currentCurve) return;

    currentCurve.offsetsData.forEach((offsetData, index) => {
      this.toolbarView.updateOffsetValue(
        index + 1,
        currentCurve.offsetsData[index].offset
      );
      // console.log("Updating checkbox", index + 1, offsetData.visible);
      this.toolbarView.updateOffsetCheckbox(index + 1, offsetData.visible);
      // this.toolbarView.updateOffsetValue(3, currentCurve.offsetsData[2].offset);
      // this.toolbarView.updateOffsetValue(2, currentCurve.offsetsData[1].offset);
      // this.toolbarView.updateOffsetValue(1, currentCurve.offsetsData[0].offset);
    });
    // const offsetsVisible = this.drawController.offsetsVisibleByCurve[
    //   this.model.currentCurveIndex
    // ] || [true, true, true];

    // offsetsVisible.forEach((visible, index) => {
    //   this.toolbarView.updateOffsetCheckbox(index + 1, visible);
    // });
  }

  /**
   * Gère le changement d'un slider d'offset.
   * @param {number} offsetNumber - Numéro du slider (1 à 3)
   * @param {number} value - Nouvelle valeur de l'offset
   */
  _onOffsetSliderChange(offsetNumber, value) {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    // Met à jour le modèle
    curve.offsetsData[offsetNumber - 1].offset = value;

    // Met à jour l'UI du slider
    this.toolbarView.updateOffsetValue(offsetNumber, value);

    // Recalcul et rendu
    this.model.computeAllOffsets();
    this._render();
  }

  /**
   * Gère l'activation/désactivation de la visibilité d'un offset.
   * @param {number} offsetNumber - Numéro de l'offset (1 à 3)
   */
  _onOffsetToggle(offsetNumber) {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    // offsetNumber 1 → offsetsData[0], 2 → offsetsData[1], 3 → offsetsData[2] (selon ton mapping)
    const offset = curve.offsetsData[offsetNumber - 1];
    if (!offset) return;

    offset.visible = !offset.visible;

    this._render();
  }

  _onRemoveOffset(index) {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;
    curve.offsetsData.splice(index - 1, 1);
    this.toolbarView.removeOffsetControls(index);
    this._render();
  }

  _updateOffsetCheckboxesFromModel() {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    curve.offsetsData.forEach((offset, index) => {
      // index+1 car tes checkboxes vont de 1 à 3
      const isChecked = offset.visible ? true : false;
      this.toolbarView.updateOffsetCheckbox(index + 1, isChecked);
    });
  }

  // ---------------------------
  // ---- Gestion courbes ----
  // ---------------------------

  /**
   * Ajoute une nouvelle courbe avec un nom fourni ou par défaut.
   */
  _addNewCurve() {
    const nameInput = document.getElementById("curveName");
    let curveName = nameInput?.value?.trim();
    if (curveName === "") {
      curveName = undefined; // laisse le modèle générer le nom
    }
    this.model.createCurve(curveName);

    const lastIndex = this.model.currentCurveIndex;

    this.toolbarView.clearOffsetsControls();

    this.toolbarView.updateCurveList(this.model.curves);
    this.toolbarView.updateSelectedCurve(lastIndex);

    // const currentCurve = this.model.curves[lastIndex];
    // currentCurve.offsetsData.forEach((offsetData, i) => {
    //   this.toolbarView.addOffsetControls(i + 1);
    //   this.toolbarView.updateOffsetValue(i + 1, offsetData.offset);
    //   this.toolbarView.updateOffsetCheckbox(i + 1, offsetData.visible);
    // });

    //this._updateSlidersAndCheckboxes();
    this.drawController.handlesVisible = true;
    this.toolbarView.updateHandlesToggle(true);
    //this.toolbarView.renderOffsetsControls(this.model.curves[lastIndex]);

    this._render();

    if (nameInput) nameInput.value = "";
  }

  /**
   * Supprime la courbe actuellement sélectionnée.
   * Ajuste l'index courant si nécessaire et met à jour l'UI.
   */
  _deleteCurrentCurve() {
    this.model.deleteCurrentCurve();
    this.toolbarView.clearOffsetsControls();
    this.toolbarView.updateCurveList(this.model.curves);
    if (this.model.curves.length > 0) {
      if (this.model.currentCurveIndex >= this.model.curves.length) {
        this.model.currentCurveIndex = this.model.curves.length - 1;
      }
      this.toolbarView.updateSelectedCurve(this.model.currentCurveIndex);
      this._updateSlidersAndCheckboxes();
    }
    this._render();
  }

  /**
   * Sélectionne une courbe à partir de son index et met à jour l'UI.
   * @param {number} index - Index de la courbe à sélectionner
   */
  _selectCurve(index) {
    this.model.currentCurveIndex = index;
    this._updateSlidersAndCheckboxes();
    this.toolbarView.renderOffsetsControls(this.model.curves[index]);
    this._render();
  }

  // ---------------------------
  // ---- Gestion boutons et UI ----
  // ---------------------------

  /**
   * Lie tous les événements UI (sliders, checkboxes, boutons principaux, import/export).
   */
  _bindUIEvents() {
    //this._bindOffsetSliders();
    //this._bindOffsetCheckboxes();
    this._bindCurveManagementButtons();
    this._bindMiscButtons();
    this._bindImportEvents();

    // Event delegation pour sliders et checkboxes d'offset dynamiques
    this.toolbarView.bindDynamicOffsetControls(
      (index, value) => this._onOffsetSliderChange(index, value),
      (index) => this._onOffsetToggle(index),
      (index) => this._onRemoveOffset(index)
    );
  }

  /**
   * Lie les sliders aux fonctions de changement d'offset.
   */
  // _bindOffsetSliders() {
  //   for (let i = 1; i <= 3; i++) {
  //     this.toolbarView.bindOffsetSlider(i, (e) =>
  //       this._onOffsetSliderChange(i, parseFloat(e.target.value))
  //     );
  //   }
  // }

  /**
   * Lie les checkboxes aux fonctions de toggle de visibilité des offsets.
   */
  // _bindOffsetCheckboxes() {
  //   for (let i = 1; i <= 3; i++) {
  //     this.toolbarView.bindOffsetCheckbox(i, () => this._onOffsetToggle(i));
  //   }
  // }

  /**
   * Lie les boutons pour ajouter, supprimer et sélectionner des courbes.
   */
  _bindCurveManagementButtons() {
    this.toolbarView.bindAddCurve(() => this._addNewCurve());
    this.toolbarView.bindDeleteCurve(() => this._deleteCurrentCurve());
    this.toolbarView.bindCurveSelect((index) => this._selectCurve(index));
  }

  /**
   * Lie les autres boutons (handles, background, suppression de point, export, save, import trigger).
   */
  _bindMiscButtons() {
    this.toolbarView.bindHandlesToggle(() => {
      this.drawController.handlesVisible = !this.drawController.handlesVisible;
      this._render();
    });

    this.toolbarView.bindToggleBackground(() => {
      this.drawController.backgroundVisible =
        !this.drawController.backgroundVisible;
      this.canvasView.setBackgroundVisibility(
        this.drawController.backgroundVisible
      );
    });

    this.toolbarView.bindDeletePoint(() => {
      if (this.drawController.selectedItem) {
        const id = this.drawController.selectedItem.data.id;
        this.model.deleteHandleById(id);
        this.drawController.selectedItem = null;
        this._render();
      }
    });

    this.toolbarView.bindExport(() =>
      this.canvasView.exportAsImage("mon_dessin.png")
    );

    this.toolbarView.bindSave(() => this.model.exportCurrentCurve());

    this.toolbarView.bindImportButton(() => {
      this.toolbarView.elements.importFile?.click();
    });

    this.toolbarView.bindAddOffsetBtn(() => {
      this.model.addOffsetToCurrentCurve();
      this.toolbarView.addOffsetControls();

      this._updateSlidersAndCheckboxes();
      this._render();
    });
  }

  /**
   * Lie l'importation de fichier JSON pour charger une courbe.
   */
  _bindImportEvents() {
    this.toolbarView.bindImportFile((event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => this._importCurveFromJSON(e.target.result);
      reader.readAsText(file);
    });
  }

  /**
   * Importe une courbe depuis un JSON et met à jour l'UI et la visibilité des offsets.
   * @param {string} jsonText - Contenu JSON de la courbe à importer
   */
  _importCurveFromJSON(jsonText) {
    try {
      this.model.importCurve(jsonText);

      const lastIndex = this.model.curves.length - 1;
      this.model.currentCurveIndex = lastIndex;

      if (!this.drawController.offsetsVisibleByCurve[lastIndex]) {
        this.drawController.offsetsVisibleByCurve[lastIndex] = [
          true,
          true,
          true,
        ];
      }

      this.drawController.handlesVisible = false;
      this.toolbarView.updateHandlesToggle(false);
      ///////////////////
      //Tod do check bug
      //this.toolbarView.updateOffsetCheckbox(index, visible);

      this.model.computeAllOffsets();
      this._updateSlidersAndCheckboxes();
      this._updateOffsetCheckboxesFromModel();

      this._render();

      this.toolbarView.updateCurveList(this.model.curves);
      this.toolbarView.updateSelectedCurve(lastIndex);
      this.toolbarView.renderOffsetsControls(this.model.curves[lastIndex]);
    } catch (err) {
      console.error("Erreur lors de l'import JSON :", err);
      alert("Le fichier importé est invalide !");
    }
  }

  // ---------------------------
  // ---- Rendu général ----
  // ---------------------------

  /**
   * Rend toutes les courbes sur le canvas avec les options actuelles (handles, offsets, sélection).
   */
  _render() {
    this.canvasView.renderCurves(
      this.model.curves,
      this.drawController.handlesVisible,
      true, // showOffsets
      this.drawController.selectedItem,
      this.model.currentCurveIndex,
      "rgba(0,150,255,0.2)",
      this.drawController.offsetsVisibleByCurve
    );
  }
}
