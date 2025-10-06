import paper from "paper";
export default class ToolController {
  constructor(model, toolbarView, canvasView) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.createNewCurve();

    // this.toolbarView.bindToolChange((tool) => this.model.setTool(tool));
    // this.toolbarView.bindColorChange((color) => this.model.setColor(color));
    // this.toolbarView.bindClear(() => {
    //   this.model.clear();
    //   this.canvasView.render([]);
    // });
    // this.toolbarView.bindDelete(() => {
    //   this.model.removeSelected();
    //   this.canvasView.render(this.model.shapes);
    // });

    // Crée une nouvelle courbe vide
  }

  createNewCurve(name = `Courbe ${this.model.curves.length + 1}`) {
    const path = new paper.Path({ strokeColor: "black", strokeWidth: 1 });
    const pointsHandles = [];
    const bezierHandles = [];
    //const handleLines = [];

    this.model.curves.push({
      name,
      path,
      pointsHandles,
      bezierHandles,
      //handleLines,
      selectedPointIndex: null,
    });
    this.model.currentCurveIndex = this.model.curves.length - 1;

    // Ajouter au select
    const option = document.createElement("option");
    option.value = this.model.currentCurveIndex;
    option.textContent = name;
    this.toolbarView.curveSelect.appendChild(option);
    this.toolbarView.curveSelect.value = this.model.currentCurveIndex;
  }
}
