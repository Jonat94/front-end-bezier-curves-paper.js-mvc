"use stric";
import * as ClipperLib from "clipper-lib";
import paper from "../utils/PaperSetup.js";
import CurveProcessor from "../services/CurveProcessor.js";

/**
 * Classe gérant les courbes dessinées et leurs offsets.
 * Utilise Paper.js pour la géométrie et ClipperLib pour les calculs d’offsets précis.
 */
export default class CurveModel {
  constructor() {
    this.processor = new CurveProcessor();
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

    curve.handles.forEach((h) => {
      h.segment.x += dx;
      h.segment.y += dy;
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
    this.curves.forEach((curve) => {
      this.computeOffset(curve);
    });
  }
  /**
   * Recalcule un seul offsets.
   */
  computeOffset(curve) {
    curve.offsetsData.forEach((offsetData) =>
      this.processor.computeSingleOffset(curve, offsetData)
    );
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

  // ─────────────────────────────────────────────
  // IMPORT / EXPORT
  // ─────────────────────────────────────────────

  /**
   * Exporte la courbe active en fichier JSON.
   */
  exportCurrentCurve() {
    const curve = this.getCurrentCurve();
    if (!curve) return;

    const serial = {
      name: curve.name,
      strokeWidth: curve.strokeWidth,
      handles: curve.handles.map((h) => ({
        id: h.id,
        visible: !!h.visible,
        point: [h.segment.point.x, h.segment.point.y],
        handleIn: [h.segment.handleIn.x, h.segment.handleIn.y],
        handleOut: [h.segment.handleOut.x, h.segment.handleOut.y],
        inPointId: h.inPointId,
        outPointId: h.outPointId,
      })),
      offsetsData: curve.offsetsData.map((o) => ({
        offset: o.offset,
        visible: !!o.visible,
      })),
    };

    const jsonData = JSON.stringify(serial);
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
      const rebuilt = {
        name: data.name,
        strokeWidth: data.strokeWidth || this.defaultStrokeWidth,
        handles: data.handles.map((h) => ({
          id: h.id || this.generateId(),
          inPointId: h.inPointId || this.generateId("in"),
          outPointId: h.outPointId || this.generateId("out"),
          segment: new paper.Segment(
            new paper.Point(h.point[0], h.point[1]),
            new paper.Point(h.handleIn[0], h.handleIn[1]),
            new paper.Point(h.handleOut[0], h.handleOut[1])
          ),
          visible: h.visible ?? true,
        })),
        offsetsData: (data.offsetsData || []).map((o) => ({
          offset: o.offset,
          points: [],
          visible: !!o.visible,
        })),
      };

      this.curves.push(rebuilt);
      this.currentCurveIndex = this.curves.length - 1;
    } catch (e) {
      console.error("Erreur import:", e);
      throw e;
    }
  }
}
