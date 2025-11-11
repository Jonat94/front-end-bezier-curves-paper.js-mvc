"use strict";
import * as ClipperLib from "clipper-lib";
import paper from "../utils/paperSetup.js";

/**
 * Classe gérant les courbes dessinées et leurs offsets.
 * Utilise Paper.js pour la géométrie et ClipperLib pour les calculs d’offsets précis.
 */
export default class CurveProcessor {
  constructor() {
    this.offsetsData = [{ offset: 20, points: [], visible: true }];
    this.curvesPath = [];
    this.clipperScale = 1000;

    this.minOffsetPointSpacing = 4;
  }

  // ─────────────────────────────────────────────
  // OFFSETS : calculs et alignements
  // ─────────────────────────────────────────────

  /**
   * Recalcule tous les offsets pour toutes les courbes.
   */
  computeAllOffsets(curves, offsetSampleStep) {
    if (!curves.length) return;
    this.offsetsData = [];
    const allSampledPoints = this.sampleAllCurves(curves, offsetSampleStep); //faire appel à process curve

    curves.forEach((curve, i) => {
      const points = allSampledPoints[i];
      this.offsetsData.forEach((offsetData) => {
        this.computeSingleOffset(curve, points, offsetData);
      });
    });
    return this.offsetsData;
  }

  /**
   * Calcule un offset à partir des points d’une courbe donnée.
   * Utilise ClipperLib pour générer les points de la courbe offset.
   */
  computeSingleOffset(curve, basePoints, offsetData) {
    //faire appel à process curve
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
    const mainPath = results.reduce((a, b) => (b.length > a.length ? b : a)); //faire appel à process curve

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
    //this.filterCornerPoints(curve, offsetData);
    this.serializeOffset(offsetData);
  }

  serializeOffset(offsetData) {
    this.offsetsData.push({
      offset: offsetData.offset,
      visible: offsetData.visible,
      points: offsetData.points.map((pt) => ({ x: pt.x, y: pt.y })),
    });
  }

  /**
   * Aligne le début de l’offset sur le premier point de la courbe d’origine.
   */
  alignOffsetStart(curve, offsetData) {
    //faire appel à process curve
    if (!offsetData.points?.length || !curve.handles?.length) return;

    const startPoint = new paper.Point(
      curve.handles[0].segment.x,
      curve.handles[0].segment.y
    );
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
    //faire appel à process curve
    if (!offsetData.points?.length || !curve.handles?.length) return 0;

    const endPoint = new paper.Point(
      curve.handles.at(-1).segment.x,
      curve.handles.at(-1).segment.y
    );
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
    //faire appel à process curve
    const start = new paper.Point(
      curve.handles[0].segment.x,
      curve.handles[0].segment.y
    );
    const end = new paper.Point(
      curve.handles.at(-1).segment.x,
      curve.handles.at(-1).segment.y
    );

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
    //faire appel à process curve
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
  sampleAllCurves(curves, offsetSampleStep) {
    let allPath = curves.map((curve) => {
      const path = new paper.Path({ visible: true });

      let segment;

      curve.handles.forEach(
        (h) => {
          segment = new paper.Segment(
            new paper.Point(h.segment.x, h.segment.y),
            new paper.Point(h.handleIn.x, h.handleIn.y),
            new paper.Point(h.handleOut.x, h.handleOut.y)
          );
          path.add(segment);
        } // convertir les coordonnées en segment
      );
      return path;
    });

    const result = allPath.map((path) => {
      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += 1) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }
      path.remove();
      return sampledPoints;
    });

    return result;
  }
}
