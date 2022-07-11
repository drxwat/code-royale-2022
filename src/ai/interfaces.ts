import { Constants } from "../model/constants";
import { Game } from "../model/game";
import { Unit } from "../model/unit";

export interface Enemy {
  unit: Unit;
  disntance: number;
  angle: number;
}

export declare type SectorSafety = Map<number, number>;
export interface ScanningInfo {
  enemies?: Enemy[];
  sectorSafety?: SectorSafety;
}

export interface StateMeta {
  constants: Constants;
  game: Game;
  unit: Unit;
  enemies: Enemy[]; // visible enemies
  time: number;
  isHiding: boolean;
  scanningInfo?: ScanningInfo;
}
