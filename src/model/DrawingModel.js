export default class DrawingModel {
  constructor() {
    //this.shapes = [];
    //this.curves = [];
    //this.currentTool = "pen";
    this.currentColor = "#000000";
    //this.selectedShape = null;
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1;
    this.curves = []; // tableau de courbes { path, pointsHandles, bezierHandles, handleLines }
    this._idCounter = 0;
  }
  setStrokeWidth(width) {
    this.currentStrokeWidth = width;
  }
  addShape(shape) {
    this.shapes.push(shape);
  }

  selectShape(shape) {
    this.selectedShape = shape;
  }

  clearSelection() {
    this.selectedShape = null;
  }

  removeSelected() {
    if (!this.selectedShape) return;
    this.shapes = this.shapes.filter((s) => s !== this.selectedShape.shapeData);
    this.selectedShape.item.remove();
    this.clearSelection();
  }

  clear() {
    this.shapes = [];
    this.selectedShape = null;
  }

  setTool(tool) {
    this.currentTool = tool;
  }
  setColor(color) {
    this.currentColor = color;
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

  generateUniqueId() {
    return "id-" + Math.random().toString(36).substr(2, 9);
  }

  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }
}
