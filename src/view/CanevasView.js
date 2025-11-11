"use strict";
import paper from "../utils/paperSetup.js";

/**
 * Classe représentant la vue canvas avec Paper.js
 * Gestion des calques, dessin de courbes, offsets et export.
 */
export default class CanvasView {
  /**
   * Initialise le canvas et configure les calques de dessin
   * @param {HTMLCanvasElement} canvasElement - Canvas HTML
   */
  constructor(canvasElement) {
    //   paper.setup(canvasElement);
    this.canvas = canvasElement;

    // Calques de dessin
    this.backgroundLayer = new paper.Layer();
    this.foregroundLayer = new paper.Layer();

    // Ajout du fond rasterisé
    const backgroundRaster = new paper.Raster("/images/paper.jpg");
    backgroundRaster.position = paper.view.center;
    backgroundRaster.scale(0.4);
    backgroundRaster.sendToBack();
    this.backgroundLayer.addChild(backgroundRaster);
    this.backgroundLayer.visible = false;

    this.foregroundLayer.activate();
  }

  // ---------------------------
  // Nettoie la couche de dessin principale
  // ---------------------------
  clearForeground() {
    this.foregroundLayer.removeChildren();
  }

  // ---------------------------
  // Rendu des courbes et de leurs offsets
  // ---------------------------
  renderCurves(
    curves,
    showHandles = true,
    //showOffsets = true,
    selectedItem = null,
    selectedCurveIndex = null,
    fillColor = "rgba(0,150,255,0.2)"
  ) {
    let offsetsVisibilityMap = this.generateOffsetsVisibilityMap(curves);
    this.clearForeground();

    curves.forEach((curve, curveIndex) => {
      const displayHandles = showHandles && curveIndex === selectedCurveIndex;

      this.drawCurve(curve, displayHandles, selectedItem);

      if (curve.offsetsData.length) {
        const offsetsVisible =
          offsetsVisibilityMap[curveIndex] ||
          Array(curve.offsetsData.length).fill(false);

        curve.offsetsData.forEach((offset, offsetIndex) => {
          if (!offsetsVisible[offsetIndex] || offset.points.length < 2) return;
          this.drawOffset(offset);
          this.fillBetweenCurveAndOffset(curve, offset, fillColor);
        });
      }
    });

    paper.view.update();
  }

  /**
   * Génère un offsetsVisibilityMap à partir des attributs `visible` des offsets
   * @param {Array} curves - Tableau des courbes
   * @returns {Object} offsetsVisibilityMap
   *
   * Exemple de structure :
   * curves = [
   *   { offsetsData: [ { visible: true }, { visible: false } ] },
   *   { offsetsData: [ { visible: true } ] }
   * ]
   * => { 0: [true, false], 1: [true] }
   */
  generateOffsetsVisibilityMap(curves) {
    const visibilityMap = {};

    curves.forEach((curve, curveIndex) => {
      if (!curve.offsetsData) return;

      visibilityMap[curveIndex] = curve.offsetsData.map(
        (offset) => !!offset.visible
      );
    });

    return visibilityMap;
  }

  // ---------------------------
  // Dessine une courbe et ses handles
  // ---------------------------
  drawCurve(curve, showHandles = true, selectedItem = null) {
    const path = new paper.Path({
      strokeColor: "#000",
      strokeWidth: curve.strokeWidth || 2,
    });

    curve.handles.forEach((handle) => {
      const segment = new paper.Segment(
        new paper.Point(handle.segment.x, handle.segment.y),
        new paper.Point(handle.handleIn.x, handle.handleIn.y),
        new paper.Point(handle.handleOut.x, handle.handleOut.y)
      );

      path.add(segment);

      if (!showHandles) return;

      this._drawHandleCircles(handle, selectedItem);
    });

    this._drawHandleLines(curve, showHandles);
  }

  // ---------------------------
  // Dessine les cercles représentant les handles et points
  // ---------------------------
  _drawHandleCircles(handle, selectedItem) {
    const mainColor =
      selectedItem?.data?.id === handle.id ? "#1aac7eff" : "#c64343";

    // Cercle central (point)
    this._makeCircle(
      new paper.Point(handle.segment.x, handle.segment.y),
      mainColor,
      handle.id,
      "circle",
      handle.inPointId,
      handle.outPointId
    );

    // Handles Bézier
    this._makeCircle(
      new paper.Point(
        handle.segment.x + handle.handleIn.x,
        handle.segment.y + handle.handleIn.y
      ),
      "#3498db",
      handle.inPointId,
      "bezier_in"
    );
    this._makeCircle(
      new paper.Point(
        handle.segment.x + handle.handleOut.x,
        handle.segment.y + handle.handleOut.y
      ),
      "#3498db",
      handle.outPointId,
      "bezier_out"
    );
  }

  // ---------------------------
  // Dessine un offset de courbe
  // ---------------------------
  drawOffset(offset) {
    const path = new paper.Path({ strokeColor: "#1aac7eff", strokeWidth: 2 });
    offset.points.forEach((pt) => path.add(new paper.Point(pt.x, pt.y)));
    path.sendToBack();
  }

  // ---------------------------
  // Remplissage entre courbe principale et offset
  // ---------------------------
  fillBetweenCurveAndOffset(curve, offset, color) {
    const fillPath = new paper.Path({ fillColor: color });

    // Ajouter points de la courbe principale
    curve.handles.forEach((handle) =>
      fillPath.add(
        new paper.Segment(
          new paper.Point(handle.segment.x, handle.segment.y),
          new paper.Point(handle.handleIn.x, handle.handleIn.y),
          new paper.Point(handle.handleOut.x, handle.handleOut.y)
        )
      )
    );

    // Ajouter points de l'offset en sens inverse
    for (let i = offset.points.length - 1; i >= 0; i--) {
      const pt = offset.points[i];
      fillPath.add(new paper.Point(pt.x, pt.y));
    }

    fillPath.closed = true;
    fillPath.sendToBack();
  }

  // ---------------------------
  // Affiche ou masque le calque de fond
  // ---------------------------
  setBackgroundVisibility(visible) {
    this.backgroundLayer.visible = !!visible;
  }

  // ---------------------------
  // Crée un cercle représentant un point ou handle et l'ajoute au calque actif
  // ---------------------------
  _makeCircle(point, color, id, type, inPtId = null, outPtId = null) {
    const circle = new paper.Path.Circle(point, 4);
    circle.fillColor = color;
    circle.data = { type, id, inPointId: inPtId, outPointId: outPtId };
    this.foregroundLayer.addChild(circle); // <-- ajout au calque pour hitTest
    return circle;
  }

  // ---------------------------
  // Dessine les lignes reliant points et handles Bézier
  // ---------------------------
  _drawHandleLines(curve, showHandles = true) {
    if (!showHandles) return;

    curve.handles.forEach((handle) => {
      const origin = new paper.Point(handle.segment.x, handle.segment.y);
      [handle.handleIn, handle.handleOut].forEach((handleVec) => {
        const line = new paper.Path.Line({
          from: origin,
          to: origin.add(handleVec),
          strokeColor: "gray",
          strokeWidth: 1,
          dashArray: [4, 4],
        });
        line.sendToBack();
      });
    });
  }

  // ---------------------------
  // Export du canvas en PNG
  // ---------------------------
  exportAsImage(filename = "canvas.png", includeBackground = true) {
    if (!this.canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const ctx = tempCanvas.getContext("2d");

    if (includeBackground) {
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
