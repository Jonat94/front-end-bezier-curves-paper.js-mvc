"use strict";
import paper from "paper";

export function initPaper(canvasId = "canvas") {
  const canvas = document.getElementById(canvasId);
  paper.setup(canvas);
  return paper;
}

// On exporte une instance globale unique
export default paper;
