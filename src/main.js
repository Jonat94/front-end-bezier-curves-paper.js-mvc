import DrawingModel from "./model/DrawingModel.js";
import CanvasView from "./view/CanevasView.js";
import ToolbarView from "./view/ToolbarView.js";
import DrawingController from "./controller/DrawingController.js";
import ToolController from "./controller/ToolController.js";

window.onload = () => {
  const canvas = document.getElementById("myCanvas");
  const model = new DrawingModel();
  const canvasView = new CanvasView(canvas);
  const toolbarView = new ToolbarView();

  new ToolController(model, toolbarView, canvasView);
  new DrawingController(model, canvasView);
};
