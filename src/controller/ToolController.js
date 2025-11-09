"use strict";

export default class ToolController {
  constructor(model, toolbarView, canvasView, drawController) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.drawController = drawController;

    // Créer une première courbe
    //this.model.createNewCurve();

    // Initialiser l'objet de visibilité des offsets par courbe
    this.drawController.offsetsVisibleByCurve = {};
    this._updateSlidersForCurrentCurve();

    // Mettre à jour la liste des courbes
    this.toolbarView.updateCurveList(this.model.curves);

    // Lier tous les événements
    this._bindEvents();
  }

  // ---------------------------
  // ---- Méthodes internes ----
  // ---------------------------

  _updateSlidersForCurrentCurve() {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    // Mettre à jour les sliders
    this.toolbarView.updateOffsetValue(3, curve.offsetsData[2].offset);
    this.toolbarView.updateOffsetValue(2, curve.offsetsData[1].offset);
    this.toolbarView.updateOffsetValue(1, curve.offsetsData[0].offset);

    // Mettre à jour les checkboxes de visibilité
    const offsetsVisible = this.drawController.offsetsVisibleByCurve[
      this.model.currentCurveIndex
    ] || [true, true, true];
    for (let n = 1; n <= 3; n++) {
      this.toolbarView.updateOffsetViewCbx(n, offsetsVisible[n - 1]);
    }
  }

  _bindEvents() {
    // ------------------ Sliders ------------------
    for (let i = 1; i <= 3; i++) {
      const bindSlider = this.toolbarView[`bindSlider${i}`].bind(
        this.toolbarView
      );
      bindSlider((e) => this._onSliderChange(i, parseFloat(e.target.value)));
    }

    // ------------------ Checkboxes offsets ------------------
    for (let i = 1; i <= 3; i++) {
      const bindToggle = this.toolbarView[`bindToggleOffset${i}Cbx`].bind(
        this.toolbarView
      );
      bindToggle(() => this._onToggleOffset(i));
    }

    // ------------------ Autres événements ------------------
    this.toolbarView.bindAddCurve(() => {
      const curveNameInput = document.getElementById("curveName");
      let name = curveNameInput?.value?.trim();
      if (!name) {
        // Si aucun nom saisi, on utilise le nom par défaut
        name = `Courbe ${this.model.curveIdCounter + 1}`;
      }
      this.model.createCurve(name);

      // Mettre à jour l'UI
      this.toolbarView.updateCurveList(this.model.curves);
      this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);
      this._updateSlidersForCurrentCurve();
      this._render();

      // Vider le champ de texte
      if (curveNameInput) curveNameInput.value = "";
    });

    this.toolbarView.bindDeleteCurve(() => {
      this.model.deleteCurrentCurve();
      this.toolbarView.updateCurveList(this.model.curves);

      if (this.model.curves.length > 0) {
        if (this.model.currentCurveIndex >= this.model.curves.length) {
          this.model.currentCurveIndex = this.model.curves.length - 1;
        }
        this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);
        this._updateSlidersForCurrentCurve();
      }

      this._render();
    });

    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      this._updateSlidersForCurrentCurve();
      this._render();
    });

    this.toolbarView.bindToggleHandles(() => {
      this.drawController.handlesVisible = !this.drawController.handlesVisible;
      this._render();
    });

    this.toolbarView.bindToggleBackground(() => {
      this.drawController.backgroundVisible =
        !this.drawController.backgroundVisible;
      this.canvasView.setBackground(this.drawController.backgroundVisible);
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
      console.log("Import button clicked");
      this.toolbarView.importFile.click(); // Ouvre le file picker invisible
    });

    this.toolbarView.bindImport((event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // 1️⃣ Importer la courbe
          this.model.importCurve(e.target.result);

          // 2️⃣ Sélectionner la dernière courbe importée
          const lastIndex = this.model.curves.length - 1;
          this.model.currentCurveIndex = lastIndex;

          // 3️⃣ Initialiser les offsets visibles pour cette courbe
          if (!this.drawController.offsetsVisibleByCurve[lastIndex]) {
            this.drawController.offsetsVisibleByCurve[lastIndex] = [
              true,
              true,
              true,
            ];
          }

          // 4️⃣ Forcer l’affichage des points de contrôle
          this.drawController.handlesVisible = true;
          this.toolbarView.updateHandlesViewCbx(true);

          // 5️⃣ Recalculer les offsets
          this.model.computeAllOffsets();

          // 6️⃣ Mettre à jour sliders et checkboxes
          this._updateSlidersForCurrentCurve();

          // 7️⃣ Rendu de la courbe importée
          this._render();

          // 8️⃣ Mettre à jour la liste des courbes et sélectionner la nouvelle
          this.toolbarView.updateCurveList(this.model.curves);
          this.toolbarView.setSelectedCurve(lastIndex);
        } catch (err) {
          console.error("Erreur lors de l'import JSON :", err);
          alert("Le fichier importé est invalide !");
        }
      };
      reader.readAsText(file);
    });
  }

  // ---------------------------
  // ---- Gestion offsets ----
  // ---------------------------

  _onSliderChange(offsetNumber, value) {
    this.toolbarView.updateOffsetValue(offsetNumber, value);

    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    // Mapping offsets : slider 1 → offsetsData[2], slider 2 → offsetsData[1], slider 3 → offsetsData[0]
    const mapping = [0, 1, 2];
    curve.offsetsData[mapping[offsetNumber - 1]].offset = value;

    this.model.computeAllOffsets();
    this._render();
  }

  _onToggleOffset(offsetNumber) {
    const curveIndex = this.model.currentCurveIndex;
    const offsetsVisible = this.drawController.offsetsVisibleByCurve[
      curveIndex
    ] || [true, true, true];
    offsetsVisible[offsetNumber - 1] = !offsetsVisible[offsetNumber - 1];
    this.drawController.offsetsVisibleByCurve[curveIndex] = offsetsVisible;

    this._render();
  }

  // ---------------------------
  // ---- Rendu général ----
  // ---------------------------
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
