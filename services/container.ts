import type { Client } from "discord.js";
import type { Logger } from "pino";
import type { getItem as dbGetItem, setItem as dbSetItem } from "@/db/index.js";

interface DbMethods {
  getItem: typeof dbGetItem;
  setItem: typeof dbSetItem;
}

export interface AppContainer {
  get(key: "logger"): Logger;
  get(key: "client"): Client<true>;
  get(key: "db"): DbMethods;
}

class Container implements AppContainer {
  #services = new Map<string, unknown>();

  register<T>(key: string, value: T): this {
    this.#services.set(key, value as unknown);
    return this;
  }

  get(key: "logger"): Logger;
  get(key: "client"): Client<true>;
  get(key: "db"): DbMethods;
  get(key: string): unknown {
    const service = this.#services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered in container`);
    }
    return service;
  }

  has(key: string): boolean {
    return this.#services.has(key);
  }
}

export const container = new Container();
