import { UnitStrategy } from "./ai/unit-strategy";
import { DebugInterface } from "./debug-interface";
import { Constants } from "./model/constants";
import { Game } from "./model/game";
import { Order } from "./model/order";
import { UnitOrder } from "./model/unit-order";

// wander, fight, flee

export let DEBUG_INTERFACE: DebugInterface | null = null;
export let DEBUG_COMMANDS: Array<() => Promise<void>> = [];

export class MyStrategy {
  private unitStratagies = new Map<number, UnitStrategy>();

  constructor(private constants: Constants) {}

  async getOrder(
    game: Game,
    debug_interface: DebugInterface | null
  ): Promise<Order> {
    DEBUG_INTERFACE = debug_interface; // making it global
    const orders = new Map<number, UnitOrder>();
    for (const unit of game.units) {
      if (unit.playerId !== game.myId) {
        continue;
      }
      // Geting singleton UnitStrategy
      let unitStrategy = this.unitStratagies.get(unit.id);
      if (!unitStrategy) {
        unitStrategy = new UnitStrategy(unit.id);
        this.unitStratagies.set(unit.id, unitStrategy);
      }
      // Performing action
      orders.set(
        unit.id,
        unitStrategy.getUnitOrder(unit, game, this.constants)
      );
    }

    while (DEBUG_COMMANDS.length > 0) {
      const debugCommand = DEBUG_COMMANDS.pop();
      if (debugCommand) {
        await debugCommand();
      }
    }
    await debug_interface?.flush();
    return new Order(orders);
  }

  async debugUpdate(displayed_tick: number, debug_interface: DebugInterface) {}
  finish() {}
}
