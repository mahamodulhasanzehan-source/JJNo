import { Entity } from './Entity';
import { InputManager } from './InputManager';
import { Projectile } from './Projectile';
import { E_COST, Q_COST, C_COST, Q_DMG } from './Constants';
import { Particle } from './Particle';
import { soundManager } from './SoundManager';
import { handlePlayerMovement } from '../systems/movement';
import { Vector2 } from './Types';

export class Player extends Entity {
  input: InputManager;

  constructor(id: string, x: number, y: number, input: InputManager) {
    super(id, x, y, 'Yuji', '#4a90e2'); // Default to Yuji for player
    this.input = input;
  }

  update(dt: number, groundY: number, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isYujiDomainActive: boolean = false) {
    const energyRegenMultiplier = (isYujiDomainActive && this.characterType === 'Yuji') ? 1.5 : 1.0;
    const statsResult = this.updateStats(dt, energyRegenMultiplier);
    
    // Movement
    const result = handlePlayerMovement(
      dt, this.input, this.vel, this.isGrounded, this.stamina, 
      this.staminaPenaltyTimer, this.slowTimer, this.stunTimer, this.latencyTimer,
      isYujiDomainActive && this.characterType === 'Yuji',
      this.characterType
    );
    
    this.vel = result.newVel;
    this.stamina = result.newStamina;
    this.staminaPenaltyTimer = result.newStaminaPenaltyTimer;
    if (result.facingRight !== null) {
      this.facingRight = result.facingRight;
    }
    this.isDashing = this.input.isKeyDown('shift') && this.stamina > 0 && this.staminaPenaltyTimer <= 0;

    // Handle Input Latency
    const isKeyDown = (key: string) => {
      return this.input.isKeyDown(key);
    };

    // Abilities
    let baseECooldown = isYujiDomainActive ? 250 : 500;
    if (this.characterType === 'Sukuna') baseECooldown *= 0.75; // 25% faster
    
    if (isKeyDown('e') && this.cooldowns.e <= 0 && this.energy >= E_COST && this.stunTimer <= 0) {
      this.energy -= E_COST;
      this.cooldowns.e = baseECooldown;
      
      const centerX = this.pos.x + this.width / 2;
      const centerY = this.pos.y + this.height / 2;
      
      let speedMultiplier = this.characterType === 'Sukuna' ? 1.5 : 1;
      const vx = (this.facingRight ? 15 : -15) * speedMultiplier;
      const vy = 0;
      
      let projColor = '#00ffff'; // Default Yuji
      if (this.characterType === 'Gojo') projColor = '#8a2be2';
      if (this.characterType === 'Sukuna') projColor = '#ff0000';
      
      projectiles.push(new Projectile(centerX, centerY, vx, vy, this.id, projColor, 'E', this.characterType));
      soundManager.playBlast();
      
      // Extra E particles
      for(let i=0; i<15; i++) {
        particles.push(new Particle(
          centerX, centerY,
          (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15 + vy,
          400, projColor, 6
        ));
      }
    }

    const qCooldown = isYujiDomainActive ? 500 : 1000;
    if (isKeyDown('q') && this.cooldowns.q <= 0 && this.energy >= Q_COST && this.stunTimer <= 0) {
      this.energy -= Q_COST;
      this.cooldowns.q = qCooldown;
      this.phaseTimer = 15 * 16.66; // 15 frames
      let dashSpeed = 25;
      if (this.characterType === 'Gojo') {
        dashSpeed *= 1.25; // 25% farther
      }
      
      const centerX = this.pos.x + this.width / 2;
      const centerY = this.pos.y + this.height / 2;
      this.vel.x = this.facingRight ? dashSpeed : -dashSpeed;
      this.vel.y = 0;
      
      this.hasHitDash = false;
      triggerShake();
      soundManager.playDash();
      
      // Dash particles
      for(let i=0; i<20; i++) {
        particles.push(new Particle(
          centerX, centerY,
          (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
          300, this.color, 8
        ));
      }
    }

    this.updatePhysics(dt, groundY);
    return statsResult;
  }
}
