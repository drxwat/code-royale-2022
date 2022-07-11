import { UnitOrder } from "../../model/unit-order";
import { StateMeta } from "../interfaces";
import { WANDER_DURATION } from "../variables";
import { diffVec2 } from "../vector-math";
import { UnitStratagyState } from "./abstract-state";
import { UnitAttackState } from "./attack-state";
import { UnitFleeState } from "./flee-state";
import { UnitScanState } from "./scan-state";

export class UnitWanderState extends UnitStratagyState {
  debugName = "WanderState";
  wanderTimeLimit: number | undefined;

  input(meta: StateMeta): UnitStratagyState {
    if (meta.enemies.length > 1) {
      return new UnitScanState(this.strategy);
    }

    if (this.wanderTimeLimit === undefined) {
      this.wanderTimeLimit = meta.time + WANDER_DURATION;
    }
    if (this.wanderTimeLimit < meta.time) {
      return new UnitScanState(this.strategy);
    }
    return this;
  }

  evaluateState(meta: StateMeta): UnitOrder {
    // TODO: Get the most interesting point and go
    const moveDirection = diffVec2(
      meta.game.zone.currentCenter,
      meta.unit.position
    );
    return new UnitOrder(moveDirection, moveDirection, null);
  }
}
