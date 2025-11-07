import paper from "../paperSetup.js";
("use strict");

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.selectedItem = null;
    this.dragOffset = null;

    this.isDraggingCurve = false;
    this.lastMousePos = null;

    this._setupTool();
  }

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

      // --- Si clic sur un point / poignée → on la sélectionne ---
      if (
        hit &&
        hit.item &&
        (hit.item.data.type === "circle" ||
          hit.item.data.type === "bezier_in" ||
          hit.item.data.type === "bezier_out")
      ) {
        this.selectedItem = hit.item;
        this.dragOffset = event.point.subtract(hit.item.position);

        this.model.computeOffset();
        this.view.renderCurves(
          this.model.curves,
          this.model.handlesVisible,
          this.model.offsetVisible,
          this.selectedItem
        );

        return;
      }

      // --- Sinon, test si clic sur la courbe (au moins 2 points) ---
      if (curve.handles.length >= 2) {
        const path = new paper.Path(curve.handles.map((h) => h.segt));
        const nearest = path.getNearestPoint(event.point);

        if (nearest && nearest.getDistance(event.point) < 10) {
          this.isDraggingCurve = true;
          this.lastMousePos = event.point;
          this.selectedItem = null;
          path.remove(); // supprimer le path temporaire
          return;
        }

        path.remove(); // supprimer le path temporaire si pas proche
      }

      // --- Sinon → ajout d'un nouveau point ---
      if (!this.model.handlesVisible) return;

      let idShape = this.model.generateId();
      let idIn = this.model.generateId();
      let idOut = this.model.generateId();

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
          this.model.handlesVisible,
          this.model.offsetVisible,
          this.selectedItem
        );
        return;
      }

      // ---- Déplacement d'un point / poignée ----
      if (this.selectedItem) {
        this.selectedItem.position = event.point.subtract(this.dragOffset);

        let tab;
        if (this.selectedItem.data.type === "circle") {
          tab = curve.handles.filter((h) => h.id === this.selectedItem.data.id);
          if (tab[0]) {
            tab[0].segt.point = tab[0].segt.point.add(event.delta);
          }
        }

        if (this.selectedItem.data.type === "bezier_in") {
          tab = curve.handles.filter(
            (h) => h.inPointId === this.selectedItem.data.id
          );
          if (tab[0]) {
            tab[0].segt.handleIn = tab[0].segt.handleIn.add(event.delta);
          }
        }

        if (this.selectedItem.data.type === "bezier_out") {
          tab = curve.handles.filter(
            (h) => h.outPointId === this.selectedItem.data.id
          );
          if (tab[0]) {
            tab[0].segt.handleOut = tab[0].segt.handleOut.add(event.delta);
          }
        }

        this.model.computeOffset();
        this.view.renderCurves(
          this.model.curves,
          this.model.handlesVisible,
          this.model.offsetVisible,
          this.selectedItem
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
        this.model.handlesVisible,
        this.model.offsetVisible,
        this.selectedItem
      );
    };
  }

  /**
   * Vérifie si l'item sélectionné appartient à la courbe sélectionnée
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
