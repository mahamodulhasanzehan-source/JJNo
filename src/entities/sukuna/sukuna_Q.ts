import { Entity } from '../../game/Entity';
import { Projectile } from '../../game/Projectile';
import { Particle } from '../../game/Particle';

export function applySukunaQ(target: Entity, isPlayer: boolean, setBlur: (val: number) => void) {
  target.bleedTimer = 3000;
  target.bleedDamage = 5;
  if (isPlayer) {
    setBlur(20);
  }
}

export function fireSukunaQDomain(
  owner: Entity,
  target: Entity | null | undefined,
  projectiles: Projectile[],
  particles: Particle[],
  playSound: () => void,
  triggerShake: () => void
) {
  let targetX = owner.pos.x + owner.width / 2;
  let targetY = owner.pos.y + owner.height / 2;
  if (target) {
    targetX = target.pos.x + target.width / 2;
    targetY = target.pos.y + target.height / 2;
  }

  const projWidth = 20 + 150; // Size override is 150
  const theta = Math.random() * Math.PI * 2;
  const R = 1500;
  
  const startX = targetX - Math.cos(theta) * R - projWidth / 2;
  const startY = targetY - Math.sin(theta) * R - projWidth / 2;
  
  const speed = 160; 
  const vx = Math.cos(theta) * speed;
  const vy = Math.sin(theta) * speed;
  
  projectiles.push(new Projectile(
    startX, startY, vx, vy, owner.id, '#ff0000', 'Q', 'Sukuna',
    35, 150, 'world_slash' // 35 damage, super massive (150 bonus)
  ));
  playSound();
  triggerShake();
  
  // Pre-fire impact/blood particles marking the sure-hit
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(
      targetX + (Math.random() - 0.5) * 80, targetY + (Math.random() - 0.5) * 80,
      0, Math.random() * 20,
      600, '#ff0000', 8 + Math.random() * 10
    ));
  }
}

