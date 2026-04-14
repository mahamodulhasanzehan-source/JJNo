import { Entity } from '../../game/Entity';

export function applyMegumiQ(target: Entity, sourceEntity: Entity) {
  // Q (Shadow Snap Dash):
  // Combat Logic: If an enemy is positioned in the dash path, they can be struck twice
  // (once during the initial dash and once during the snap-back).
  // This function is called when the dash hits the target.
  // We can apply a brief stun or just let the damage happen.
  target.stunTimer = 200; // Brief stun on hit
}
