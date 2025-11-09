"use strict";
import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";

/**
 * Classe gérant les courbes dessinées et leurs offsets.
 * Utilise Paper.js pour la géométrie et ClipperLib pour les calculs d’offsets précis.
 */
export default class DrawingModel {
  constructor() {
    // Paramètres globaux de dessin et d’échantillonnage
    this.defaultStrokeWidth = 4;
    this.offsetSampleStep = 5;
    this.minOffsetPointSpacing = 4;

    // Données internes
    this.curves = [];
    this.currentCurveIndex = -1;
    this.curveIdCounter = 0;
    this.handleIdCounter = 0;

    // Paramètres pour ClipperLib
    this.clipperScale = 500;

    // Valeurs d’offset par défaut pour chaque nouvelle courbe
    this.defaultOffsets = [];
    this.createCurve();
  }

  // ─────────────────────────────────────────────
  // COURBES : création, sélection, suppression
  // ─────────────────────────────────────────────

  /**
   * Crée une nouvelle courbe vide avec des offsets par défaut.
   * @param {string} name Nom de la courbe (généré automatiquement si absent)
   */
  createCurve(name = `Courbe ${++this.curveIdCounter}`) {
    const newCurve = {
      name,
      handles: [],
      strokeWidth: this.defaultStrokeWidth,
      offsetsData: this.defaultOffsets.map((value) => ({
        offset: value,
        points: [],
        visible: true,
      })),
    };

    this.curves.push(newCurve);
    this.currentCurveIndex = this.curves.length - 1;
  }

