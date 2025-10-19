import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
  }

  clear() {
    paper.project.activeLayer.removeChildren();
  }

  drawShape(curve, visibility = true) {
    const path = new paper.Path();

    path.strokeColor = "#000000";
    path.strokeWidth = curve.currentStrokeWidth || 1;

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
        "bezier_in"
      );

      this.makeShape(
        p.segt.point.add(p.segt.handleOut),
        "#1e25fbff",
        p.outPointId,
        "bezier_out"
      );
    });
    this.updateHandleLines(curve, visibility);
  }

  // Crée un cercle interactif
  makeShape(point, color, id, type, inPtId, outPtId) {
    const c = new paper.Path.Circle(point, 3);
    c.fillColor = color;
    c.data.type = type;
    c.data.id = id;
    c.data.inPointId = inPtId;
    c.data.outPointId = outPtId;
    return c;
  }

  renderCurves(curves, visibility) {
    this.clear();
    curves.forEach((curve) => this.drawShape(curve, visibility));
    paper.view.update();
  }

  // renderOffset(curve, offsetData) {
  //   // supprime les anciens points/lignes
  //   curve.offsetData.points.forEach((p) => p.remove());
  //   if (curve.offsetData.line) curve.offsetData.line.remove();

  //   // dessine les nouveaux points verts
  //   const newPoints = [];
  //   //const path = new paper.Path();
  //   console.log("kkkkkkkk", curve.offsetData.points[0]);
  //   curve.offsetData.points.forEach((pt) => {
  //     const dot = new paper.Path.Circle(pt.position, 5);
  //     dot.fillColor = "green";
  //     dot.sendToBack();
  //     newPoints.push(dot);
  //     //pt.dot = dot; // garder référence si besoin
  //   });
  //   curve.offsetData.points = newPoints;

  //   console.log("oooooooo", curve.offsetData.points);
  //   console.log("ppppppppp", curve);
  //   // dessine la ligne
  //   if (curve.offsetData.points.length > 1) {
  //     const line = new paper.Path();
  //     line.strokeColor = "green";
  //     line.strokeWidth = 2;
  //     curve.offsetData.points.forEach((dot) => line.add(dot.position));
  //     line.closed = false;
  //     line.sendToBack();
  //     curve.offsetData.line = line;
  //   }
  // }

  // renderOffset(curve, offsetData) {
  //   let offsetLine = new paper.Path();
  //   offsetLine.strokeColor = "green";
  //   offsetLine.strokeWidth = 15;
  //   console.log("eeeeee", curve.lines);
  //   console.log("rrrr", curve.offsetData.points);
  //   curve.offsetData.points.forEach((dot) => {
  //     offsetLine.add(dot.position);
  //   });

  //   offsetLine.closed = false; // empêche la fermeture
  //   offsetLine.sendToBack();
  // }

  getCurvePoints(curve, sampleStep) {
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p, index) => {
      path.add(p.segt);
    });
    const points = [];
    //const path = curve.path;
    for (let s = 0; s <= path.length; s += sampleStep) {
      const p = path.getPointAt(s);
      if (p) points.push({ x: p.x, y: p.y });
    }
    return points;
  }

  // Dans CanvasView
  getOffsetPointsFromCurves(curves) {
    return curves.map((curve) => {
      const points = [];
      const path = new paper.Path();
      path.visible = false;

      curve.handles.forEach((p, index) => {
        path.add(p.segt);
      });

      for (let s = 0; s <= path.length; s += 15) {
        const p = path.getPointAt(s);
        if (p) points.push({ x: p.x, y: p.y });
      }
      return points;
    });
  }

  // Met à jour les lignes de handles
  updateHandleLines(curve, visibility = true) {
    if (!visibility) return;
    for (let i = 0; i < curve.handles.length; i++) {
      const point = curve.handles[i].segt.point;
      const hIn = curve.handles[i].segt.handleIn.add(point);
      const hOut = curve.handles[i].segt.handleOut.add(point);
      // console.log(curve.handles[i].segt.handleIn);
      const lineIn = new paper.Path.Line({
        from: point,
        to: hIn,
        strokeColor: "gray",
        strokeWidth: 1,
        dashArray: [4, 4],
      });
      lineIn.sendToBack();
      const lineOut = new paper.Path.Line({
        from: point,
        to: hOut,
        strokeColor: "gray",
        strokeWidth: 1,
        dashArray: [4, 4],
      });
      lineOut.sendToBack();
    }
  }
}
