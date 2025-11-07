import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";
("use strict");

export default class DrawingModel {
  constructor() {
    this.currentStrokeWidth = 20;
    this.currentCurveIndex = -1;
    this.curves = [];
    this._idCounter = 0;
    this.curveCounter = 0;
    this.handlesVisible = true;
    this.offsetVisible = true;
    this.backgroundVisible = true;
  }

  createNewCurve(name = `Courbe ${++this.curveCounter}`) {
    const handles = [];
    this.curves.push({
      name,
      handles,
      offsets: [
        {
          points: [],
          line: null,
          sampleStep: 5,
          scale: 100,
          offset: 10,
        },
        {
          points: [],
          line: null,
          sampleStep: 5,
          scale: 100,
          offset: 30,
        },
        {
          points: [],
          line: null,
          sampleStep: 5,
          scale: 100,
          offset: 40,
        },
      ],
    });
    this.currentCurveIndex = this.curves.length - 1;
  }

  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }

  computeOffset() {
    if (!this.curves?.length) return;
    const allPoints = this.getPointsFromCurves();

    this.curves.forEach((curve, i) => {
      const points = allPoints[i];
      curve.offsets.forEach((offsetData) => {
        this.computeOffsetFromPoints(curve, points, offsetData);
      });
    });
  }

  computeOffsetFromPoints(curve, points, offsetData) {
    if (!points || points.length < 2) return;

    const pts = points.map((pt) => ({
      X: Math.round(pt.x * offsetData.scale),
      Y: Math.round(pt.y * offsetData.scale),
    }));

    const co = new ClipperLib.ClipperOffset();
    co.AddPath(
      pts,
      ClipperLib.JoinType.jtRound,
      ClipperLib.EndType.etOpenRound
    );
    const solution_paths = new ClipperLib.Paths();
    co.Execute(solution_paths, offsetData.offset * offsetData.scale);

    if (!solution_paths.length) {
      offsetData.points = [];
      return;
    }

    let best = solution_paths[0];
    for (let i = 1; i < solution_paths.length; i++) {
      if (solution_paths[i].length > best.length) best = solution_paths[i];
    }

    const offsetPointsRaw = best.map(
      (pt) => new paper.Point(pt.X / offsetData.scale, pt.Y / offsetData.scale)
    );

    // réduction des points
    offsetData.points = [];
    let lastPt = null;
    offsetPointsRaw.forEach((pt) => {
      if (!lastPt || pt.getDistance(lastPt) >= 4) {
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
    offsetData.points = [
      ...offsetData.points.slice(bestIndex),
      ...offsetData.points.slice(0, bestIndex),
    ];
  }

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

  getPointsFromCurves() {
    return this.curves.map((curve) => {
      const path = new paper.Path();
      path.visible = false;
      curve.handles.forEach((p) => path.add(p.segt));
      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += curve.offsets[0].sampleStep) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }
      path.remove();
      return sampledPoints;
    });
  }
}
