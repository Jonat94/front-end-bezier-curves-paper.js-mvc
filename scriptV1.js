import paper from "paper";

const canvas = document.getElementById("canvas");
paper.setup(canvas);
const tool = new paper.Tool();

// DOM elements
const clearBtn = document.getElementById("clearBtn");
const toggleHandlesBtn = document.getElementById("toggleHandlesBtn");
const deletePointBtn = document.getElementById("deletePointBtn");
const addCurveBtn = document.getElementById("addCurveBtn");
const curveSelect = document.getElementById("curveSelect");

// État global
let curves = []; // tableau de courbes { path, pointsHandles, bezierHandles, handleLines }
let currentCurveIndex = -1;
let selectedHandleDown = null;
let handleType = "";
let handleDownIndex = -1;
let selectedPointIndex = null;
let handlesVisible = true;

// Crée un cercle interactif
function makeHandle(point, color) {
  const c = new paper.Path.Circle(point, 3);
  c.fillColor = color;
  return c;
}

// Crée une nouvelle courbe vide
function createNewCurve(name = `Courbe ${curves.length + 1}`) {
  const path = new paper.Path({ strokeColor: "black", strokeWidth: 1 });
  const pointsHandles = [];
  const bezierHandles = [];
  const handleLines = [];

  curves.push({
    name,
    path,
    pointsHandles,
    bezierHandles,
    handleLines,
    selectedPointIndex: null,
  });
  currentCurveIndex = curves.length - 1;

  // Ajouter au select
  const option = document.createElement("option");
  option.value = currentCurveIndex;
  option.textContent = name;
  curveSelect.appendChild(option);
  curveSelect.value = currentCurveIndex;

  return curves[currentCurveIndex];
}

// Sélection de la courbe active
curveSelect.addEventListener("change", (e) => {
  currentCurveIndex = parseInt(e.target.value);
});

// Affiche / masque les handles
toggleHandlesBtn.addEventListener("click", () => {
  handlesVisible = !handlesVisible;
  const curve = curves[currentCurveIndex];
  if (!curve) return;
  curve.pointsHandles.forEach((h) => (h.visible = handlesVisible));
  curve.bezierHandles.forEach(([hIn, hOut]) => {
    hIn.visible = handlesVisible;
    hOut.visible = handlesVisible;
  });
  curve.handleLines.forEach((line) => (line.visible = handlesVisible));
  paper.view.update();
});

// Bouton ajouter une nouvelle courbe
addCurveBtn.addEventListener("click", () => {
  createNewCurve();
  paper.view.update();
});

// Bouton effacer tout
clearBtn.addEventListener("click", () => {
  curves.forEach((curve) => {
    curve.path.remove();
    curve.pointsHandles.forEach((h) => h.remove());
    curve.bezierHandles.forEach(([hIn, hOut]) => {
      hIn.remove();
      hOut.remove();
    });
    curve.handleLines.forEach((line) => line.remove());
  });
  curves = [];
  currentCurveIndex = -1;
  curveSelect.innerHTML = "";
  paper.view.update();
});

// Bouton supprimer le point sélectionné
deletePointBtn.addEventListener("click", () => {
  const curve = curves[currentCurveIndex];
  console.log("Delete point", curve.selectedPointIndex);
  if (!curve) return;
  if (
    curve.selectedPointIndex !== null &&
    curve.selectedPointIndex >= 0 &&
    curve.selectedPointIndex < curve.path.segments.length
  ) {
    removePoint(curve.selectedPointIndex, curve);
    curve.selectedPointIndex = null;
  }
});

// Ajout d’un point
tool.onMouseDown = (event) => {
  const curve = curves[currentCurveIndex];
  if (!curve) return;
  let { path, pointsHandles, bezierHandles } = curve;

  let found = false;

  pointsHandles.forEach((h, i) => {
    if (h.contains(event.point)) {
      selectedHandleDown = h;
      handleType = "point";
      handleDownIndex = i;
      selectedPointIndex = i;
      found = true;
      curve.selectedPointIndex = i;
      console.log("Point selected", i);
    }
  });

  bezierHandles.forEach((pair, i) => {
    pair.forEach((h) => {
      if (h.contains(event.point)) {
        selectedHandleDown = h;
        handleType = "bezier";
        handleDownIndex = i;
        found = true;
      }
    });
  });

  if (!found) {
    selectedPointIndex = null; // aucun point sélectionné
    const newSegment = path.add(event.point);
    const segmentIndex = path.segments.length - 1;

    path.segments[segmentIndex].handleIn = new paper.Point(-50, 0);
    path.segments[segmentIndex].handleOut = new paper.Point(50, 0);

    pointsHandles.push(makeHandle(event.point, "red"));

    const handleInCircle = Object.assign(
      makeHandle(event.point.add(path.segments[segmentIndex].handleIn), "blue"),
      { type: "in" }
    );
    const handleOutCircle = Object.assign(
      makeHandle(
        event.point.add(path.segments[segmentIndex].handleOut),
        "blue"
      ),
      { type: "out" }
    );

    bezierHandles.push([handleInCircle, handleOutCircle]);
    updateHandleLines(curve);
  }
};

// Drag points ou handles
tool.onMouseDrag = (event) => {
  const curve = curves[currentCurveIndex];
  if (!curve) return;
  let { path, pointsHandles, bezierHandles } = curve;
  if (!selectedHandleDown) return;

  selectedHandleDown.position = event.point;

  if (handleType === "point") {
    const s = path.segments[handleDownIndex];
    const delta = event.delta;
    s.point = s.point.add(delta);

    const [hIn, hOut] = bezierHandles[handleDownIndex];
    hIn.position = s.point.add(s.handleIn);
    hOut.position = s.point.add(s.handleOut);
  } else if (handleType === "bezier") {
    const s = path.segments[handleDownIndex];
    const h = selectedHandleDown;
    if (h.type === "in") s.handleIn = h.position.subtract(s.point);
    else s.handleOut = h.position.subtract(s.point);
  }

  updateHandleLines(curve);
};

// Fin drag
tool.onMouseUp = () => {
  selectedHandleDown = null;
  handleType = "";
  handleDownIndex = -1;
  selectedPointIndex = null;
};

// Supprimer un point
function removePoint(index, curve) {
  if (index === null || index < 0 || index >= curve.path.segments.length)
    return;

  curve.path.removeSegment(index);
  curve.pointsHandles[index].remove();
  curve.bezierHandles[index][0].remove();
  curve.bezierHandles[index][1].remove();

  curve.pointsHandles.splice(index, 1);
  curve.bezierHandles.splice(index, 1);
  selectedPointIndex = null;

  updateHandleLines(curve);
}

// Met à jour les lignes de handles
function updateHandleLines(curve) {
  curve.handleLines.forEach((line) => line.remove());
  curve.handleLines = [];

  for (let i = 0; i < curve.pointsHandles.length; i++) {
    const point = curve.pointsHandles[i].position;
    const [hIn, hOut] = curve.bezierHandles[i];

    const lineIn = new paper.Path.Line({
      from: point,
      to: hIn.position,
      strokeColor: "gray",
      strokeWidth: 1,
      dashArray: [4, 4],
    });
    const lineOut = new paper.Path.Line({
      from: point,
      to: hOut.position,
      strokeColor: "gray",
      strokeWidth: 1,
      dashArray: [4, 4],
    });

    curve.handleLines.push(lineIn, lineOut);
  }

  paper.view.update();
}

// Créer la première courbe par défaut
createNewCurve();
