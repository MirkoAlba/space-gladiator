class IsometricMap {
  constructor() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.canvas = null;
    this.context = null;
    this.tileSheetImg = null;

    // Map data
    this.tileMap = null;
    this.rooms = null;
    this.mapWidth = null;
    this.mapHeight = null;

    // Offset the map position
    this.mapOffsetX = -200;
    this.mapOffsetY = -3500;

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
    this.overlapWidth = 2;
    this.overlapHeight = 2;

    this.projectedTileWidth =
      this.tileWidth - this.overlapWidth - this.overlapHeight;
    this.projectedTileHeight =
      this.tileHeight - this.overlapWidth - this.overlapHeight;
  }

  async init() {
    const canvasId = "viewport",
      tileSheetURI =
        "https://assets.codepen.io/6201207/codepen-iso-tilesheet.png";
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

    this.buildMap();

    this.updateMapOffset(this.viewportWidth / 2, this.viewportHeight / 4);

    this.onResize();

    this.renderMap();
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

  /**
   * Generate a random 2D map with a border of walls and an inner area of
   * terrain.
   *
   * @returns {undefined}
   */
  buildMap(minRooms = 6) {
    const currentMap = this.getCurrentMap();

    if (currentMap) {
      this.tileMap = currentMap.tileMap;
      return;
    }

    const mapWidth = Math.floor(Math.random() * 20) + minRooms * 20;
    const mapHeight = Math.floor(Math.random() * 20) + minRooms * 20;
    const map = Array(mapHeight)
      .fill()
      .map(() => Array(mapWidth).fill(-1));

    function createRoom() {
      const roomWidth = Math.floor(Math.random() * 9) + 16;
      const roomHeight = Math.floor(Math.random() * 9) + 16;
      const x = Math.floor(Math.random() * (mapWidth - roomWidth - 1)) + 1;
      const y = Math.floor(Math.random() * (mapHeight - roomHeight - 1)) + 1;
      return { x, y, width: roomWidth, height: roomHeight };
    }

    function isOverlapping(room, rooms) {
      return rooms.some(
        (r) =>
          room.x < r.x + r.width + 3 &&
          room.x + room.width + 3 > r.x &&
          room.y < r.y + r.height + 3 &&
          room.y + room.height + 3 > r.y
      );
    }

    const rooms = [];
    let attempts = 0;
    const maxAttempts = 1000;
    while (rooms.length < minRooms && attempts < maxAttempts) {
      const room = createRoom();
      if (!isOverlapping(room, rooms)) {
        rooms.push(room);
        attempts = 0;
      } else {
        attempts++;
      }
    }

    rooms.forEach((room) => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          map[y][x] = 1;
        }
      }
    });

    function drawCorridor(x1, y1, x2, y2) {
      const points = [];
      let x = x1,
        y = y1;
      while (x !== x2 || y !== y2) {
        if (Math.random() < 0.5) {
          if (x < x2) x = Math.min(x + 2, x2);
          else if (x > x2) x = Math.max(x - 2, x2);
          else if (y < y2) y = Math.min(y + 2, y2);
          else if (y > y2) y = Math.max(y - 2, y2);
        } else {
          if (y < y2) y = Math.min(y + 2, y2);
          else if (y > y2) y = Math.max(y - 2, y2);
          else if (x < x2) x = Math.min(x + 2, x2);
          else if (x > x2) x = Math.max(x - 2, x2);
        }
        points.push([x, y]);
      }
      return points;
    }

    function applyCorridorWidth(x, y) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
            if (map[ny][nx] === -1) {
              map[ny][nx] = 1;
            }
          }
        }
      }
    }

    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];
      const start = {
        x: room1.x + Math.floor(room1.width / 2),
        y: room1.y + Math.floor(room1.height / 2),
      };
      const end = {
        x: room2.x + Math.floor(room2.width / 2),
        y: room2.y + Math.floor(room2.height / 2),
      };
      const corridor = drawCorridor(start.x, start.y, end.x, end.y);
      corridor.forEach(([x, y]) => {
        applyCorridorWidth(x, y);
      });
    }

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (map[y][x] === -1 && hasAdjacentFloor(x, y)) {
          map[y][x] = 0;
        }
      }
    }

    function hasAdjacentFloor(x, y) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx,
            ny = y + dy;
          if (
            nx >= 0 &&
            nx < mapWidth &&
            ny >= 0 &&
            ny < mapHeight &&
            map[ny][nx] === 1
          ) {
            return true;
          }
        }
      }
      return false;
    }

    this.tileMap = map;
    this.rooms = rooms;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.saveCurrentMap();
  }

  findRightmostRoom(rooms) {
    if (!rooms || rooms.length === 0) {
      console.error("No rooms provided to findRightmostRoom");
      return null;
    }

    return rooms.reduce((rightmost, room) => {
      const roomRightEdge = room.x + room.width;
      const rightmostRightEdge = rightmost.x + rightmost.width;

      return roomRightEdge > rightmostRightEdge ? room : rightmost;
    });
  }

  /**
   * Gets the current map data from local storage
   * @returns {Object} Current map data { tileMap, width, height }
   */
  getCurrentMap() {
    return JSON.parse(localStorage.getItem("spgr")).map;
  }

  /**
   * Saves the current map to local storage
   * @param {Object} map The map data to be saved
   */
  saveCurrentMap() {
    const gameData = JSON.parse(localStorage.getItem("spgr")) || {};

    gameData.map = {
      tileMap: this.tileMap,
      rooms: this.rooms,
      width: this.mapWidth,
      height: this.mapHeight,
    };

    const gameDataJson = JSON.stringify(gameData);

    localStorage.setItem("spgr", gameDataJson);
  }

  onResize() {
    window.addEventListener("resize", () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.canvas.width = this.viewportWidth;
      this.canvas.height = this.viewportHeight;
    });
  }

  renderMap() {
    this.clearViewport("#1A1B1F");
    this.draw();
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

    var firstVisbleTile = this.convertScreenToTile(
      -this.mapOffsetX,
      -this.mapOffsetY
    );

    var firstVisibleTileX = firstVisbleTile.x;
    var firstVisibleTileY = firstVisbleTile.y;

    // var viewportRows = Math.ceil(this.viewportWidth / this.projectedTileWidth);
    // var viewportCols = Math.ceil(
    //   this.viewportHeight / this.projectedTileHeight
    // );

    // var maxVisibleTiles = viewportRows + viewportCols;
    var maxVisibleTiles = 100;
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

export const isometricMapInstance = new IsometricMap();
