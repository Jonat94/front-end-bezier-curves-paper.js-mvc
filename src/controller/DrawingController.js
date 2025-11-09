"use strict";
import paper from "../paperSetup.js";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.selectedItem = null;
    this.dragOffset = null;
    this.handlesVisible = true;
    this.backgroundVisible = false;
    this.offsetVisible = true;

    this.isDraggingCurve = false;
    this.lastMousePos = null;

    // Tableau de visibilité des offsets par courbe { curveIndex: [true, false, true] }
    this.offsetsVisibleByCurve = {};

    this._setupTool();
  }

  // ---------------------------
  // Création d'une nouvelle courbe
  // ---------------------------
  addNewCurve(name) {
    this.model.createNewCurve(name);
    const curveIndex = this.model.currentCurveIndex;

    // Initialisation des offsets visibles
    this.offsetsVisibleByCurve[curveIndex] = [true, true, true];

    // Calcul immédiat des offsets
    this.model.computeAllOffsets();

    // Rendu initial
    this.view.renderCurves(
      this.model.curves,
      this.handlesVisible,
      this.offsetVisible,
      null,
      curveIndex,
      "rgba(0,150,255,0.2)",
      this.offsetsVisibleByCurve
    );
  }

  // ---------------------------
  // Setup Paper.js Tool
  // ---------------------------
  _setupTool() {
    const tool = new paper.Tool();

    // ---------------------------
    // MOUSE DOWN
    // ---------------------------
    tool.onMouseDown = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      const hit = paper.project.hitTest(event.point, {
        fill: true,
        stroke: true,
        tolerance: 8,
      });

      // --- Sélection d'un point ou poignée ---
      if (
        hit &&
        hit.item &&
        ["circle", "bezier_in", "bezier_out"].includes(hit.item.data.type)
      ) {
        this.selectedItem = hit.item;
        this.dragOffset = event.point.subtract(hit.item.position);

        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex,
          "rgba(0,150,255,0.2)",
          this.offsetsVisibleByCurve
        );
        return;
      }

      // --- Déplacement d'une courbe entière ---
      if (curve.handles.length >= 2) {
        const path = new paper.Path();
        curve.handles.forEach((h) => path.add(h.segt));

        const nearest = path.getNearestPoint(event.point);
        if (nearest && nearest.getDistance(event.point) < 10) {
          this.isDraggingCurve = true;
          this.lastMousePos = event.point;
          this.selectedItem = null;
          path.remove();
          return;
        }
        path.remove();
      }

      // --- Ajouter un nouveau point ---
      if (!this.handlesVisible) return;

      const idShape = this.model.generateId();
      const idIn = this.model.generateId();
      const idOut = this.model.generateId();

      curve.handles.push({
        id: idShape,
        segt: new paper.Segment(
          new paper.Point(event.point.x, event.point.y),
          new paper.Point(-50, 0),
          new paper.Point(50, 0)
        ),
        inPointId: idIn,
        outPointId: idOut,
      });

      const curveIndex = this.model.currentCurveIndex;

      // --- Initialisation de la visibilité des offsets pour cette courbe ---
      if (!this.offsetsVisibleByCurve[curveIndex]) {
        this.offsetsVisibleByCurve[curveIndex] = [true, true, true];
      }

      // Recalcul des offsets
      this.model.computeAllOffsets();

      this.selectedItem = null;

      this.view.renderCurves(
        this.model.curves,
        this.handlesVisible,
        this.offsetVisible,
        this.selectedItem,
        curveIndex,
        "rgba(0,150,255,0.2)",
        this.offsetsVisibleByCurve
      );
    };

    // ---------------------------
    // MOUSE DRAG
    // ---------------------------
    tool.onMouseDrag = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // Déplacer la courbe entière
      if (this.isDraggingCurve) {
        const dx = event.point.x - this.lastMousePos.x;
        const dy = event.point.y - this.lastMousePos.y;
        this.lastMousePos = event.point;

        this.model.moveActiveCurve(dx, dy);

        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex,
          "rgba(0,150,255,0.2)",
          this.offsetsVisibleByCurve
        );
        return;
      }

      // Déplacer un point ou une poignée
      if (this.selectedItem) {
        this.selectedItem.position = event.point.subtract(this.dragOffset);

        let targetHandles;
        switch (this.selectedItem.data.type) {
          case "circle":
            targetHandles = curve.handles.filter(
              (h) => h.id === this.selectedItem.data.id
            );
            if (targetHandles[0]) {
              targetHandles[0].segt.point = targetHandles[0].segt.point.add(
                event.delta
              );
            }
            break;

          case "bezier_in":
            targetHandles = curve.handles.filter(
              (h) => h.inPointId === this.selectedItem.data.id
            );
            if (targetHandles[0]) {
              targetHandles[0].segt.handleIn =
                targetHandles[0].segt.handleIn.add(event.delta);
            }
            break;

          case "bezier_out":
            targetHandles = curve.handles.filter(
              (h) => h.outPointId === this.selectedItem.data.id
            );
            if (targetHandles[0]) {
              targetHandles[0].segt.handleOut =
                targetHandles[0].segt.handleOut.add(event.delta);
            }
            break;
        }

        this.model.computeAllOffsets();

        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex,
          "rgba(0,150,255,0.2)",
          this.offsetsVisibleByCurve
        );
      }
    };

    // ---------------------------
    // MOUSE UP
    // ---------------------------
    tool.onMouseUp = () => {
      this.isDraggingCurve = false;

      this.model.computeAllOffsets();

      this.view.renderCurves(
        this.model.curves,
        this.handlesVisible,
        this.offsetVisible,
        this.selectedItem,
        this.model.currentCurveIndex,
        "rgba(0,150,255,0.2)",
        this.offsetsVisibleByCurve
      );
    };
  }

  // ---------------------------
  // Vérifie si l'item appartient à la courbe sélectionnée
  // ---------------------------
  isItemOnSelectedCurve(itemData, curve) {
    if (!itemData || !curve || !curve.handles) return false;

    return curve.handles.some(
      (h) =>
        h.id === itemData.data.id ||
        h.inPointId === itemData.data.id ||
        h.outPointId === itemData.data.id
    );
  }

  // ---------------------------
  // Bascule la visibilité d'un offset spécifique
  // ---------------------------
  toggleOffsetVisibility(curveIndex, offsetIndex) {
    if (!this.offsetsVisibleByCurve[curveIndex]) {
      this.offsetsVisibleByCurve[curveIndex] = [];
    }
    this.offsetsVisibleByCurve[curveIndex][offsetIndex] =
      !this.offsetsVisibleByCurve[curveIndex][offsetIndex];

    this.view.renderCurves(
      this.model.curves,
      this.handlesVisible,
      this.offsetVisible,
      this.selectedItem,
      this.model.currentCurveIndex,
      "rgba(0,150,255,0.2)",
      this.offsetsVisibleByCurve
    );
  }
}
