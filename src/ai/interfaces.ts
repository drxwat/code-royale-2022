import { Constants } from "../model/constants";
import { Game } from "../model/game";
import { Loot } from "../model/loot";
import { Unit } from "../model/unit";
import { Vec2 } from "../model/vec2";

export interface Enemy {
  unit: Unit;
  disntance: number;
  angle: number;
  direction: Vec2;
}

export declare type SectorSafety = Map<number, number>;
export interface ScanningInfo {
  enemies?: Enemy[];
  metaLoot?: MetaLoot[];
  sectorSafety?: SectorSafety;
}

export interface StateMeta {
  constants: Constants;
  game: Game;
  unit: Unit;
  enemies: Enemy[]; // visible enemies
  metaLoot: MetaLoot[];
  time: number;
  isHiding: boolean;
  distanceToZoneEdge: number;
  zoneEdgeAngle: number;
  scanningInfo?: ScanningInfo;
  currentMovingSector?: number;
}

export interface MetaLoot {
  loot: Loot;
  disntance: number;
  angle: number;
  direction: Vec2;
}
