class AssetsManager {
  constructor() {
    this.assets = ["assets/map/earth.png", "assets/map/wall.png"];
    this.errorMessage = "Assets failed to load:";

    this.assetsLoaded = [];
  }

  async loadAssets() {
    const assetsPromises = this.assets.map(this.loadImage.bind(this));

    this.assetsLoaded = await Promise.all(assetsPromises);

    return true;
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      var asset = new Image();

      asset.onload = () => resolve(asset); // the value to be returned
      asset.onerror = () => reject(this.errorMessage + " " + url);
      asset.src = url;
    });
  }
}

export const assetsManager = new AssetsManager();
