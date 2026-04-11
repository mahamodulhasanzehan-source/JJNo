import { Entity } from '../../game/Entity';

export function applyYujiQ(target: Entity, sourceEntity: Entity) {
  target.stunTimer = 1000;
  target.vel.x = sourceEntity.facingRight ? 90 : -90; // 1.5x of E's new knockback (60 * 1.5)
  target.vel.y = -20;
}
