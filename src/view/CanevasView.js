"use strict";
import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.canvas = canvasElement;

    // Calques
    this.backgroundLayer = new paper.Layer();
    this.foregroundLayer = new paper.Layer();

    // Ajout du fond
    const raster = new paper.Raster("/images/paper.jpg");
    raster.position = paper.view.center;
    raster.scale(0.4);
    raster.sendToBack();
    this.backgroundLayer.addChild(raster);
    this.backgroundLayer.visible = false;

    this.foregroundLayer.activate();
  }

  // ---------------------------
  // Nettoie la couche principale
  // ---------------------------
  clear() {
    this.foregroundLayer.removeChildren();
  }

  // ---------------------------
  // Rendu de toutes les courbes et offsets
  // ---------------------------
  renderCurves(
    curves,
    showHandles = true,
    showOffsets = true,
    selectedItem = null,
    selectedCurveIndex = null,
    fillColor = "rgba(0,150,255,0.2)",
    offsetsVisibleByCurve = {}
  ) {
    this.clear();

    for (let c = 0; c < curves.length; c++) {
      const curve = curves[c];
      const displayHandles = showHandles && c === selectedCurveIndex;

      this.drawCurve(curve, displayHandles, selectedItem);

      if (showOffsets && curve.offsetsData.length) {
        const offsetsVisible =
          offsetsVisibleByCurve[c] ||
          Array(curve.offsetsData.length).fill(false);

        for (let i = 0; i < curve.offsetsData.length; i++) {
          const offsetData = curve.offsetsData[i];
          if (!offsetsVisible[i] || offsetData.points.length < 2) continue;

          this.drawOffset(offsetData);
          this.fillBetweenCurves(curve, offsetData, fillColor);
        }
      }
    }

    paper.view.update();
  }

  // ---------------------------
  // Dessine une courbe et ses handles
  // ---------------------------
  drawCurve(curve, visibility = true, selectedItem) {
    const path = new paper.Path({
      strokeColor: "#000",
      strokeWidth: curve.strokeWidth || 2,
    });

    for (let i = 0; i < curve.handles.length; i++) {
      const p = curve.handles[i];
      path.add(p.segment);

      if (!visibility) continue;

      // Cercle central
      this.makeCircle(
        p.segment.point,
        selectedItem &&
          selectedItem.contains &&
          selectedItem.contains(p.segment.point)
          ? "#2cff61ff"
          : "#ff0000",
        p.id,
        "circle",
        p.inPointId,
        p.outPointId
      );

      // Poignées Bézier
      this.makeCircle(
        p.segment.point.add(p.segment.handleIn),
        "#1e25fbff",
        p.inPointId,
        "bezier_in"
      );
      this.makeCircle(
        p.segment.point.add(p.segment.handleOut),
        "#1e25fbff",
        p.outPointId,
        "bezier_out"
      );
    }

    this.updateHandleLines(curve, visibility);
  }

  // ---------------------------
  // Dessine un offset
  // ---------------------------
  drawOffset(offsetData) {
    const path = new paper.Path({ strokeColor: "green", strokeWidth: 2 });
    for (let i = 0; i < offsetData.points.length; i++) {
      const pt = offsetData.points[i];
      path.add(new paper.Point(pt.x, pt.y));
    }
    path.sendToBack();
  }

  // ---------------------------
  // Remplissage entre courbe et offset
  // ---------------------------
  fillBetweenCurves(curve, offsetData, color) {
    const fillPath = new paper.Path({ fillColor: color });

    // Courbe principale
    for (let i = 0; i < curve.handles.length; i++)
      fillPath.add(curve.handles[i].segment);

    // Offset inverse
    for (let i = offsetData.points.length - 1; i >= 0; i--) {
      const pt = offsetData.points[i];
      fillPath.add(new paper.Point(pt.x, pt.y));
    }

    fillPath.closed = true;
    fillPath.sendToBack();
  }

  // ---------------------------
  // Affiche ou masque le fond
  // ---------------------------
  setBackground(visible) {
    this.backgroundLayer.visible = !!visible;
  }

  // ---------------------------
  // Crée un cercle pour un handle ou point
  // ---------------------------
  makeCircle(point, color, id, type, inPtId, outPtId) {
    const circle = new paper.Path.Circle(point, 4);
    circle.fillColor = color;
    circle.data = { type, id, inPointId: inPtId, outPointId: outPtId };
    return circle;
  }

  // ---------------------------
  // Affiche les lignes des handles
  // ---------------------------
  updateHandleLines(curve, visibility = true) {
    if (!visibility) return;

    for (let i = 0; i < curve.handles.length; i++) {
      const h = curve.handles[i];
      const pt = h.segment.point;
      const handles = [h.segment.handleIn, h.segment.handleOut];

      for (let j = 0; j < handles.length; j++) {
        const handle = handles[j];
        const line = new paper.Path.Line({
          from: pt,
          to: pt.add(handle),
          strokeColor: "gray",
          strokeWidth: 1,
          dashArray: [4, 4],
        });
        line.sendToBack();
      }
    }
  }

  // ---------------------------
  // Export du canvas en image PNG
  // ---------------------------
  exportAsImage(filename = "graphe.png", withBackground = true) {
    if (!this.canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const ctx = tempCanvas.getContext("2d");

    if (withBackground) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    ctx.drawImage(this.canvas, 0, 0);

    const dataURL = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    link.click();
  }
}
