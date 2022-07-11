import { ActionOrder } from "../../model/action-order";
import { StateMeta } from "../interfaces";
import { PICK_UP_CLOSE_DISNTANCE, SHIELD_MIN_THRESHOLD } from "../variables";
import { Item } from "../../model/item";
import { Vec2 } from "../../model/vec2";
import { disntaceVec2Vec } from "../vector-math";

const isSheldPotion = (item: Item): boolean => {
  return "amount" in item && !("weaponTypeIndex" in item);
};

const itCloseDistance = (from: Vec2, to: Vec2) => {
  return disntaceVec2Vec(from, to) < PICK_UP_CLOSE_DISNTANCE;
};

export function takeAction(
  meta: StateMeta,
  defaultAction: ActionOrder | null = null
): ActionOrder | null {
  const isLowShield =
    meta.unit.shield < meta.constants.maxShield * SHIELD_MIN_THRESHOLD;
  const hasShieldPotions = meta.unit.shieldPotions > 0;
  const catPickUpShieldPotion =
    meta.unit.shieldPotions < meta.constants.maxShieldPotionsInInventory;

  const closeShieldPotions = meta.game.loot.filter(
    (loot) =>
      isSheldPotion(loot.item) &&
      itCloseDistance(meta.unit.position, loot.position)
  );

  if (isLowShield && hasShieldPotions) {
    return new ActionOrder.UseShieldPotion();
  }

  // Item.ShieldPotions.TAG
  // return new ActionOrder.Pickup()

  return defaultAction;
}
