import type { LifeSystem } from "../context.ts";
import "./items.ts";

// Cooking: recipes at the tavern kitchen with Bram, and baking once the bakery stands (LIFE.md). Opens when the tavern is finished.
export const COOKING: LifeSystem = {
  id: "cooking",
  install() {},
};
