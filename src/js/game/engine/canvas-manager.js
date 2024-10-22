class CanvasManager {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;

    this.backgroundColor = "#1A1B1F";
  }

  setBackground() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  // Handle loading screen
  showLoadingScreen() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "LOADING...",
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  hideLoadingScreen() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.setBackground();
  }
}

export const canvasManager = new CanvasManager();
