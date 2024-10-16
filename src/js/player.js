import { isometricMapInstance } from "./isometric-map.js";

class Player {
  constructor() {}

  renderPlayer() {
    const tileToScreen = isometricMapInstance.convertTileToScreen(94, 88);
  }
}

export const playerInstance = new Player();
