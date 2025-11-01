import * as ClipperLib from "clipper-lib";
import paper from "../paperSetup.js";
("mode strict");
export default class DrawingModel {
  constructor() {
    //console.log("Paper project ID:", paper.project);
    //this.currentColor = "#000000";
    this.currentStrokeWidth = 20; // ← ajout pour la taille du trait
    this.currentCurveIndex = -1; //index de la courbe choisi pour modification
    this.curves = []; // array des courbes sur le canvas
    this._idCounter = 0; //compteur de cercle ajouté au canvas
    this.curveCounter = 0; // numero de la courbe créée pour pouvoir l'identifier uniquement
    this.handlesVisible = true; //flag permettant de specifier si il faut afficher les poingées
    this.offsetVisible = true; //flag permettant de specifier si il faut afficher l'offset
    this.backgroundVisible = true; //Flag permettant de specifier si le fond doit s'afficher.
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
        if (!lastPt || pt.getDistance(lastPt) >= 2) {
          //ajoute les coordonnées des points de l'offeset dans ofsetdata
          curve.offsetData.points.push(pt);
          lastPt = pt;
        }
      });

      //ici le tableau points contient la totalité des points de la courbe offset
      //il faut maintenant filtrer les points qui nous interesse.
      this.filterPointsAbove(curve);

      this.filterOffsetPointsBelowCurve(curve);

      this.sortOffsetPointsAlongCurve(curve);
    }
  }

  filterOffsetPointsBelowCurve(curve) {
    if (!curve.offsetData?.points?.length) return [];

    // Créer un path temporaire à partir des handles
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p) => path.add(p.segt));

    // Filtrer les points existants dans offsetData
    let belowPoints = curve.offsetData.points.filter((pt, index) => {
      const paperPt = new paper.Point(pt.x, pt.y);
      const nearest = path.getNearestLocation(paperPt);
      const tangent = path.getTangentAt(nearest.offset).normalize();
      const normal = tangent.rotate(-90).normalize(); // vers le bas
      const vec = paperPt.subtract(nearest.point);
      //console.log("hhhhhhhh" + vec.dot(normal) + " " + index);
      return (
        // vec.dot(normal) < 0
        vec.dot(normal) < -1 * curve.offsetData.offset + 0.1 //Ajustement pour eviter que certaine points passent au dessus de la normal dans certain cas avec un angle tres aigue
      ); // <0 si le point est en dessous
    });

    // Réordonner pour que le point le plus proche du début devienne le premier
    const start = curve.handles[0].segt.point;
    let closestIndex = 0;
    let minDist = Infinity;
    belowPoints.forEach((pt, i) => {
      const dist = new paper.Point(pt.x, pt.y).getDistance(start);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex > 0) {
      belowPoints = [
        ...belowPoints.slice(closestIndex),
        ...belowPoints.slice(0, closestIndex),
      ];
    }

    // Mettre à jour offsetData.points
    curve.offsetData.points = belowPoints;
  }

  //retourne un echantillonage des courbes principales
  computeOffset() {
    if (!this.curves) return;
    const allPoints = this.getPointsFromCurves(this.curves); //--> recupere le tableau des points de l'offset de chaque courbe
    this.curves.forEach((curve, i) => {
      const points = allPoints[i];
      this.computeOffsetFromPoints(curve, points); // envoi les points offset calculé a computeOffsetFromPoints pour filtrage et stockage
    });
  }

  //retourne l'echantillonage de toutes les courbes de bezier dans un array
  getPointsFromCurves() {
    return this.curves.map((curve) => {
      const path = new paper.Path();
      path.visible = false;

      // --- Création d'un chemin Bézier invisibel de la courbe principal ---
      curve.handles.forEach((p) => path.add(p.segt));

      // --- echantillonage des points le long du chemin ---
      const sampledPoints = [];
      for (let s = 0; s <= path.length; s += curve.offsetData.sampleStep) {
        const p = path.getPointAt(s);
        if (p) sampledPoints.push(p);
      }
      return sampledPoints;
    });
  }

  //Cette fonction trie les points d’offset d’une courbe pour qu’ils suivent l’ordre de la courbe principale
  // en fonction de leur position la plus proche sur celle-ci.
  sortOffsetPointsAlongCurve(curve) {
    if (!curve.offsetData?.points?.length) return [];

    // Créer un path temporaire à partir des points de la courbe principal
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p) => path.add(p.segt));

    // Pour chaque point d'offset, trouver sa position le plus proche de la courbe principale
    const pointsWithOffset = curve.offsetData.points.map((pt) => {
      const paperPt = new paper.Point(pt.x, pt.y);
      const location = path.getNearestLocation(paperPt);
      return { pt, offset: location.offset };
    });

    // Trier les points selon leur position la plus proche de la courbe principal
    pointsWithOffset.sort((a, b) => a.offset - b.offset);

    // Extraire seulement les points triés
    const sortedPoints = pointsWithOffset.map((p) => p.pt);

    // Mettre à jour offsetData points
    curve.offsetData.points = sortedPoints;
  }

  // acctuellement supprime les coté de la courbe offset
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
  }

  //supprime le point sélctionné (a réécrire)...
  deletePoint() {
    let tab;
    tab = this.curves[this.currentCurveIndex].handles.filter((h) => {
      return h.id == this.selectedItem.data.id;
    });
    let index = this.curves[this.currentCurveIndex].handles.indexOf(tab[0]);
    this.curves[this.currentCurveIndex].handles.splice(index, 1);
    this.computeOffset();
  }

  //Supprime une courbe du canvas
  removeSelected() {
    if (!this.selectedShape) return;
    this.shapes = this.shapes.filter((s) => s !== this.selectedShape.shapeData);
    this.selectedShape.item.remove();
    this.clearSelection();
    this.selectedShape = null;
  }

  //efface le canvas paper
  clear() {
    this.shapes = [];
    this.selectedShape = null;
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
        scale: 100,
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

  exportCurve() {
    const jsonData = JSON.stringify(this.curves[this.currentCurveIndex]);
    const blob = new Blob([jsonData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `drawing${this.currentCurveIndex}.json`;
    link.click();
    console.log(jsonData);
  }

  importCurve(jsonData) {
    console.log(jsonData);
    //const reader = new FileReader();
    //reader.onload = (e) => {
    //const content = e.target.result; // Contenu du fichier JSON
    const data = JSON.parse(jsonData);
    console.log("lllllll", data);
    let curve;
    curve = data;
    const handles = data.handles.map((h) => ({
      id: h.id,
      inPointId: h.inPointId,
      outPointId: h.outPointId,
      segt: new paper.Segment(
        new paper.Point(h.segt[1][0], h.segt[1][1]),
        new paper.Point(h.segt[2][0], h.segt[2][1]),
        new paper.Point(h.segt[3][0], h.segt[3][1])
      ),
    }));
    console.log("oooooooooo", handles);
    curve.handles = handles;

    console.log("jjjj", curve);
    this.curves.push(curve);
    // controller.model.fromJSON(content); // Charge dans le modèle
    // controller.view.renderCurves(
    //   controller.model.curves,
    //   controller.model.handlesVisible,
    //   controller.model.offsetVisible
    // );
    //};

    // reader.readAsText(file); // Lit le fichier en tant que texte
  }
}
