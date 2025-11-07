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

  //efface tous les elements du premier plan
  clear() {
    this.foregroundLayer.removeChildren();
  }

  //dessine une courbe dans le canvase
  drawCurve(curve, visibility = true, selectedItem) {
    const path = new paper.Path();

    path.strokeColor = "#000000";
    path.strokeWidth = curve.currentStrokeWidth || 2;

    curve.handles.forEach((p, index) => {
      path.add(p.segt);
      if (!visibility) return;
      console.log("llllll", selectedItem);
      //ajoute un cercle rouge pour chaque point de la courbe
      let dotColor = "#ff0000";
      if (selectedItem?.contains(p.segt.point)) dotColor = "#2cff61ff";
      this.makeCircle(
        p.segt.point,
        dotColor,
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
    selectedItem = null,
    fillColor = "rgba(0,150,255,0.2)"
  ) {
    this.clear();
    console.log("rrr", selectedItem);
    curves.forEach((curve) => {
      // Dessine la courbe principale
      this.drawCurve(curve, visibility, selectedItem);

      // Dessine la courbe offset si la courbe principal à plus de deux points
      if (visibility_offset && curve.offsetData.points.length > 1) {
        this.drawOffset(curve, visibility_offset);
      }

      // Remplit la zone entre la courbe principale et son offset
      if (visibility_offset && curve.offsetData?.points?.length) {
        this.fillBetweenCurves(curve, fillColor);
      }
    });

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
