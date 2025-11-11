"use strict";
import { initPaper } from "./utils/PaperSetup.js";
import paper from "paper";
import ClipperLib from "clipper-lib";
import CanvasView from "./view/CanevasView.js";
import ToolbarView from "./view/ToolbarView.js";
import DrawingController from "./controller/DrawingController.js";
import ToolController from "./controller/ToolController.js";
import CurveModel from "./model/CurveModel.js";
import CurveProcessor from "./services/CurveProcessor.js";

const canvas = document.getElementById("canvas");
paper.setup(canvas);

// const model = new DrawingModel();
// const canvasView = new CanvasView(canvas);
const toolbarView = new ToolbarView();
// const drawingController = new DrawingController(model, canvasView);
const model = new CurveModel();
const canvasView = new CanvasView(canvas);
const drawingController = new DrawingController(model, canvasView);
new ToolController(model, toolbarView, canvasView, drawingController);
