import { Constants } from "../model/constants";
import { Game } from "../model/game";
import { Unit } from "../model/unit";
import { UnitOrder } from "../model/unit-order";
import { Vec2 } from "../model/vec2";
import { DEBUG_COMMANDS, DEBUG_INTERFACE } from "../my-strategy";
import {
  COLOR_BLUE,
  COLOR_DANGER,
  COLOR_RED,
  COLOR_SAFE,
  COLOR_SAFEST,
  FLEE_SECTOR,
} from "./constants";
import { Enemy, ScanningInfo, StateMeta } from "./interfaces";
import { UnitStratagyState } from "./states/abstract-state";
import { UnitScanState } from "./states/scan-state";
import { HIDING_TIME_LIMIT } from "./variables";
import { addVec2, angleVec2VecRad, disntaceVec2Vec } from "./vector-math";

export class UnitStrategy {
  private state: UnitStratagyState = new UnitScanState(this);
  private enemies: Enemy[] = [];
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
    if (this.isHiding && time > this.hidingTimeLimit) {
      this.isHiding = false;
    }

    this.enemies = game.units
      .filter((gameUnit) => gameUnit.playerId !== game.myId)
      .map((enemyUnit) => ({
        unit: enemyUnit,
        disntance: disntaceVec2Vec(unit.position, enemyUnit.position),
        angle: angleVec2VecRad(unit.position, enemyUnit.position),
      }));

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
    return {
      unit,
      game,
      enemies: this.enemies,
      constants,
      time: game.currentTick / constants.ticksPerSecond,
      scanningInfo: this.scanningInfo,
      isHiding: this.isHiding,
    };
  }

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
          [meta.unit.position, addVec2(meta.unit.position, moveDirection)],
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
      const theSafestSector = sectorSafetyTupple.reduce(
        ([safestSector, maxSafety], [sector, safety]) => {
          if (safety > maxSafety) {
            return [sector, safety];
          }
          return [safestSector, maxSafety];
        },
        sectorSafetyTupple[0]
      );

      sectorSafetyTupple.forEach(([sector, safety]) => {
        DEBUG_COMMANDS.push(async () => {
          await DEBUG_INTERFACE?.addPie(
            meta.unit.position,
            25,
            sector,
            sector + FLEE_SECTOR,
            safety === theSafestSector[1]
              ? COLOR_SAFEST
              : safety >= 1
              ? COLOR_SAFE
              : COLOR_DANGER
          );
        });
      });
    }
  }
}
