import { ActionOrder } from "../../model/action-order";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { FLEE_SECTOR } from "../constants";
import { SectorSafety, StateMeta } from "../interfaces";
import { FLEE_DURATION } from "../variables";
import { angleToVec2, mulVec2byScalar } from "../vector-math";
import { UnitStratagyState } from "./abstract-state";
import { UnitScanState } from "./scan-state";

export class UnitFleeState extends UnitStratagyState {
  debugName = "FleeState";
  moveDirection: Vec2 | undefined;
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
    if (!this.moveDirection && this.sectorSafety) {
      this.moveDirection = this.calculateSafestMoveDirection(
        meta,
        this.sectorSafety
      );
    }
    return new UnitOrder(
      this.moveDirection || new Vec2(0, 0),
      this.moveDirection || new Vec2(0, 0),
      null
    );
  }

  private calculateSafestMoveDirection(
    meta: StateMeta,
    sectorSafety: SectorSafety
  ) {
    const sectorSafetyTupple = Array.from(sectorSafety);
    const theSafestSector = sectorSafetyTupple.reduce(
      ([safestSector, maxSafety], [sector, safety]) => {
        if (safety > maxSafety) {
          return [sector, safety];
        }
        return [safestSector, maxSafety];
      },
      sectorSafetyTupple[0]
    );

    const safestMoveDirection = mulVec2byScalar(
      angleToVec2(theSafestSector[0] + FLEE_SECTOR / 2),
      meta.constants.maxUnitForwardSpeed
    );

    return safestMoveDirection;
  }
}
