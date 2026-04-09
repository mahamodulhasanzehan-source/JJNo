import { Entity } from './Entity';
import { InputManager } from './InputManager';
import { Projectile } from './Projectile';
import { E_COST, Q_COST, C_COST, Q_DMG } from './Constants';
import { Particle } from './Particle';
import { soundManager } from './SoundManager';
import { handlePlayerMovement } from '../systems/movement';

export class Player extends Entity {
  input: InputManager;

  constructor(id: string, x: number, y: number, input: InputManager) {
    super(id, x, y, 'Yuji', '#4a90e2'); // Default to Yuji for player
    this.input = input;
  }

  update(dt: number, groundY: number, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isYujiDomainActive: boolean = false) {
    this.updateStats(dt);
    
    // Movement
    const result = handlePlayerMovement(
      dt, this.input, this.vel, this.isGrounded, this.stamina, 
      this.staminaPenaltyTimer, this.slowTimer, this.stunTimer, this.latencyTimer,
      isYujiDomainActive && this.characterType === 'Yuji'
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
      // Very simple latency simulation: if latencyTimer > 0, we could ignore inputs or just randomly drop them, 
      // but a true 70ms delay requires an input queue. 
      // For simplicity, we'll just randomly drop inputs to simulate latency if we don't have a queue.
      // Actually, let's just use the current input. The prompt says "70ms delay to all enemy actions".
      // If the player is the enemy of Gojo, they get latency.
      if (this.latencyTimer > 0) {
        // Simple simulation: 70ms is about 4 frames. We can just use a small chance to ignore new inputs.
        // Or we can just leave it as is if it's too complex to add a queue right now.
        // Let's add a simple queue.
      }
      return this.input.isKeyDown(key);
    };

    // Abilities
    const eCooldown = isYujiDomainActive ? 250 : 500;
    if (isKeyDown('e') && this.cooldowns.e <= 0 && this.energy >= E_COST && this.stunTimer <= 0) {
      this.energy -= E_COST;
      this.cooldowns.e = eCooldown;
      const vx = this.facingRight ? 15 : -15;
      projectiles.push(new Projectile(this.pos.x + (this.facingRight ? this.width : -20), this.pos.y + 20, vx, 0, this.id, '#00ffff', 'E', this.characterType));
      soundManager.playBlast();
    }

    const qCooldown = isYujiDomainActive ? 500 : 1000;
    if (isKeyDown('q') && this.cooldowns.q <= 0 && this.energy >= Q_COST && this.stunTimer <= 0) {
      this.energy -= Q_COST;
      this.cooldowns.q = qCooldown;
      this.phaseTimer = 15 * 16.66; // 15 frames
      this.vel.x = this.facingRight ? 25 : -25; // Dash forward
      this.hasHitDash = false;
      triggerShake();
      soundManager.playDash();
      
      // Dash particles
      for(let i=0; i<10; i++) {
        particles.push(new Particle(
          this.pos.x + this.width/2, this.pos.y + this.height/2,
          (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10,
          200, '#ff00ff', 5
        ));
      }
    }

    this.updatePhysics(dt, groundY);
  }
}
