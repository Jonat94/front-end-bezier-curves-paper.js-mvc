"use strict";
import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.canvas = canvasElement;

    // Calques
    this.backgroundLayer = new paper.Layer();
    this.foregroundLayer = new paper.Layer();

    // Ajouter un fond (image)
    const raster = new paper.Raster("/images/paper.jpg");
    raster.position = paper.view.center;
    raster.scale(0.4);
    raster.sendToBack();
    this.backgroundLayer.addChild(raster);
    this.backgroundLayer.visible = false;

    this.foregroundLayer.activate();
  }

  // -----------------------------
  // ---- Méthodes de rendu ----
  // -----------------------------

  clear() {
    this.foregroundLayer.removeChildren();
  }

  /**
   * Dessine toutes les courbes et leurs offsets
   * @param {Array} curves - tableau des courbes
   * @param {boolean} showHandles - afficher les handles
   * @param {boolean} showOffsets - afficher les offsets
   * @param {object|null} selectedItem - item sélectionné
   * @param {number|null} selectedCurveIndex - index de la courbe sélectionnée
   * @param {string} fillColor - couleur du remplissage entre courbe et offset
   * @param {object} offsetsVisibleByCurve - {curveIndex: [true, false, true]}
   */
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

    curves.forEach((curve, curveIndex) => {
      const displayHandles = showHandles && curveIndex === selectedCurveIndex;
      this.drawCurve(curve, displayHandles, selectedItem);

      if (showOffsets && curve.offsetsData.length) {
        const offsetsVisible = offsetsVisibleByCurve[curveIndex] || [
          true,
          true,
          true,
        ];

        curve.offsetsData.forEach((offsetData, offsetIndex) => {
          if (!offsetsVisible[offsetIndex] || offsetData.points.length < 2)
            return;
          this.drawOffset(offsetData);
          this.fillBetweenCurves(curve, offsetData, fillColor);
        });
      }
    });

    paper.view.update();
  }

  drawCurve(curve, visibility = true, selectedItem) {
    const path = new paper.Path({
      strokeColor: "#000",
      strokeWidth: curve.strokeWidth || 2,
    });

    curve.handles.forEach((p) => {
      path.add(p.segt);

      if (!visibility) return;

      // Cercle central
      this.makeCircle(
        p.segt.point,
        selectedItem?.contains(p.segt.point) ? "#2cff61ff" : "#ff0000",
        p.id,
        "circle",
        p.inPointId,
        p.outPointId
      );

      // Poignées Bézier
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

    // Courbe principale
    curve.handles.forEach((h) => fillPath.add(h.segt));

    // Offset inverse
    for (let i = offsetData.points.length - 1; i >= 0; i--) {
      const pt = offsetData.points[i];
      fillPath.add(new paper.Point(pt.x, pt.y));
    }

    fillPath.closed = true;
    fillPath.sendToBack();
  }

  setBackground(visible) {
    this.backgroundLayer.visible = !!visible;
  }

  makeCircle(point, color, id, type, inPtId, outPtId) {
    const circle = new paper.Path.Circle(point, 4);
    circle.fillColor = color;
    circle.data = { type, id, inPointId: inPtId, outPointId: outPtId };
    return circle;
  }

  updateHandleLines(curve, visibility = true) {
    if (!visibility) return;
    curve.handles.forEach((h) => {
      const pt = h.segt.point;
      [h.segt.handleIn, h.segt.handleOut].forEach((handle) => {
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
