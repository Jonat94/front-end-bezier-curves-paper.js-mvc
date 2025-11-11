"use strict";
import paper from "../utils/paperSetup.js";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    // État de l'interface
    this.selectedItem = null; // Item actuellement sélectionné (point ou poignée)
    this.dragOffset = null; // Décalage entre la souris et le point sélectionné
    this.handlesVisible = true; // Affichage des poignées
    this.backgroundVisible = false; // Affichage du fond (non utilisé ici)
    this.offsetVisible = true; // Affichage des offsets
    //this.offsetsVisibleByCurve = {}; // Visibilité des offsets par courbe

    // État du drag global
    this.isDraggingCurve = false;
    this.lastMousePos = null;

    this._setupTool();
  }

  // ---------------------------
  // Initialisation de l'outil Paper.js
  // ---------------------------
  _setupTool() {
    const tool = new paper.Tool();

    tool.onMouseDown = (event) => this._handleMouseDown(event);
    tool.onMouseDrag = (event) => this._handleMouseDrag(event);
    tool.onMouseUp = () => this._handleMouseUp();
  }

  // ---------------------------
  // Gère le clic souris
  // ---------------------------
  _handleMouseDown(event) {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    const hitResult = paper.project.hitTest(event.point, {
      fill: true,
      stroke: true,
      tolerance: 8,
    });

    // --- Sélection d'un point ou d'une poignée ---
    if (this._selectHitItem(hitResult, event)) return;

    // --- Déplacement de la courbe entière ---
    if (this._checkStartCurveDrag(curve, event)) return;

    // --- Ajouter un nouveau point sur la courbe ---
    if (this.handlesVisible) {
      this._addPointToCurve(curve, event.point);
    }
  }

  // ---------------------------
  // Gère le drag souris
  // ---------------------------
  _handleMouseDrag(event) {
    const curve = this.model.curves[this.model.currentCurveIndex];
    if (!curve) return;

    if (this.isDraggingCurve) {
      this._dragEntireCurve(event);
    } else if (this.selectedItem) {
      this._dragSelectedItem(event, curve);
    }
  }

  // ---------------------------
  // Gère le relâchement souris
  // ---------------------------
  _handleMouseUp() {
    this.isDraggingCurve = false;
    this.model.computeAllOffsets();
    this._renderCurves();
  }

  // ---------------------------
  // Sélectionne un point ou une poignée si cliqué
  // ---------------------------
  _selectHitItem(hitResult, event) {
    if (
      hitResult &&
      hitResult.item &&
      ["circle", "bezier_in", "bezier_out"].includes(hitResult.item.data.type)
    ) {
      this.selectedItem = hitResult.item;
      this.dragOffset = event.point.subtract(hitResult.item.position);
      this._renderCurves();
      return true;
    }
    return false;
  }

  // ---------------------------
  // Vérifie si une courbe entière doit être déplacée
  // ---------------------------
  _checkStartCurveDrag(curve, event) {
    if (curve.handles.length < 2) return false;

    const tempPath = new paper.Path();
    curve.handles.forEach((h) => tempPath.add(h.segment));

    const nearestPoint = tempPath.getNearestPoint(event.point);
    if (nearestPoint && nearestPoint.getDistance(event.point) < 10) {
      this.isDraggingCurve = true;
      this.lastMousePos = event.point;
      this.selectedItem = null;
      tempPath.remove();
      return true;
    }

    tempPath.remove();
    return false;
  }

  // ---------------------------
  // Ajoute un nouveau point à la courbe active
  // ---------------------------
  _addPointToCurve(curve, point) {
    const shapeId = this.model.generateId();
    const inId = this.model.generateId();
    const outId = this.model.generateId();
    curve.handles.push({
      id: shapeId,
      segment: { x: point.x, y: point.y },
      handleIn: { x: -50, y: 0 },
      handleOut: { x: 50, y: 0 },
      inPointId: inId,
      outPointId: outId,
    });

    const curveIndex = this.model.currentCurveIndex;
    this.model.computeAllOffsets();
    this.selectedItem = null;
    this._renderCurves(curveIndex);
  }

  // ---------------------------
  // Déplace toute la courbe
  // ---------------------------
  _dragEntireCurve(event) {
    const dx = event.point.x - this.lastMousePos.x;
    const dy = event.point.y - this.lastMousePos.y;
    this.lastMousePos = event.point;

    this.model.moveActiveCurve(dx, dy);
    this._renderCurves();
  }

  // ---------------------------
  // Déplace un point ou une poignée sélectionnée
  // ---------------------------
  _dragSelectedItem(event, curve) {
    let targetHandle;
    switch (this.selectedItem.data.type) {
      case "circle":
        targetHandle = curve.handles.find(
          (h) => h.id === this.selectedItem.data.id
        );
        if (targetHandle) {
          targetHandle.segment.x += event.delta.x;
          targetHandle.segment.y += event.delta.y;
        }

        break;

      case "bezier_in":
        targetHandle = curve.handles.find(
          (h) => h.inPointId === this.selectedItem.data.id
        );
        targetHandle.handleIn.x += event.delta.x;
        targetHandle.handleIn.y += event.delta.y;
        break;

      case "bezier_out":
        targetHandle = curve.handles.find(
          (h) => h.outPointId === this.selectedItem.data.id
        );
        targetHandle.handleOut.x += event.delta.x;
        targetHandle.handleOut.y += event.delta.y;
        break;
    }

    this.model.computeAllOffsets();
    this._renderCurves();
  }

  // ---------------------------
  // Rend toutes les courbes
  // ---------------------------
  _renderCurves(curveIndex = this.model.currentCurveIndex) {
    this.view.renderCurves(
      this.model.curves,
      this.handlesVisible,
      this.selectedItem,
      curveIndex,
      "rgba(0,150,255,0.2)"
    );
  }

  // ---------------------------
  // Vérifie si un item appartient à la courbe sélectionnée
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
    this.model.curves[curveIndex].offsetsData[offsetIndex].visible =
      !this.model.curves[curveIndex].offsetsData[offsetIndex].visible;

    this._renderCurves();
  }
}
