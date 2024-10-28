// Engine
import { canvasManager } from "../engine/canvas-manager";
import { assetsManager } from "../engine/assets-manager";
import { localStorageManager } from "../engine/local-storage-manager";

export default class IsometricMap {
  constructor() {
    this.TILE_TYPES = {
      // Constants, check the order of the assets in the array inside assets-manager.js
      WALL: 0,
      GROUND: 1,
      EMPTY: -1,
    };

    this.tileMap = this.generateMap();

    this.mapOffsetX = 0;
    this.mapOffsetY = 0;

    this.mouseDown = false;
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.mouseTileX = 0;
    this.mouseTileY = 0;

    // The range of tiles to render based on visibility.
    // Will be updated as map is dragged around.
    this.renderStartX = 0;
    this.renderStartY = 0;
    this.renderFinishX = 0;
    this.renderFinishY = 0;

    // The full dimensions of the tile sprite.
    this.blockWidth = 74;
    this.blockHeight = 70;

    // The "top only" dimensions of the tile sprite.
    this.tileWidth = 74;
    this.tileHeight = 44;

    // How much the tiles should overlap when drawn.
    this.overlapWidth = 2;
    this.overlapHeight = 2;

    this.projectedTileWidth =
      this.tileWidth - this.overlapWidth - this.overlapHeight;

    this.projectedTileHeight =
      this.tileHeight - this.overlapWidth - this.overlapHeight;

    this.init();
  }

  render() {
    // Clear the canvas on every render
    canvasManager.setBackground();

    this.drawMap();
  }

