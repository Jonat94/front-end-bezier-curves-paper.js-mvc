import paper from "../paperSetup.js";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentPath = null;
    this.tempShape = null;
    this.startPoint = null;

    this.dragOffset = null;

    let selectedHandleDown = null;
    let handleType = "";
    let handleDownIndex = -1;

    this._setupTool();
  }

  renderOffset() {
    const curves = this.model.curves;
    const allPoints = this.view.getOffsetPointsFromCurves(curves);
    curves.forEach((curve, i) => {
      const points = allPoints[i];
      this.model.computeOffsetFromPoints(curve, points); // méthode dans le modèle
    });
  }

  _setupTool() {
    const tool = new paper.Tool();

    tool.onMouseDown = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // On effectue un hit-test à l'endroit du clic
      const hit = paper.project.hitTest(event.point, {
        fill: true, // détecte les clics sur les zones remplies
        stroke: true, // (optionnel) détecte aussi les bords
        tolerance: 15, // marge d’erreur (px)
      });

      if (
        hit &&
        hit.item &&
        (hit.item.data.type == "circle" ||
          hit.item.data.type == "bezier_in" ||
          hit.item.data.type == "bezier_out")
      ) {
        if (
          hit.item.data.type == "bezier_in" ||
          hit.item.data.type == "bezier_out"
        ) {
          console.log("item clické", hit.item);
          this.model.selectedItem = hit.item;

          console.log("Handle Bézier sélectionné parmi :", curve.handles);
          this.dragOffset = event.point.subtract(
            this.model.selectedItem.position
          );
          return;
        }
        // Si un élément a été cliqué
        const item = hit.item;
        console.log("Tu as cliqué sur :", item);

        this.model.selectedItem = item;
        this.dragOffset = event.point.subtract(
          this.model.selectedItem.position
        );
      } else {
        // Si on clique ailleurs, créer un petit point
        this.dragOffset = null;
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
        console.log("Clic vide, nouveau point ajouté à", curve);
      }
    };

    // Quand on déplace la souris (drag actif)
    tool.onMouseDrag = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;
      if (this.model.selectedItem) {
        this.model.selectedItem.position = event.point.subtract(
          this.dragOffset
        );

        let tab;
        if (this.model.selectedItem.data.type == "circle") {
          console.log("circle");
          tab = curve.handles.filter(
            (e) => e.id == this.model.selectedItem.data.id
          );
          tab[0].segt.point = tab[0].segt.point.add(event.delta);
          console.log(tab);
        }

        if (this.model.selectedItem.data.type == "bezier_in") {
          console.log("bezier_in");
          console.log("aaa", this.model.selectedItem);
          console.log("eee", curve.handles);
          tab = curve.handles.filter(
            (e) => e.inPointId == this.model.selectedItem.data.id
          );
          tab[0].segt.handleIn = tab[0].segt.handleIn.add(event.delta);
          console.log(tab);
        }

        if (this.model.selectedItem.data.type == "bezier_out") {
          console.log("bezier_out");
          console.log("aaa", this.model.selectedItem);
          console.log("eee", curve.handles);
          tab = curve.handles.filter(
            (e) => e.outPointId == this.model.selectedItem.data.id
          );
          console.log(tab);
          tab[0].segt.handleOut = tab[0].segt.handleOut.add(event.delta);
        }

        this.renderOffset();
        this.view.renderCurves(this.model.curves, this.model.handlesVisible);
      }
    };

    tool.onMouseUp = (event) => {
      console.log("Visibility", this.model.handlesVisible);
      this.view.renderCurves(this.model.curves, this.model.handlesVisible);
    };
  }
}
