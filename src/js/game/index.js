// Engine
import { assetsManager } from "./engine/assets-manager.js";
import { canvasManager } from "./engine/canvas-manager.js";

// Objects
import IsometricMap from "./objects/isometric-map.js";
import Player from "./objects/player.js";

// Utils
import { normalizeRAF } from "./utils/index.js";

export default class Game {
  constructor() {
    // Game settings
    this.fps = 60; // Control the FPS in all devices
    this.now = null;
    this.then = Date.now();
    this.interval = 1000 / this.fps;
    this.delta = null;
    this.isRunning = false;

    // Objects
    this.isometricMap = null;
    this.player = null;

    // Normalize requestAnimationFrame
    normalizeRAF();
  }

  // Initialize the Game objects
  async start() {
    // Load assets
    try {
      canvasManager.showLoadingScreen();

      const assetsLoaded = await assetsManager.loadAssets();

      if (assetsLoaded) {
        canvasManager.hideLoadingScreen();

        this.isometricMap = new IsometricMap();
        // this.player = new Player();

        this.isRunning = true;

        this.render();
      }
    } catch (errorMessage) {
      console.error(errorMessage);
    }
  }

  stop() {
    this.isRunning = false;
  }

  render() {
    if (!this.isRunning) return;

    this.now = Date.now();
    this.delta = this.now - this.then;

    if (this.delta > this.interval) {
      // update time stuffs

      // Just `then = now` is not enough.
      // Lets say we set fps at 10 which means
      // each frame must take 100ms
      // Now frame executes in 16ms (60fps) so
      // the loop iterates 7 times (16*7 = 112ms) until
      // delta > interval === true
      // Eventually this lowers down the FPS as
      // 112*10 = 1120ms (NOT 1000ms).
      // So we have to get rid of that extra 12ms
      // by subtracting delta (112) % interval (100).
      // Hope that makes sense.

      this.then = this.now - (this.delta % this.interval);

      // ---------- Rendering objects ----------
      this.isometricMap.render();
    }

    window.requestAnimationFrame(() => {
      this.render();
    });
  }
}
