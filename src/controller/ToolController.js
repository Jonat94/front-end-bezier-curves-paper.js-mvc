("mode strict");
export default class ToolController {
  constructor(mod, tlbView, canView) {
    this.model = mod;
    this.toolbarView = tlbView;
    this.canvasView = canView;
    this.model.createNewCurve();
    this.toolbarView.updateCurveList(this.model.curves);
    this.toolbarView.updateBackgroundCbx(this.model.backgroundVisible);
    this.toolbarView.updateHandlesViewCbx(this.model.handlesVisible);
    this.toolbarView.updateOffsetViewCbx(this.model.offsetVisible);

    this.toolbarView.bindSlider((e) => {
      const value = parseFloat(e.target.value);
      this.toolbarView.offsetValue.textContent = value;

      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // Mettre à jour l'offset de la courbe
      this.model.curves[this.model.currentCurveIndex].offsetData.offset = value;

      // Recalculer l'offset avec les points de la courbe
      const points = this.model.getPointsFromCurves(this.model.curves); // renvoi les points echantilloné des courbes principal
      points.forEach((point, index) =>
        this.model.computeOffsetFromPoints(this.model.curves[index], point)
      );

      // 3Rerender la courbe avec la nouvelle offset
      this.canvasView.renderCurves(
        this.model.curves,
        this.model.handlesVisible,
        this.model.offsetVisible
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

    this.toolbarView.bindExport(() => {
      this.canvasView.exportAsImage("mon_dessin.png");
    });

    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      this.toolbarView.updateOffsetValue(
        this.model.curves[index].offsetData.offset
      );
    });

    this.toolbarView.bindToggleHandles(() => {
      this.model.handlesVisible = !this.model.handlesVisible;
      console.log("toggle handles");
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

    this.toolbarView.bindToggleBackground(() => {
      this.model.backgroundVisible = !this.model.backgroundVisible;
      console.log("toggle background", this.model.backgroundVisible);
      this.canvasView.setBackground(this.model.backgroundVisible);
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
