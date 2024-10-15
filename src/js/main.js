import Game from "./game.js";

const game = new Game();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    game.start();
  },
  false
);