  init() {
    this.onResize();

    canvasManager.canvas.onmouseclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    canvasManager.canvas.oncontextmenu = (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    canvasManager.canvas.onmouseup = (e) => {
      this.mouseDown = false;
      return false;
    };

    canvasManager.canvas.onmousedown = (e) => {
      this.mouseDown = true;
      return false;
    };

    canvasManager.canvas.onmousemove = (e) => {
      this.onMouseMove(e);
    };

    // const xPixelsOffset = canvasManager.viewportWidth / 2,
    //   yPixelsOffset = -canvasManager.viewportHeight / 2;

    const xPixelsOffset = 0,
      yPixelsOffset = 0;

    this.updateMapOffset(xPixelsOffset, yPixelsOffset);
  }

  onResize() {
    window.addEventListener("resize", () => {
      canvasManager.viewportWidth = window.innerWidth;
      canvasManager.viewportHeight = window.innerHeight;

      canvasManager.canvas.width = canvasManager.viewportWidth;
      canvasManager.canvas.height = canvasManager.viewportHeight;
    });
  }

  limit(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  convertScreenToTile(screenX, screenY) {
    let mappedX = screenX / this.projectedTileWidth;
    let mappedY = screenY / this.projectedTileHeight;

    let maxTileX = this.tileMap.length - 1;
    let maxTileY =
      Array.isArray(this.tileMap) && this.tileMap.length > 0
        ? this.tileMap[0].length - 1
        : 0;

    let tileX = this.limit(Math.round(mappedX + mappedY) - 1, 0, maxTileX);
    let tileY = this.limit(Math.round(-mappedX + mappedY), 0, maxTileY);

    return { x: tileX, y: tileY };
  }

  convertTileToScreen(tileX, tileY) {
    var isoX = tileX - tileY;
    var isoY = tileX + tileY;

    var screenX =
      this.mapOffsetX + isoX * (this.tileWidth / 2 - this.overlapWidth);
    var screenY =
      this.mapOffsetY + isoY * (this.tileHeight / 2 - this.overlapHeight);

    return { x: screenX, y: screenY };
  }

  updateMapOffset(deltaX, deltaY) {
    this.mapOffsetX += deltaX;
    this.mapOffsetY += deltaY;

    const firstVisibleTile = this.convertScreenToTile(
      -this.mapOffsetX,
      -this.mapOffsetY
    );

    // const viewportRows = Math.ceil(
    //   canvasManager.viewportWidth / this.projectedTileWidth
    // );

    // const viewportCols = Math.ceil(
    //   canvasManager.viewportHeight / this.projectedTileHeight
    // );

    const maxVisibleTiles = this.tileMap.length;
    const halfVisibleTiles = Math.ceil(maxVisibleTiles / 2);

    this.renderStartX = 0;
    this.renderStartY = 0;

    this.renderFinishX = Math.min(
      firstVisibleTile.x + maxVisibleTiles,
      this.tileMap.length - 1
    );

    this.renderFinishY = Math.min(
      firstVisibleTile.y + halfVisibleTiles + 1,
      this.tileMap[0].length - 1
    );
  }

  drawMap() {
    for (let x = this.renderStartX; x <= this.renderFinishX; x++) {
      for (let y = this.renderStartY; y <= this.renderFinishY; y++) {
        const drawTile = this.tileMap[x][y];

        const destinationPosition = this.convertTileToScreen(x, y);

        if (drawTile !== -1) {
          canvasManager.ctx.drawImage(
            assetsManager.assetsLoaded[drawTile], // img object
            0, // source x (where to start to draw the image in the img object)
            0, // source y (where to start to draw the image in the img object)
            this.blockWidth, // source width
            this.blockHeight, // source height
            destinationPosition.x, // x coordinate in the destination canvas at which to place the top-left corner of the source image.
            destinationPosition.y, // y coordinate in the destination canvas at which to place the top-left corner of the source image.
            this.blockWidth, // The width to draw the image in the destination canvas
            this.blockHeight // The height to draw the image in the destination canvas
          );
        }
      }
    }

    this.drawCursor();
  }

  drawCursor() {
    let screenPos = this.convertTileToScreen(this.mouseTileX, this.mouseTileY);
    let screenX = screenPos.x;
    let screenY = screenPos.y;

    // output the tile location of the mouse
    canvasManager.ctx.font = "bold 11px Tahoma";
    canvasManager.ctx.textAlign = "center";
    canvasManager.ctx.textBaseline = "middle";
    canvasManager.ctx.fillStyle = "#F15A24";

    let textX = screenX + this.projectedTileWidth / 2;
    let textY = screenY + this.projectedTileHeight / 2;

    let text = "(" + this.mouseTileX + ", " + this.mouseTileY + ")";

    canvasManager.ctx.fillText(text, textX, textY);
  }

  onMouseMove(e) {
    if (
      !Array.isArray(this.tileMap) ||
      this.tileMap.length < 1 ||
      this.tileMap[0].length < 1
    )
      return;

    let rect = canvasManager.canvas.getBoundingClientRect();

    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;

    let mouseDeltaX = newX - this.mouseScreenX;
    let mouseDeltaY = newY - this.mouseScreenY;

    this.mouseScreenX = newX;
    this.mouseScreenY = newY;

    let mouseTilePos = this.convertScreenToTile(
      this.mouseScreenX - this.mapOffsetX,
      this.mouseScreenY - this.mapOffsetY
    );

    this.mouseTileX = mouseTilePos.x;
    this.mouseTileY = mouseTilePos.y;

    if (this.mouseDown) this.updateMapOffset(mouseDeltaX, mouseDeltaY);
  }

  /**
   * Applies one step of the cellular automata rules
   * @param {Array<Array<number>>} map - The current map state
   * @param {number} size - Size of the map
   * @param {number} neighborhoodRule - Cellular automata rules
   * @returns {Array<Array<number>>} - New map state after applying rules
   */
  applyCARule(map, size, neighborhoodRule = 4) {
    const newMap = Array(size)
      .fill()
      .map(() => Array(size).fill(0));

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let wallCount = 0;

        // Count walls in Moore neighborhood (8 surrounding cells)
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;

            const newX = x + i;
            const newY = y + j;

            // Count edges as walls
            if (newX < 0 || newX >= size || newY < 0 || newY >= size) {
              wallCount++;
            } else if (map[newX][newY] === this.TILE_TYPES.WALL) {
              wallCount++;
            }
          }
        }

        // Apply cellular automata rules
        // If a cell has 4 or more wall neighbors, it becomes a wall
        // If a cell has 3 or fewer wall neighbors, it becomes ground
        if (wallCount >= neighborhoodRule) {
          newMap[x][y] = this.TILE_TYPES.WALL;
        } else {
          newMap[x][y] = this.TILE_TYPES.GROUND;
        }
      }
    }

    return newMap;
  }

  /**
   * Map generator using Cellular Automata
   * @param {number} minSize - Minimum size of the map
   * @param {number} maxSize - Maximum size of the map
   * @param {number} wallProbability - Probability of walls
   * @param {number} iterations - Number of iterations of the CA
   * @returns {Array<Array<number>>} - Generated map
   */
  generateMap(
    minSize = 64,
    maxSize = 128,
    wallProbability = 0.3,
    iterations = 3
  ) {
    let map = localStorageManager.get("map");

    if (map) {
      return map;
    }

    // Random number between minSize and maxSize multiple of 2
    const size =
      Math.floor(Math.random() * ((maxSize - minSize) / 2 + 1)) * 2 + minSize;

    // Initialize map randomly
    map = Array(size)
      .fill()
      .map(() =>
        Array(size)
          .fill()
          .map(() =>
            Math.random() < wallProbability
              ? this.TILE_TYPES.WALL
              : this.TILE_TYPES.GROUND
          )
      );

    // Apply CA rules multiple times

    for (let i = 0; i < iterations; i++) {
      map = this.applyCARule(map, size);
    }

    // Ensure borders are walls
    for (let x = 0; x < size; x++) {
      map[x][0] = this.TILE_TYPES.WALL;
      map[x][size - 1] = this.TILE_TYPES.WALL;
      map[0][x] = this.TILE_TYPES.WALL;
      map[size - 1][x] = this.TILE_TYPES.WALL;
    }

    localStorageManager.set("map", map);

    return map;
  }
}
