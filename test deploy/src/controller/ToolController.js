export default class ToolController {
  constructor(model, toolbarView, canvasView) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.model.createNewCurve();
    this.toolbarView.updateCurveList(this.model.curves);

    this.toolbarView.bindSlider((e) => {
      const value = parseFloat(e.target.value);
      offsetValue.textContent = value;

      const curve = model.curves[model.currentCurveIndex];
      if (!curve) return;

      // Mettre à jour l'offset de la courbe
      curve.offsetData.offset = value;

      // Recalculer l'offset avec les points de la courbe
      const points = canvasView.getOffsetPointsFromCurves(model.curves)[0]; // à adapter selon ta méthode
      model.computeOffsetFromPoints(curve, points);

      // 3Rerender la courbe avec la nouvelle offset
      canvasView.renderCurves(
        model.curves,
        model.handlesVisible,
        model.offsetVisible
      );
    });

    this.toolbarView.bindAddCurve(() => {
      this.model.createNewCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);
    });

    this.toolbarView.bindDeleteCurve(() => {
      this.model.deleteCurrentCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.canvasView.renderCurves(this.model.curves);
    });

    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
    });

    this.toolbarView.bindToggleHandles(() => {
      this.model.handlesVisible = !this.model.handlesVisible;
      this.canvasView.renderCurves(
        this.model.curves,
        this.model.handlesVisible,
        this.model.offsetVisible
      );
    });

    this.toolbarView.bindDeletePoint(() => {
      this.model.deletePoint();
      this.canvasView.renderCurves(this.model.curves);
    });

    this.toolbarView.bindOffset(() => {
      this.renderOffset();
    });
  }

  renderOffset() {
    const curves = this.model.curves;
    console.log(" masquer offset");
    this.model.offsetVisible = !this.model.offsetVisible;
    this.canvasView.renderCurves(
      this.model.curves,
      this.model.handlesVisible,
      this.model.offsetVisible
    );
    //const allPoints = this.canvasView.getOffsetPointsFromCurves(curves);
    //console.log("jjjjjjjj", allPoints);
    // curves.forEach((curve, i) => {
    //   const points = allPoints[i];
    //   this.model.computeOffsetFromPoints(curve, points); // méthode dans le modèle
    // });
  }
}
