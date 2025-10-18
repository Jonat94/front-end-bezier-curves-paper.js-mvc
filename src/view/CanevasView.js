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

  drawShape(curve, visibility = true) {
    //console.log("draw point", pt.pointsHandles);
    const path = new paper.Path();

    path.strokeColor = "#000000";
    path.strokeWidth = curve.currentStrokeWidth || 2;
    //path.fullySelected = true;

    // curve.handles.forEach((p) => path.add(p.pt));

    curve.handles.forEach((p, index) => {
      path.add(p.segt);
      if (!visibility) return;
      this.makeShape(
        p.segt.point,
        "#ff0000",
        p.id,
        "circle",
        p.inPointId,
        p.outPointId
      );
      //path.add(p.segt._handleIn),
      this.makeShape(
        p.segt.point.add(p.segt.handleIn),
        "#1e25fbff",
        p.inPointId,
        "bezier"
      );

      this.makeShape(
        p.segt.point.add(p.segt.handleOut),
        "#1e25fbff",
        p.inPointId,
        "bezier"
      );
    });
    //console.log("path", path);
  }

  // Crée un cercle interactif
  makeShape(point, color, id, type, inPtId, outPtId) {
    console.log("aaaaa", point);
    const c = new paper.Path.Circle(point, 8);
    c.fillColor = color;
    c.data.type = type;
    c.data.id = id;
    c.data.inPointId = inPtId;
    c.data.outPointId = outPtId;
    // c.data.inPoint = inPosition;
    // c.data.outPoint = outPosition;
    return c;
  }

  // highlightShape(item) {
  //   item.selectedColorBackup = item.shapeData.color;
  //   item.shapeData.color = "#903484";
  //   console.log("eeeeeeee", item);
  // }

  // clearHighlight(item) {
  //   console.log(
  //     "clear highlight",
  //     item,
  //     item.shapeData.color,
  //     item.selectedColorBackup
  //   );
  //   //if (item && item.selectedColorBackup) {
  //   console.log("restore color");
  //   //item.shapeData.color = item.selectedColorBackup;
  //   item.shapeData.color = "#0932ffff";
  //   //}
  // }
  renderCurves(curves, visibility) {
    this.clear();
    curves.forEach((curve) => this.drawShape(curve, visibility));
    paper.view.update();
  }
}
