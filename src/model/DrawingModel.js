import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";

export default class DrawingModel {
  constructor() {
    console.log("Paper project ID:", paper.project);
    this.currentColor = "#000000";
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1;
    this.curves = [];
    this._idCounter = 0;
    this.curveCounter = 0;
    this.handlesVisible = true;
    this.offsetVisible = true;
    this.selectedItem = null;
  }

  computeOffsetFromPoints(curve, points) {
    // similaire à ton computeOffset(), mais en manipulant curve.handles
    // et en stockant le résultat dans this.offsetData
    console.log("Compute offset");
    //let curve = this.curves[this.currentCurveIndex];
    console.log("ppppppp", points);
    let pts = [];
    points.forEach((pt) => {
      pts.push({
        X: Math.round(pt.x * curve.offsetData.scale),
        Y: Math.round(pt.y * curve.offsetData.scale),
      });
    });

    console.log(pts);
    if (pts.length < 2) return;
    console.log("avant clipper");
    let co = new ClipperLib.ClipperOffset();
    co.AddPath(
      pts,
      ClipperLib.JoinType.jtRound,
      ClipperLib.EndType.etOpenRound
    );
    let solution_paths = new ClipperLib.Paths();
    co.Execute(
      solution_paths,
      curve.offsetData.offset * curve.offsetData.scale
    );

    if (curve.offsetData.points) curve.offsetData.points = [];

    //cherche le plus long chemin continue car il peut y avoir plusieur chemein dans solution_paths
    if (solution_paths.length > 0) {
      let best = solution_paths[0];
      for (let i = 1; i < solution_paths.length; i++) {
        if (solution_paths[i].length > best.length) best = solution_paths[i];
      }
      //reduction de la taille de l'offset
      console.log("pppiiiippp", best);
      let offsetPointsRaw = best.map(
        (pt) =>
          new paper.Point(
            pt.X / curve.offsetData.scale,
            pt.Y / curve.offsetData.scale
          )
      );

      console.log("fffffff", offsetPointsRaw);

      //Affiche les points de l'offset calculé avec des cercle jaunes;
      let lastPt = null;
      offsetPointsRaw.forEach((pt) => {
        //reduit le nombre de point à calsculer
        if (!lastPt || pt.getDistance(lastPt) >= 6) {
          //ajoute les coordonnées des points de l'offeset dans ofsetdata
          curve.offsetData.points.push(pt);
          //curve.offsetData.points.push(pt);
          lastPt = pt;
        }
      });

      // 🔹 Fermer le contour : ajouter le premier point à la fin
      if (curve.offsetData.points.length > 1) {
        const firstPt = curve.offsetData.points[0];
        const lastPt =
          curve.offsetData.points[curve.offsetData.points.length - 1];
        if (firstPt.getDistance(lastPt) > 0.01) {
          // créer un nouveau cercle identique au premier pour fermer le chemin
          curve.offsetData.points.push(firstPt.clone());
        }
      }

      //ici le tableau points contient tous les points de la courbe
      console.log("oooooooo", curve.offsetData.points);
      this.filterPointsAbove(curve);
    }
  }

  filterPointsAbove(curve) {
    //creation d'une nouvelle courbe de bezier avec les points de l'offset
    let start = curve.handles[0].segt.point;
    let end = curve.handles[curve.handles.length - 1].segt.point;
    const filteredPoints = [];

    // Ignorer les points proches des extrémités

    // Ignorer les points trop proches des extrémités

    curve.offsetData.points.forEach((pt) => {
      const distStart = pt.getDistance(start);
      const distEnd = pt.getDistance(end);

      // 🔹 Si le point est trop proche du début ou de la fin, on le supprime
      if (
        distStart <= curve.offsetData.offset + 1 ||
        distEnd <= curve.offsetData.offset + 1
      ) {
        console.log("Point supprimé (trop proche des extrémités)");
      } else {
        filteredPoints.push(pt); // on garde les autres
      }
    });
    // Remplacer l'ancien tableau par le nouveau filtré
    curve.offsetData.points = filteredPoints;

    //filtrage de la partie haute de la courbe
    // Crée un path de la courbe principale (juste les points)
    const mainPath = new paper.Path();
    curve.handles.forEach((h) => mainPath.add(h.segt.point));
    const filteredPoints2 = [];
    curve.offsetData.points.forEach((pt) => {
      // Trouver le point le plus proche sur la courbe principale
      const nearest = mainPath.getNearestPoint(pt);

      // Calculer le vecteur tangent à ce point
      const offsetOnPath = mainPath.getOffsetOf(nearest);
      const tangent = mainPath.getTangentAt(offsetOnPath);
      if (!tangent) return; // sécurité

      // Normale perpendiculaire
      const normal = tangent.rotate(90).normalize();

      // Vecteur du point d'offset vers le point de la courbe
      const vec = pt.subtract(nearest);

      // Produit scalaire pour déterminer le côté
      if (vec.dot(normal) <= 0) {
        // Côté « bas » ou sur la courbe → garder
        filteredPoints2.push(pt);
      } else {
        // Côté « haut » → supprimer
        // pas besoin de .remove() pour paper.Point purs
      }
    });

    curve.offsetData.points = curve.offsetData.points
      .map((pt) => ({
        pt,
        offset: mainPath.getOffsetOf(mainPath.getNearestPoint(pt)),
      }))
      .sort((a, b) => a.offset - b.offset)
      .map((o) => o.pt);

    // Remplacer l'ancien tableau par le filtré
    curve.offsetData.points = filteredPoints2;
  }

  setStrokeWidth(width) {
    this.currentStrokeWidth = width;
  }
  deletePoint() {
    let tab;
    tab = this.curves[this.currentCurveIndex].handles.filter((h) => {
      return h.id == this.selectedItem.data.id;
    });
    let index = this.curves[this.currentCurveIndex].handles.indexOf(tab[0]);
    this.curves[this.currentCurveIndex].handles.splice(index, 1);
  }
  addShape(shape) {
    this.shapes.push(shape);
  }

  selectShape(shape) {
    this.selectedShape = shape;
  }

  clearSelection() {
    this.selectedShape = null;
  }

  removeSelected() {
    if (!this.selectedShape) return;
    this.shapes = this.shapes.filter((s) => s !== this.selectedShape.shapeData);
    this.selectedShape.item.remove();
    this.clearSelection();
  }

  clear() {
    this.shapes = [];
    this.selectedShape = null;
  }

  setTool(tool) {
    this.currentTool = tool;
  }
  setColor(color) {
    this.currentColor = color;
  }

  createNewCurve(name = `Courbe ${++this.curveCounter}`) {
    //const path = new paper.Path({ strokeColor: "black", strokeWidth: 1 });
    const handles = [];
    this.curves.push({
      name,
      //path,
      handles,
      offsetData: {
        points: [],
        line: null,
        sampleStep: 15,
        scale: 100,
        offset: 50,
      },
    });
    this.currentCurveIndex = this.curves.length - 1; // mettre à jour l'index de la courbe courante
  }

  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }

  deleteCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    ) {
      console.warn("Aucune courbe à supprimer.");
      return;
    }

    // Supprimer le chemin de Paper.js
    this.curves[this.currentCurveIndex].path.remove();

    // Supprimer la courbe du tableau
    this.curves.splice(this.currentCurveIndex, 1);

    // Mettre à jour l'index de la courbe courante
    if (this.curves.length === 0) {
      this.currentCurveIndex = -1; // Aucune courbe restante
    } else if (this.currentCurveIndex >= this.curves.length) {
      this.currentCurveIndex = this.curves.length - 1; // Aller à la dernière courbe
    }
  }
}
