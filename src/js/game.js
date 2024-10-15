import IsometricMap from "./isometric-map.js";

const isometricMap = new IsometricMap();

export default class Game {
  constructor() {}

  async start() {
    await isometricMap.init(
      "viewport",
      "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"
    );

    this.render();
  }

  render() {
    isometricMap.renderMap();

    window.requestAnimationFrame(() => {
      this.render();
    });
  }
}
