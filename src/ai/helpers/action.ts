import { ActionOrder } from "../../model/action-order";
import { StateMeta } from "../interfaces";
import { SHIELD_MIN_THRESHOLD } from "../variables";
import { isSheldPotion, itCloseDistance } from "./common.helpers";

export function takeAction(
  meta: StateMeta,
  defaultAction: ActionOrder | null = null
): ActionOrder | null {
  const isLowShield =
    meta.unit.shield < meta.constants.maxShield * SHIELD_MIN_THRESHOLD;
  const hasShieldPotions = meta.unit.shieldPotions > 0;

  if (isLowShield && hasShieldPotions) {
    return new ActionOrder.UseShieldPotion();
  }

  return defaultAction;
}
