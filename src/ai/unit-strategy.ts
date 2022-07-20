import { Constants } from "../model/constants";
import { Game } from "../model/game";
import { Unit } from "../model/unit";
import { UnitOrder } from "../model/unit-order";
import { Vec2 } from "../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../my-strategy";
import {
  COLOR_BLUE,
  COLOR_DANGER,
  COLOR_DEADLY,
  COLOR_RED,
  COLOR_SAFE,
  COLOR_SAFEST,
  COLOR_WARNING,
  FLEE_SECTOR,
} from "./constants";
import { getTheSafestSector, isReadyToFight } from "./helpers/common.helpers";
import { Enemy, ScanningInfo, StateMeta } from "./interfaces";
import { UnitStratagyState } from "./states/abstract-state";
import { UnitScanState } from "./states/scan-state";
import { HIDING_TIME_LIMIT } from "./variables";

export class UnitStrategy {
  private state: UnitStratagyState = new UnitScanState(this);
  private scanningInfo: ScanningInfo | undefined;
  public lastOrder: UnitOrder | undefined;

  private hidingTimeLimit: number | undefined;
  private isHiding = true;

  constructor(public unitId: number) {}

  public getUnitOrder(unit: Unit, game: Game, constants: Constants): UnitOrder {
    const time = game.currentTick / constants.ticksPerSecond;
    if (this.hidingTimeLimit === undefined) {
      this.hidingTimeLimit = time + HIDING_TIME_LIMIT;
    }
    if (
      (this.isHiding && time > this.hidingTimeLimit) ||
      isReadyToFight(this.getMeta(unit, game, constants))
    ) {
      this.isHiding = false;
    }

    this.state = this.state.input(this.getMeta(unit, game, constants));
    this.lastOrder = this.state.evaluateState(
      this.getMeta(unit, game, constants)
    );
    if (DEBUG_INTERFACE) {
      this.displayDebugInterface(this.getMeta(unit, game, constants));
    }
    return this.lastOrder;
  }

  public setScanningInfo(info: ScanningInfo) {
    this.scanningInfo = info;
  }

  public updateScanningInfo(info: Partial<ScanningInfo>) {
    this.scanningInfo = { ...this.scanningInfo, ...info };
  }

  /**
   * Can change between input and evaluateState methods
   */
  private getMeta(unit: Unit, game: Game, constants: Constants): StateMeta {
    const moveDirection = this.lastOrder?.targetDirection;
    let currentMovingSector: number | undefined;
    if (this.scanningInfo?.sectorSafety && moveDirection) {
      currentMovingSector = Array.from(
        this.scanningInfo?.sectorSafety?.keys()
      ).find((sector) => sector + FLEE_SECTOR > moveDirection.angle());
    }
    const enemies = game.units
      .filter((gameUnit) => gameUnit.playerId !== game.myId)
      .map((enemyUnit) => ({
        unit: enemyUnit,
        disntance: unit.position.clone().distance(enemyUnit.position),
        direction: enemyUnit.position
          .clone()
          .subtract(unit.position)
          .normalize()
          .toVec2(),
        angle: enemyUnit.position.clone().subtract(unit.position).angle(),
      }));

    const metaLoot = game.loot.map((loot) => ({
      loot,
      disntance: unit.position.clone().distance(loot.position),
      direction: loot.position
        .clone()
        .subtract(unit.position)
        .normalize()
        .toVec2(),
      angle: loot.position.clone().subtract(unit.position).angle(),
    }));

    return {
      unit,
      game,
      enemies,
      metaLoot,
      constants,
      time: game.currentTick / constants.ticksPerSecond,
      scanningInfo: this.scanningInfo,
      isHiding: this.isHiding,
      distanceToZoneEdge:
        game.zone.currentRadius -
        game.zone.currentCenter.distance(unit.position),
      zoneEdgeAngle: unit.position
        .clone()
        .subtract(game.zone.currentCenter)
        .angle(),
      currentMovingSector,
    };
  }
  /**
   * DEBUG INTERFACE
   */

  private displayDebugInterface(meta: StateMeta) {
    this.displayInfo(meta);
    this.displaySectorSafety(meta);
    this.displayMoveDirection(meta);
  }

  private displayInfo(meta: StateMeta) {
    DEBUG_COMMANDS.push(async () => {
      await DEBUG_INTERFACE?.addPlacedText(
        meta.unit.position,
        `IsHiding: ${meta.isHiding}`,
        new Vec2(0, -8),
        0.5,
        COLOR_RED
      );
      await DEBUG_INTERFACE?.addPlacedText(
        meta.unit.position,
        `State: ${this.state.debugName}`,
        new Vec2(0, -10),
        0.5,
        COLOR_RED
      );
    });
  }

  private displayMoveDirection(meta: StateMeta) {
    const moveDirection = this.lastOrder?.targetDirection;
    if (moveDirection) {
      DEBUG_COMMANDS.push(async () => {
        await DEBUG_INTERFACE?.addPolyLine(
          [
            meta.unit.position,
            meta.unit.position.clone().add(moveDirection).toVec2(),
          ],
          0.2,
          COLOR_BLUE
        );
      });
    }
  }

  private displaySectorSafety(meta: StateMeta) {
    /**
     * DEBUG INTERFACE
     */
    const moveDirection = this.lastOrder?.targetDirection;
    const sectorSafety = this.scanningInfo?.sectorSafety;
    if (moveDirection && sectorSafety && DEBUG_INTERFACE) {
      const sectorSafetyTupple = Array.from(sectorSafety);
      const theSafestSector = getTheSafestSector(sectorSafety);

      sectorSafetyTupple.forEach(([sector, safety]) => {
        let sectorColor = COLOR_SAFE;
        if (safety === theSafestSector.safety) {
          sectorColor = COLOR_SAFEST;
        } else if (safety < 0) {
          sectorColor = COLOR_DEADLY;
        } else if (safety < 1) {
          sectorColor = COLOR_DANGER;
        } else if (safety < 2) {
          sectorColor = COLOR_WARNING;
        } else {
          sectorColor = COLOR_SAFE;
        }
        DEBUG_COMMANDS.push(async () => {
          await DEBUG_INTERFACE?.addPie(
            meta.unit.position,
            meta.constants.viewDistance,
            sector,
            sector + FLEE_SECTOR,
            sectorColor
          );
        });
      });
    }
  }
}
