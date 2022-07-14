import { ActionOrder } from "../../model/action-order";
import { Unit } from "../../model/unit";
import { UnitOrder } from "../../model/unit-order";
import { Vec2 } from "../../model/vec2";
import { FLEE_SECTOR } from "../constants";
import {
  angleToVector,
  getTheSafestSector,
  isSheldPotion,
  isVectorInSector,
} from "../helpers/common.helpers";
import { Enemy, MetaLoot, SectorSafety, StateMeta } from "../interfaces";
import {
  FLEE_MAX_ENEMIES,
  FLEE_MAX_ENEMIES_HIDING,
  FLEE_MIN_HP,
  ZONE_EDGE_DISTANCE,
} from "../variables";
import {
  degToRad,
  diffVec2,
  disntaceVec2Vec,
  isAngleBetween,
  mulVec2byScalar,
  vec2ToAngle,
} from "../vector-math";
import { UnitStratagyState } from "./abstract-state";
import { UnitAttackState } from "./attack-state";
import { UnitFleeState } from "./flee-state";

export class UnitScanState extends UnitStratagyState {
  debugName = "ScanState";
  initialRotation: number | undefined;
  rotationThreshold: number | undefined;
  enemies = new Map<number, Enemy>();
  loot = new Map<number, MetaLoot>();

  input(meta: StateMeta): UnitStratagyState {
    const rotation = vec2ToAngle(meta.unit.direction);
    if (
      // INIT
      this.initialRotation === undefined ||
      this.rotationThreshold === undefined
    ) {
      this.initialRotation = rotation;
      let threshold = this.initialRotation - Math.PI / 4;
      this.rotationThreshold =
        threshold < 0 ? Math.PI * 2 + threshold : threshold;
    } else if (
      // TERMINATE
      isAngleBetween(rotation, this.rotationThreshold, this.initialRotation)
    ) {
      console.log("TERMINATE SCANNING");

      const sectorSafety = this.calculateSectorSafety(
        meta,
        Array.from(this.enemies.values()).sort(
          (a, b) => a.disntance - b.disntance
        )
      );
      const metaLoot = Array.from(this.loot.values());
      this.strategy.setScanningInfo({
        sectorSafety,
        enemies: Array.from(this.enemies.values()),
        metaLoot: Array.from(metaLoot),
      });

      const fleeMaxEnemies = meta.isHiding
        ? FLEE_MAX_ENEMIES_HIDING
        : FLEE_MAX_ENEMIES;
      if (
        this.enemies.size >= fleeMaxEnemies ||
        meta.unit.health < meta.constants.unitHealth * FLEE_MIN_HP
      ) {
        return new UnitFleeState(this.strategy);
      } else if (this.enemies.size > 0) {
        return new UnitAttackState(this.strategy);
      }
      return new UnitFleeState(this.strategy);
    }
    return this;
  }

  evaluateState(meta: StateMeta): UnitOrder {
    meta.enemies.forEach((enemy) => this.enemies.set(enemy.unit.id, enemy));
    meta.metaLoot.forEach((metaLoot) =>
      this.loot.set(metaLoot.loot.id, metaLoot)
    );

    return new UnitOrder(
      this.strategy.lastOrder?.targetVelocity || new Vec2(0, 0),
      new Vec2(-meta.unit.direction.y, meta.unit.direction.x),
      null
    );
  }

  private calculateSectorSafety(meta: StateMeta, enemies: Enemy[]) {
    const sectorSafety = new Map<number, number>();

    // Enemies Impact
    const sectorEnemies = new Map<number, Enemy[]>();
    for (let sector = 0; sector < Math.PI * 2; sector += FLEE_SECTOR) {
      sectorEnemies.set(
        sector,
        enemies.filter((enemy) => isVectorInSector(enemy.direction, sector))
      );
    }

    // Clockwise safety calculation
    const sectorEnemiesTupples = Array.from(sectorEnemies);
    // Initially negative
    let lastEnemy: Enemy;
    let lastEnemySectorIndex =
      -1 -
      [...sectorEnemiesTupples].reverse().findIndex(([sector, enemies]) => {
        if (enemies.length > 0) {
          lastEnemy = enemies[0];
          return true;
        }
        return false;
      });

    Array.from(sectorEnemies).forEach(([sector, enemies], sectorIndex) => {
      if (enemies.length > 0) {
        lastEnemy = enemies[0];
        lastEnemySectorIndex = sectorIndex;
        sectorSafety.set(sector, 0);
      } else {
        sectorSafety.set(sector, sectorIndex - lastEnemySectorIndex);
      }
    });

    // Reverse clockwise safety calculation
    lastEnemySectorIndex =
      -1 -
      sectorEnemiesTupples.findIndex(([sector, enemies]) => {
        if (enemies.length > 0) {
          lastEnemy = enemies[0];
          return true;
        }
        return false;
      });
    [...sectorEnemiesTupples]
      .reverse()
      .forEach(([sector, enemies], sectorIndex) => {
        if (enemies.length > 0) {
          lastEnemy = enemies[0];
          lastEnemySectorIndex = sectorIndex;
          sectorSafety.set(sector, 0);
        } else {
          const currectSectorSafety = sectorSafety.get(sector) || 100;
          sectorSafety.set(
            sector,
            Math.min(sectorIndex - lastEnemySectorIndex, currectSectorSafety)
          );
        }
      });
    // Zone  Impact
    if (meta.distanceToZoneEdge < ZONE_EDGE_DISTANCE) {
      Array.from(sectorSafety.keys()).map((sector) => {
        const sectorMiddleVector = angleToVector(sector + FLEE_SECTOR / 2);
        const zoneEdgeVector = angleToVector(meta.zoneEdgeAngle);
        if (
          Math.acos(sectorMiddleVector.dot(zoneEdgeVector)) <
          FLEE_SECTOR * 2
        ) {
          sectorSafety.set(sector, -1);
        }
      });
    }
    console.log("safety ", sectorSafety);

    return sectorSafety;
  }
}
