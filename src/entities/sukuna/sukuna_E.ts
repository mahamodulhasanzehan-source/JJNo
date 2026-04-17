import { Entity } from '../../game/Entity';
import { Projectile } from '../../game/Projectile';
import { Particle } from '../../game/Particle';

export function applySukunaE(target: Entity) {
  target.secondaryHitTimer = 2000;
}

export function fireSukunaE(
  owner: Entity,
  chargeTime: number,
  projectiles: Projectile[],
  particles: Particle[],
  playSound: () => void
) {
  const isFuga = chargeTime >= 1000;
  const bonusDamage = Math.floor(chargeTime / 500) * 7;
  const bonusSize = Math.floor(chargeTime / 500) * 20;

  const centerX = owner.pos.x + owner.width / 2;
  const centerY = owner.pos.y + owner.height / 2;
  const vx = (owner.facingRight ? 15 : -15) * 1.5;
  const vy = 0;
  const projColor = isFuga ? '#ff4500' : '#ff0000';

  projectiles.push(new Projectile(
    centerX, centerY, vx, vy, owner.id, projColor, 'E', 'Sukuna', bonusDamage, bonusSize, isFuga ? 'fuga' : 'normal'
  ));
  playSound();

  for (let i = 0; i < 15; i++) {
    particles.push(new Particle(
      centerX, centerY,
      (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15 + vy,
      400, projColor, 6
    ));
  }
}
