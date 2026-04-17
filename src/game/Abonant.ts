import { Entity } from './Entity';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { E_COST, Q_COST } from './Constants';
import { CharacterType, Vector2 } from './Types';
import { InputManager } from './InputManager';
import { soundManager } from './SoundManager';

type AIState = 'IDLE' | 'APPROACH' | 'RETREAT' | 'ATTACK_E' | 'ATTACK_Q' | 'BAIT' | 'DESPERATION' | 'DOMAIN';

export class Abonant extends Entity {
  state: AIState = 'IDLE';
  stateTimer: number = 0;
  target: Player | null = null;
  reactionTimer: number = 0;
  input?: InputManager;

  constructor(id: string, x: number, y: number, input?: InputManager) {
    const types: CharacterType[] = ['Gojo', 'Sukuna', 'Yuji', 'Megumi', 'Hakari'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const colors = {
      'Gojo': '#8a2be2',
      'Sukuna': '#e74c3c',
      'Yuji': '#ff6b6b',
      'Megumi': '#00008b',
      'Hakari': '#ffd700'
    };
    super(id, x, y, randomType, colors[randomType]);
    this.input = input;
  }

  update(dt: number, groundY: number, player: Player, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isSukunaDomainActive: boolean = false, isYujiDomainActive: boolean = false, isMegumiDomainActive: boolean = false, isEnemyDomainActive: boolean = false) {
    const energyRegenMultiplier = (isYujiDomainActive && this.characterType === 'Yuji') ? 1.5 : 1.0;
    const statsResult = this.updateStats(dt, energyRegenMultiplier);
    this.target = player;
    
    if (this.input) {
      this.handleInput(dt);
    } else {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.think(projectiles, isSukunaDomainActive, isYujiDomainActive, isEnemyDomainActive);
        this.reactionTimer = 150 + Math.random() * 100; // 150-250ms reaction time
      }
    }

    this.executeState(dt, projectiles, particles, triggerShake, isSukunaDomainActive, isYujiDomainActive, isMegumiDomainActive, isEnemyDomainActive);
    if (this.sukunaQTimer > 0) {
      this.sukunaQTimer = 0;
    }

    this.updatePhysics(dt, groundY);
    return statsResult;
  }

  handleInput(dt: number) {
    if (!this.input) return;
    
    this.state = 'IDLE';
    
    if (this.input.isKeyDown('a')) {
      this.state = this.facingRight ? 'RETREAT' : 'APPROACH';
      this.facingRight = false;
    } else if (this.input.isKeyDown('d')) {
      this.state = this.facingRight ? 'APPROACH' : 'RETREAT';
      this.facingRight = true;
    }

    if (this.input.isKeyDown('w') || this.input.isKeyDown(' ')) {
      if (this.isGrounded) {
        this.vel.y = -15;
        this.isGrounded = false;
      }
    }

    if (this.input.isKeyDown('shift')) {
      // Dash handled in executeState or we can just set a flag
      this.isDashing = true;
    } else {
      this.isDashing = false;
    }

    if (this.input.isKeyDown('e')) {
      this.state = 'ATTACK_E';
    } else if (this.input.isKeyDown('q')) {
      this.state = 'ATTACK_Q';
    } else if (this.input.isKeyDown('c')) {
      this.state = 'DOMAIN';
    }
  }

