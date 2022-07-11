import { ActionOrder } from "../../model/action-order";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { StateMeta } from "../interfaces";
import {
  ATTACK_DURATION,
  FLEE_MAX_ENEMIES,
  FLEE_MAX_ENEMIES_HIDING,
  FLEE_MIN_HP,
} from "../variables";
import { diffVec2, lengthVec2 } from "../vector-math";
import { UnitStratagyState } from "./abstract-state";
import { UnitFleeState } from "./flee-state";
import { UnitScanState } from "./scan-state";
import { UnitWanderState } from "./wander-state";

export class UnitAttackState extends UnitStratagyState {
  debugName = "AttackState";
  attackTimeLimit: number | undefined;

  input(meta: StateMeta): UnitStratagyState {
    const enemies = meta.scanningInfo?.enemies || meta.enemies;
    if (this.attackTimeLimit === undefined) {
      this.attackTimeLimit = meta.time + ATTACK_DURATION;
    }
    if (this.attackTimeLimit < meta.time) {
      console.log("ATTACK TIME LIMIT");
      return new UnitScanState(this.strategy);
    }

    const fleeMaxEnemies = meta.isHiding
      ? FLEE_MAX_ENEMIES_HIDING
      : FLEE_MAX_ENEMIES;
    if (enemies.length >= fleeMaxEnemies) {
      console.log("CANT FIGHT TOO MANY ENEMIES");
      return new UnitFleeState(this.strategy);
    } else if (enemies.length === 0) {
      console.log("NO ENEMIES");
      return new UnitScanState(this.strategy);
    }

    if (meta.unit.weapon === null) {
      console.log("NO WEAPON");
      return new UnitWanderState(this.strategy);
    }
    const enemyMinHP = Math.min(...enemies.map((enemy) => enemy.unit.health));
    if (
      meta.unit.health < meta.constants.unitHealth * FLEE_MIN_HP &&
      meta.unit.health < enemyMinHP
    ) {
      console.log("LOW HP ", meta.unit.health, meta.constants.unitHealth);
      console.log("ENEMY HP", enemyMinHP);
      this.strategy.updateScanningInfo({ enemies: meta.enemies }); // Fleeing from current enemy (TODO: Current enemy)
      return new UnitFleeState(this.strategy);
    }
    return this;
  }

  evaluateState(meta: StateMeta): UnitOrder {
    const isEnemyInVisibility = meta.enemies.length > 0;
    const enemies =
      meta.enemies.length > 0
        ? meta.enemies
        : meta.scanningInfo?.enemies || meta.enemies;
    const closestEnemy = [...enemies].sort(
      (a, b) => a.disntance - b.disntance
    )[0];

    const dirToEnemy = diffVec2(closestEnemy.unit.position, meta.unit.position);
    let moveDirection = dirToEnemy;

    if (meta.unit.weapon) {
      const weapon = meta.constants.weapons[meta.unit.weapon];
      const range = weapon.projectileLifeTime * weapon.projectileSpeed;
      if (range > lengthVec2(dirToEnemy)) {
        moveDirection = new Vec2(0, 0);
      }
    }
    return new UnitOrder(
      moveDirection,
      dirToEnemy,
      new ActionOrder.Aim(isEnemyInVisibility)
    );
  }
}
