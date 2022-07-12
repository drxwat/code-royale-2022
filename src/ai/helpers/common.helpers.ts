import { Item } from "../../model/item";
import { Vec2 } from "../../model/vec2";
import { SectorSafety } from "../interfaces";
import { PICK_UP_CLOSE_DISNTANCE } from "../variables";
import { disntaceVec2Vec } from "../vector-math";

export const isSheldPotion = (item: Item): boolean => {
  return "amount" in item && !("weaponTypeIndex" in item);
};

export const itCloseDistance = (from: Vec2, to: Vec2) => {
  return disntaceVec2Vec(from, to) < PICK_UP_CLOSE_DISNTANCE;
};

export const getTheSafestSectors = (sectorSafety: SectorSafety) => {
  const sectorSafetyTupple = Array.from(sectorSafety);
  return sectorSafetyTupple.reduce(
    ([safestSector, maxSafety], [sector, safety]) => {
      if (safety > maxSafety) {
        return [sector, safety];
      }
      return [safestSector, maxSafety];
    },
    sectorSafetyTupple[0]
  );
};
