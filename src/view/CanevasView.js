"use strict";
import paper from "../paperSetup.js";

export default class CanvasView {
  constructor(canvasElement) {
    paper.setup(canvasElement);
    this.canvas = canvasElement;

    // Création des calques
    this.backgroundLayer = new paper.Layer();
    this.foregroundLayer = new paper.Layer();

    // Ajouter le fond
    const raster = new paper.Raster("/images/paper.jpg");
    raster.position = paper.view.center;
    raster.scale(0.4); // réduire à 40% de sa taille
    raster.sendToBack(); // toujours derrière les formes
    this.backgroundLayer.addChild(raster);

    this.backgroundLayer.visible = false;

    // Toujours dessiner sur le calque du dessus
    this.foregroundLayer.activate();
  }

  /**
   * Supprime tout ce qui est dessiné sur le calque avant
   */
  clear() {
    this.foregroundLayer.removeChildren();
  }

  /**
   * Dessine toutes les courbes et leurs offsets
   */
  renderCurves(
    curves,
    showHandles = true,
    showOffsets = true,
    selectedItem = null,
    selectedCurveIndex = null,
    fillColor = "rgba(0,150,255,0.2)"
  ) {
    this.clear();

    curves.forEach((curve, index) => {
      // Afficher les points uniquement sur la courbe sélectionnée
      const displayHandles = showHandles && index === selectedCurveIndex;
      this.drawCurve(curve, displayHandles, selectedItem);

      // Dessiner les offsets
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

  /**
   * Dessine une courbe principale et ses poignées
   */
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

    // Lignes des poignées
    this.updateHandleLines(curve, visibility);
  }

  /**
   * Dessine un offset
   */
  drawOffset(offsetData) {
    const path = new paper.Path({ strokeColor: "green", strokeWidth: 2 });
    offsetData.points.forEach((pt) => path.add(new paper.Point(pt.x, pt.y)));
    path.sendToBack();
  }

  /**
   * Remplit l’espace entre la courbe principale et son offset
   */
  fillBetweenCurves(curve, offsetData, color) {
    const fillPath = new paper.Path({ fillColor: color });

    // Ajouter les points de la courbe principale
    curve.handles.forEach((h) => fillPath.add(h.segt));

    // Ajouter les points de l'offset (inversement)
    for (let i = offsetData.points.length - 1; i >= 0; i--) {
      const pt = offsetData.points[i];
      fillPath.add(new paper.Point(pt.x, pt.y));
    }

    fillPath.closed = true;
    fillPath.sendToBack();
  }

  /**
   * Définit la visibilité du fond
   */
  setBackground(visibility) {
    this.backgroundLayer.visible = !!visibility;
  }

  /**
   * Crée un cercle pour les points et poignées
   */
  makeCircle(point, color, id, type, inPtId, outPtId) {
    const circle = new paper.Path.Circle(point, 4);
    circle.fillColor = color;
    circle.data = { type, id, inPointId: inPtId, outPointId: outPtId };
    return circle;
  }

  /**
   * Dessine les lignes reliant le point central aux poignées
   */
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

  /**
   * Export du canvas en image PNG
   */
  // exportAsImage(filename = "graphe.png") {
  //   if (!this.canvas) return;
  //   const dataURL = this.canvas.toDataURL("image/png");
  //   const link = document.createElement("a");
  //   link.href = dataURL;
  //   link.download = filename;
  //   link.click();
  // }

  exportAsImage(filename = "graphe.png", withBackground = true) {
    if (!this.canvas) return;

    // Créer un canvas temporaire pour l’export
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const ctx = tempCanvas.getContext("2d");

    if (withBackground) {
      // Fond blanc si demandé
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // Copier le contenu du canvas original
    ctx.drawImage(this.canvas, 0, 0);

    // Export
    const dataURL = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    link.click();
  }
}
