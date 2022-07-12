import { ActionOrder } from "../../model/action-order";
import { Loot } from "../../model/loot";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../../my-strategy";
import { COLOR_RED, FLEE_SECTOR } from "../constants";
import { getTheSafestSectors, isSheldPotion } from "../helpers/common.helpers";
import { SectorSafety, StateMeta } from "../interfaces";
import { FLEE_DURATION } from "../variables";
import {
  angleToVec2,
  diffVec2,
  disntaceVec2Vec,
  isAngleBetween,
  mulVec2byScalar,
  normalizeVec,
  vec2ToAngle,
} from "../vector-math";
import { UnitStratagyState } from "./abstract-state";
import { UnitScanState } from "./scan-state";

export class UnitFleeState extends UnitStratagyState {
  debugName = "FleeState";
  moveDirection: Vec2 | undefined;
  lootToPickup: Loot | undefined;
  sectorSafety: Map<number, number> | undefined;
  fleeTimeLimit: number | undefined;

  input(meta: StateMeta): UnitStratagyState {
    if (!meta.scanningInfo?.sectorSafety) {
      console.log("NEED SECTOR SAFETY BEFORE FLEE");
      return new UnitScanState(this.strategy);
    }
    this.sectorSafety = meta.scanningInfo?.sectorSafety;
    if (this.fleeTimeLimit === undefined) {
      this.fleeTimeLimit = meta.time + FLEE_DURATION;
    }
    if (meta.time < this.fleeTimeLimit) {
      return this;
    } else {
      return new UnitScanState(this.strategy);
    }
  }

  evaluateState(meta: StateMeta): UnitOrder {
    if (!(this.moveDirection || this.lootToPickup) && this.sectorSafety) {
      const { safestMoveDirection, closestPotion } = this.calculateSafest(
        meta,
        this.sectorSafety
      );
      this.moveDirection = safestMoveDirection;
      if (
        meta.unit.shieldPotions < meta.constants.maxShieldPotionsInInventory
      ) {
        this.lootToPickup = closestPotion;
      }
    }

    console.log("LOOT", JSON.stringify(this.lootToPickup));
    const action = this.lootToPickup
      ? new ActionOrder.Pickup(this.lootToPickup.id)
      : null;
    const moveDirection = this.lootToPickup
      ? diffVec2(this.lootToPickup.position, meta.unit.position)
      : this.moveDirection;

    if (this.lootToPickup) {
      const ltp = this.lootToPickup;
      console.log("MOVING TO LOOT");
      DEBUG_COMMANDS.push(async () => {
        await DEBUG_INTERFACE?.addCircle(ltp.position, 1, COLOR_RED);
      });
    }
    return new UnitOrder(
      moveDirection || new Vec2(0, 0),
      moveDirection || new Vec2(0, 0),
      action
    );
  }

  private calculateSafest(meta: StateMeta, sectorSafety: SectorSafety) {
    const theSafestSectors = getTheSafestSectors(sectorSafety);
    const theSafestSector = theSafestSectors[0];
    const safePotions = meta.game.loot
      .filter((loot) => isSheldPotion(loot.item))
      .sort(
        (a, b) =>
          disntaceVec2Vec(meta.unit.position, a.position) -
          disntaceVec2Vec(meta.unit.position, b.position)
      );

    const closestPotion = safePotions.length > 0 ? safePotions[0] : undefined;

    const safestMoveDirection = mulVec2byScalar(
      angleToVec2(theSafestSector + FLEE_SECTOR / 2),
      meta.constants.maxUnitForwardSpeed
    );

    return { safestMoveDirection, closestPotion };
  }
}
