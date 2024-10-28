// Engine
import { canvasManager } from "../engine/canvas-manager";
import { localStorageManager } from "../engine/local-storage-manager";

export default class Player {
  constructor() {
    // Starting position in tiles
    this.position = {
      x: 19,
      y: 4,
    };

    this.speed = 5;

    this.drawPlayer();
  }

  render() {}

  drawPlayer() {
    console.log("first");
  }
}
