import paper from "paper";
export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.onShapeClick = null;
  }

  clear() {
    paper.project.activeLayer.removeChildren();
  }

  render(shapes) {
    this.clear();
    shapes.forEach((shape) => this._drawShape(shape));
    paper.view.update();
  }

  _drawShape(shape) {
    let item;
    switch (shape.type) {
      case "path":
        item = new paper.Path(shape.points);
        break;
      case "rectangle":
        item = new paper.Path.Rectangle(shape.from, shape.to);
        break;
      case "circle":
        item = new paper.Path.Circle(shape.center, shape.radius);
        break;
    }
    item.strokeColor = shape.color;
    item.strokeWidth = shape.strokeWidth || 2;
    // clic sur l'objet
    item.onClick = () => {
      if (this.onShapeClick) this.onShapeClick({ shapeData: shape, item });
    };

    return item;
  }

  highlightShape(item) {
    item.selectedColorBackup = item.shapeData.color;
    item.shapeData.color = "#903484";
    console.log("eeeeeeee", item);
  }

  clearHighlight(item) {
    console.log(
      "clear highlight",
      item,
      item.shapeData.color,
      item.selectedColorBackup
    );
    //if (item && item.selectedColorBackup) {
    console.log("restore color");
    //item.shapeData.color = item.selectedColorBackup;
    item.shapeData.color = "#000000";
    //}
  }
}
