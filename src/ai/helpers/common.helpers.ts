import { Item } from "../../model/item";
import { Vec2 } from "../../model/vec2";
import { FLEE_SECTOR } from "../constants";
import { SectorSafety } from "../interfaces";
import { PICK_UP_CLOSE_DISNTANCE } from "../variables";
import { disntaceVec2Vec } from "../vector-math";

export const isSheldPotion = (item: Item): boolean => {
  return "amount" in item && !("weaponTypeIndex" in item);
};

export const itCloseDistance = (from: Vec2, to: Vec2) => {
  return disntaceVec2Vec(from, to) < PICK_UP_CLOSE_DISNTANCE;
};

export const getTheSafestSector = (sectorSafety: SectorSafety) => {
  const sectorSafetyTupple = Array.from(sectorSafety);
  const firstSafestSector = sectorSafetyTupple.reduce(
    ([safestSector, maxSafety], [sector, safety]) => {
      if (safety > maxSafety) {
        return [sector, safety];
      }
      return [safestSector, maxSafety];
    },
    sectorSafetyTupple[0]
  );
  return { sector: firstSafestSector[0], safety: firstSafestSector[1] };
};

export const angleToVector = (angle: number) => {
  return new Vec2(1, 0).rotate(angle);
};

export const isVectorInSector = (vector: Vec2, sector: number) => {
  const sectorMiddleVector = angleToVector(sector + FLEE_SECTOR / 2);
  return Math.acos(sectorMiddleVector.dot(vector)) < FLEE_SECTOR / 2;
};
