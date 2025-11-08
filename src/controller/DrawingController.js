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

    this._setupTool();
  }

  /**
   * Initialise l'outil Paper.js et ses événements
   */
  _setupTool() {
    const tool = new paper.Tool();

    // ---------------------------
    //      MOUSE DOWN
    // ---------------------------
    tool.onMouseDown = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      const hit = paper.project.hitTest(event.point, {
        fill: true,
        stroke: true,
        tolerance: 8,
      });

      // --- Clic sur un point ou poignée ---
      if (
        hit &&
        hit.item &&
        ["circle", "bezier_in", "bezier_out"].includes(hit.item.data.type)
      ) {
        this.selectedItem = hit.item;
        this.dragOffset = event.point.subtract(hit.item.position);

        this.model.computeOffset();
        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex
        );
        return;
      }

      // --- Clic sur la courbe (au moins 2 points) ---
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

      // --- Sinon → ajout d'un nouveau point ---
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

      this.selectedItem = null;
    };

    // ---------------------------
    //        MOUSE DRAG
    // ---------------------------
    tool.onMouseDrag = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // ---- Déplacement de la courbe entière ----
      if (this.isDraggingCurve) {
        const dx = event.point.x - this.lastMousePos.x;
        const dy = event.point.y - this.lastMousePos.y;
        this.lastMousePos = event.point;

        this.model.moveCurrentCurve(dx, dy);
        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex
        );
        return;
      }

      // ---- Déplacement d'un point / poignée ----
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

        this.model.computeOffset();
        this.view.renderCurves(
          this.model.curves,
          this.handlesVisible,
          this.offsetVisible,
          this.selectedItem,
          this.model.currentCurveIndex
        );
      }
    };

    // ---------------------------
    //        MOUSE UP
    // ---------------------------
    tool.onMouseUp = () => {
      this.isDraggingCurve = false;
      this.model.computeOffset();
      this.view.renderCurves(
        this.model.curves,
        this.handlesVisible,
        this.offsetVisible,
        this.selectedItem,
        this.model.currentCurveIndex
      );
    };
  }

  /**
   * Vérifie si l'item sélectionné appartient à la courbe sélectionnée
   * @param {object} itemData
   * @param {object} curve
   * @returns {boolean}
   */
  isItemOnSelectedCurve(itemData, curve) {
    if (!itemData || !curve || !curve.handles) return false;

    return curve.handles.some(
      (h) =>
        h.id === itemData.data.id ||
        h.inPointId === itemData.data.id ||
        h.outPointId === itemData.data.id
    );
  }
}
