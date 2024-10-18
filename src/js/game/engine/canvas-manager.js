class CanvasManager {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.canvas = document.getElementById("game");
    this.context = this.canvas.getContext("2d");
    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;
  }
}

export const canvasManager = new CanvasManager();
