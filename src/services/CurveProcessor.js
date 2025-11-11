"use strict";
import ClipperLib from "clipper-lib";
import paper from "paper";

export default class CurveProcessor {
  /**
   * @param {number} scale - Facteur d’échelle pour ClipperLib (entiers requis)
   * @param {number} sample - Pas d’échantillonnage des courbes
   * @param {number} reduction - Distance minimale entre les points d’offset
   */
  constructor(scale = 1000, sample = 2, reduction = 4) {
    this.clipperScale = scale;
    this.sampleStep = sample;
    this.minOffsetPointSpacing = reduction;
  }

  // ────────────── OFFSETS ──────────────

  /**
   * Calcule un offset pour une courbe donnée.
   * Découpe la logique en plusieurs étapes : échantillonnage, mise à l’échelle,
   * exécution Clipper, conversion et filtrage des points.
   * @param {Object} curve - Courbe Paper.js avec handles
   * @param {Object} offsetData - Objet contenant la valeur d’offset et tableau points
   */
  computeSingleOffset(curve, offsetData) {
    const sampledPoints = this.sampleCurve(curve);
    if (!sampledPoints || sampledPoints.length < 2) {
      curve.offsetsData.forEach(function (od) {
        od.points = [];
      });
      return;
    }

    const scaledPoints = this.scalePoints(sampledPoints);
    const mainPath = this.executeClipperOffset(scaledPoints, offsetData.offset);

    if (!mainPath.length) {
      offsetData.points = [];
      return;
    }

    let offsetPoints = this.convertClipperPointsToPaper(mainPath);
    offsetPoints = this.removeClosePoints(
      offsetPoints,
      this.minOffsetPointSpacing
    );
    offsetData.points = offsetPoints;

    this.alignOffsetStart(curve, offsetData);
    this.trimOffsetPoints(curve, offsetData);
  }

  /**
   * Met à l’échelle les points pour ClipperLib (qui fonctionne avec des entiers)
   * @param {Array} points - Points Paper.js
   * @returns {Array} Points avec X et Y arrondis
   */
  scalePoints(points) {
    return points.map(function (pt) {
      return {
        X: Math.round(pt.x * this.clipperScale),
        Y: Math.round(pt.y * this.clipperScale),
      };
    }, this);
  }

  /**
   * Exécute l’offset via ClipperLib et retourne le chemin principal
   * @param {Array} scaledPoints - Points mis à l’échelle pour Clipper
   * @param {number} offset - Valeur d’offset
   * @returns {Array} Chemin principal Clipper
   */
  executeClipperOffset(scaledPoints, offset) {
    const co = new ClipperLib.ClipperOffset();
    co.AddPath(
      scaledPoints,
      ClipperLib.JoinType.jtRound,
      ClipperLib.EndType.etOpenRound
    );
    const results = new ClipperLib.Paths();
    co.Execute(results, offset * this.clipperScale);
    if (!results.length) return [];
    return results.reduce(function (a, b) {
      return b.length > a.length ? b : a;
    });
  }

  /**
   * Convertit des points ClipperLib (entiers) en points Paper.js (flottants)
   * @param {Array} points - Points ClipperLib
   * @returns {Array} Points Paper.js
   */
  convertClipperPointsToPaper(points) {
    return points.map(function (pt) {
      return new paper.Point(
        pt.X / this.clipperScale,
        pt.Y / this.clipperScale
      );
    }, this);
  }

  /**
   * Réalise les ajustements finaux sur l’offset :
   * - inverse le tableau pour récupérer le dessous
   * - coupe après la fin de la courbe
   * - filtre les points proches des coins
   * @param {Object} curve - Courbe Paper.js
   * @param {Object} offsetData - Contient points et valeur d’offset
   */
  trimOffsetPoints(curve, offsetData) {
    offsetData.points.reverse();
    const endIndex = this.findClosestOffsetEnd(curve, offsetData);
    offsetData.points = offsetData.points.slice(0, endIndex + 1);
    this.filterCornerPoints(curve, offsetData);
  }

