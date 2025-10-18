import paper from "paper";
export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.onShapeClick = null;
  }

  clear() {
    paper.project.activeLayer.removeChildren();
  }

  // render(curves) {
  //   this.clear();
  //   curves.forEach((pt) => this._drawShape(pt));
  //   paper.view.update();
  // }

  _drawShape(curve, visibility = true) {
    //console.log("draw point", pt.pointsHandles);
    const path = new paper.Path();
    //path.fullySelected = true;

    curve.pointsHandles.forEach((p) => path.add(p.pt));

    path.segments.forEach((seg) => {
      seg.handleOut = new paper.Point(50, 0);
      seg.handleIn = new paper.Point(-50, 0);
      if (visibility) {
        curve.pointsHandles.forEach((p, index) => {
          this.makeHandle(p.pt, "#ff0000", p.id, "circle");
          this.makeHandle(
            seg.point.add(curve.bezierHandles[index].pt[0]),
            "#blue",
            p.id + "-in",
            "bezier"
          );
          this.makeHandle(
            seg.point.add(curve.bezierHandles[index].pt[1]),
            "#0000ff",
            p.id + "-out",
            "bezier"
          );
        });

        const lineIn = new paper.Path.Line({
          from: seg.point,
          to: seg.point.add(seg.handleIn),
          strokeColor: "gray",
          strokeWidth: 1,
          dashArray: [4, 4],
        });

        const lineOut = new paper.Path.Line({
          from: seg.point,
          to: seg.point.add(seg.handleOut),
          strokeColor: "gray",
          strokeWidth: 1,
          dashArray: [4, 4],
        });
      }
    });

    path.strokeColor = "#000000";
    path.strokeWidth = curve.currentStrokeWidth || 2;
    //console.log("path", path);
  }

  // Crée un cercle interactif
  makeHandle(point, color, id, type) {
    const c = new paper.Path.Circle(point, 8);
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
  renderCurves(curves, visibility) {
    this.clear();

    curves.forEach((curve) => this._drawShape(curve, visibility));
    paper.view.update();
  }
}
