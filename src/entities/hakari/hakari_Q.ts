import { Entity } from '../../game/Entity';

export function applyHakariQ(target: Entity, sourceEntity: Entity) {
  // Q (Jackpot Dash): Randomly applies one of three status effects if successful
  // Outcome 1: Impact (Yuji-style knockback)
  // Outcome 2: Delayed Cut (Sukuna-style 3 DMG after 2s)
  // Outcome 3: Shadow Tether (Megumi-style rubber-band bind for 1s)
  
  const roll = Math.random();
  
  if (roll < 0.33) {
    // Outcome 1: Impact (Knockback handled in GameEngine)
    (target as any).hakariQKnockback = true;
  } else if (roll < 0.66) {
    // Outcome 2: Delayed Cut
    target.secondaryHitTimer = 2000; // 2 seconds
  } else {
    // Outcome 3: Shadow Tether
    (target as any).shadowAnchor = {
      x: target.pos.x,
      y: target.pos.y,
      timer: 1000 // 1 second
    };
  }
}
