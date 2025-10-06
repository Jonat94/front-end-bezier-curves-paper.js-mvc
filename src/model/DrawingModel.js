export default class DrawingModel {
  constructor() {
    this.shapes = [];
    this.currentTool = "pen";
    this.currentColor = "#000000";
    this.selectedShape = null;
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
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
}
