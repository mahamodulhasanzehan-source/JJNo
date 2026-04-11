import { Vector2, Rect, CharacterType } from './Types';
import { GRAVITY, FRICTION, TERMINAL_VELOCITY, STAMINA_MAX, STAMINA_RECOVERY_RATE, STAMINA_PENALTY_DURATION, ENERGY_MAX, ENERGY_PASSIVE_REGEN } from './Constants';
import { Projectile } from './Projectile';
import { applyPhysics } from '../systems/physics';
import { updateCombatStats, calculateDamage } from '../systems/combat_manager';

export class Entity {
  id: string;
  pos: Vector2;
  vel: Vector2;
  width: number = 40;
  height: number = 80;
  
  hp: number = 200;
  maxHp: number = 200;
  energy: number = 15;
  stamina: number = STAMINA_MAX;
  isDashing: boolean = false;
  
  staminaPenaltyTimer: number = 0;
  phaseTimer: number = 0; // Invulnerability frames
  brainDamageTimer: number = 0; // Gojo domain after-effect
  
  stunTimer: number = 0;
  latencyTimer: number = 0;
  slowTimer: number = 0;
  secondaryHitTimer: number = 0;
  bleedTimer: number = 0;
  bleedDamage: number = 0;
  
  hasHitDash: boolean = false;
  
  characterType: CharacterType;
  color: string;
  
  facingRight: boolean = true;
  isGrounded: boolean = false;
  
  cooldowns: Record<string, number> = {
    e: 0,
    q: 0,
    c: 0
  };

  constructor(id: string, x: number, y: number, type: CharacterType, color: string) {
    this.id = id;
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.characterType = type;
    this.color = color;
  }

  getRect(): Rect {
    return { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
  }

  takeDamage(amount: number, isDomainActive: boolean = false, domainType: CharacterType | null = null, domainOwnerId: string | null = null) {
    const finalDamage = calculateDamage(amount, this.phaseTimer, this.characterType, isDomainActive, domainType, domainOwnerId, this.id);
    if (finalDamage === 0 && amount > 0) return false;
    this.hp -= finalDamage;
    return true;
  }

  updatePhysics(dt: number, groundY: number) {
    const result = applyPhysics(
      this.pos, this.vel, this.width, this.height, dt, groundY, this.isGrounded, this.phaseTimer
    );
    this.pos = result.newPos;
    this.vel = result.newVel;
    this.isGrounded = result.newIsGrounded;
  }

  updateStats(dt: number) {
    const result = updateCombatStats(
      dt, this.energy, this.staminaPenaltyTimer, this.phaseTimer, 
      this.stunTimer, this.latencyTimer, this.slowTimer, 
      this.secondaryHitTimer, this.bleedTimer, this.brainDamageTimer,
      this.hp, this.bleedDamage
    );
    
    this.energy = result.newEnergy;
    this.staminaPenaltyTimer = result.newStaminaPenaltyTimer;
    this.phaseTimer = result.newPhaseTimer;
    this.stunTimer = result.newStunTimer;
    this.latencyTimer = result.newLatencyTimer;
    this.slowTimer = result.newSlowTimer;
    this.brainDamageTimer = result.newBrainDamageTimer;
    this.hp = result.newHp;
    this.secondaryHitTimer = result.newSecondaryHitTimer;
    this.bleedTimer = result.newBleedTimer;

    // Stamina regen (not handled in combat manager to keep it simple, or we can handle it here)
    if (this.staminaPenaltyTimer <= 0 && !this.isDashing) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_RECOVERY_RATE * dt);
    }
    if (this.stamina <= 0 && this.staminaPenaltyTimer <= 0) {
      this.staminaPenaltyTimer = STAMINA_PENALTY_DURATION;
    }

    // Cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] -= dt;
      }
    }

    return {
      didSecondaryHit: result.didSecondaryHit,
      didBleedHit: result.didBleedHit
    };
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    ctx.globalAlpha = this.phaseTimer > 0 ? 0.5 : 1;

    // Base body
    ctx.fillStyle = this.phaseTimer > 0 ? '#ffffff' : this.color;
    if (this.characterType === 'Yuji') ctx.fillStyle = '#ff6b6b'; // Light-red hoodie
    
    ctx.fillRect(x, y, this.width, this.height);

    // Character specific details
    if (this.characterType === 'Gojo') {
      // Spiky white hair
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 15);
      ctx.lineTo(x + 5, y - 20);
      ctx.lineTo(x + 20, y - 10);
      ctx.lineTo(x + 35, y - 25);
      ctx.lineTo(x + 45, y + 15);
      ctx.fill();
      // Blindfold
      ctx.fillStyle = '#111111';
      ctx.fillRect(x - 2, y + 5, this.width + 4, 12);
    } else if (this.characterType === 'Sukuna') {
      // Spiky pink hair (swept up)
      ctx.fillStyle = '#e68a8a';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 10, y - 20);
      ctx.lineTo(x + 25, y - 10);
      ctx.lineTo(x + 40, y - 25);
      ctx.lineTo(x + 45, y + 10);
      ctx.fill();
      // Face markings
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 5, y + 5, 8, 2);
      ctx.fillRect(x + 27, y + 5, 8, 2);
      ctx.fillRect(x + 10, y + 12, 20, 2);
      // Kimono collar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x + this.width / 2, y + 35);
      ctx.lineTo(x + this.width, y + 20);
      ctx.lineTo(x + this.width, y + 25);
      ctx.lineTo(x + this.width / 2, y + 40);
      ctx.lineTo(x, y + 25);
      ctx.fill();
    } else if (this.characterType === 'Yuji') {
      // Spiky pink/brown hair instead of a white rectangle
      ctx.fillStyle = '#e68a8a';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 5, y - 15);
      ctx.lineTo(x + 15, y - 5);
      ctx.lineTo(x + 25, y - 15);
      ctx.lineTo(x + 35, y - 5);
      ctx.lineTo(x + 45, y + 10);
      ctx.fill();
      // Red hood/scarf
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(x - 2, y + 15, this.width + 4, 10);
    }

    ctx.globalAlpha = 1;
    
    // Direction indicator
    ctx.fillStyle = '#000';
    if (this.facingRight) {
      ctx.fillRect(x + this.width - 10, y + 10, 10, 10);
    } else {
      ctx.fillRect(x, y + 10, 10, 10);
    }
  }
}