  // ────────────── ALIGNEMENT ──────────────

  /**
   * Aligne le début de l’offset avec le premier point de la courbe d’origine
   * @param {Object} curve - Courbe Paper.js
   * @param {Object} offsetData - Contient points et valeur d’offset
   */
  alignOffsetStart(curve, offsetData) {
    if (
      !offsetData.points ||
      !offsetData.points.length ||
      !curve.handles ||
      !curve.handles.length
    )
      return;

    const startPoint = new paper.Point(
      curve.handles[0].segment.x,
      curve.handles[0].segment.y
    );

    let bestIndex = 0,
      minDistance = Infinity;
    offsetData.points.forEach(function (pt, i) {
      const dist = pt.getDistance(startPoint);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    });

    offsetData.points = offsetData.points
      .slice(bestIndex)
      .concat(offsetData.points.slice(0, bestIndex));
  }

  /**
   * Trouve l’index du point d’offset le plus proche de la fin de la courbe
   * @param {Object} curve - Courbe Paper.js
   * @param {Object} offsetData - Contient points et valeur d’offset
   * @returns {number} Index du point le plus proche de la fin
   */
  findClosestOffsetEnd(curve, offsetData) {
    if (
      !offsetData.points ||
      !offsetData.points.length ||
      !curve.handles ||
      !curve.handles.length
    )
      return 0;

    const endPoint = new paper.Point(
      curve.handles[curve.handles.length - 1].segment.x,
      curve.handles[curve.handles.length - 1].segment.y
    );

    let bestIndex = 0,
      minDist = Infinity;
    offsetData.points.forEach(function (pt, i) {
      const dist = pt.getDistance(endPoint);
      if (dist < minDist) {
        minDist = dist;
        bestIndex = i;
      }
    });

    return bestIndex;
  }

  /**
   * Supprime les points d’offset trop proches des extrémités de la courbe
   * @param {Object} curve - Courbe Paper.js
   * @param {Object} offsetData - Contient points et valeur d’offset
   */
  filterCornerPoints(curve, offsetData) {
    const start = new paper.Point(
      curve.handles[0].segment.x,
      curve.handles[0].segment.y
    );
    const end = new paper.Point(
      curve.handles[curve.handles.length - 1].segment.x,
      curve.handles[curve.handles.length - 1].segment.y
    );

    offsetData.points = offsetData.points.filter(function (pt) {
      return (
        pt.getDistance(start) > offsetData.offset + 1 &&
        pt.getDistance(end) > offsetData.offset + 1
      );
    });
  }

  /**
   * Supprime les points trop rapprochés les uns des autres
   * @param {Array} points - Points Paper.js
   * @param {number} minDistance - Distance minimale entre les points
   * @returns {Array} Points filtrés
   */
  removeClosePoints(points, minDistance) {
    const result = [];
    let lastPt = null;

    points.forEach(function (pt) {
      if (!lastPt || pt.getDistance(lastPt) >= minDistance) {
        result.push(pt);
        lastPt = pt;
      }
    });

    return result;
  }

  // ────────────── UTILITAIRES ──────────────

  /**
   * Échantillonne une courbe Paper.js en points selon sampleStep
   * @param {Object} curve - Courbe Paper.js
   * @returns {Array} Points échantillonnés le long de la courbe
   */
  sampleCurve(curve) {
    const path = new paper.Path({ visible: true });
    let segment;

    curve.handles.forEach(function (h) {
      segment = new paper.Segment(
        new paper.Point(h.segment.x, h.segment.y),
        new paper.Point(h.handleIn.x, h.handleIn.y),
        new paper.Point(h.handleOut.x, h.handleOut.y)
      );
      path.add(segment);
    });

    const sampledPoints = [];
    for (let s = 0; s <= path.length; s += this.sampleStep) {
      const p = path.getPointAt(s);
      if (p) sampledPoints.push(p);
    }
    path.remove();
    return sampledPoints;
  }
}
