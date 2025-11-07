"use strict";

export default class ToolController {
  constructor(model, toolbarView, canvasView, drawController) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.drawController = drawController;

    // Créer une première courbe
    this.model.createNewCurve();
    this._updateOffsetUI(this.model.curves[0]);
    // Mise à jour de l'interface initiale
    this.toolbarView.updateCurveList(this.model.curves);
    // Initialiser les sliders selon les valeurs de la courbe actuelle
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (curve && curve.offsetsData) {
      this.toolbarView.updateOffsetValue(1, curve.offsetsData[2].offset);
      this.toolbarView.updateOffsetValue(2, curve.offsetsData[1].offset);
      this.toolbarView.updateOffsetValue(3, curve.offsetsData[0].offset);
    }

    this.toolbarView.updateBackgroundCbx(this.drawController.backgroundVisible);
    this.toolbarView.updateHandlesViewCbx(this.drawController.handlesVisible);
    this.toolbarView.updateOffsetViewCbx(this.drawController.offsetVisible);

    // Lier tous les événements de la toolbar
    this._bindEvents();
  }

  _updateOffsetUI(curve) {
    if (!curve || !curve.offsetsData) return;

    this.toolbarView.updateOffsetValue(1, curve.offsetsData[2].offset);
    this.toolbarView.updateOffsetValue(2, curve.offsetsData[1].offset);
    this.toolbarView.updateOffsetValue(3, curve.offsetsData[0].offset);
  }

  /**
   * Lier tous les événements de la toolbar
   */
  _bindEvents() {
    // --- Slider pour l'offset ---
    this.toolbarView.bindSlider1((e) => {
      const value = parseFloat(e.target.value);
      this.toolbarView.offsetValue1.textContent = value;

      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // Mettre à jour l'offset de la courbe
      if (curve.offsetsData) {
        curve.offsetsData[2].offset = value;
      }
      //console.log("kkkkkk", curve);

      this.model.computeOffset();

      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    this.toolbarView.bindSlider2((e) => {
      const value = parseFloat(e.target.value);
      this.toolbarView.offsetValue2.textContent = value;

      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;
      //console.log(curve.offsetData);
      // Mettre à jour l'offset de la courbe
      if (curve.offsetsData) {
        curve.offsetsData[1].offset = value;
      }
      //console.log("kkkkkk", curve);

      this.model.computeOffset();

      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    this.toolbarView.bindSlider3((e) => {
      const value = parseFloat(e.target.value);
      this.toolbarView.offsetValue3.textContent = value;

      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;
      //console.log("aaa", curve.offsetData);
      // Mettre à jour l'offset de la courbe
      if (curve.offsetsData) {
        curve.offsetsData[0].offset = value;
      }
      //console.log("kkkkkk", curve);

      this.model.computeOffset();

      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    // --- Ajouter une nouvelle courbe ---
    this.toolbarView.bindAddCurve(() => {
      this.model.createNewCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);

      const curve = this.model.curves[this.model.currentCurveIndex];
      this._updateOffsetUI(curve);
    });

    // --- Supprimer la courbe courante ---
    this.toolbarView.bindDeleteCurve(() => {
      this.model.deleteCurrentCurve();

      // Mettre à jour la liste des courbes
      this.toolbarView.updateCurveList(this.model.curves);

      // Sélectionner la courbe courante après suppression
      if (this.model.curves.length > 0) {
        // Assure que l'index reste valide
        if (this.model.currentCurveIndex >= this.model.curves.length) {
          this.model.currentCurveIndex = this.model.curves.length - 1;
        }

        this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);

        // Actualiser les sliders pour la nouvelle courbe sélectionnée
        const curve = this.model.curves[this.model.currentCurveIndex];
        this._updateOffsetUI(curve);
      }

      // Re-render du canvas
      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    // --- Exporter le canvas en PNG ---
    this.toolbarView.bindExport(() => {
      this.canvasView.exportAsImage("mon_dessin.png");
    });

    // --- Sélection d'une courbe dans la liste ---
    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      const curve = this.model.curves[index];
      this._updateOffsetUI(curve);
    });

    // --- Toggle affichage des poignées ---
    this.toolbarView.bindToggleHandles(() => {
      this.drawController.handlesVisible = !this.drawController.handlesVisible;
      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    // --- Supprimer un point sélectionné ---
    this.toolbarView.bindDeletePoint(() => {
      if (this.drawController.selectedItem) {
        const id = this.drawController.selectedItem.data.id;
        this.model.deletePoint(id);
        this.drawController.selectedItem = null;
      }
      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.drawController.offsetVisible
      );
    });

    // --- Sauvegarder la courbe actuelle ---
    this.toolbarView.bindSave(() => {
      this.model.exportCurve();
    });

    // --- Importer une courbe depuis un fichier JSON ---
    this.toolbarView.bindImport((event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        try {
          this.model.importCurve(content);
          this.model.computeOffset();
          this.canvasView.renderCurves(
            this.model.curves,
            this.drawController.handlesVisible,
            this.drawController.offsetVisible
          );
          this.toolbarView.updateCurveList(this.model.curves);
          this.model.currentCurveIndex = 0;
        } catch (err) {
          console.error("Erreur JSON :", err);
        }
      };
      reader.readAsText(file);
    });

    // --- Toggle affichage du fond ---
    this.toolbarView.bindToggleBackground(() => {
      this.drawController.backgroundVisible =
        !this.drawController.backgroundVisible;
      this.canvasView.setBackground(this.drawController.backgroundVisible);
    });

    // --- Toggle affichage des offsets ---
    this.toolbarView.bindOffset(() => {
      this.renderOffset();
    });
  }

  /**
   * Toggle affichage des offsets et re-render
   */
  renderOffset() {
    this.drawController.offsetVisible = !this.drawController.offsetVisible;
    this.canvasView.renderCurves(
      this.model.curves,
      this.drawController.handlesVisible,
      this.drawController.offsetVisible
    );
  }
}
