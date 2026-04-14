import { Entity } from '../../game/Entity';

export function applyMegumiE(target: Entity, sourceEntity: Entity) {
  // E (Shadow Blast): On impact, creates a "Shadow Anchor" at the hit coordinates.
  // The Bind: A black, rubber-band-like string connects the enemy to the anchor for 1 second.
  // The enemy can move but is forcefully pulled back toward the anchor point if they try to exceed a certain radius.
  
  // We'll set a custom property on the target to handle the tether.
  (target as any).shadowAnchor = {
    x: target.pos.x,
    y: target.pos.y,
    timer: 1000 // 1 second
  };
}
