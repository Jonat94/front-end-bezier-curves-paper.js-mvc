import paper from "paper";

export default class DrawingController {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.currentPath = null;
    this.tempShape = null;
    this.startPoint = null;

    // gestion des clics sur les objets
    this.view.onShapeClick = (selected) => {
      if (this.model.selectedShape) {
        this.view.clearHighlight(this.model.selectedShape);
        this.model.clearSelection();
      } else {
        this.view.highlightShape(selected);
        this.model.selectShape(selected);
      }
    };

    this._setupTool();
  }

  _setupTool() {
    const tool = new paper.Tool();

    tool.onMouseDown = (event) => {
      if (this.model.currentTool === "pen") {
        this.currentPath = new paper.Path();
        this.currentPath.strokeColor = this.model.currentColor;
        this.currentPath.strokeWidth = this.model.currentStrokeWidth;
        this.currentPath.add(event.point);
      } else if (
        this.model.currentTool === "rectangle" ||
        this.model.currentTool === "circle"
      ) {
        this.startPoint = event.point;
      }
    };

    tool.onMouseDrag = (event) => {
      if (this.model.currentTool === "pen") {
        this.currentPath.add(event.point);
      } else if (this.model.currentTool === "rectangle") {
        this.view.clear();
        this.tempShape = new paper.Path.Rectangle(this.startPoint, event.point);
        this.tempShape.strokeColor = this.model.currentColor;
      } else if (this.model.currentTool === "circle") {
        this.view.clear();
        const radius = this.startPoint.getDistance(event.point);
        this.tempShape = new paper.Path.Circle(this.startPoint, radius);
        this.tempShape.strokeColor = this.model.currentColor;
      }
    };

    tool.onMouseUp = (event) => {
      if (this.model.currentTool === "pen") {
        this.model.addShape({
          type: "path",
          points: this.currentPath.segments.map((s) => s.point),
          color: this.model.currentColor,
          strokeWidth: this.model.currentStrokeWidth,
        });
      } else if (this.model.currentTool === "rectangle") {
        this.model.addShape({
          type: "rectangle",
          from: this.startPoint,
          to: event.point,
          color: this.model.currentColor,
          strokeWidth: this.model.currentStrokeWidth,
        });
      } else if (this.model.currentTool === "circle") {
        const radius = this.startPoint.getDistance(event.point);
        this.model.addShape({
          type: "circle",
          center: this.startPoint,
          radius,
          color: this.model.currentColor,
          strokeWidth: this.model.currentStrokeWidth,
        });
      }
      this.view.render(this.model.shapes);
    };
  }
}
