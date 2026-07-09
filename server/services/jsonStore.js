import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

export function jsonStore(fileName) {
  const filePath = path.resolve(config.rootDir, "server/data", fileName);
  return {
    async read() {
      return JSON.parse(await fs.readFile(filePath, "utf-8"));
    },
    async write(data) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return data;
    },
  };
}
