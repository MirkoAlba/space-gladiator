import Game from "./game/index.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const game = new Game();

    game.start();
  },
  false
);
