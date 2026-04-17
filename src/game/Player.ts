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

  update(dt: number, groundY: number, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isYujiDomainActive: boolean = false, isMegumiDomainActive: boolean = false, isSukunaDomainActive: boolean = false, target?: Entity) {
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
    const activeCharacterType = this.mimicryTarget || this.characterType;
    
    let baseECooldown = isYujiDomainActive ? 250 : 500;
    if (activeCharacterType === 'Sukuna') baseECooldown *= 0.75; // 25% faster
    
    if (activeCharacterType === 'Sukuna') {
      if (!isSukunaDomainActive) {
        if (isKeyDown('e') && this.cooldowns.e <= 0 && this.energy >= E_COST && this.stunTimer <= 0) {
          this.eChargeTimer += dt;
        } else if (!isKeyDown('e') && this.eChargeTimer > 0) {
          this.energy -= E_COST;
          this.cooldowns.e = baseECooldown;
          
          const chargeTime = this.eChargeTimer;
          this.eChargeTimer = 0;
          
          const isFuga = chargeTime >= 1000;
          const bonusDamage = Math.floor(chargeTime / 500) * 7;
          const bonusSize = Math.floor(chargeTime / 500) * 20;
          
          const centerX = this.pos.x + this.width / 2;
          const centerY = this.pos.y + this.height / 2;
          const vx = (this.facingRight ? 15 : -15) * 1.5;
          const vy = 0;
          const projColor = isFuga ? '#ff4500' : '#ff0000';
          
          projectiles.push(new Projectile(centerX, centerY, vx, vy, this.id, projColor, 'E', activeCharacterType, bonusDamage, bonusSize, isFuga ? 'fuga' : 'normal'));
          soundManager.playBlast();
          
          for(let i=0; i<15; i++) {
            particles.push(new Particle(centerX, centerY, (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15 + vy, 400, projColor, 6));
          }
        }
      } else {
        this.eChargeTimer = 0;
      }
    } else {
      if (isKeyDown('e') && this.cooldowns.e <= 0 && this.energy >= E_COST && this.stunTimer <= 0) {
        this.energy -= E_COST;
        this.cooldowns.e = baseECooldown;
        
        const centerX = this.pos.x + this.width / 2;
        const centerY = this.pos.y + this.height / 2;
        
        const vx = (this.facingRight ? 15 : -15);
        const vy = 0;
        
        let projColor = '#00ffff'; // Default Yuji
        let variant = 'normal';
        if (activeCharacterType === 'Gojo') projColor = '#8a2be2';
        if (activeCharacterType === 'Megumi') projColor = '#00008b'; // Deep blue
        if (activeCharacterType === 'Hakari') {
          const isPull = Math.random() > 0.5;
          projColor = isPull ? '#00ffff' : '#ffff00'; // Neon Blue / Yellow
          variant = isPull ? 'pull' : 'knockback';
        }
        
        projectiles.push(new Projectile(centerX, centerY, vx, vy, this.id, projColor, 'E', activeCharacterType, 0, 0, variant));
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
    }

    const qCooldown = isYujiDomainActive ? 500 : 1000;
    if (isKeyDown('q') && this.cooldowns.q <= 0 && this.energy >= Q_COST && this.stunTimer <= 0 && !this.qDisabled) {
      if (activeCharacterType === 'Sukuna' && isSukunaDomainActive) {
        this.energy -= Q_COST;
        this.cooldowns.q = 1000; // 1 second cooldown (reduced by 50%)
        
        // Sure-hit effect: Massive slash dropping perfectly vertical onto the target's position
        let targetX = this.pos.x + this.width / 2;
        if (target) {
          targetX = target.pos.x + target.width / 2;
        }

        const projWidth = 20 + 150; // Size override is 150
        const startX = targetX - projWidth / 2; // Perfectly centered on target
        const startY = target.pos.y - 1000; // Spawn 1000 pixels above target
        const vx = 0;
        const vy = 160; // 160 velocity per 16.66ms ≈ 9600 pixels/sec. Will cross 1000 pixels in ~0.1 seconds!
        
        projectiles.push(new Projectile(
          startX, startY, vx, vy, this.id, '#ff0000', 'Q', 'Sukuna',
          35, 150, 'world_slash' // 35 damage, super massive (150 bonus)
        ));
        soundManager.playSlash();
        triggerShake();
        
        // Pre-fire impact/blood particles marking the sure-hit
        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(
            targetX + (Math.random() - 0.5) * 80, target.pos.y - 200 + (Math.random() * 800),
            0, Math.random() * 20,
            600, '#ff0000', 8 + Math.random() * 10
          ));
        }
      } else {
        this.energy -= Q_COST;
        this.cooldowns.q = qCooldown;
        this.phaseTimer = 15 * 16.66; // 15 frames
        let dashSpeed = 25;
        if (activeCharacterType === 'Gojo' || activeCharacterType === 'Megumi' || activeCharacterType === 'Hakari' || activeCharacterType === 'Sukuna') {
          dashSpeed *= 1.25; // 25% farther
        }
        
        if (activeCharacterType === 'Megumi') {
          this.qDashTimer = 15 * 16.66;
          this.qDashHit = false;
          this.qDashStartX = this.pos.x;
          this.qDashStartY = this.pos.y;
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
    }

    if (this.sukunaQTimer > 0) {
      this.sukunaQTimer = 0;
    }

    this.updatePhysics(dt, groundY);
    return statsResult;
  }
}
