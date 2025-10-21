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
    const c = new paper.Path.Circle(point, 5);
    c.fillColor = color;
    c.data.type = type;
    c.data.id = id;
    c.data.inPointId = inPtId;
    c.data.outPointId = outPtId;
    return c;
  }

  renderCurves(curves, visibility, visibility_offset) {
    this.clear();
    curves.forEach((curve) => this.drawShape(curve, visibility));
    curves.forEach((curve) => this.drawOffset(curve, visibility_offset));
    // curves.forEach((curve) =>
    //   this.showPointsWithIndex(curve.offsetData.points)
    // );
    paper.view.update();
  }

  showPointsWithIndex(points, radius = 15, color = "blue") {
    points.forEach((pt, i) => {
      // Créer le cercle
      const circle = new paper.Path.Circle({
        center: pt,
        radius: radius,
        fillColor: color,
        strokeColor: "black",
        strokeWidth: 1,
      });

      // Ajouter le texte au centre du cercle
      const text = new paper.PointText({
        point: pt.add(new paper.Point(-radius / 2, radius / 2)), // léger décalage pour centrer
        content: i.toString(),
        fillColor: "white",
        fontSize: radius * 1.5,
        justification: "center",
      });
    });
  }

  drawOffset(curve, visibility = true) {
    if (!visibility || !curve.offsetData?.points?.length) return;

    // --- Dessin de la courbe d’offset ---
    const bez = new paper.Path({
      strokeColor: "green",
      strokeWidth: 1,
    });

    bez.addSegments(curve.offsetData.points);
  }

  // Dans CanvasView
  getOffsetPointsFromCurves(curves) {
    return curves.map((curve) => {
      const path = new paper.Path();
      path.visible = false;

      // --- Création d'un chemin Bézier invisibel de la courbe principal ---
      curve.handles.forEach((p) => path.add(p.segt));

      // --- echantillonage des points le long du chemin ---
      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += curve.offsetData.sampleStep) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }

      // --- Filtrage : conserver uniquement les points en dessous ---
      let belowPoints = sampledPoints.filter((pt) => {
        const nearest = path.getNearestLocation(pt);
        const tangent = path.getTangentAt(nearest.offset).normalize();
        const normal = tangent.rotate(-90).normalize(); // vers le bas
        const vec = pt.subtract(nearest.point);
        return vec.dot(normal) < 0;
      });

      // --- Réordonner pour que le premier point soit proche du début ---
      const start = curve.handles[0].segt.point;
      let closestIndex = 0;
      let minDist = Infinity;
      belowPoints.forEach((pt, i) => {
        const dist = pt.getDistance(start);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      });

      if (closestIndex > 0) {
        belowPoints = [
          ...belowPoints.slice(closestIndex),
          ...belowPoints.slice(0, closestIndex),
        ];
      }

      return belowPoints.map((pt) => ({ x: pt.x, y: pt.y }));
    });
  }

  // Affiche les lignes de tangente sur le canvas
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
