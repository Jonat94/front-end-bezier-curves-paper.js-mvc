"use strict";
import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.canvas = canvasElement;
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

  clear() {
    this.foregroundLayer.removeChildren();
  }

  //Dessine la courbes principale et son offset sur le canvas
  renderCurves(
    curves,
    showHandles = true,
    showOffsets = true,
    selectedItem = null,
    fillColor = "rgba(0,150,255,0.2)"
  ) {
    this.clear();

    curves.forEach((curve) => {
      // dessiner la courbe principale
      this.drawCurve(curve, showHandles, selectedItem);

      // dessiner tous les offsets
      if (showOffsets && curve.offsetsData.length) {
        curve.offsetsData.forEach((offsetData) => {
          if (offsetData.points.length > 1) {
            this.drawOffset(offsetData);
            this.fillBetweenCurves(curve, offsetData, fillColor);
          }
        });
      }
    });

    paper.view.update();
  }

  drawCurve(curve, visibility = true, selectedItem) {
    const path = new paper.Path({
      strokeColor: "#000",
      strokeWidth: curve.currentStrokeWidth || 2,
    });
    curve.handles.forEach((p) => {
      path.add(p.segt);
      if (!visibility) return;
      this.makeCircle(
        p.segt.point,
        selectedItem?.contains(p.segt.point) ? "#2cff61ff" : "#ff0000",
        p.id,
        "circle",
        p.inPointId,
        p.outPointId
      );
      this.makeCircle(
        p.segt.point.add(p.segt.handleIn),
        "#1e25fbff",
        p.inPointId,
        "bezier_in"
      );
      this.makeCircle(
        p.segt.point.add(p.segt.handleOut),
        "#1e25fbff",
        p.outPointId,
        "bezier_out"
      );
    });
    this.updateHandleLines(curve, visibility);
  }

  drawOffset(offsetData) {
    const path = new paper.Path({ strokeColor: "green", strokeWidth: 2 });
    offsetData.points.forEach((pt) => path.add(new paper.Point(pt.x, pt.y)));
    path.sendToBack();
  }

  fillBetweenCurves(curve, offsetData, color) {
    const fillPath = new paper.Path({ fillColor: color });
    curve.handles.forEach((h) => fillPath.add(h.segt));
    offsetData.points
      .slice()
      .reverse()
      .forEach((pt) => fillPath.add(new paper.Point(pt.x, pt.y)));
    fillPath.closed = true;
    fillPath.sendToBack();
  }

  //definie la visibilité du fond
  setBackground(visibility) {
    if (visibility) this.backgroundLayer.visible = true;
    else this.backgroundLayer.visible = false;
  }

  makeCircle(point, color, id, type, inPtId, outPtId) {
    const c = new paper.Path.Circle(point, 4);
    c.fillColor = color;
    c.data = { type, id, inPointId: inPtId, outPointId: outPtId };
    return c;
  }

  updateHandleLines(curve, visibility = true) {
    if (!visibility) return;
    curve.handles.forEach((h) => {
      const pt = h.segt.point;
      [h.segt.handleIn, h.segt.handleOut].forEach((handle, i) => {
        const line = new paper.Path.Line({
          from: pt,
          to: pt.add(handle),
          strokeColor: "gray",
          strokeWidth: 1,
          dashArray: [4, 4],
        });
        line.sendToBack();
      });
    });
  }
}
