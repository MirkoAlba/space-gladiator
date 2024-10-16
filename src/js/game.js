import { isometricMapInstance } from "./isometric-map.js";
import { playerInstance } from "./player.js";

export default class Game {
  constructor() {
    // Control the FPS in all devices
    this.fps = 30;
    this.now = null;
    this.then = Date.now();
    this.interval = 1000 / this.fps;
    this.delta = null;

    // Normalize requestAnimationFrame
    var requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        return setTimeout(callback, 1000 / this.fps);
      };

    var cancelAnimationFrame =
      window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function (timer) {
        return clearTimeout(timer);
      };

    window.requestAnimationFrame = requestAnimationFrame;
    window.cancelAnimationFrame = cancelAnimationFrame;
  }

  async start() {
    // Init the map
    await isometricMapInstance.init();

    // Main render loop
    this.render();
  }

  render() {
    window.requestAnimationFrame(() => {
      this.render();
    });

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

      // Map
      isometricMapInstance.renderMap();

      // Player
      playerInstance.renderPlayer();
    }
  }
}
