import IsometricMap from "./isometric-map.js";

function init() {
  let isometricMap = new IsometricMap();

  isometricMap.init(
    "viewport",
    "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"
  );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    init();
  },
  false
);
