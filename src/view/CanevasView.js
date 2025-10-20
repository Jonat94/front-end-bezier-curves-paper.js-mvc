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
    curves.forEach((curve) => this.filterOffsetPointsBelowCurve(curve));

    curves.forEach((curve) => this.sortOffsetPointsAlongCurve(curve));

    curves.forEach((curve) => this.drawOffset(curve, visibility));

    //this.showPointsWithIndex(curves[0].offsetData.points);
    paper.view.update();
  }
  sortOffsetPointsAlongCurve(curve, sampleStep = 5) {
    if (!curve.offsetData?.points?.length) return [];

    // 1️⃣ Créer un path temporaire à partir des segments de la courbe
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p) => path.add(p.segt));

    // 2️⃣ Pour chaque point d'offset, trouver sa position sur le path
    const pointsWithOffset = curve.offsetData.points.map((pt) => {
      const paperPt = new paper.Point(pt.x, pt.y);
      const location = path.getNearestLocation(paperPt);
      return { pt, offset: location.offset };
    });

    // 3️⃣ Trier les points selon leur offset le long du path
    pointsWithOffset.sort((a, b) => a.offset - b.offset);

    // 4️⃣ Extraire seulement les points triés
    const sortedPoints = pointsWithOffset.map((p) => p.pt);

    // 5️⃣ Mettre à jour offsetData
    curve.offsetData.points = sortedPoints;

    return sortedPoints;
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

  filterOffsetPointsBelowCurve(curve) {
    if (!curve.offsetData?.points?.length) return [];

    // 1️⃣ Créer un path temporaire à partir des handles
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p) => path.add(p.segt));

    // 2️⃣ Filtrer les points existants dans offsetData
    let belowPoints = curve.offsetData.points.filter((pt) => {
      const paperPt = new paper.Point(pt.x, pt.y);
      const nearest = path.getNearestLocation(paperPt);
      const tangent = path.getTangentAt(nearest.offset).normalize();
      const normal = tangent.rotate(-90).normalize(); // vers le bas
      const vec = paperPt.subtract(nearest.point);
      return vec.dot(normal) < 0; // <0 si le point est en dessous
    });

    // 3️⃣ Réordonner pour que le point le plus proche du début devienne le premier
    const start = curve.handles[0].segt.point;
    let closestIndex = 0;
    let minDist = Infinity;
    belowPoints.forEach((pt, i) => {
      const dist = new paper.Point(pt.x, pt.y).getDistance(start);
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

    // 4️⃣ Mettre à jour offsetData.points
    curve.offsetData.points = belowPoints;

    return belowPoints;
  }

  drawOffset(curve, visibility = true) {
    if (!visibility || !curve.offsetData?.points?.length) return;

    // Crée un chemin temporaire pour accéder aux tangentes, si besoin
    const path = new paper.Path();
    curve.handles.forEach((p) => path.add(p.segt));

    // --- 🟦 Réordonnancement du tableau d’offsets ---
    const start = curve.handles[0].segt.point;
    let closestIndex = 0;
    let minDist = Infinity;

    curve.offsetData.points.forEach((pt, i) => {
      const dist = pt.getDistance(start);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex > 0) {
      // rotation du tableau : le point le plus proche passe en premier
      const rotated = [
        ...curve.offsetData.points.slice(closestIndex),
        ...curve.offsetData.points.slice(0, closestIndex),
      ];
      curve.offsetData.points = rotated;
    }

    // --- 🟥 Dessin de la courbe d’offset ---
    const bez = new paper.Path({
      strokeColor: "red",
      strokeWidth: 1,
      visible: visibility,
    });

    bez.addSegments(curve.offsetData.points);
  }

  // getCurvePoints(curve, sampleStep) {
  //   const path = new paper.Path();
  //   path.visible = false;
  //   curve.handles.forEach((p, index) => {
  //     path.add(p.segt);
  //   });
  //   const points = [];
  //   //const path = curve.path;
  //   for (let s = 0; s <= path.length; s += sampleStep) {
  //     const p = path.getPointAt(s);
  //     if (p) points.push({ x: p.x, y: p.y });
  //   }
  //   return points;
  // }

  // Dans CanvasView
  getOffsetPointsFromCurves(curves) {
    return curves.map((curve) => {
      const path = new paper.Path();
      path.visible = false;

      // --- Création du chemin Bézier ---
      curve.handles.forEach((p) => path.add(p.segt));

      // --- Récupération initiale des points le long du chemin ---
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
