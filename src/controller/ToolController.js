export default class ToolController {
  constructor(model, toolbarView, canvasView) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.model.createNewCurve();
    this.toolbarView.updateCurveList(this.model.curves);

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
        this.model.handlesVisible
      );
    });

    this.toolbarView.bindDeletePoint(() => {
      this.model.deletePoint();
      this.canvasView.renderCurves(this.model.curves);
    });
  }
}
