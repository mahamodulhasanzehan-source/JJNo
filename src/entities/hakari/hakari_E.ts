import { Entity } from '../../game/Entity';

export function applyHakariE(target: Entity) {
  // E (Probability Blast): 50/50 RNG on hit
  // Outcome A: Stun (Gojo-style 1s Input Disable)
  // Outcome B: Knockback (Yuji-style forceful vertical/horizontal push)
  
  const isStun = Math.random() < 0.5;
  
  if (isStun) {
    target.stunTimer = 1000; // 1 second stun
  } else {
    // Knockback handled in GameEngine on hit, we'll set a flag
    (target as any).hakariEKnockback = true;
  }
}
