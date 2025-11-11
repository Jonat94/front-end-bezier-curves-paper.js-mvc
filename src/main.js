"use strict";
import { initPaper } from "./utils/paperSetup.js";
import paper from "./utils/paperSetup.js";
import * as ClipperLib from "clipper-lib";
import DrawingModel from "./model/DrawingModel.js";
import CanvasView from "./view/CanevasView.js";
import ToolbarView from "./view/ToolbarView.js";
import DrawingController from "./controller/DrawingController.js";
import ToolController from "./controller/ToolController.js";
import CurveModel from "./model/CurveModel.js";
import CurveProcessor from "./services/CurveProcessor.js";

window.onload = () => {
  const paperInstance = initPaper("canvas"); // setup unique
  console.log("Paper project ID:", paper.project);

  // const model = new DrawingModel();
  // const canvasView = new CanvasView(canvas);
  const toolbarView = new ToolbarView();
  // const drawingController = new DrawingController(model, canvasView);
  const model = new CurveModel();
  const canvasView = new CanvasView(canvas);
  const drawingController = new DrawingController(model, canvasView);
  new ToolController(model, toolbarView, canvasView, drawingController);
};
