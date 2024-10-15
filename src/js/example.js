export default class IsometricMap {
  constructor() {
    // this.viewportWidth = window.innerWidth;
    // this.viewportHeight = window.innerHeight;

    this.viewportWidth = 800;
    this.viewportHeight = 800;

    this.canvas = null;
    this.context = null;
    this.tileSheetImg = null;
    this.tileMap = null;

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

    // How many tile sprites are on each row of the sprite sheet?
    this.spriteColumns = 5;

    // How much spacing/padding is around each tile sprite.
    this.spritePadding = 2;

    // The full dimensions of the tile sprite.
    this.blockWidth = 74;
    this.blockHeight = 70;

    // The "top only" dimensions of the tile sprite.
    this.tileWidth = 74;
    this.tileHeight = 44;

    // How much the tiles should overlap when drawn.
    this.overlapWidth = 1;
    this.overlapHeight = 1;

    this.projectedTileWidth =
      this.tileWidth - this.overlapWidth - this.overlapHeight;

    this.projectedTileHeight =
      this.tileHeight - this.overlapWidth - this.overlapHeight;

    // Main Loop
    this.updateId = null;
    this.previousDelta = null;
    this.fpsLimit = 60;
  }

  async init(canvasId, tileSheetURI) {
    this.canvas = document.getElementById(canvasId);

    if (this.canvas == null) {
      console.error("Could not find canvas with id: " + canvasId);
      return;
    }

    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;

    this.context = this.canvas.getContext("2d");

    this.clearViewport("#1A1B1F");
    this.showLoadingPlaceholder();

    this.tileSheetImg = await this.loadImage(tileSheetURI);

    this.buildMap();

    this.canvas.onmouseclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    this.canvas.oncontextmenu = (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    this.canvas.onmouseup = (e) => {
      this.mouseDown = false;
      return false;
    };

    this.canvas.onmousedown = (e) => {
      this.mouseDown = true;
      return false;
    };

    this.canvas.onmousemove = (e) => {
      this.onMouseMove(e);
    };

    this.updateMapOffset(this.viewportWidth / 2, this.viewportHeight / 4);

    this.mainLoop();

    this.onResize();
  }

  onResize() {
    window.addEventListener("resize", () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;

      this.canvas.width = this.viewportWidth;
      this.canvas.height = this.viewportHeight;
    });
  }

  clearViewport(color) {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  showLoadingPlaceholder() {
    this.context.font = "14px Tahoma";
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = "#EEEEEE";

    var textX = this.viewportWidth / 2;
    var textY = this.viewportHeight / 2;

    this.context.fillText("LOADING ASSETS...", textX, textY);
  }

  async loadImage(uri) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = uri;
    });
  }

  // min and max included
  randomInt(min, max) {
    return Math.floor(Math.random() * ((max - min) / 2)) * 2 + min;
  }

  /**
   * Generate a random 2D map with a border of walls and an inner area of
   * terrain.
   *
   * @returns {undefined}
   */
  buildMap() {
    const width = this.randomInt(12, 40),
      height = this.randomInt(12, 40);

    const room = [];
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        if (i < 2 || j < 2 || i >= height - 2 || j >= width - 2) {
          row.push(0); // muro
        } else {
          row.push(1); // terreno
        }
      }
      room.push(row);
    }

    this.tileMap = room;
  }

  mainLoop(currentDelta) {
    this.clearViewport("#1A1B1F");
    this.draw();

    requestAnimationFrame(this.mainLoop.bind(this, currentDelta));
  }

  limit(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  /**
   * Maps a screen (x, y) coordinate to a tile (x, y) coordinate.
   * @param {number} screenX
   * @param {number} screenY
   * @returns {{x: number, y: number}} The tile (x, y) coordinate.
   */
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

    console.log(tileX, tileY);

    return { x: tileX, y: tileY };
  }

  /**
   * Given a tile's x and y coordinates, returns an object with the corresponding
   * screen x and y coordinates.
   *
   * @param {number} tileX - The tile's x coordinate.
   * @param {number} tileY - The tile's y coordinate.
   * @returns {Object} - An object with the screen x and y coordinates, accessible
   *                    via the `x` and `y` properties.
   */
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

    var firstVisbleTile = this.convertScreenToTile(
      -this.mapOffsetX,
      -this.mapOffsetY
    );

    var firstVisibleTileX = firstVisbleTile.x;
    var firstVisibleTileY = firstVisbleTile.y;

    var viewportRows = Math.ceil(this.viewportWidth / this.projectedTileWidth);
    var viewportCols = Math.ceil(
      this.viewportHeight / this.projectedTileHeight
    );

    var maxVisibleTiles = viewportRows + viewportCols;
    var halfVisibleTiles = Math.ceil(maxVisibleTiles / 2);

    this.renderStartX = Math.max(firstVisibleTileX, 0);
    this.renderStartY = Math.max(firstVisibleTileY - halfVisibleTiles + 1, 0);

    this.renderFinishX = Math.min(
      firstVisibleTileX + maxVisibleTiles,
      this.tileMap.length - 1
    );
    this.renderFinishY = Math.min(
      firstVisibleTileY + halfVisibleTiles + 1,
      this.tileMap[0].length - 1
    );
  }

  draw() {
    for (var x = this.renderStartX; x <= this.renderFinishX; x++) {
      for (var y = this.renderStartY; y <= this.renderFinishY; y++) {
        var drawTile = this.tileMap[x][y];

        var spriteWidth = this.blockWidth + 2 * this.spritePadding;
        var spriteHeight = this.blockHeight + 2 * this.spritePadding;

        var srcX =
          (drawTile % this.spriteColumns) * spriteWidth + this.spritePadding;
        var srcY =
          Math.floor(drawTile / this.spriteColumns) * spriteHeight +
          this.spritePadding;

        var destPos = this.convertTileToScreen(x, y);
        console.log(destPos);
        var destX = destPos.x;
        var destY = destPos.y;
        var destWidth = this.blockWidth;
        var destHeight = this.blockHeight;

        this.context.drawImage(
          this.tileSheetImg,
          srcX,
          srcY,
          this.blockWidth,
          this.blockHeight,
          destX,
          destY,
          destWidth,
          destHeight
        );
      }
    }

    this.drawCursor();
  }

  drawCursor() {
    let screenPos = this.convertTileToScreen(this.mouseTileX, this.mouseTileY);
    let screenX = screenPos.x;
    let screenY = screenPos.y;

    // to save images, the mouse cursor is just a tile sprite
    var drawTile = 15;

    var spriteWidth = this.blockWidth + 2 * this.spritePadding;
    var spriteHeight = this.blockHeight + 2 * this.spritePadding;

    var srcX =
      (drawTile % this.spriteColumns) * spriteWidth + this.spritePadding;
    var srcY =
      Math.floor(drawTile / this.spriteColumns) * spriteHeight +
      this.spritePadding;

    this.context.drawImage(
      this.tileSheetImg,
      srcX,
      srcY,
      this.blockWidth,
      this.blockHeight,
      screenX,
      screenY,
      this.blockWidth,
      this.blockHeight
    );

    // output the tile location of the mouse
    this.context.font = "bold 11px Tahoma";
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = "#F15A24";

    let textX = screenX + this.projectedTileWidth / 2;
    let textY = screenY + this.projectedTileHeight / 2;

    let text = "(" + this.mouseTileX + ", " + this.mouseTileY + ")";

    this.context.fillText(text, textX, textY);
  }

  onMouseMove(e) {
    if (
      !Array.isArray(this.tileMap) ||
      this.tileMap.length < 1 ||
      this.tileMap[0].length < 1
    )
      return;

    let rect = this.canvas.getBoundingClientRect();

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
