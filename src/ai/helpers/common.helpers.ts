import { Item } from "../../model/item";
import { Vec2 } from "../../model/vec2";
import { FLEE_SECTOR } from "../constants";
import { Enemy, SectorSafety, StateMeta } from "../interfaces";
import { LOW_AMMO, PICK_UP_CLOSE_DISNTANCE, WEAPON_BOW_ID } from "../variables";
import { disntaceVec2Vec } from "../vector-math";

export const isSheldPotion = (item: Item): boolean => {
  return "amount" in item && !("weaponTypeIndex" in item);
};

export const canPickUpSheldPotion = (meta: StateMeta) => {
  return meta.unit.shieldPotions < meta.constants.maxShieldPotionsInInventory;
};

export const itCloseDistance = (from: Vec2, to: Vec2) => {
  return disntaceVec2Vec(from, to) < PICK_UP_CLOSE_DISNTANCE;
};

export const canPickUpBow = (meta: StateMeta) => {
  return meta.unit.weapon !== WEAPON_BOW_ID;
};

export const canPickUpAmmo = (meta: StateMeta) => {
  return meta.unit.ammo[WEAPON_BOW_ID] < LOW_AMMO;
};

export const isReadyToFight = (meta: StateMeta) => {
  return (
    meta.unit.weapon === WEAPON_BOW_ID &&
    meta.unit.ammo[WEAPON_BOW_ID] > 0 &&
    meta.unit.shieldPotions > 0
  );
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

export const calculateTimeOfClosestCollition = (
  bulletPosition: Vec2,
  bulletVelocity: Vec2,
  enemyPosition: Vec2,
  enemyVelocity: Vec2
) => {
  const relativePosition = enemyPosition.clone().subtract(bulletPosition);
  const relativeVelocity = enemyVelocity.clone().subtract(bulletVelocity);
  const relativeSpeed = relativeVelocity.length();
  return relativePosition.dot(relativeVelocity) / Math.pow(relativeSpeed, 2);
};
