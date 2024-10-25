class LocalStorageManager {
  constructor() {
    this.textDomain = "spgr";

    this.options = {};
  }

  get(key) {
    let savedOptions = localStorage.getItem(this.textDomain) || "{}";

    savedOptions = JSON.parse(savedOptions);

    return savedOptions && savedOptions[key];
  }

  set(key, value) {
    this.options[key] = value;

    localStorage.setItem(this.textDomain, JSON.stringify(this.options));
  }
}

export const localStorageManager = new LocalStorageManager();
