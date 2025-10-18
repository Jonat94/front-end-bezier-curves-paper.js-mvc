import paper from "paper";
import { Point, setup } from "paper/dist/paper-core";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentPath = null;
    this.tempShape = null;
    this.startPoint = null;

    // this.selectedItem = this.model.selectedItem;
    this.dragOffset = null;

    let selectedHandleDown = null;
    let handleType = "";
    let handleDownIndex = -1;

    // gestion des clics sur les objets
    // this.view.onShapeClick = (selected) => {
    //   if (this.model.selectedShape) {
    //     this.view.clearHighlight(this.model.selectedShape);
    //     this.model.clearSelection();
    //   } else {
    //     this.view.highlightShape(selected);
    //     this.model.selectShape(selected);
    //   }
    // };

    this._setupTool();
  }
  // visibleHandles() {
  //   return this.model.showHandles;
  // }
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
          //console.log("Clic sur un handle bezier, pas encore géré");
          console.log("item clické", hit.item);
          this.model.selectedItem = hit.item;
          // console.log(
          //   "Handle id sélectionné :",
          //   hit.item.curve.bezierHandles.id
          // );
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

        //if (this.selectedItem)
        // this.selectedItem.fillColor = this.selectedItem.data.originalColor;
        //this.model.selectedItem = hit.item;
        this.dragOffset = null;
        let idShape = this.model.generateId();
        let idIn = this.model.generateId();
        let idOut = this.model.generateId();
        curve.handles.push({
          id: idShape,
          segt: new paper.Segment(
            new paper.Point(event.point.x, event.point.y),
            new paper.Point(50, 0),
            new paper.Point(-50, 0)
          ),
          inPointId: idIn,
          outPointId: idOut,
        });
        console.log("Clic vide, nouveau point ajouté à", curve);
      }
    };

    // tool.onMouseDown = (event) => {
    //   if (this.model.currentTool === "pen") {
    //     this.currentPath = new paper.Path();
    //     this.currentPath.strokeColor = this.model.currentColor;
    //     this.currentPath.strokeWidth = this.model.currentStrokeWidth;
    //     this.currentPath.add(event.point);
    //   } else if (
    //     this.model.currentTool === "rectangle" ||
    //     this.model.currentTool === "circle"
    //   ) {
    //     this.startPoint = event.point;
    //   }
    // };

    // tool.onMouseDrag = (event) => {
    // if (this.model.currentTool === "pen") {
    //   this.currentPath.add(event.point);
    // } else if (this.model.currentTool === "rectangle") {
    //   this.view.clear();
    //   this.tempShape = new paper.Path.Rectangle(this.startPoint, event.point);
    //   this.tempShape.strokeColor = this.model.currentColor;
    // } else if (this.model.currentTool === "circle") {
    //   this.view.clear();
    //   const radius = this.startPoint.getDistance(event.point);
    //   this.tempShape = new paper.Path.Circle(this.startPoint, radius);
    //   this.tempShape.strokeColor = this.model.currentColor;
    // }
    // };

    // Quand on déplace la souris (drag actif)
    tool.onMouseDrag = (event) => {
      const curve = this.model.curves[this.model.currentCurveIndex];
      if (!curve) return;
      if (this.model.selectedItem) {
        this.model.selectedItem.position = event.point.subtract(
          this.dragOffset
        );
        //console.log("Drag en cours :", curve.pointsHandles[1].pt);

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
          //tab[0].seg.handleOut._x += event.delta.x;
          //tab[0].seg.handleOut._y += event.delta.y;
        }

        //segt._x = event.point.x;
        //curve.handles.segt._y = event.point.y;
        //console.log("ggggggggg", this.model.selectedItem.data);
        // let indexPoint = -1;
        // if (this.model.selectedItem.data.type == "circle") {
        //   curve.pointsHandles.forEach((h, index) => {
        //     console.log("handle id ", h.id);
        //     if (h.id === this.model.selectedItem.data.id) {
        //       console.log("trouvé", index);
        //       indexPoint = index;
        //     }
        //   });
        //   curve.pointsHandles[indexPoint].pt = event.point;
        // } else if (this.model.selectedItem.data.type == "bezier") {
        //   console.log("tttttttt", curve.bezierHandles);
        //   curve.bezierHandles.forEach((bh, index) => {
        //     if (
        //       bh.id + "-in" == this.model.selectedItem.data.id ||
        //       bh.id + "-out" == this.model.selectedItem.data.id
        //     ) {
        //       console.log("trouvé", index);
        //       indexPoint = index;
        //     }
        //   });
        // curve.bezierHandles[indexPoint].pt = event.point;
        // }

        // for (let sh of curve.pointsHandles) {
        //   console.log("aaaaaaaaaaaa", sh.id);
        // }

        //curve.pointsHandles[indexPoint].pt = event.point;
        //console.log("Drag en cours :", curve.pointsHandles[1]);
        //console.log("Objet déplacé :", this.model.selectedItem.position);
        this.view.renderCurves(this.model.curves, this.model.handlesVisible);
      }
    };

    // tool.onMouseDrag = (event) => {
    //   const curve = this.model.curves[currentCurveIndex];
    //   if (!curve) return;
    //   let { path, pointsHandles, bezierHandles } = curve;
    //   if (!selectedHandleDown) return;

    //   selectedHandleDown.position = event.point;

    //   if (handleType === "point") {
    //     const s = path.segments[handleDownIndex];
    //     const delta = event.delta;
    //     s.point = s.point.add(delta);

    //     const [hIn, hOut] = bezierHandles[handleDownIndex];
    //     hIn.position = s.point.add(s.handleIn);
    //     hOut.position = s.point.add(s.handleOut);
    //   }
    // };

    tool.onMouseUp = (event) => {
      // if (this.model.currentTool === "pen") {
      //   this.model.addShape({
      //     type: "path",
      //     points: this.currentPath.segments.map((s) => s.point),
      //     color: this.model.currentColor,
      //     strokeWidth: this.model.currentStrokeWidth,
      //   });
      // } else if (this.model.currentTool === "rectangle") {
      //   this.model.addShape({
      //     type: "rectangle",
      //     from: this.startPoint,
      //     to: event.point,
      //     color: this.model.currentColor,
      //     strokeWidth: this.model.currentStrokeWidth,
      //   });
      // } else if (this.model.currentTool === "circle") {
      //   const radius = this.startPoint.getDistance(event.point);
      //   this.model.addShape({
      //     type: "circle",
      //     center: this.startPoint,
      //     radius,
      //     color: this.model.currentColor,
      //     strokeWidth: this.model.currentStrokeWidth,
      //   });
      // }
      console.log("Visibility", this.model.handlesVisible);
      this.view.renderCurves(this.model.curves, this.model.handlesVisible);
    };
  }
  //Ajoute un point de contrôle au tableau de la courbe courante
  // addHandle(pt) {
  //   let path = this.model.curves[this.model.currentCurveIndex].path;
  //   let pointsHandles =
  //     this.model.curves[this.model.currentCurveIndex].pointsHandles;
  //   let bezierHandles =
  //     this.model.curves[this.model.currentCurveIndex].bezierHandles;
  //   const curve = this.model.curves[this.model.currentCurveIndex];
  //   curve.selectedPointIndex = null; // aucun point sélectionné
  //   const newSegment = path.add(pt);
  //   const segmentIndex = path.segments.length - 1;

  //   path.segments[segmentIndex].handleIn = new paper.Point(-50, 0);
  //   path.segments[segmentIndex].handleOut = new paper.Point(50, 0);

  //   pointsHandles.push(this.makeHandle(pt, "red"));

  //   const handleInCircle = Object.assign(
  //     this.makeHandle(pt.add(path.segments[segmentIndex].handleIn), "blue"),
  //     { type: "in" }
  //   );
  //   const handleOutCircle = Object.assign(
  //     this.makeHandle(pt.add(path.segments[segmentIndex].handleOut), "blue"),
  //     { type: "out" }
  //   );

  //   bezierHandles.push([handleInCircle, handleOutCircle]);
  //   //updateHandleLines(curve);
  // }
  //
}
