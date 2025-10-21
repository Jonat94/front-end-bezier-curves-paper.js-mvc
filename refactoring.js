
// stockage fonction temproraire refactoring

  renderCurves(curves, visibility) {
    this.clear();
    curves.forEach((curve) => this.drawShape(curve, visibility));
    curves.forEach((curve) => this.drawOffset(curve, visibility_offset));

    curves.forEach((curve) => this.filterOffsetPointsBelowCurve(curve));

    curves.forEach((curve) => this.sortOffsetPointsAlongCurve(curve));

    curves.forEach((curve) => this.drawOffset(curve));

    //this.showPointsWithIndex(curves[0].offsetData.points);
    paper.view.update();
  }











    drawOffset(curve, visibility = true) {
    if (!visibility || !curve.offsetData?.points?.length) return;

    // Crée un chemin temporaire pour accéder aux tangentes, si besoin
    const path = new paper.Path();
    curve.handles.forEach((p) => path.add(p.segt));

    // --- 🟦 Réordonnancement du tableau d’offsets ---
    const start = curve.handles[0].segt.point;
    let closestIndex = 0;
    let minDist = Infinity;

    curve.offsetData.points.forEach((pt, i) => {
      const dist = pt.getDistance(start);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex > 0) {
      // rotation du tableau : le point le plus proche passe en premier
      const rotated = [
        ...curve.offsetData.points.slice(closestIndex),
        ...curve.offsetData.points.slice(0, closestIndex),
      ];
      curve.offsetData.points = rotated;
    }

    // --- 🟥 Dessin de la courbe d’offset ---
    const bez = new paper.Path({
      strokeColor: "green",
      strokeWidth: 1,
      visible: visibility,
    });

    bez.addSegments(curve.offsetData.points);
  }









  


  sortOffsetPointsAlongCurve(curve, sampleStep = 5) {
    if (!curve.offsetData?.points?.length) return [];

    // 1️⃣ Créer un path temporaire à partir des points de la courbe principal
    const path = new paper.Path();
    path.visible = false;
    curve.handles.forEach((p) => path.add(p.segt));

    // 2️⃣ Pour chaque point d'offset, trouver sa position sur le path
    const pointsWithOffset = curve.offsetData.points.map((pt) => {
      const paperPt = new paper.Point(pt.x, pt.y);
      const location = path.getNearestLocation(paperPt);
      return { pt, offset: location.offset };
    });

    // 3️⃣ Trier les points selon leur offset le long du path
    pointsWithOffset.sort((a, b) => a.offset - b.offset);

    // 4️⃣ Extraire seulement les points triés
    const sortedPoints = pointsWithOffset.map((p) => p.pt);

    // 5️⃣ Mettre à jour offsetData
    curve.offsetData.points = sortedPoints;

    return sortedPoints;
  }