import { Action } from "../../model/action";
import { ActionOrder } from "../../model/action-order";
import { Item } from "../../model/item";
import { Loot } from "../../model/loot";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../../my-strategy";
import { COLOR_RED, COLOR_RED_2, FLEE_SECTOR } from "../constants";
import { takeAction } from "../helpers/action";
import {
  angleToVector,
  canPickUpAmmo,
  canPickUpBow,
  canPickUpSheldPotion,
  getTheSafestSector,
  isSheldPotion,
  isVectorInSector,
} from "../helpers/common.helpers";
import { MetaLoot, SectorSafety, StateMeta } from "../interfaces";
import {
  FLEE_DURATION,
  LOOT_SLOWDOWN_DISTANCE,
  SHIELD_MIN_THRESHOLD,
  WEAPON_BOW_ID,
} from "../variables";

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
    const theSafestSector = getTheSafestSector(this.sectorSafety);
    if (
      meta.enemies.some((enemy) =>
        isVectorInSector(enemy.direction, theSafestSector.sector)
      )
    ) {
      return new UnitScanState(this.strategy);
    }
    if (!this.isGoingToLoot() && meta.time > this.fleeTimeLimit) {
      console.log("SCANNING");
      return new UnitScanState(this.strategy);
    }
    if (
      this.lootinAction &&
      this.lootToPickup !== null &&
      this.hasFinishedLooting(this.lootinAction, meta)
    ) {
      console.log("PICKED UP", this.lootToPickup);
      this.lootToPickup = null;
    }
    return this;
  }

  evaluateState(meta: StateMeta): UnitOrder {
    if (
      this.sectorSafety &&
      this.lootToPickup === undefined &&
      meta.scanningInfo?.metaLoot
    ) {
      const theSafestSector = getTheSafestSector(this.sectorSafety);
      const sectorLoot = meta.scanningInfo.metaLoot
        .filter((loot) =>
          isVectorInSector(loot.direction, theSafestSector.sector)
        )
        .sort((a, b) => a.disntance - b.disntance);

      const bow = sectorLoot.find(
        (metaLoot) =>
          metaLoot.loot.item instanceof Item.Weapon &&
          metaLoot.loot.item.typeIndex === WEAPON_BOW_ID &&
          canPickUpBow(meta)
      );
      const ammo = sectorLoot.find(
        (metaLoot) =>
          metaLoot.loot.item instanceof Item.Ammo &&
          metaLoot.loot.item.weaponTypeIndex === WEAPON_BOW_ID &&
          canPickUpAmmo(meta)
      );
      const potions = sectorLoot.find(
        (metaLoot) =>
          metaLoot.loot.item instanceof Item.ShieldPotions &&
          canPickUpSheldPotion(meta)
      );
      if (bow) {
        this.lootToPickup = bow;
      } else if (
        meta.unit.shield <= meta.constants.maxShield * SHIELD_MIN_THRESHOLD &&
        meta.unit.shieldPotions <= 0
      ) {
        this.lootToPickup = potions;
      } else if (ammo) {
        this.lootToPickup = ammo;
      } else if (potions) {
        this.lootToPickup = potions;
      } else {
        this.lootToPickup = null;
      }
      console.log("GOING TO PICK UP ", this.lootToPickup?.loot);
      console.log(meta.unit);
    }

    if (this.moveDirection === undefined && this.sectorSafety) {
      this.moveDirection = this.calculateSafest(meta, this.sectorSafety);
    }

    const action = this.lootToPickup
      ? new ActionOrder.Pickup(this.lootToPickup.loot.id)
      : null;
    let moveDirection = this.moveDirection;
    if (this.lootToPickup) {
      const lootDinstance = this.lootToPickup.loot.position.distance(
        meta.unit.position
      );
      const moveDirectionToLoot = this.lootToPickup.loot.position
        .clone()
        .subtract(meta.unit.position)
        .normalize();
      const speed =
        lootDinstance < LOOT_SLOWDOWN_DISTANCE
          ? lootDinstance
          : meta.constants.maxUnitForwardSpeed;

      moveDirection = moveDirectionToLoot.multiplyScalar(speed).toVec2();
    }

    if (this.lootToPickup) {
      const ltp = this.lootToPickup;
      DEBUG_COMMANDS.push(async () => {
        await DEBUG_INTERFACE?.addCircle(ltp.loot.position, 0.5, COLOR_RED_2);
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
