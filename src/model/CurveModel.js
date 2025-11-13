"use strict";
import ClipperLib from "clipper-lib";
import paper from "paper";
import CurveProcessor from "../services/CurveProcessor.js";

/**
 * Classe gérant les courbes dessinées et leurs offsets.
 * Utilise Paper.js pour la géométrie et ClipperLib pour les calculs d’offsets précis.
 */
export default class CurveModel {
  constructor() {
    // Paramètres globaux de dessin et d’échantillonnage
    this.defaultStrokeWidth = 3;
    this.offsetSampleStep = 15;
    this.minOffsetPointSpacing = 5;

    // Paramètres pour ClipperLib
    this.clipperScale = 50;

    // Données internes
    this.curves = [];
    this.currentCurveIndex = -1;
    this.curveIdCounter = 0;
    this.handleIdCounter = 0;

    // Valeurs d’offset par défaut pour chaque nouvelle courbe
    this.defaultOffsets = 20;

    this.processor = new CurveProcessor(
      this.clipperScale,
      this.offsetSampleStep,
      this.minOffsetPointSpacing
    );

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
      offsetsData: [],
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

    curve.sampledValid = false;
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

    // Déplace les offsets déjà calculés
    curve.offsetsData.forEach((offset) => {
      offset.points.forEach((pt) => {
        pt.x += dx;
        pt.y += dy;
      });
    });

    curve.sampledValid = false;
    // this.computeAllOffsets();
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
      curve.offsetsData.push({
        offset: this.defaultOffsets,
        points: [],
        visible: true,
      });
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
   * Recalcule les offsets d'une courbe avec utilisation du cache d'echantillonage de la courbe.
   */
  computeOffset(curve) {
    curve.offsetsData.forEach((offset) =>
      this.processor.computeSingleOffset(curve, offset)
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
   * Exporte la courbe active en format JSON.
   */
  getCurrentCurveJSON() {
    const curve = this.getCurrentCurve();
    if (!curve) return;
    const serial = {
      name: curve.name,
      strokeWidth: curve.strokeWidth,
      handles: curve.handles.map((h) => ({
        id: h.id,
        segment: { x: h.segment.x, y: h.segment.y },
        handleIn: { x: h.handleIn.x, y: h.handleIn.y },
        handleOut: { x: h.handleOut.x, y: h.handleOut.y },
        inPointId: h.inPointId,
        outPointId: h.outPointId,
      })),
      offsetsData: curve.offsetsData.map((o) => ({
        offset: o.offset,
        point: [],
        visible: !!o.visible,
      })),
    };

    const jsonData = JSON.stringify(serial);
    return jsonData;
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
          inPointId: h.inPointId || this.generateId(),
          outPointId: h.outPointId || this.generateId(),
          segment: { x: h.segment.x, y: h.segment.y },
          handleIn: { x: h.handleIn.x, y: h.handleIn.y },
          handleOut: { x: h.handleOut.x, y: h.handleOut.y },
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
