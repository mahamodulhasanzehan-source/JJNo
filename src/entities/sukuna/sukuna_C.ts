import { Vector2 } from '../../game/Types';
import { Entity } from '../../game/Entity';
import { Projectile } from '../../game/Projectile';

export function handleSukunaDomainInput(
  dt: number,
  isOwnerPlayer: boolean,
  player: Entity,
  abonant: Entity,
  isEPressed: boolean,
  omniCleaveTimer: number,
  setOmniCleaveTimer: (val: number) => void,
  omniCleaveCount: number,
  setOmniCleaveCount: (val: number) => void,
  projectiles: any[],
  triggerShake: (val: number) => void,
  setImpactFrameTimer: (val: number) => void,
  playSound: () => void
) {
  const owner = isOwnerPlayer ? player : abonant;
  const target = isOwnerPlayer ? abonant : player;
  
  target.takeDamage((5 * dt) / 1000); // 5 DMG/sec passive DoT

  // Trigger Omni-Directional Cleave
  if (isEPressed && omniCleaveTimer <= 0 && omniCleaveCount === 0) {
    setOmniCleaveCount(10);
    setOmniCleaveTimer(50); // 1 slash every 50ms (0.5s total for 10)
  }

  // AI Logic for Omni-Directional Cleave
  if (!isOwnerPlayer && omniCleaveCount === 0 && Math.random() < 0.02) {
    setOmniCleaveCount(10);
    setOmniCleaveTimer(50);
  }

  // Process Omni-Directional Cleave
  if (omniCleaveCount > 0) {
    if (omniCleaveTimer > 0) {
      setOmniCleaveTimer(omniCleaveTimer - dt);
    }
    
    if (omniCleaveTimer <= 0) {
      // Fire 1 slash
      const isLeft = omniCleaveCount % 2 === 0;
      const angleOffset = (Math.random() * 16 - 8) * (Math.PI / 180); // -8 to +8 degrees
      const baseAngle = isLeft ? Math.PI : 0;
      const finalAngle = baseAngle + angleOffset;
      
      const speed = 45; // Fast-moving linear projectile
      const vx = Math.cos(finalAngle) * speed;
      const vy = Math.sin(finalAngle) * speed;
      
      const centerX = owner.pos.x + owner.width / 2;
      const centerY = owner.pos.y + owner.height / 2;
      
      projectiles.push(new Projectile(
        centerX, centerY, vx, vy, owner.id, '#ff0000', 'DOMAIN_E', 'Sukuna', 15, 20, 'omni_cleave'
      ));
      
      playSound();
      triggerShake(5);
      setImpactFrameTimer(20);
      
      setOmniCleaveCount(omniCleaveCount - 1);
      if (omniCleaveCount - 1 > 0) {
        setOmniCleaveTimer(50);
      }
    }
  }
}
