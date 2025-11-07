"use strict";

export default class ToolController {
  constructor(model, toolbarView, canvasView, drawController) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.drawController = drawController;

    // Créer une première courbe
    this.model.createNewCurve();

    // Mise à jour de l'interface initiale
    this.toolbarView.updateCurveList(this.model.curves);
    this.toolbarView.updateBackgroundCbx(this.model.backgroundVisible);
    this.toolbarView.updateHandlesViewCbx(this.drawController.handlesVisible);
    this.toolbarView.updateOffsetViewCbx(this.model.offsetVisible);

    // Lier tous les événements de la toolbar
    this._bindEvents();
  }

  /**
   * Lier tous les événements de la toolbar
   */
  _bindEvents() {
    // --- Slider pour l'offset ---
    this.toolbarView.bindSlider((e) => {
      const value = parseFloat(e.target.value);
      this.toolbarView.offsetValue.textContent = value;

      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // Mettre à jour l'offset de la courbe
      if (curve.offsetData) curve.offsetData.offset = value;

      // Recalculer les offsets pour toutes les courbes
      const pointsArray = this.model.getPointsFromCurves();
      pointsArray.forEach((points, index) => {
        this.model.computeOffsetFromPoints(this.model.curves[index], points);
      });

      // Re-render la courbe
      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.model.offsetVisible
      );
    });

    // --- Ajouter une nouvelle courbe ---
    this.toolbarView.bindAddCurve(() => {
      this.model.createNewCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);
    });

    // --- Supprimer la courbe courante ---
    this.toolbarView.bindDeleteCurve(() => {
      this.model.deleteCurrentCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.canvasView.renderCurves(this.model.curves);
    });

    // --- Exporter le canvas en PNG ---
    this.toolbarView.bindExport(() => {
      this.canvasView.exportAsImage("mon_dessin.png");
    });

    // --- Sélection d'une courbe dans la liste ---
    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      const curve = this.model.curves[index];
      if (curve.offsetData) {
        this.toolbarView.updateOffsetValue(curve.offsetData.offset);
      }
    });

    // --- Toggle affichage des poignées ---
    this.toolbarView.bindToggleHandles(() => {
      this.drawController.handlesVisible = !this.drawController.handlesVisible;
      this.canvasView.renderCurves(
        this.model.curves,
        this.drawController.handlesVisible,
        this.model.offsetVisible
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
        this.model.offsetVisible
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
            this.model.offsetVisible
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
      this.model.backgroundVisible = !this.model.backgroundVisible;
      this.canvasView.setBackground(this.model.backgroundVisible);
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
    this.model.offsetVisible = !this.model.offsetVisible;
    this.canvasView.renderCurves(
      this.model.curves,
      this.drawController.handlesVisible,
      this.model.offsetVisible
    );
  }
}
