import paper from "paper";
export default class DrawingModel {
  constructor() {
    //this.shapes = [];
    //this.curves = [];
    //this.currentTool = "pen";
    this.currentColor = "#000000";
    //this.selectedShape = null;
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1;
    this.curves = []; // tableau de courbes { path, handles, handleLines }
    this._idCounter = 0;
    this.curveCounter = 0;
    this.handlesVisible = true;
    this.selectedItem;
  }
  setStrokeWidth(width) {
    this.currentStrokeWidth = width;
  }
  deletePoint() {
    let tab;
    console.log("lllllll", this.selectedItem);
    console.log("eeeeee", this.curves);
    console.log("ffffff", this.curves[this.currentCurveIndex].handles);
    tab = this.curves[this.currentCurveIndex].handles.filter((h) => {
      return h.id == this.selectedItem.data.id;
    });
    console.log(tab);
    let index = this.curves[this.currentCurveIndex].handles.indexOf(tab[0]);
    console.log(index);
    this.curves[this.currentCurveIndex].handles.splice(index, 1);
    console.log(this.curves);
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
    const path = new paper.Path({ strokeColor: "black", strokeWidth: 1 });
    //const pointsHandles = [];
    const handles = [];
    //const handleLines = [];

    this.curves.push({
      name,
      path,
      handles,
      //handleLines,
      //selectedPointIndex: null,
    });
    this.currentCurveIndex = this.curves.length - 1; // mettre à jour l'index de la courbe courante

    // Ajouter au select
    // const option = document.createElement("option");
    // option.value = this.currentCurveIndex;
    // option.textContent = name;
    // this.toolbarView.curveSelect.appendChild(option);
    // this.toolbarView.curveSelect.value = this.model.currentCurveIndex;
  }

  // generateUniqueId() {
  //   return "id-" + Math.random().toString(36).substr(2, 9);
  // }

  // toggleHandlesVisibility() {
  //   this.handlesVisible = !this.handlesVisible;
  //   const curve = this.curves[this.currentCurveIndex];
  //   if (!curve) return;
  //   curve.pointsHandles.forEach((h) => (h.visible = this.handlesVisible));
  //   // curve.bezierHandles.forEach(([hIn, hOut]) => {
  //   //   hIn.visible = this.handlesVisible;
  //   //   hOut.visible = this.handlesVisible;
  //   // });
  //   curve.bezierHandles[0].visible = this.handlesVisible;
  //   curve.bezierHandles[1].visible = this.handlesVisible;

  //   // curve.handleLines.forEach((line) => (line.visible = this.handlesVisible));
  //   paper.view.update();
  // }

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
