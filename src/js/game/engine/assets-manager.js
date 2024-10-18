class AssetsManager {
  constructor() {
    this.assets = ["assets/map/earth.png", "assets/map/wall.png"];
    this.successMessage = "Assets loaded successfully";
    this.errorMessage = "Assets failed to load:";
  }

  async loadAssets() {
    const assetsPromises = this.assets.map(this.loadImage.bind(this));

    await Promise.all(assetsPromises);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      var asset = new Image();

      asset.onload = () => resolve(this.successMessage);
      asset.onerror = () => reject(this.errorMessage + " " + url);
      asset.src = url;
    });
  }
}

export const assetsManager = new AssetsManager();
