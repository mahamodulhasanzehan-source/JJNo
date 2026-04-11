import { Entity } from '../../game/Entity';

export function applyYujiE(target: Entity, sourceEntity: Entity) {
  target.vel.x = sourceEntity.facingRight ? 60 : -60; // Doubled from 30
  target.vel.y = -15; // Slightly more vertical knockback too
}
