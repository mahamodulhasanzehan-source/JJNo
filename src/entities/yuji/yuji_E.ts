import { Entity } from '../../game/Entity';
import { Particle } from '../../game/Particle';
import { Vector2 } from '../../game/Types';

export function applyYujiE(target: Entity, sourceEntity: Entity) {
  target.vel.x = sourceEntity.facingRight ? 60 : -60; // Doubled from 30
  target.vel.y = -15; // Slightly more vertical knockback too
}

export function fireYujiDomainE(
  owner: Entity,
  target: Entity | null | undefined,
  particles: Particle[],
  activeBeams: { start: Vector2; end: Vector2; timer: number; maxTimer: number; color?: string }[],
  visualSlashes: { x: number; y: number; angle: number; timer: number; maxTimer: number; color: string }[],
  triggerShake: (amt?: number) => void,
  playSound: () => void
) {
  const startX = owner.pos.x + owner.width / 2;
  const startY = owner.pos.y + owner.height / 2;
  const endX = owner.facingRight ? startX + 2500 : startX - 2500;
  const endY = startY;

  // Beam visual: high-intensity laser beam going in facing direction
  activeBeams.push({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    timer: 300,
    maxTimer: 300,
    color: '#ff1744'
  });

  playSound();
  triggerShake(15);

  // Laser beam energy particle burst
  const dir = owner.facingRight ? 1 : -1;
  for (let i = 0; i < 45; i++) {
    const px = startX + dir * (i * 50);
    particles.push(new Particle(
      px, startY + (Math.random() - 0.5) * 12,
      dir * (15 + Math.random() * 25), (Math.random() - 0.5) * 12,
      350 + Math.random() * 200,
      Math.random() > 0.4 ? '#ff1744' : '#ffd700',
      8 + Math.random() * 10,
      'line'
    ));
  }

  if (target) {
    // "Impossible to dodge if you are at the same level as Yuji"
    // Vertical bounds overlap test (+/- margin)
    const ownerYTop = owner.pos.y - 30;
    const ownerYBot = owner.pos.y + owner.height + 30;
    const targetYTop = target.pos.y;
    const targetYBot = target.pos.y + target.height;

    const isSameLevel = (targetYBot >= ownerYTop && targetYTop <= ownerYBot);
    const isInFacingDirection = owner.facingRight
      ? (target.pos.x + target.width >= owner.pos.x)
      : (target.pos.x <= owner.pos.x + owner.width);

    if (isSameLevel && isInFacingDirection) {
      // Direct guaranteed hit dealing reduced damage without stunning target
      const damage = 4.4; // 80% less damage (was 22)
      target.hp -= damage;
      target.secondaryHitTimer = 1000;
      target.stunTimer = 0; // No stun at all so target moves freely
      
      // Energy gain & lifesteal
      owner.energy = Math.min(100, owner.energy + 5);
      owner.hp = Math.min(owner.maxHp, owner.hp + damage * 0.2);

      // Sukuna-style slash overlays on target
      for (let s = 0; s < 6; s++) {
        visualSlashes.push({
          x: target.pos.x + target.width / 2 + (Math.random() - 0.5) * 40,
          y: target.pos.y + target.height / 2 + (Math.random() - 0.5) * 40,
          angle: Math.random() * Math.PI,
          timer: 250,
          maxTimer: 250,
          color: '#ff0000'
        });
      }

      // Hit sparks
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
          target.pos.x + target.width / 2,
          target.pos.y + target.height / 2,
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 35,
          450,
          '#ff1744',
          12
        ));
      }
    }
  }
}

