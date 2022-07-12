import { Action } from "../../model/action";
import { ActionOrder } from "../../model/action-order";
import { Loot } from "../../model/loot";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../../my-strategy";
import { COLOR_RED, FLEE_SECTOR } from "../constants";
import { takeAction } from "../helpers/action";
import {
  angleToVector,
  getTheSafestSector,
  isSheldPotion,
  isVectorInSector,
} from "../helpers/common.helpers";
import { MetaLoot, SectorSafety, StateMeta } from "../interfaces";
import { FLEE_DURATION } from "../variables";

import { UnitStratagyState } from "./abstract-state";
import { UnitScanState } from "./scan-state";

export class UnitFleeState extends UnitStratagyState {
  debugName = "FleeState";
  moveDirection: Vec2 | undefined;
  lootToPickup: MetaLoot | undefined | null;
  lootinAction: Action | undefined;
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

    if (this.lootToPickup && meta.unit.action) {
      this.lootinAction = meta.unit.action;
    }
    if (this.lootinAction && this.hasFinishedLooting(this.lootinAction, meta)) {
      this.lootToPickup = undefined;
    }
    if (!this.isGoingToLoot() && meta.time > this.fleeTimeLimit) {
      return new UnitScanState(this.strategy);
    }
    return this;
  }

  evaluateState(meta: StateMeta): UnitOrder {
    if (!(this.moveDirection || this.lootToPickup) && this.sectorSafety) {
      this.moveDirection = this.calculateSafest(meta, this.sectorSafety);
      if (
        this.lootToPickup === undefined &&
        meta.scanningInfo?.metaLoot &&
        meta.unit.shieldPotions < meta.constants.maxShieldPotionsInInventory
      ) {
        const theSafestSector = getTheSafestSector(this.sectorSafety);
        const sectorLootPotions = meta.scanningInfo.metaLoot
          .filter(
            (loot) =>
              isVectorInSector(loot.direction, theSafestSector.sector) &&
              isSheldPotion(loot.loot.item)
          )
          .sort((a, b) => a.disntance - b.disntance);
        console.log("LOOT ", sectorLootPotions);
        if (sectorLootPotions.length > 0) {
          this.lootToPickup = sectorLootPotions[0];
        } else {
          this.lootToPickup = null;
        }
      }
    }

    const action = this.lootToPickup
      ? new ActionOrder.Pickup(this.lootToPickup.loot.id)
      : null;
    const moveDirection = this.lootToPickup
      ? this.lootToPickup.loot.position
          .clone()
          .subtract(meta.unit.position)
          .toVec2()
      : this.moveDirection;

    if (this.lootToPickup) {
      const ltp = this.lootToPickup;
      DEBUG_COMMANDS.push(async () => {
        await DEBUG_INTERFACE?.addCircle(ltp.loot.position, 1, COLOR_RED);
      });
    }
    return new UnitOrder(
      moveDirection || new Vec2(0, 0),
      moveDirection || new Vec2(0, 0),
      // action
      takeAction(meta, action)
    );
  }

  private isGoingToLoot() {
    return !!this.lootToPickup;
  }

  private hasFinishedLooting(lootinAction: Action, meta: StateMeta) {
    return lootinAction.finishTick > meta.game.currentTick;
  }

  private calculateSafest(meta: StateMeta, sectorSafety: SectorSafety) {
    const theSafestSector = getTheSafestSector(sectorSafety);

    const safestMoveDirection = angleToVector(
      theSafestSector.sector + FLEE_SECTOR / 2
    )
      .multiplyScalar(meta.constants.maxUnitForwardSpeed)
      .toVec2();

    return safestMoveDirection;
  }
}
