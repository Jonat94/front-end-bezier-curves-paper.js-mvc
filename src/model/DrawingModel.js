import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";

export default class DrawingModel {
  constructor() {
    //console.log("Paper project ID:", paper.project);
    this.currentColor = "#000000";
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1; //index de la courbe choisi pour modification
    this.curves = []; // array des courbes sur le canvas
    this._idCounter = 0; //compteur de cercle ajouté au canvas
    this.curveCounter = 0; // numero de la courbe créée pour pouvoir l'identifier uniquement
    this.handlesVisible = true; //flag permettant de specifier si il faut afficher les poingées
    this.offsetVisible = true; //flag permettant de specifier si il faut afficher l'offset
    this.selectedItem = null; //item paper selectionné sur le canvas (à placer dans la vue)
  }

  //construit le tableau à partir de tous les points echantillioné sur la courbe
  // pour ne conserver que la partie qui est sous la courbe.
  computeOffsetFromPoints(curve, points) {
    let pts = [];
    //multiplie par le scale pour clipper
    points.forEach((pt) => {
      pts.push({
        X: Math.round(pt.x * curve.offsetData.scale),
        Y: Math.round(pt.y * curve.offsetData.scale),
      });
    });

    //console.log(pts);
    if (pts.length < 2) return;
    //calcul du tracé complet de l'offset par clipper
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

    //cherche le plus long chemin continue car il peut y avoir plusieur chemin dans solution_paths
    if (solution_paths.length > 0) {
      let best = solution_paths[0];
      for (let i = 1; i < solution_paths.length; i++) {
        if (solution_paths[i].length > best.length) best = solution_paths[i];
      }
      //division par scale pour retrouver les coordonnées dans le plan de depart
      let offsetPointsRaw = best.map(
        (pt) =>
          new paper.Point(
            pt.X / curve.offsetData.scale,
            pt.Y / curve.offsetData.scale
          )
      );

      //Reduction du nombre de point calculé pour accélérer les calcules
      let lastPt = null;
      offsetPointsRaw.forEach((pt) => {
        //reduit le nombre de point à calsculer
        if (!lastPt || pt.getDistance(lastPt) >= 6) {
          //ajoute les coordonnées des points de l'offeset dans ofsetdata
          curve.offsetData.points.push(pt);
          lastPt = pt;
        }
      });

      // // 🔹 Fermer le contour : ajouter le premier point à la fin
      // if (curve.offsetData.points.length > 1) {
      //   const firstPt = curve.offsetData.points[0];
      //   const lastPt =
      //     curve.offsetData.points[curve.offsetData.points.length - 1];
      //   if (firstPt.getDistance(lastPt) > 0.01) {
      //     // créer un nouveau cercle identique au premier pour fermer le chemin
      //     curve.offsetData.points.push(firstPt.clone());
      //   }
      // }

      //ici le tableau points contient la totalité des points de la courbe offset
      //il faut maintenant filtrer les points qui nous interesse.
      this.filterPointsAbove(curve);

      // // 1️⃣ Créer un Path de la courbe principale
      // const mainPath = new paper.Path();
      // curve.handles.forEach((h) => mainPath.add(h.segt.point));

      // // 2️⃣ Mapper chaque point de l’offset à sa position sur la courbe principale
      // const pointsWithOffset = curve.offsetData.points.map((pt) => {
      //   const nearestPoint = mainPath.getNearestPoint(pt); // point sur la courbe principale
      //   const offsetOnPath = mainPath.getOffsetOf(nearestPoint); // distance le long du path
      //   return { pt, offset: offsetOnPath };
      // });

      // // 3️⃣ Trier les points selon leur position le long de la courbe principale
      // pointsWithOffset.sort((a, b) => a.offset - b.offset);

      // // 4️⃣ Mettre à jour le tableau des points de l’offset
      // curve.offsetData.points = pointsWithOffset.map((o) => o.pt);
    }
  }

  filterPointsAbove(curve) {
    //creation d'une nouvelle courbe de bezier avec les points de la courbe principale
    let start = curve.handles[0].segt.point;
    let end = curve.handles[curve.handles.length - 1].segt.point;
    const filteredPoints = [];

    // filtrage des points proches des extrémités pour ouvrir la courbe dee chaque coté
    curve.offsetData.points.forEach((pt) => {
      const distStart = pt.getDistance(start);
      const distEnd = pt.getDistance(end);

      // Si le point est à une distance d'un offset du début ou de la fin de la courbe principale,
      // on le supprime du tableau.
      if (
        distStart <= curve.offsetData.offset + 1 ||
        distEnd <= curve.offsetData.offset + 1
      ) {
        //console.log("Point supprimé (trop proche des extrémités)");
      } else {
        filteredPoints.push(pt); // sinon on place le points dans le tableau filtré
      }
    });
    // Remplacer l'ancien tableau tableau de point par le nouveau tableau filtré
    curve.offsetData.points = filteredPoints;

    /*----------

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
      if (vec.dot(normal) >= 0) {
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
    ----------*/
  }

  //supprime le point sélctionné (a réécrire)...
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

  //Ajout une courbe vide sur le canvas en faisant un ajout d'objet dans le tableau curves
  createNewCurve(name = `Courbe ${++this.curveCounter}`) {
    const handles = [];
    this.curves.push({
      name,
      //path,
      handles,
      offsetData: {
        points: [],
        line: null,
        sampleStep: 5,
        scale: 1000,
        offset: 10,
      },
    });
    this.currentCurveIndex = this.curves.length - 1; // mettre à jour l'index de la courbe courante
  }

  //permet d'incrementer un id , utilisé pour identifier chaque point du canvas de facon unique
  generateId(prefix = "id") {
    this._idCounter += 1;
    return `${prefix}-${this._idCounter}`;
  }

  //supprime la courbe en cours de modification
  deleteCurrentCurve() {
    if (
      this.currentCurveIndex < 0 ||
      this.currentCurveIndex >= this.curves.length
    ) {
      console.warn("Aucune courbe à supprimer.");
      return;
    }

    // Supprimer le chemin de Paper.js
    //this.curves[this.currentCurveIndex].path.remove();

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
