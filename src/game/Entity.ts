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
  
  qDashTimer: number = 0;
  qDashHit: boolean = false;
  qDashStartX: number = 0;
  qDashStartY: number = 0;
  
  // Hakari Buffs
  infiniteCeTimer: number = 0;
  invulnerableTimer: number = 0;
  mimicryTarget: CharacterType | null = null;
  qDisabled: boolean = false;
  
  eChargeTimer: number = 0;
  aiChargeTarget: number = 0;
  
  yujiEComboTimer: number = 0;
  
  sukunaQTimer: number = 0;
  
  isDismantled: boolean = false;
  
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
    let finalDamage = calculateDamage(amount, this.phaseTimer, this.characterType, isDomainActive, domainType, domainOwnerId, this.id);
    
    if (this.invulnerableTimer > 0) {
      finalDamage *= 0.25; // 75% damage reduction
    } else if (this.infiniteCeTimer > 0) {
      finalDamage *= 0.93; // 7% damage reduction
    }
    
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

  updateStats(dt: number, energyRegenMultiplier: number = 1.0) {
    const result = updateCombatStats(
      dt, this.energy, this.staminaPenaltyTimer, this.phaseTimer, 
      this.stunTimer, this.latencyTimer, this.slowTimer, 
      this.secondaryHitTimer, this.bleedTimer, this.brainDamageTimer,
      this.hp, this.bleedDamage, energyRegenMultiplier
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
    
    // Hakari Buffs Update
    if (this.infiniteCeTimer > 0) {
      this.infiniteCeTimer -= dt;
      this.energy = ENERGY_MAX;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    
    if (this.yujiEComboTimer > 0) {
      this.yujiEComboTimer -= dt;
    }

    // Stamina regen (not handled in combat manager to keep it simple, or we can handle it here)
    if (this.staminaPenaltyTimer <= 0 && !this.isDashing) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_RECOVERY_RATE * dt);
    }
    if (this.stamina <= 0 && this.staminaPenaltyTimer <= 0) {
      this.staminaPenaltyTimer = STAMINA_PENALTY_DURATION;
    }

    // Cooldowns
    const cdrMultiplier = this.infiniteCeTimer > 0 ? 2.0 : (this.invulnerableTimer > 0 ? 1.33 : 1.0); // 50% CDR = 2x speed, 25% CDR = 1.33x speed
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] -= dt * cdrMultiplier;
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
    if (this.phaseTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, this.width, this.height);
    } else {
      if (this.characterType === 'Megumi' || this.characterType === 'Gojo') {
        ctx.fillStyle = '#1a237e'; // Dark blue cloth
        ctx.fillRect(x, y, this.width, this.height);
      } else if (this.characterType === 'Yuji') {
        ctx.fillStyle = '#1a237e'; // Dark blue cloth pants/bottom
        ctx.fillRect(x, y + this.height / 2, this.width, this.height / 2);
        ctx.fillStyle = '#cc0000'; // Red hoodie top
        ctx.fillRect(x, y, this.width, this.height / 2);
      } else if (this.characterType === 'Sukuna') {
        ctx.fillStyle = '#f5cbba'; // Bare chest (skin color)
        ctx.fillRect(x, y, this.width, this.height / 2);
        ctx.fillStyle = '#f8f8ff'; // White pants
        ctx.fillRect(x, y + this.height / 2, this.width, this.height / 2);
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
      }
    }

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
      
      // Chest markings
      ctx.fillRect(x + 10, y + 25, 20, 2);
      ctx.fillRect(x + 15, y + 30, 10, 2);
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
    } else if (this.characterType === 'Megumi') {
      // Spiky dark blue-black hair
      ctx.fillStyle = '#0a1128';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 15);
      ctx.lineTo(x + 5, y - 20);
      ctx.lineTo(x + 15, y - 5);
      ctx.lineTo(x + 25, y - 25);
      ctx.lineTo(x + 35, y - 10);
      ctx.lineTo(x + 45, y + 15);
      ctx.fill();
      // Tactical uniform collar
      ctx.fillStyle = '#0a0a2a';
      ctx.fillRect(x, y + 15, this.width, 10);
    } else if (this.characterType === 'Hakari') {
      // Blonde hair
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 10, y - 15);
      ctx.lineTo(x + 20, y - 5);
      ctx.lineTo(x + 30, y - 15);
      ctx.lineTo(x + 45, y + 10);
      ctx.fill();
      
      // Jacket
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x - 2, y + 15, this.width + 4, 30);
      
      // Mimicry indicator
      if (this.mimicryTarget) {
        ctx.fillStyle = '#ff1493';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MIMIC', x + this.width / 2, y - 25);
      }
    }

    ctx.globalAlpha = 1;
    
    // Direction indicator
    ctx.fillStyle = '#000';
    if (this.facingRight) {
      ctx.fillRect(x + this.width - 10, y + 10, 10, 10);
    } else {
      ctx.fillRect(x, y + 10, 10, 10);
    }

    // Sukuna Fuga Charge Visual
    if (this.eChargeTimer > 0 && (this.characterType === 'Sukuna' || this.mimicryTarget === 'Sukuna')) {
      const chargeRatio = Math.min(this.eChargeTimer / 1000, 1);
      ctx.beginPath();
      ctx.arc(x + this.width/2, y + this.height/2, 30 + chargeRatio * 20, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255, 69, 0, ${chargeRatio * 0.8})`;
      ctx.lineWidth = 2 + chargeRatio * 4;
      ctx.stroke();
    }
  }
}
