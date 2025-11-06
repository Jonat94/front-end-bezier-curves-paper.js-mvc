import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.canvas = canvasElement; // on garde le canvas pour l'export
    this.backgroundLayer = new paper.Layer();
    this.foregroundLayer = new paper.Layer();
    // Ajouter le fond
    const raster = new paper.Raster("/images/paper.jpg");
    raster.position = paper.view.center;
    // Réduire l'image à 50% de sa taille
    raster.scale(0.4);
    raster.sendToBack(); // toujours derrière les formes
    this.backgroundLayer.addChild(raster);
    // Toujours dessiner sur le layer du dessus
    this.foregroundLayer.activate();
  }

  //definie la visibilité du fond
  setBackground(visibility) {
    if (visibility) this.backgroundLayer.visible = true;
    else this.backgroundLayer.visible = false;
  }

  //definie la visibilité des handles
  // setHandlesVisible(visibility) {
  //   console.log("aaaaaa");
  // }

  //efface tous les elements du premier plan
  clear() {
    this.foregroundLayer.removeChildren();
  }

  //dessine une courbe dans le canvase
  drawCurve(curve, visibility = true) {
    const path = new paper.Path();

    path.strokeColor = "#000000";
    path.strokeWidth = curve.currentStrokeWidth || 2;

    curve.handles.forEach((p, index) => {
      path.add(p.segt);
      if (!visibility) return;
      //ajoute un cercle rouge pour chaque point de la courbe
      this.makeCircle(
        p.segt.point,
        "#ff0000",
        p.id,
        "circle",
        p.inPointId,
        p.outPointId
      );
      //ajoute un cercle bleu pour la première poignée
      this.makeCircle(
        p.segt.point.add(p.segt.handleIn),
        "#1e25fbff",
        p.inPointId,
        "bezier_in"
      );
      //ajoute un cercle bleu pour la deuxième poignée
      this.makeCircle(
        p.segt.point.add(p.segt.handleOut),
        "#1e25fbff",
        p.outPointId,
        "bezier_out"
      );
    });
    this.updateHandleLines(curve, visibility);
  }

  // Crée un cercle interactif
  makeCircle(point, color, id, type, inPtId, outPtId) {
    const c = new paper.Path.Circle(point, 4);
    c.fillColor = color;
    c.data.type = type;
    c.data.id = id;
    c.data.inPointId = inPtId;
    c.data.outPointId = outPtId;
    return c;
  }

  //Dessine la courbes principale et son offset sur le canvas
  renderCurves(
    curves,
    visibility = true,
    visibility_offset = true,
    fillColor = "rgba(0,150,255,0.2)"
  ) {
    this.clear();

    curves.forEach((curve) => {
      // Dessine la courbe principale
      this.drawCurve(curve, visibility);

      // Dessine la courbe offset
      this.drawOffset(curve, visibility_offset);

      // Remplit la zone entre la courbe principale et son offset
      if (visibility_offset && curve.offsetData?.points?.length) {
        this.fillBetweenCurves(curve, fillColor);
      }
    });

    // 🔍 Optionnel : afficher les normales pour debug
    // curves.forEach((curve) => this.drawNormalsFacingOffset(curve));

    paper.view.update();
  }

  // --- Méthode pour remplir entre deux courbes ---
  fillBetweenCurves(curve, color = "rgba(0,255,0,0.3)") {
    if (!curve.offsetData?.points?.length || !curve.handles?.length) return;

    const fillPath = new paper.Path();
    fillPath.fillColor = color;

    // Ajouter les points de la courbe principale
    curve.handles.forEach((p) => fillPath.add(p.segt));

    // Ajouter les points de la courbe offset dans l'ordre inverse
    const offsetPoints = curve.offsetData.points.slice().reverse();
    offsetPoints.forEach((pt) => fillPath.add(new paper.Point(pt.x, pt.y)));

    fillPath.closed = true;
    fillPath.sendToBack();
  }

  //fonction de debug qui affiche l'order des points de la courbe
  showPointsWithIndex(points, radius = 5, color = "blue") {
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
        fontSize: radius * 2,
        justification: "center",
      });
    });
  }

  //Dessine la courbe d'offset à partir d'un tableau de points sur le canvas
  drawOffset(curve, visibility = true) {
    if (!visibility || !curve.offsetData?.points?.length) return;

    // --- Dessin de la courbe d’offset ---
    const offsetCurve = new paper.Path({
      strokeColor: "green",
      strokeWidth: 2,
    });

    offsetCurve.addSegments(curve.offsetData.points);
    offsetCurve.sendToBack();
  }

  // Affiche les normales des points de la courbe d'offset en face des échantillons de la courbe principale
  // drawNormalsFacingOffset(curve, length = 25, color = "red") {
  //   if (!curve?.offsetData?.points?.length || !curve.handles?.length) return;

  //   // Crée le chemin principal
  //   const mainPath = new paper.Path();
  //   mainPath.visible = false;
  //   curve.handles.forEach((p) => mainPath.add(p.segt));

  //   // Supprime les anciennes normales
  //   paper.project.activeLayer.children
  //     .filter((item) => item.data && item.data.type === "normal-debug")
  //     .forEach((item) => item.remove());

  //   // On prend le premier point d'offset pour déterminer le côté
  //   const refOffset = new paper.Point(
  //     curve.offsetData.points[0].x,
  //     curve.offsetData.points[0].y
  //   );
  //   const nearestRef = mainPath.getNearestLocation(refOffset);
  //   const tangentRef = mainPath.getTangentAt(nearestRef.offset).normalize();
  //   const normal1Ref = tangentRef.rotate(90).normalize();
  //   const normal2Ref = tangentRef.rotate(-90).normalize();
  //   const side =
  //     normal1Ref.dot(nearestRef.point.subtract(refOffset)) >
  //     normal2Ref.dot(nearestRef.point.subtract(refOffset))
  //       ? normal1Ref
  //       : normal2Ref;

  //   // Pour chaque point d'offset
  //   curve.offsetData.points.forEach((ptRaw) => {
  //     const offsetPt = new paper.Point(ptRaw.x, ptRaw.y);

  //     // Tangente et normales à ce point sur la courbe principale
  //     const nearest = mainPath.getNearestLocation(offsetPt);
  //     if (!nearest) return;

  //     const tangent = mainPath.getTangentAt(nearest.offset).normalize();
  //     const normal1 = tangent.rotate(90).normalize();
  //     const normal2 = tangent.rotate(-90).normalize();

  //     // Choisir la normale correspondant au côté de référence
  //     const normal = normal1.dot(side) > normal2.dot(side) ? normal1 : normal2;

  //     // Dessiner la normale
  //     const normalLine = new paper.Path.Line({
  //       from: offsetPt,
  //       to: offsetPt.add(normal.multiply(length)),
  //       strokeColor: color,
  //       strokeWidth: 2,
  //       dashArray: [4, 3],
  //     });
  //     normalLine.data.type = "normal-debug";
  //   });

  //   mainPath.remove();
  // }

  // --- Méthode d’export PNG ---
  exportAsImage(filename = "graphe.png") {
    if (!this.canvas) return;
    const dataURL = this.canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    link.click();
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
