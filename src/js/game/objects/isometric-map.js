// Engine
import { canvasManager } from "../engine/canvas-manager";
import { assetsManager } from "../engine/assets-manager";

export default class IsometricMap {
  constructor() {
    this.tileMap = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

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
    // clear the canvas on every render
    canvasManager.setBackground();

    this.drawMap();
  }

  init() {
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

    this.updateMapOffset(
      canvasManager.viewportWidth / 2,
      canvasManager.viewportHeight / 4
    );
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

    const viewportRows = Math.ceil(
      canvasManager.viewportWidth / this.projectedTileWidth
    );

    const viewportCols = Math.ceil(
      canvasManager.viewportHeight / this.projectedTileHeight
    );

    const maxVisibleTiles = viewportRows + viewportCols;
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

        canvasManager.ctx.drawImage(
          assetsManager.assetsLoaded[drawTile],
          0,
          0,
          this.blockWidth,
          this.blockHeight,
          destinationPosition.x,
          destinationPosition.y,
          this.blockWidth,
          this.blockHeight
        );
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
}