  /**
   * Supprime la courbe actuellement sélectionnée.
   */
  deleteCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    )
      return;

    this.curves.splice(this.currentCurveIndex, 1);

    // Ajuste l’index courant après suppression
    if (this.curves.length === 0) this.currentCurveIndex = -1;
    else if (this.currentCurveIndex >= this.curves.length)
      this.currentCurveIndex = this.curves.length - 1;
  }

  // ─────────────────────────────────────────────
  // POINTS / HANDLES
  // ─────────────────────────────────────────────

  /**
   * Supprime un point de contrôle (handle) par ID sur la courbe active.
   * @param {string} id Identifiant du point à supprimer
   */
  deleteHandleById(id) {
    const curve = this.getCurrentCurve();
    if (!curve) return;

    const index = curve.handles.findIndex((h) => h.id === id);
    if (index >= 0) curve.handles.splice(index, 1);

    this.computeAllOffsets();
  }

  /**
   * Déplace la courbe active entière d’un delta (dx, dy).
   */
  moveActiveCurve(dx, dy) {
    const curve = this.getCurrentCurve();
    if (!curve) return;

    const delta = new paper.Point(dx, dy);
    curve.handles.forEach((h) => {
      h.segment.point = h.segment.point.add(delta);
    });

    this.computeAllOffsets();
  }

  /**
   * Ajoute un offset à la courbe active.
   */

  addOffsetToCurrentCurve() {
    const curve = this.getCurrentCurve();
    if (!curve) return;
    if (curve.offsetsData.length > 0) {
      let offsetValue =
        curve.offsetsData[curve.offsetsData.length - 1].offset + 20;
      let obj = { offset: offsetValue, points: [], visible: true };
      curve.offsetsData.push(obj);
    } else {
      curve.offsetsData.push({ offset: 20, points: [], visible: true });
    }
    this.computeAllOffsets();
  }

  // ─────────────────────────────────────────────
  // OFFSETS : calculs et alignements
  // ─────────────────────────────────────────────

  /**
   * Recalcule tous les offsets pour toutes les courbes.
   */
  computeAllOffsets() {
    if (!this.curves.length) return;

    const allSampledPoints = this.sampleAllCurves();

    this.curves.forEach((curve, i) => {
      const points = allSampledPoints[i];
      curve.offsetsData.forEach((offsetData) => {
        this.computeSingleOffset(curve, points, offsetData);
      });
    });
  }

  /**
   * Calcule un offset à partir des points d’une courbe donnée.
   * Utilise ClipperLib pour générer les points de la courbe offset.
   */
  computeSingleOffset(curve, basePoints, offsetData) {
    if (!basePoints || basePoints.length < 2) {
      offsetData.points = [];
      return;
    }

    // Mise à l’échelle pour ClipperLib (entiers requis)
    const scaledPoints = basePoints.map((pt) => ({
      X: Math.round(pt.x * this.clipperScale),
      Y: Math.round(pt.y * this.clipperScale),
    }));

    // Crée et exécute l’offset Clipper
    const clipperOffset = new ClipperLib.ClipperOffset();
    clipperOffset.AddPath(
      scaledPoints,
      ClipperLib.JoinType.jtRound,
      ClipperLib.EndType.etOpenRound
    );

    const results = new ClipperLib.Paths();
    clipperOffset.Execute(results, offsetData.offset * this.clipperScale);

    if (!results.length) {
      offsetData.points = [];
      return;
    }

    // Choisit le chemin avec le plus de points (cas multi-tracés)
    const mainPath = results.reduce((a, b) => (b.length > a.length ? b : a));

    // Convertit les points Clipper en points Paper.js
    const offsetPoints = mainPath.map(
      (pt) =>
        new paper.Point(pt.X / this.clipperScale, pt.Y / this.clipperScale)
    );

    // Filtrage des points trop rapprochés pour alléger la courbe
    offsetData.points = this.removeClosePoints(
      offsetPoints,
      this.minOffsetPointSpacing
    );

    // Ajustements géométriques
    this.alignOffsetStart(curve, offsetData);
    offsetData.points.reverse();

    // Coupe les points après la fin de la courbe d’origine
    const endIndex = this.findClosestOffsetEnd(curve, offsetData);
    offsetData.points = offsetData.points.slice(0, endIndex + 1);

    // Supprime les points trop proches des extrémités
    this.filterCornerPoints(curve, offsetData);
  }

  /**
   * Aligne le début de l’offset sur le premier point de la courbe d’origine.
   */
  alignOffsetStart(curve, offsetData) {
    if (!offsetData.points?.length || !curve.handles?.length) return;

    const startPoint = curve.handles[0].segment.point;
    let bestIndex = 0;
    let minDistance = Infinity;

    offsetData.points.forEach((pt, i) => {
      const dist = pt.getDistance(startPoint);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    });

    // Réordonne le tableau de points pour commencer à l’index le plus proche
    offsetData.points = [
      ...offsetData.points.slice(bestIndex),
      ...offsetData.points.slice(0, bestIndex),
    ];
  }

  /**
   * Trouve le point d’offset le plus proche de la fin de la courbe.
   */
  findClosestOffsetEnd(curve, offsetData) {
    if (!offsetData.points?.length || !curve.handles?.length) return 0;

    const endPoint = curve.handles.at(-1).segment.point;
    let bestIndex = 0;
    let minDist = Infinity;

    offsetData.points.forEach((pt, i) => {
      const dist = pt.getDistance(endPoint);
      if (dist < minDist) {
        minDist = dist;
        bestIndex = i;
      }
    });
    return bestIndex;
  }

  /**
   * Supprime les points trop proches du début ou de la fin de la courbe.
   */
  filterCornerPoints(curve, offsetData) {
    const start = curve.handles[0].segment.point;
    const end = curve.handles.at(-1).segment.point;

    offsetData.points = offsetData.points.filter((pt) => {
      const dStart = pt.getDistance(start);
      const dEnd = pt.getDistance(end);
      return dStart > offsetData.offset + 1 && dEnd > offsetData.offset + 1;
    });
  }

  /**
   * Supprime les points trop rapprochés les uns des autres.
   */
  removeClosePoints(points, minDistance) {
    const result = [];
    let lastPt = null;

    for (const pt of points) {
      if (!lastPt || pt.getDistance(lastPt) >= minDistance) {
        result.push(pt);
        lastPt = pt;
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────

  /**
   * Échantillonne les points de toutes les courbes avec un pas fixe.
   * Retourne un tableau de tableaux de points.
   */
  sampleAllCurves() {
    return this.curves.map((curve) => {
      const path = new paper.Path({ visible: false });
      curve.handles.forEach((h) => path.add(h.segment));

      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += this.offsetSampleStep) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }

      path.remove();
      return sampledPoints;
    });
  }

  /**
   * Retourne la courbe actuellement sélectionnée.
   */
  getCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    )
      return null;
    return this.curves[this.currentCurveIndex];
  }

  /**
   * Génère un identifiant unique.
   */
  generateId(prefix = "id") {
    this.handleIdCounter += 1;
    return `${prefix}-${this.handleIdCounter}`;
  }

  // ─────────────────────────────────────────────
  // IMPORT / EXPORT
  // ─────────────────────────────────────────────

  /**
   * Exporte la courbe active en fichier JSON.
   */
  exportCurrentCurve() {
    const curve = this.getCurrentCurve();
    if (!curve) return;

    const jsonData = JSON.stringify(curve);
    const blob = new Blob([jsonData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `drawing-${curve.name}-${this.currentCurveIndex}.json`;
    link.click();
  }

  /**
   * Importe une courbe à partir d’un JSON (string).
   */
  importCurve(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      // Reconstruit les segments Paper.js à partir des coordonnées sérialisées
      data.handles = data.handles.map((h) => ({
        id: h.id,
        inPointId: h.inPointId,
        outPointId: h.outPointId,
        segment: new paper.Segment(
          new paper.Point(h.segment[1][0], h.segment[1][1]),
          new paper.Point(h.segment[2][0], h.segment[2][1]),
          new paper.Point(h.segment[3][0], h.segment[3][1])
        ),
        visible: h.visible,
      }));
      this.curves.push(data);
      this.currentCurveIndex = this.curves.length - 1;
    } catch (e) {
      console.error("Erreur lors de l’import de la courbe :", e);
    }
  }
}
