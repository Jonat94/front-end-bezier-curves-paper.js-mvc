import paper from "../paperSetup.js";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.currentPath = null;
    this.tempShape = null;
    this.startPoint = null;
    this.dragOffset = null;
    this._setupTool();
  }

  _setupTool() {
    const tool = new paper.Tool();

    tool.onMouseDown = (event) => {
      //console.log("tu as clické ", event.point);
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;

      // On effectue un hit-test à l'endroit du clic
      const hit = paper.project.hitTest(event.point, {
        fill: true, // détecte les clics sur les zones remplies
        stroke: true, // (optionnel) détecte aussi les bords
        tolerance: 5, // marge d’erreur (px)
      });
      //TESTER AUSSI SI L'ITEM EST SUR LA COURBE SELCETIONNEE
      if (
        hit &&
        hit.item &&
        (hit.item.data.type == "circle" ||
          hit.item.data.type == "bezier_in" ||
          hit.item.data.type == "bezier_out")
      ) {
        // Si un élément a été cliqué
        //const item =
        //console.log("Tu as cliqué sur :", item);
        let test = this.isItemOnSelectedCurve(
          hit.item,
          this.model.curves[this.model.currentCurveIndex]
        );
        //console.log(test);

        this.model.selectedItem = hit.item;
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
        //console.log("Clic vide, nouveau point ajouté à", curve);
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
        if (
          this.model.selectedItem.data.type == "circle" &&
          this.isItemOnSelectedCurve(this.model.selectedItem, curve)
        ) {
          //TO DO verifier que l'item selectionné appartient bien à la courbe selectionné.
          //console.log("hhhhh", this.model.selectedItem.data);
          //console.log("lllll", curve.handles);
          tab = curve.handles.filter(
            (e) => e.id == this.model.selectedItem.data.id
          );
          tab[0].segt.point = tab[0].segt.point.add(event.delta);
        }

        if (
          this.model.selectedItem.data.type == "bezier_in" &&
          this.isItemOnSelectedCurve(this.model.selectedItem, curve)
        ) {
          tab = curve.handles.filter(
            (e) => e.inPointId == this.model.selectedItem.data.id
          );
          tab[0].segt.handleIn = tab[0].segt.handleIn.add(event.delta);
        }

        if (
          this.model.selectedItem.data.type == "bezier_out" &&
          this.isItemOnSelectedCurve(this.model.selectedItem, curve)
        ) {
          tab = curve.handles.filter(
            (e) => e.outPointId == this.model.selectedItem.data.id
          );
          tab[0].segt.handleOut = tab[0].segt.handleOut.add(event.delta);
        }

        this.model.computeOffset();
        this.view.renderCurves(
          this.model.curves,
          this.model.handlesVisible,
          this.model.offsetVisible
        );
      }
    };

    tool.onMouseUp = (event) => {
      this.model.computeOffset();
      this.view.renderCurves(
        this.model.curves,
        this.model.handlesVisible,
        this.model.offsetVisible
      );
    };
  }

  /**
   * Vérifie si l'item sélectionné appartient à la courbe actuellement sélectionnée
   * @param {Object} itemData - data de l'item Paper.js sélectionné (hit.item.data)
   * @param {Object} curve - courbe actuellement sélectionnée (model.curves[currentCurveIndex])
   * @returns {boolean} true si l'item appartient à la courbe, false sinon
   */
  isItemOnSelectedCurve(itemData, curve) {
    //console.log("tttttt", itemData, curve.handles);
    if (!itemData || !curve || !curve.handles) return false;
    //console.log("mmmmmmmm");
    return curve.handles.some(
      (h) =>
        h.id === itemData.data.id ||
        h.inPointId === itemData.data.id ||
        h.outPointId === itemData.data.id
    );
  }
}
