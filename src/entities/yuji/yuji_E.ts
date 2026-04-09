import { Entity } from '../../game/Entity';

export function applyYujiE(target: Entity, sourceEntity: Entity) {
  target.vel.x = sourceEntity.facingRight ? 30 : -30;
  target.vel.y = -10;
}
