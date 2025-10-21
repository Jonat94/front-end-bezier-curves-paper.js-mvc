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
      model.curves[model.currentCurveIndex].offsetData.offset = value;

      // Recalculer l'offset avec les points de la courbe
      const points = model.getPointsFromCurves(model.curves); // renvoi les points echantilloné des courbes principal
      points.forEach((point, index) =>
        model.computeOffsetFromPoints(this.model.curves[index], point)
      );

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
      this.toolbarView.updateOffsetValue(
        this.model.curves[this.model.currentCurveIndex].offsetData.offset
      );
    });

    this.toolbarView.bindDeleteCurve(() => {
      this.model.deleteCurrentCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.canvasView.renderCurves(this.model.curves);
    });

    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      this.toolbarView.updateOffsetValue(
        this.model.curves[index].offsetData.offset
      );
    });

    this.toolbarView.bindToggleHandles(() => {
      this.model.handlesVisible = !this.model.handlesVisible;
      console.log("toggle");
      this.canvasView.renderCurves(
        this.model.curves,
        this.model.handlesVisible,
        this.model.offsetVisible
      );
    });

    this.toolbarView.bindDeletePoint(() => {
      this.model.deletePoint();
      this.canvasView.renderCurves(this.model.curves);
      this.canvasView.renderCurves(
        this.model.curves,
        this.model.handlesVisible,
        this.model.offsetVisible
      );
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
  }
}
