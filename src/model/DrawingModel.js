"use strict";
import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";

export default class DrawingModel {
  constructor() {
    //this.currentStrokeWidth = 20;
    this.currentCurveIndex = -1;
    this.curves = [];
    this._idCounter = 0;
    this.curveCounter = 0;
    this.offsetVisible = true;
    this.backgroundVisible = true;
    this.offsetPointsDistance = 4;
    this.clipperScale = 500;
    this.sampleStep = 5;
  }

  // Crée une nouvelle courbe avec trois offsets par défaut
  createNewCurve(name = `Courbe ${++this.curveCounter}`) {
    const handles = [];
    this.curves.push({
      name,
      handles,
      offsetsData: [
        { points: [], line: null, offset: 10 },
        { points: [], line: null, offset: 30 },
        { points: [], line: null, offset: 60 },
      ],
    });
    this.currentCurveIndex = this.curves.length - 1;
  }

  // Génère un ID unique
  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }

  // Calcule tous les offsets pour toutes les courbes
  computeOffset() {
    if (!this.curves?.length) return;
    const allPoints = this.getPointsFromCurves();
    this.curves.forEach((curve, i) => {
      const points = allPoints[i];
      curve.offsetsData.forEach((offsetData) => {
        this.computeOffsetFromPoints(curve, points, offsetData);
      });
    });
  }

  // Calcule un offset à partir de points
  computeOffsetFromPoints(curve, points, offsetData) {
    if (!points || points.length < 2) {
      offsetData.points = [];
      return;
    }

    const pts = points.map((pt) => ({
      X: Math.round(pt.x * this.clipperScale),
      Y: Math.round(pt.y * this.clipperScale),
    }));

    const co = new ClipperLib.ClipperOffset();
    co.AddPath(
      pts,
      ClipperLib.JoinType.jtRound,
      ClipperLib.EndType.etOpenRound
    );
    const solution_paths = new ClipperLib.Paths();
    co.Execute(solution_paths, offsetData.offset * this.clipperScale);
    if (!solution_paths.length) {
      offsetData.points = [];
      return;
    }

    // Sélectionne le tracé avec le plus de points
    let best = solution_paths[0];
    for (let i = 1; i < solution_paths.length; i++) {
      if (solution_paths[i].length > best.length) best = solution_paths[i];
    }

    const offsetPointsRaw = best.map(
      (pt) =>
        new paper.Point(pt.X / this.clipperScale, pt.Y / this.clipperScale)
    );

    // Réduction des points trop proches
    offsetData.points = [];
    let lastPt = null;
    offsetPointsRaw.forEach((pt) => {
      if (!lastPt || pt.getDistance(lastPt) >= this.offsetPointsDistance) {
        offsetData.points.push(pt);
        lastPt = pt;
      }
    });

    this.alignOffsetStart(curve, offsetData);
    offsetData.points.reverse();
    const closestIndex = this.getClosestOffsetPointToEnd(curve, offsetData);
    offsetData.points = offsetData.points.slice(0, closestIndex + 1);
    this.filterCornerPoints(curve, offsetData);
  }

  // Aligne le début de l'offset avec le premier point de la courbe
  alignOffsetStart(curve, offsetData) {
    if (!offsetData?.points?.length || !curve.handles?.length) return;

    const startPoint = curve.handles[0].segt.point;
    let minDist = Infinity;
    let bestIndex = 0;

    offsetData.points.forEach((pt, i) => {
      const d = pt.getDistance(startPoint);
      if (d < minDist) {
        minDist = d;
        bestIndex = i;
      }
    });

    const reordered = [];
    for (let i = bestIndex; i < offsetData.points.length; i++)
      reordered.push(offsetData.points[i]);
    for (let i = 0; i < bestIndex; i++) reordered.push(offsetData.points[i]);
    offsetData.points = reordered;
  }

  // Trouve le point de l'offset le plus proche de la fin de la courbe
  getClosestOffsetPointToEnd(curve, offsetData) {
    if (!offsetData?.points?.length || !curve.handles?.length) return 0;

    const endPoint = curve.handles[curve.handles.length - 1].segt.point;
    let minDistance = Infinity;
    let closestIndex = 0;

    offsetData.points.forEach((pt, i) => {
      const d = pt.getDistance(endPoint);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    });
    return closestIndex;
  }

  // Filtre les points trop proches des extrémités
  filterCornerPoints(curve, offsetData) {
    const start = curve.handles[0].segt.point;
    const end = curve.handles[curve.handles.length - 1].segt.point;
    const filteredPoints = offsetData.points.filter((pt) => {
      const distStart = pt.getDistance(start);
      const distEnd = pt.getDistance(end);
      return (
        distStart > offsetData.offset + 1 && distEnd > offsetData.offset + 1
      );
    });
    offsetData.points = filteredPoints;
  }

  // Déplace la courbe entière
  moveCurrentCurve(dx, dy) {
    const curve = this.curves[this.currentCurveIndex];
    if (!curve) return;

    const delta = new paper.Point(dx, dy);
    curve.handles.forEach((h) => {
      h.segt.point = h.segt.point.add(delta);
    });
    this.computeOffset();
  }

  // Supprime un point par ID
  deletePoint(id) {
    const curve = this.curves[this.currentCurveIndex];
    if (!curve) return;

    const index = curve.handles.findIndex((h) => h.id === id);
    if (index >= 0) {
      curve.handles.splice(index, 1);
    }
    this.computeOffset();
  }

  // Retourne tous les points échantillonnés des courbes
  getPointsFromCurves() {
    return this.curves.map((curve) => {
      const path = new paper.Path();
      path.visible = false;
      curve.handles.forEach((p) => path.add(p.segt));

      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += this.sampleStep) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }
      path.remove();
      return sampledPoints;
    });
  }

  // Supprime la courbe courante
  deleteCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    )
      return;

    this.curves.splice(this.currentCurveIndex, 1);
    if (this.curves.length === 0) {
      this.currentCurveIndex = -1;
    } else if (this.currentCurveIndex >= this.curves.length) {
      this.currentCurveIndex = this.curves.length - 1;
    }
  }

  // Export JSON de la courbe courante
  exportCurve() {
    const jsonData = JSON.stringify(this.curves[this.currentCurveIndex]);
    const blob = new Blob([jsonData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `drawing${this.currentCurveIndex}.json`;
    link.click();
  }

  // Import JSON
  importCurve(jsonData) {
    const data = JSON.parse(jsonData);
    const handles = data.handles.map((h) => ({
      id: h.id,
      inPointId: h.inPointId,
      outPointId: h.outPointId,
      segt: new paper.Segment(
        new paper.Point(h.segt[1][0], h.segt[1][1]),
        new paper.Point(h.segt[2][0], h.segt[2][1]),
        new paper.Point(h.segt[3][0], h.segt[3][1])
      ),
    }));
    data.handles = handles;
    this.curves.push(data);
  }
}
