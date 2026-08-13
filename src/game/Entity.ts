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
  
  yujiDomainEWindowTimer: number = 0;
  yujiDomainECastCount: number = 0;
  
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

    if (this.yujiDomainEWindowTimer > 0) {
      this.yujiDomainEWindowTimer -= dt;
      if (this.yujiDomainEWindowTimer <= 0) {
        this.yujiDomainEWindowTimer = 0;
        this.yujiDomainECastCount = 0;
      }
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

    ctx.save();
    
    // Dynamic drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x + this.width / 2, y + this.height, this.width / 1.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Auras based on character type or buffs
    if (this.infiniteCeTimer > 0) {
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = 30 + Math.sin(Date.now() * 0.01) * 20;
      ctx.strokeStyle = `rgba(241, 196, 15, ${0.5 + Math.sin(Date.now() * 0.02) * 0.5})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 5, y - 5, this.width + 10, this.height + 10);
    } else if (this.characterType === 'Gojo' && this.energy > 50) {
      ctx.shadowColor = '#8a2be2';
      ctx.shadowBlur = 20;
    } else if (this.characterType === 'Sukuna' && this.energy > 50) {
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 20;
    } else if (this.characterType === 'Yuji' && this.energy > 50) {
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 20;
    }

    if (this.phaseTimer > 0) {
      // After-image dodge effect
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - (this.vel.x * 0.05), y, this.width, this.height);
      ctx.fillRect(x - (this.vel.x * 0.1), y, this.width, this.height);
      ctx.globalAlpha = 0.8;
    } else {
      ctx.globalAlpha = 1.0;
    }

    // Base body drawing (High Quality Simple Outfit & Texture)
    if (this.phaseTimer > 0) {
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, this.width, this.height, 6);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, this.width, this.height);
      }
    } else {
      ctx.shadowBlur = 0; // Turn off aura blur for body painting
      
      // Rounded Body Capsule Base
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, this.width, this.height, 6);
      } else {
        ctx.rect(x, y, this.width, this.height);
      }
      ctx.clip();

      if (this.characterType === 'Gojo' || this.characterType === 'Megumi') {
        // High quality dark navy Jujutsu High Coat Gradient
        const coatGrad = ctx.createLinearGradient(x, y, x, y + this.height);
        coatGrad.addColorStop(0, '#1e293b');
        coatGrad.addColorStop(0.5, '#0f172a');
        coatGrad.addColorStop(1, '#020617');
        ctx.fillStyle = coatGrad;
        ctx.fill();

        // High collar detail
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x, y + 10, this.width, 12);
        
        // Metallic Jujutsu Button
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + 28, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + 42, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Fabric Fold Texture Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(x + 4, y, 3, this.height);
        ctx.fillRect(x + this.width - 7, y, 3, this.height);

      } else if (this.characterType === 'Yuji') {
        // Jujutsu Pants (Bottom half)
        const pantsGrad = ctx.createLinearGradient(x, y + this.height/2, x, y + this.height);
        pantsGrad.addColorStop(0, '#1e293b');
        pantsGrad.addColorStop(1, '#020617');
        ctx.fillStyle = pantsGrad;
        ctx.fillRect(x, y + this.height / 2, this.width, this.height / 2);

        // Red Hoodie Top (Upper half)
        const hoodGrad = ctx.createLinearGradient(x, y, x, y + this.height/2);
        hoodGrad.addColorStop(0, '#ef4444');
        hoodGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = hoodGrad;
        ctx.fillRect(x, y, this.width, this.height / 2);

        // Hoodie Scarf / Collar Texture
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + 12, this.width/2 + 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Zipper & Pocket Texture Line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + 12);
        ctx.lineTo(x + this.width/2, y + this.height/2);
        ctx.stroke();

      } else if (this.characterType === 'Sukuna') {
        // Bare chest skin top
        ctx.fillStyle = '#f5cbba';
        ctx.fillRect(x, y, this.width, this.height * 0.45);

        // Chest tattoo markings
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + 20, 6, 0, Math.PI);
        ctx.stroke();
        ctx.fillRect(x + 10, y + 14, this.width - 20, 1.5);

        // White Kimono Pants
        const kimonoGrad = ctx.createLinearGradient(x, y + this.height * 0.45, x, y + this.height);
        kimonoGrad.addColorStop(0, '#f8fafc');
        kimonoGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = kimonoGrad;
        ctx.fillRect(x, y + this.height * 0.45, this.width, this.height * 0.55);

        // Black Sash Obi Waistband
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 2, y + this.height * 0.42, this.width + 4, 8);

      } else if (this.characterType === 'Hakari') {
        // Dark purple coat over white shirt
        const coatGrad = ctx.createLinearGradient(x, y, x, y + this.height);
        coatGrad.addColorStop(0, '#581c87');
        coatGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = coatGrad;
        ctx.fill();

        // White V-neck undershirt
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 5);
        ctx.lineTo(x + this.width / 2, y + 30);
        ctx.lineTo(x + this.width - 10, y + 5);
        ctx.closePath();
        ctx.fill();

        // Gold Chain
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + 12, 8, 0, Math.PI);
        ctx.stroke();

      } else {
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      // Inner Edge Highlight Texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // High Texture Hair & Facial Features
    if (this.characterType === 'Gojo') {
      // Spiky White Hair with Under-shading
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 12);
      ctx.lineTo(x + 2, y - 22);
      ctx.lineTo(x + 14, y - 10);
      ctx.lineTo(x + 24, y - 26);
      ctx.lineTo(x + 34, y - 10);
      ctx.lineTo(x + 44, y - 20);
      ctx.lineTo(x + 48, y + 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 10);
      ctx.lineTo(x + 4, y - 18);
      ctx.lineTo(x + 15, y - 8);
      ctx.lineTo(x + 24, y - 22);
      ctx.lineTo(x + 33, y - 8);
      ctx.lineTo(x + 42, y - 16);
      ctx.lineTo(x + 45, y + 10);
      ctx.fill();

      // Blindfold with Subtle Blue Edge Glow
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x - 3, y + 4, this.width + 6, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - 3, y + 14, this.width + 6, 1.5);

    } else if (this.characterType === 'Sukuna') {
      // Spiky Pink Hair
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 8, y - 18);
      ctx.lineTo(x + 20, y - 8);
      ctx.lineTo(x + 32, y - 22);
      ctx.lineTo(x + 44, y + 10);
      ctx.fill();

      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 8);
      ctx.lineTo(x + 9, y - 15);
      ctx.lineTo(x + 20, y - 6);
      ctx.lineTo(x + 31, y - 18);
      ctx.lineTo(x + 42, y + 8);
      ctx.fill();

      // 4 Glowing Red Eyes
      ctx.fillStyle = '#ef4444';
      const eyeX = this.facingRight ? x + this.width - 12 : x + 4;
      ctx.fillRect(eyeX, y + 4, 3, 2);
      ctx.fillRect(eyeX + 4, y + 4, 3, 2);
      ctx.fillRect(eyeX, y + 8, 3, 1.5);
      ctx.fillRect(eyeX + 4, y + 8, 3, 1.5);

    } else if (this.characterType === 'Yuji') {
      // Two-Tone Salmon Pink Hair
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 6, y - 15);
      ctx.lineTo(x + 18, y - 6);
      ctx.lineTo(x + 30, y - 18);
      ctx.lineTo(x + 42, y + 10);
      ctx.fill();

      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 8);
      ctx.lineTo(x + 7, y - 12);
      ctx.lineTo(x + 18, y - 4);
      ctx.lineTo(x + 29, y - 14);
      ctx.lineTo(x + 39, y + 8);
      ctx.fill();

    } else if (this.characterType === 'Megumi') {
      // Messy Dark Blue Spiky Hair
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 12);
      ctx.lineTo(x + 4, y - 20);
      ctx.lineTo(x + 16, y - 8);
      ctx.lineTo(x + 26, y - 24);
      ctx.lineTo(x + 36, y - 10);
      ctx.lineTo(x + 46, y + 12);
      ctx.fill();

      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 10);
      ctx.lineTo(x + 6, y - 14);
      ctx.lineTo(x + 16, y - 5);
      ctx.lineTo(x + 25, y - 18);
      ctx.lineTo(x + 34, y - 7);
      ctx.lineTo(x + 42, y + 10);
      ctx.fill();

    } else if (this.characterType === 'Hakari') {
      // Styled Blonde Hair & Sunglasses
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 10);
      ctx.lineTo(x + 10, y - 16);
      ctx.lineTo(x + 22, y - 6);
      ctx.lineTo(x + 34, y - 18);
      ctx.lineTo(x + 44, y + 10);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(x - 1, y + 8);
      ctx.lineTo(x + 11, y - 13);
      ctx.lineTo(x + 22, y - 4);
      ctx.lineTo(x + 33, y - 14);
      ctx.lineTo(x + 41, y + 8);
      ctx.fill();

      // Sunglasses
      ctx.fillStyle = '#18181b';
      const sgX = this.facingRight ? x + this.width - 14 : x + 2;
      ctx.fillRect(sgX, y + 5, 12, 6);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(sgX + 2, y + 7, 3, 2);
    }

    ctx.globalAlpha = 1;
    
    // Direction Indicator / Eye Reflection
    ctx.fillStyle = '#38bdf8';
    if (this.facingRight) {
      ctx.fillRect(x + this.width - 6, y + 8, 3, 3);
    } else {
      ctx.fillRect(x + 3, y + 8, 3, 3);
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
    
    ctx.restore();
  }
}
