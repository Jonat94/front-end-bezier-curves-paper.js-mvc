import paper from "paper";
export default class ToolController {
  constructor(model, toolbarView, canvasView) {
    this.model = model;
    this.toolbarView = toolbarView;
    this.canvasView = canvasView;
    this.model.createNewCurve();
    this.toolbarView.updateCurveList(this.model.curves);

    this.toolbarView.bindAddCurve(() => {
      console.log("Ajouter une nouvelle courbe");
      this.model.createNewCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      console.log(
        "Courbe courante après ajout :",
        this.model.currentCurveIndex
      );
      this.toolbarView.setSelectedCurve(this.model.currentCurveIndex);
    });

    this.toolbarView.bindDeleteCurve(() => {
      console.log(
        "Supprimer la courbe courante :",
        this.model.currentCurveIndex
      );
      this.model.deleteCurrentCurve();
      this.toolbarView.updateCurveList(this.model.curves);
      this.canvasView.renderCurves(this.model.curves);
    });

    this.toolbarView.bindCurveSelect((index) => {
      this.model.currentCurveIndex = index;
      console.log(
        "Changement de courbe sélectionnée vers l'index :",
        index,
        this.model.currentCurveIndex
      );
    });

    this.toolbarView.bindToggleHandles(() => {
      console.log("Basculer la visibilité des handles");
      this.model.handlesVisible = !this.model.handlesVisible;
      this.canvasView.renderCurves(
        this.model.curves,
        this.model.handlesVisible
      );
    });

    //this.deleteBtn = document.getElementById("deleteBtn");

    // this.toolbarView.bindToolChange((tool) => this.model.setTool(tool));
    // this.toolbarView.bindColorChange((color) => this.model.setColor(color));
    // this.toolbarView.bindClear(() => {
    //   this.model.clear();
    //   this.canvasView.render([]);
    // });
    // this.toolbarView.bindDelete(() => {
    //   this.model.removeSelected();
    //   this.canvasView.render(this.model.shapes);
    // });

    // Crée une nouvelle courbe vide
  }
}
