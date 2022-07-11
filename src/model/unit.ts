import { Action } from "./action";
import { Vec2 } from "./vec2";
import { Stream } from "../stream";

/**
 * A unit
 */
export class Unit {
    /**
     * Unique id
     */
    id: number
    /**
     * Id of the player (team) controlling the unit
     */
    playerId: number
    /**
     * Current health
     */
    health: number
    /**
     * Current shield value
     */
    shield: number
    /**
     * Left extra lives of this unit
     */
    extraLives: number
    /**
     * Current position of unit's center
     */
    position: Vec2
    /**
     * Remaining time until unit will be spawned, or None
     */
    remainingSpawnTime: number | null
    /**
     * Current velocity
     */
    velocity: Vec2
    /**
     * Current view direction (vector of length 1)
     */
    direction: Vec2
    /**
     * Value describing process of aiming (0 - not aiming, 1 - ready to shoot)
     */
    aim: number
    /**
     * Current action unit is performing, or None
     */
    action: Action | null
    /**
     * Tick when health regeneration will start (can be less than current game tick)
     */
    healthRegenerationStartTick: number
    /**
     * Index of the weapon this unit is holding (starting with 0), or None
     */
    weapon: number | null
    /**
     * Next tick when unit can shoot again (can be less than current game tick)
     */
    nextShotTick: number
    /**
     * List of ammo in unit's inventory for every weapon type
     */
    ammo: Array<number>
    /**
     * Number of shield potions in inventory
     */
    shieldPotions: number

    constructor(id: number, playerId: number, health: number, shield: number, extraLives: number, position: Vec2, remainingSpawnTime: number | null, velocity: Vec2, direction: Vec2, aim: number, action: Action | null, healthRegenerationStartTick: number, weapon: number | null, nextShotTick: number, ammo: Array<number>, shieldPotions: number) {
        this.id = id;
        this.playerId = playerId;
        this.health = health;
        this.shield = shield;
        this.extraLives = extraLives;
        this.position = position;
        this.remainingSpawnTime = remainingSpawnTime;
        this.velocity = velocity;
        this.direction = direction;
        this.aim = aim;
        this.action = action;
        this.healthRegenerationStartTick = healthRegenerationStartTick;
        this.weapon = weapon;
        this.nextShotTick = nextShotTick;
        this.ammo = ammo;
        this.shieldPotions = shieldPotions;
    }

    /**
     * Read Unit from input stream
     */
    static async readFrom(stream: Stream): Promise<Unit> {
        let id;
        id = await stream.readInt();
        let playerId;
        playerId = await stream.readInt();
        let health;
        health = await stream.readDouble();
        let shield;
        shield = await stream.readDouble();
        let extraLives;
        extraLives = await stream.readInt();
        let position;
        position = await Vec2.readFrom(stream);
        let remainingSpawnTime;
        if (await stream.readBool()) {
            remainingSpawnTime = await stream.readDouble();
        } else {
            remainingSpawnTime = null;
        }
        let velocity;
        velocity = await Vec2.readFrom(stream);
        let direction;
        direction = await Vec2.readFrom(stream);
        let aim;
        aim = await stream.readDouble();
        let action;
        if (await stream.readBool()) {
            action = await Action.readFrom(stream);
        } else {
            action = null;
        }
        let healthRegenerationStartTick;
        healthRegenerationStartTick = await stream.readInt();
        let weapon;
        if (await stream.readBool()) {
            weapon = await stream.readInt();
        } else {
            weapon = null;
        }
        let nextShotTick;
        nextShotTick = await stream.readInt();
        let ammo;
        ammo = [];
        for (let ammoCount = await stream.readInt(); ammoCount > 0; ammoCount--) {
            let ammoElement;
            ammoElement = await stream.readInt();
            ammo.push(ammoElement);
        }
        let shieldPotions;
        shieldPotions = await stream.readInt();
        return new Unit(id, playerId, health, shield, extraLives, position, remainingSpawnTime, velocity, direction, aim, action, healthRegenerationStartTick, weapon, nextShotTick, ammo, shieldPotions)
    }

    /**
     * Write Unit to output stream
     */
    async writeTo(stream: Stream) {
        let id = this.id;
        await stream.writeInt(id);
        let playerId = this.playerId;
        await stream.writeInt(playerId);
        let health = this.health;
        await stream.writeDouble(health);
        let shield = this.shield;
        await stream.writeDouble(shield);
        let extraLives = this.extraLives;
        await stream.writeInt(extraLives);
        let position = this.position;
        await position.writeTo(stream);
        let remainingSpawnTime = this.remainingSpawnTime;
        if (remainingSpawnTime === null) {
            await stream.writeBool(false);
        } else {
            await stream.writeBool(true);
            await stream.writeDouble(remainingSpawnTime);
        }
        let velocity = this.velocity;
        await velocity.writeTo(stream);
        let direction = this.direction;
        await direction.writeTo(stream);
        let aim = this.aim;
        await stream.writeDouble(aim);
        let action = this.action;
        if (action === null) {
            await stream.writeBool(false);
        } else {
            await stream.writeBool(true);
            await action.writeTo(stream);
        }
        let healthRegenerationStartTick = this.healthRegenerationStartTick;
        await stream.writeInt(healthRegenerationStartTick);
        let weapon = this.weapon;
        if (weapon === null) {
            await stream.writeBool(false);
        } else {
            await stream.writeBool(true);
            await stream.writeInt(weapon);
        }
        let nextShotTick = this.nextShotTick;
        await stream.writeInt(nextShotTick);
        let ammo = this.ammo;
        await stream.writeInt(ammo.length);
        for (let ammoElement of ammo) {
            await stream.writeInt(ammoElement);
        }
        let shieldPotions = this.shieldPotions;
        await stream.writeInt(shieldPotions);
    }
}