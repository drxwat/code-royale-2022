import { ActionOrder } from "../../model/action-order";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../../my-strategy";
import { COLOR_BLUE, COLOR_GREEN, COLOR_RED, COLOR_RED_2 } from "../constants";
import { takeAction } from "../helpers/action";
import { calculateTimeOfClosestCollition } from "../helpers/common.helpers";
import { Enemy, StateMeta } from "../interfaces";
import {
  ATTACK_DURATION,
  FLEE_MAX_ENEMIES,
  FLEE_MAX_ENEMIES_HIDING,
  FLEE_MIN_HP,
} from "../variables";
import { UnitStratagyState } from "./abstract-state";
import { UnitFleeState } from "./flee-state";
import { UnitScanState } from "./scan-state";

export class UnitAttackState extends UnitStratagyState {
  debugName = "AttackState";
  attackTimeLimit: number | undefined;
  targetEnemyLastPosition: Vec2 | undefined;

  input(meta: StateMeta): UnitStratagyState {
    const deadEnemies = new Set(
      (meta.scanningInfo?.enemies || meta.enemies)
        .filter((enemy) => enemy.unit.health <= 0)
        .map((enemy) => enemy.unit.id)
    );
    const aliveScanEemies = meta.scanningInfo?.enemies?.filter(
      (enemy) => !deadEnemies.has(enemy.unit.id)
    );
    if (deadEnemies.size > 0) {
      this.strategy.updateScanningInfo({ enemies: aliveScanEemies });
    }

    const enemies = aliveScanEemies || meta.enemies;

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

    if (meta.unit.weapon === null || meta.unit.ammo[meta.unit.weapon] <= 0) {
      console.log("NO WEAPON");
      return new UnitFleeState(this.strategy);
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
    const enemies =
      meta.enemies.length > 0
        ? meta.enemies
        : meta.scanningInfo?.enemies || meta.enemies;
    const closestEnemy = [...enemies].sort(
      (a, b) => a.disntance - b.disntance
    )[0];

    const enemyVelocity = this.targetEnemyLastPosition
      ? closestEnemy.unit.position
          .clone()
          .subtract(this.targetEnemyLastPosition)
          .toVec2()
      : undefined;
    this.targetEnemyLastPosition = closestEnemy.unit.position;

    // Taking position
    let moveDirection = closestEnemy.direction
      .clone()
      .multiplyScalar(meta.constants.maxUnitForwardSpeed)
      .toVec2();
    let isEnemyInRange = false;
    if (meta.unit.weapon !== null) {
      const weapon = meta.constants.weapons[meta.unit.weapon];
      const range = weapon.projectileLifeTime * weapon.projectileSpeed;
      if (closestEnemy.disntance < range) {
        isEnemyInRange = true;
        moveDirection = closestEnemy.direction;
      }
    }

    let shootDirection = closestEnemy.direction;
    // Aiming if have enemy velocity
    if (enemyVelocity && meta.unit.weapon !== null && isEnemyInRange) {
      const weapon = meta.constants.weapons[meta.unit.weapon];

      const bulletSpeed =
        weapon.projectileSpeed / meta.constants.ticksPerSecond;

      const SHOT_ANTICIPATE_FRAMES = 100;
      let bestDistance: undefined | number;
      let bestDirection: Vec2 | undefined;
      for (let i = 0; i <= SHOT_ANTICIPATE_FRAMES; i += 1) {
        const nextEnemyPos = closestEnemy.unit.position
          .clone()
          .add(enemyVelocity.clone().multiplyScalar(i));

        const bulletPosition = meta.unit.position;
        const bulletVelocity = nextEnemyPos
          .clone()
          .subtract(bulletPosition)
          .normalize()
          .multiplyScalar(bulletSpeed)
          .toVec2();

        const nextBulletPosition = bulletPosition
          .clone()
          .add(bulletVelocity.clone().multiplyScalar(i));

        const approxDistance = nextBulletPosition.distance(nextEnemyPos);
        if (!bestDistance || approxDistance < bestDistance) {
          bestDistance = approxDistance;
          bestDirection = bulletVelocity;
        }
        if (
          bestDirection &&
          bestDistance < 4 &&
          approxDistance > bestDistance
        ) {
          shootDirection = bestDirection;
          break;
        }
      }
      if (!bestDirection) {
        console.log("NOT FOUND BEST SHOOT DIR");
      }
    }

    DEBUG_COMMANDS.push(async () => {
      if (enemyVelocity) {
        const nextPos = closestEnemy.unit.position
          .clone()
          .add(enemyVelocity.clone().multiplyScalar(10));

        await DEBUG_INTERFACE?.addCircle(nextPos.toVec2(), 1, COLOR_RED);
      }
    });

    DEBUG_COMMANDS.push(async () => {
      await DEBUG_INTERFACE?.addPolyLine(
        [
          meta.unit.position,
          meta.unit.position
            .clone()
            .add(shootDirection.clone().multiplyScalar(closestEnemy.disntance))
            .toVec2(),
        ],
        0.2,
        COLOR_GREEN
      );
    });

    DEBUG_COMMANDS.push(async () => {
      const dirToEnemy = closestEnemy.unit.position
        .clone()
        .subtract(meta.unit.position)
        .toVec2();

      await DEBUG_INTERFACE?.addPolyLine(
        [
          meta.unit.position,
          meta.unit.position.clone().add(dirToEnemy).toVec2(),
        ],
        0.2,
        COLOR_RED_2
      );
    });

    return new UnitOrder(
      moveDirection,
      shootDirection,
      takeAction(meta, isEnemyInRange ? new ActionOrder.Aim(true) : null)
    );
  }
}
