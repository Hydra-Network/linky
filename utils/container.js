class Container {
  #services = new Map();

  register(key, value) {
    this.#services.set(key, value);
    return this;
  }

  get(key) {
    const service = this.#services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered in container`);
    }
    return service;
  }

  has(key) {
    return this.#services.has(key);
  }
}

export const container = new Container();
