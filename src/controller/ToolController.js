export default class ToolController {
  constructor(model, toolbarView, canvasView) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;

    this.toolbarView.bindToolChange((tool) => this.model.setTool(tool));
    this.toolbarView.bindColorChange((color) => this.model.setColor(color));
    this.toolbarView.bindClear(() => {
      this.model.clear();
      this.canvasView.render([]);
    });
    this.toolbarView.bindDelete(() => {
      this.model.removeSelected();
      this.canvasView.render(this.model.shapes);
    });
  }
}
