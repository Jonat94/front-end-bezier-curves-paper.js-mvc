export default class DrawingModel {
  constructor() {
    this.currentColor = "#000000";
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1;
    this.curves = []; // tableau de courbes { path, handles, handleLines }
    this._idCounter = 0;
    this.curveCounter = 0;
    this.handlesVisible = true;
    this.selectedItem = null;
  }
  setStrokeWidth(width) {
    this.currentStrokeWidth = width;
  }
  deletePoint() {
    let tab;
    tab = this.curves[this.currentCurveIndex].handles.filter((h) => {
      return h.id == this.selectedItem.data.id;
    });
    let index = this.curves[this.currentCurveIndex].handles.indexOf(tab[0]);
    this.curves[this.currentCurveIndex].handles.splice(index, 1);
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

  createNewCurve(name = `Courbe ${++this.curveCounter}`) {
    //const path = new paper.Path({ strokeColor: "black", strokeWidth: 1 });
    const handles = [];
    this.curves.push({
      name,
      //path,
      handles,
    });
    this.currentCurveIndex = this.curves.length - 1; // mettre à jour l'index de la courbe courante
  }

  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }

  deleteCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    ) {
      console.warn("Aucune courbe à supprimer.");
      return;
    }

    // Supprimer le chemin de Paper.js
    this.curves[this.currentCurveIndex].path.remove();

    // Supprimer la courbe du tableau
    this.curves.splice(this.currentCurveIndex, 1);

    // Mettre à jour l'index de la courbe courante
    if (this.curves.length === 0) {
      this.currentCurveIndex = -1; // Aucune courbe restante
    } else if (this.currentCurveIndex >= this.curves.length) {
      this.currentCurveIndex = this.curves.length - 1; // Aller à la dernière courbe
    }
  }
}