  think(projectiles: Projectile[], isSukunaDomainActive: boolean = false, isYujiDomainActive: boolean = false, isEnemyDomainActive: boolean = false) {
    if (!this.target) return;
    const dist = this.target.pos.x - this.pos.x;
    const absDist = Math.abs(dist);

    this.facingRight = dist > 0;

    // Jump or dash over incoming projectiles
    for (const p of projectiles) {
      if (p.ownerId !== this.id && p.active) {
        const pDist = p.pos.x - this.pos.x;
        // If projectile is approaching and close
        if (Math.abs(pDist) < 200 && Math.sign(pDist) !== Math.sign(p.vel.x)) {
          if (this.isGrounded && Math.random() > 0.3) {
            this.vel.y = -12;
            this.isGrounded = false;
          } else if (this.energy >= Q_COST && this.cooldowns.q <= 0 && Math.random() > 0.5) {
            // Dodge by dashing through it
            this.state = 'ATTACK_Q';
            return;
          }
          break;
        }
      }
    }

    if (this.target.phaseTimer > 0) {
      this.state = 'RETREAT';
      return;
    }

    // Domain Usage: Be much more proactive if we have the energy
    const domainCost = this.characterType === 'Gojo' ? 75 : 70;
    if (this.energy >= domainCost && this.cooldowns.c <= 0 && !isSukunaDomainActive && !isYujiDomainActive) {
       if (Math.random() > 0.05) { // 95% chance to use domain when available
           this.state = 'DOMAIN';
           return;
       }
    }

    if (this.target.energy >= 50 && Math.random() > 0.7 && !isEnemyDomainActive) {
       this.state = 'DESPERATION';
       return;
    }



    // Movement and Attack Logic
    if (absDist > 500) {
      this.state = 'APPROACH';
    } else if (absDist > 250 && absDist <= 500) {
      // Mid-range
      if (this.characterType === 'Megumi' && (this.target as any).shadowAnchor && this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else if (this.characterType === 'Megumi' && !(this.target as any).shadowAnchor && this.energy >= E_COST && this.cooldowns.e <= 0) {
        this.state = 'ATTACK_E'; // Prioritize E to set up anchor
      } else if (this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.4) {
        this.state = 'ATTACK_E';
      } else if (Math.random() > 0.6) {
        this.state = 'BAIT';
      } else {
        this.state = 'APPROACH';
      }
    } else if (absDist > 100 && absDist <= 250) {
      // Close-mid range
      if (this.characterType === 'Megumi' && (this.target as any).shadowAnchor && this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else if (this.characterType === 'Megumi' && !(this.target as any).shadowAnchor && this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.3) {
        this.state = 'ATTACK_E'; // Try to set up anchor even in close-mid
      } else if (this.energy >= Q_COST && this.cooldowns.q <= 0 && Math.random() > 0.2) {
        this.state = 'ATTACK_Q';
      } else if (this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.5) {
        this.state = 'ATTACK_E';
      } else if (this.hp < 50 && Math.random() > 0.3) {
        this.state = 'RETREAT';
      } else {
        this.state = Math.random() > 0.5 ? 'BAIT' : 'APPROACH';
      }
    } else {
      // Melee range
      if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else {
        this.state = 'RETREAT';
      }
    }

    // Block abilities in enemy domain (but allow DOMAIN overriding if possible)
    if (isEnemyDomainActive && (this.state === 'ATTACK_E' || this.state === 'ATTACK_Q' || this.state === 'DESPERATION')) {
      this.state = 'APPROACH';
    }
  }

  executeState(dt: number, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isSukunaDomainActive: boolean = false, isYujiDomainActive: boolean = false, isMegumiDomainActive: boolean = false) {
    let speed = 4;
    if (this.characterType === 'Gojo') speed *= 1.1; // Gojo is 10% faster
    if (this.staminaPenaltyTimer > 0) speed *= 0.7;
    if (isSukunaDomainActive) speed *= 0.5; // 50% slow
    if (this.brainDamageTimer > 0) speed *= 0.7; // 30% slow
    if (this.slowTimer > 0) speed *= 0.7; // 30% slow

    if (isYujiDomainActive) {
      if (this.state === 'ATTACK_Q' || this.state === 'DOMAIN') {
        this.state = 'APPROACH'; // Restricted
      }
    }

    if (this.stunTimer > 0) {
      // Stunned, cannot move or attack
      this.state = 'IDLE';
    }

    // Input Latency (70ms delay)
    // We can simulate this by randomly dropping state execution or delaying it.
    // For simplicity, if latencyTimer > 0, we have a chance to just IDLE.
    if (this.latencyTimer > 0 && Math.random() < 0.3) {
      this.state = 'IDLE';
    }

    switch (this.state) {
      case 'APPROACH':
        this.vel.x = this.facingRight ? speed : -speed;
        break;
      case 'RETREAT':
        this.vel.x = this.facingRight ? -speed : speed;
        break;
      case 'BAIT':
        // Move erratically just outside range
        this.vel.x = (Math.random() > 0.5 ? speed * 1.2 : -speed * 1.2);
        if (Math.random() > 0.95 && this.isGrounded) {
           this.vel.y = -10; // Occasional short hop
        }
        break;
      case 'DESPERATION':
        // Maximize damage, spam Q and E
        this.vel.x = this.facingRight ? speed * 1.5 : -speed * 1.5;
        if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
           this.state = 'ATTACK_Q';
        } else if (this.energy >= E_COST && this.cooldowns.e <= 0) {
           this.state = 'ATTACK_E';
        }
        break;
      case 'ATTACK_E':
        const activeCharacterTypeE = this.mimicryTarget || this.characterType;
        if (activeCharacterTypeE === 'Sukuna') {
          if (!isSukunaDomainActive) {
            if (this.eChargeTimer === 0 && this.energy >= E_COST && this.cooldowns.e <= 0) {
              this.aiChargeTarget = Math.random() * 1500; // Charge up to 1.5s
              this.eChargeTimer += dt;
            } else if (this.eChargeTimer > 0) {
              this.eChargeTimer += dt;
              if (this.eChargeTimer >= this.aiChargeTarget) {
                this.energy -= E_COST;
                this.cooldowns.e = 800 * 0.75;
                const isFuga = this.eChargeTimer >= 1000;
                const bonusDamage = Math.floor(this.eChargeTimer / 500) * 7;
                const bonusSize = Math.floor(this.eChargeTimer / 500) * 20;
                const vx = (this.facingRight ? 15 : -15) * 1.5;
                const projColor = isFuga ? '#ff4500' : '#ff0000';
                projectiles.push(new Projectile(
                  this.pos.x + (this.facingRight ? this.width : -20), this.pos.y + 20, 
                  vx, 0, this.id, projColor, 'E', activeCharacterTypeE,
                  bonusDamage, bonusSize, isFuga ? 'fuga' : 'normal'
                ));
                this.eChargeTimer = 0;
                this.state = 'IDLE';
              }
            } else {
              this.state = 'IDLE';
            }
          } else {
            this.eChargeTimer = 0;
            this.state = 'IDLE';
          }
        } else {
          if (this.energy >= E_COST && this.cooldowns.e <= 0) {
            this.energy -= E_COST;
            let baseECooldown = 800;
            this.cooldowns.e = baseECooldown;
            
            let vx = (this.facingRight ? 15 : -15);
            let vy = 0;
            
            let projColor = '#00ffff';
            let variant = 'normal';
            if (activeCharacterTypeE === 'Gojo') projColor = '#8a2be2';
            if (activeCharacterTypeE === 'Megumi') projColor = '#00008b';
            if (activeCharacterTypeE === 'Hakari') {
              const isPull = Math.random() > 0.5;
              projColor = isPull ? '#00ffff' : '#ffff00';
              variant = isPull ? 'pull' : 'knockback';
            }
            
            projectiles.push(new Projectile(this.pos.x + (this.facingRight ? this.width : -20), this.pos.y + 20, vx, vy, this.id, projColor, 'E', activeCharacterTypeE, 0, 0, variant));
            
            for(let i=0; i<15; i++) {
              particles.push(new Particle(
                this.pos.x + this.width/2, this.pos.y + this.height/2,
                (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15 + vy,
                400, projColor, 6
              ));
            }
          }
          this.state = 'IDLE';
        }
        break;
      case 'ATTACK_Q':
        const activeCharacterTypeQ = this.mimicryTarget || this.characterType;
        if (this.energy >= Q_COST && this.cooldowns.q <= 0 && !this.qDisabled) {
          if (activeCharacterTypeQ === 'Sukuna' && isSukunaDomainActive) {
            this.energy -= Q_COST;
            this.cooldowns.q = 1000; // 1 second cooldown (reduced by 50%)
            
            // Sure-hit effect: Massive slash from random angle
            let targetX = this.pos.x + this.width / 2;
            let targetY = this.pos.y + this.height / 2;
            if (this.target) {
              targetX = this.target.pos.x + this.target.width / 2;
              targetY = this.target.pos.y + this.target.height / 2;
            }
            
            const projWidth = 20 + 150;
            const theta = Math.random() * Math.PI * 2;
            const R = 1500;
            
            const startX = targetX - Math.cos(theta) * R - projWidth / 2;
            const startY = targetY - Math.sin(theta) * R - projWidth / 2;
            
            const speed = 160;
            const vx = Math.cos(theta) * speed;
            const vy = Math.sin(theta) * speed;
            
            projectiles.push(new Projectile(
              startX, startY, vx, vy, this.id, '#ff0000', 'Q', 'Sukuna',
              35, 150, 'world_slash' // 35 damage, massive size (150 bonus)
            ));
            soundManager.playSlash();
            triggerShake();

            // Pre-fire impact/blood particles
            for (let i = 0; i < 20; i++) {
              particles.push(new Particle(
                targetX + (Math.random() - 0.5) * 80, targetY + (Math.random() - 0.5) * 80,
                0, Math.random() * 20,
                300, '#ff0000', 8 + Math.random() * 10
              ));
            }
            
            this.vel.x = 0;
            this.state = 'IDLE';
          } else {
            this.energy -= Q_COST;
            this.cooldowns.q = 1500;
            this.phaseTimer = 15 * 16.66;
            let dashSpeed = 20;
            if (activeCharacterTypeQ === 'Gojo' || activeCharacterTypeQ === 'Megumi' || activeCharacterTypeQ === 'Hakari' || activeCharacterTypeQ === 'Sukuna') {
              dashSpeed *= 1.25;
            }
            
            if (activeCharacterTypeQ === 'Megumi') {
              this.qDashTimer = 15 * 16.66;
              this.qDashHit = false;
              this.qDashStartX = this.pos.x;
              this.qDashStartY = this.pos.y;
            }
            
            this.vel.x = this.facingRight ? dashSpeed : -dashSpeed;
            this.vel.y = 0;
            
            this.hasHitDash = false;
            triggerShake();
            for(let i=0; i<20; i++) {
              particles.push(new Particle(
                this.pos.x + this.width/2, this.pos.y + this.height/2,
                (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
                300, this.color, 8
              ));
            }
          }
        }
        this.state = 'IDLE';
        break;
      case 'IDLE':
      default:
        // Friction stops
        break;
    }
  }
}
