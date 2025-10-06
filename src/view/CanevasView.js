import paper from "paper";
export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.onShapeClick = null;
  }

  clear() {
    paper.project.activeLayer.removeChildren();
  }

  render(curves) {
    this.clear();
    curves.forEach((pt) => this._drawShape(pt));

    paper.view.update();
  }

  _drawShape(pt) {
    //console.log("draw point", pt.pointsHandles);
    const path = new paper.Path();
    //path.fullySelected = true;

    pt.pointsHandles.forEach((p) => path.add(p.pt));
    path.segments.forEach((seg) => {
      seg.handleOut = new paper.Point(50, 0);
      seg.handleIn = new paper.Point(-50, 0);

      pt.pointsHandles.forEach((p) =>
        this.makeHandle(p.pt, "#ff0000", p.id, "circle")
      );
      this.makeHandle(seg.point.add(seg.handleIn), "#00ff00", seg.id, "bezier");
      this.makeHandle(
        seg.point.add(seg.handleOut),
        "#0000ff",
        seg.id,
        "bezier"
      );

      const lineIn = new paper.Path.Line({
        from: seg.point,
        to: seg.point.add(seg.handleIn),
        strokeColor: "#00ff00",
        strokeWidth: 1,
      });

      const lineOut = new paper.Path.Line({
        from: seg.point,
        to: seg.point.add(seg.handleOut),
        strokeColor: "#0000ff",
        strokeWidth: 1,
      });
    });

    path.strokeColor = "#000000";
    path.strokeWidth = pt.currentStrokeWidth || 2;
    //console.log("path", path);
  }

  // Crée un cercle interactif
  makeHandle(point, color, id, type) {
    const c = new paper.Path.Circle(point, 4);
    c.fillColor = color;
    c.data.type = type;
    c.data.id = id;
    return c;
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
