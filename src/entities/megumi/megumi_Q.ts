import { Entity } from '../../game/Entity';

export function applyMegumiQ(target: Entity, sourceEntity: Entity) {
  // Q Dash hit: Tethers the enemy and pulls them to the tether point.
  // The rope disappears instantly if they cross the tether point or after 1.5s.
  
  (target as any).qTether = {
    x: sourceEntity.qDashStartX,
    y: sourceEntity.qDashStartY,
    timer: 1500 // 1.5 seconds
  };
  target.stunTimer = 200; // Brief stun on hit
}
