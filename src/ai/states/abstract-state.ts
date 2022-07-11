import { UnitOrder } from "../../model/unit-order";
import { StateMeta } from "../interfaces";
import { UnitStrategy } from "../unit-strategy";

export abstract class UnitStratagyState {
  public debugName = "UnitStratagyState";
  constructor(protected strategy: UnitStrategy) {}
  abstract input(meta: StateMeta): UnitStratagyState;
  abstract evaluateState(meta: StateMeta): UnitOrder;
}
