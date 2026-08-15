import { Entity } from './Entity';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { E_COST, Q_COST, C_COST } from './Constants';
import { CharacterType } from './Types';
import { InputManager } from './InputManager';
import { soundManager } from './SoundManager';
import { fireSukunaE } from '../entities/sukuna/sukuna_E';
import { fireSukunaQDomain } from '../entities/sukuna/sukuna_Q';
import { fireYujiDomainE } from '../entities/yuji/yuji_E';

export type AIState = 
  | 'IDLE' 
  | 'APPROACH' 
  | 'SPACING' 
  | 'CROSS_UP' 
  | 'PUNISH' 
  | 'ATTACK_E' 
  | 'ATTACK_Q' 
  | 'DOMAIN' 
  | 'COMBO_RUSH' 
  | 'TACTICAL_BACKSTEP';

export class Abonant extends Entity {
  state: AIState = 'IDLE';
  stateTimer: number = 0;
  target: Player | null = null;
  reactionTimer: number = 0;
  input?: InputManager;

  // Tactical AI Attributes
  spacingTargetDist: number = 220;
  isConservingEnergy: boolean = true;
  lastPlayerPos: { x: number; y: number } = { x: 0, y: 0 };
  punishTimer: number = 0;
  crossUpDirection: number = 1;

  constructor(id: string, x: number, y: number, input?: InputManager, initialType?: CharacterType) {
    const types: CharacterType[] = ['Gojo', 'Sukuna', 'Yuji', 'Megumi', 'Hakari'];
    const chosenType = initialType || types[Math.floor(Math.random() * types.length)];
    const colors: Record<CharacterType, string> = {
      'Gojo': '#8a2be2',
      'Sukuna': '#e74c3c',
      'Yuji': '#ff6b6b',
      'Megumi': '#00008b',
      'Hakari': '#ffd700'
    };
    super(id, x, y, chosenType, colors[chosenType]);
    this.input = input;

    this.setCharacterType(chosenType);
  }

  setCharacterType(type: CharacterType) {
    this.characterType = type;
    const colors: Record<CharacterType, string> = {
      'Gojo': '#8a2be2',
      'Sukuna': '#e74c3c',
      'Yuji': '#ff6b6b',
      'Megumi': '#00008b',
      'Hakari': '#ffd700'
    };
    this.color = colors[type] || '#ffffff';

    // Archetype-specific preferred spacing
    if (type === 'Yuji') this.spacingTargetDist = 140;
    else if (type === 'Sukuna') this.spacingTargetDist = 240;
    else if (type === 'Gojo') this.spacingTargetDist = 220;
    else if (type === 'Megumi') this.spacingTargetDist = 260;
    else if (type === 'Hakari') this.spacingTargetDist = 160;
  }

  getDomainCost(): number {
    const activeType = this.mimicryTarget || this.characterType;
    if (activeType === 'Gojo') return 75;
    if (activeType === 'Megumi') return 90;
    if (activeType === 'Yuji') return 80;
    return C_COST; // 70
  }

  canCastDomain(isSukunaDomainActive: boolean, isYujiDomainActive: boolean): boolean {
    const activeType = this.mimicryTarget || this.characterType;
    if (activeType === 'Hakari' && this.infiniteCeTimer > 0) return false;
    if (activeType === 'Megumi' && this.hasSpawnedMahoraga) return false;
    if (isSukunaDomainActive || isYujiDomainActive) return false;
    if (this.cooldowns.c > 0) return false;
    return true;
  }

  update(
    dt: number, 
    groundY: number, 
    player: Player, 
    projectiles: Projectile[], 
    particles: Particle[], 
    triggerShake: (amt?: number) => void, 
    isSukunaDomainActive: boolean = false, 
    isYujiDomainActive: boolean = false, 
    isMegumiDomainActive: boolean = false, 
    isEnemyDomainActive: boolean = false,
    activeBeams?: any[],
    visualSlashes?: any[]
  ) {
    const energyRegenMultiplier = (isYujiDomainActive && this.characterType === 'Yuji') ? 1.5 : 1.0;
    const statsResult = this.updateStats(dt, energyRegenMultiplier);
    this.target = player;

    if (isYujiDomainActive || (isEnemyDomainActive && player.characterType === 'Yuji')) {
      this.stunTimer = 0;
    }
    
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
    }

    if (this.input) {
      this.handleInput(dt);
    } else {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.think(projectiles, isSukunaDomainActive, isYujiDomainActive, isEnemyDomainActive, isMegumiDomainActive);
        // Responsive 100-160ms reaction time for sharp decision making
        this.reactionTimer = 100 + Math.random() * 60;
      }
    }

    this.executeState(dt, projectiles, particles, triggerShake, isSukunaDomainActive, isYujiDomainActive, isMegumiDomainActive, activeBeams, visualSlashes);
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
      this.state = this.facingRight ? 'TACTICAL_BACKSTEP' : 'APPROACH';
      this.facingRight = false;
    } else if (this.input.isKeyDown('d')) {
      this.state = this.facingRight ? 'APPROACH' : 'TACTICAL_BACKSTEP';
      this.facingRight = true;
    }

    if (this.input.isKeyDown('w') || this.input.isKeyDown(' ')) {
      if (this.isGrounded) {
        this.vel.y = -15;
        this.isGrounded = false;
      }
    }

    if (this.input.isKeyDown('shift')) {
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

  think(
    projectiles: Projectile[], 
    isSukunaDomainActive: boolean = false, 
    isYujiDomainActive: boolean = false, 
    isEnemyDomainActive: boolean = false,
    isMegumiDomainActive: boolean = false
  ) {
    if (!this.target || this.stunTimer > 0) return;
    
    const dist = this.target.pos.x - this.pos.x;
    const absDist = Math.abs(dist);
    const targetYDiff = this.target.pos.y - this.pos.y;
    this.facingRight = dist > 0;

    const domainCost = this.getDomainCost();
    const canDomain = this.canCastDomain(isSukunaDomainActive, isYujiDomainActive);
    const activeType = this.mimicryTarget || this.characterType;
    const isJackpotFrenzy = activeType === 'Hakari' && this.infiniteCeTimer > 0;
    const isOwnDomainActive = isSukunaDomainActive || isYujiDomainActive || (isMegumiDomainActive && this.hasSpawnedMahoraga);

    // -------------------------------------------------------------
    // 1. ULTIMATE / DOMAIN EXPANSION PRIORITY
    // -------------------------------------------------------------
    if (canDomain && this.energy >= domainCost) {
      // Energy is fully stored! Cast Domain immediately
      this.state = 'DOMAIN';
      if (this.isGrounded && Math.random() > 0.6) {
        // Quick leap or stand ground for dramatic domain expansion
        this.vel.x = 0;
      }
      return;
    }

    // Determine if we should be conserving Cursed Energy for our Domain
    // If domain is available and we haven't cast it yet, actively save energy!
    this.isConservingEnergy = canDomain && this.energy < domainCost;

    // -------------------------------------------------------------
    // 2. DEFENSIVE EVASION & PROJECTILE INTERCEPTION
    // -------------------------------------------------------------
    for (const p of projectiles) {
      if (p.ownerId !== this.id && p.active) {
        const pDist = p.pos.x - this.pos.x;
        const isApproaching = (pDist > 0 && p.vel.x < 0) || (pDist < 0 && p.vel.x > 0);
        
        if (Math.abs(pDist) < 220 && isApproaching) {
          // If grounded, jump over incoming projectile
          if (this.isGrounded && Math.random() > 0.25) {
            this.vel.y = -14;
            this.vel.x = (this.facingRight ? 1 : -1) * 6;
            this.isGrounded = false;
            return;
          } 
          // If projectile is large/dangerous and we have spare energy or are in danger, dash through with invincibility
          else if (this.energy >= Q_COST && this.cooldowns.q <= 0 && (!this.isConservingEnergy || this.energy >= Q_COST + 15 || this.hp < 60)) {
            this.state = 'ATTACK_Q';
            return;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 3. STAGE POSITIONING & ANTI-CORNER (NO TRAPPING OURSELVES)
    // -------------------------------------------------------------
    // If near the left or right wall, cross up towards center stage
    if (this.pos.x < 120 && !this.facingRight) {
      this.crossUpOverTarget();
      return;
    } else if (this.pos.x > 1800 && this.facingRight) {
      this.crossUpOverTarget();
      return;
    }

    // -------------------------------------------------------------
    // 4. PLAYER INVULNERABILITY / PHASE TIMING (SMART PUNISH SETUP)
    // -------------------------------------------------------------
    if (this.target.phaseTimer > 0) {
      // Don't run across the map; space right at strike boundary (~180px) and prepare punish
      if (absDist < 120) {
        this.state = 'SPACING';
      } else {
        this.state = 'IDLE';
      }
      return;
    }

    // -------------------------------------------------------------
    // 5. HAKARI JACKPOT BERSERKER (UNSTOPPABLE FRENZY)
    // -------------------------------------------------------------
    if (isJackpotFrenzy) {
      // Infinite CE & reduced cooldowns -> Continuous relentless assault
      if (absDist < 180 && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else if (this.cooldowns.e <= 0 && Math.random() > 0.3) {
        this.state = 'ATTACK_E';
      } else {
        this.state = 'COMBO_RUSH';
      }
      return;
    }

    // -------------------------------------------------------------
    // 6. ACTIVE DOMAIN TACTICS
    // -------------------------------------------------------------
    if (isSukunaDomainActive) {
      // In Malevolent Shrine: spam slashes and rush down
      if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else {
        this.state = 'APPROACH';
      }
      return;
    }

    if (isYujiDomainActive && activeType === 'Yuji') {
      // In Yuji's Domain: Rapid soul beam E and super dashes
      if (this.energy >= E_COST && this.cooldowns.e <= 0) {
        this.state = 'ATTACK_E';
      } else if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else {
        this.state = 'APPROACH';
      }
      return;
    }

    // -------------------------------------------------------------
    // 7. MEGUMI TACTICAL SHADOW ANCHOR + MAHORAGA SYNERGY
    // -------------------------------------------------------------
    if (activeType === 'Megumi') {
      const targetAnchor = (this.target as any).shadowAnchor;
      
      // If we are conserving for Mahoraga (need 90 CE), focus on building CE safely
      if (this.isConservingEnergy) {
        if (this.energy >= 82) {
          // Almost at 90! Keep patient spacing, don't waste any CE
          this.state = absDist < 200 ? 'SPACING' : 'APPROACH';
          return;
        }
        
        // If anchor is active on player and we have plenty of CE, dash in for guaranteed strike
        if (targetAnchor && this.energy >= Q_COST + 35 && this.cooldowns.q <= 0) {
          this.state = 'ATTACK_Q';
          return;
        }
        
        // Use E to anchor player only if energy won't drop too low
        if (!targetAnchor && this.energy >= E_COST + 25 && this.cooldowns.e <= 0 && absDist < 350 && Math.random() > 0.4) {
          this.state = 'ATTACK_E';
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // 8. SUKUNA CHARGE & DISMANTLE TACTICS
    // -------------------------------------------------------------
    if (activeType === 'Sukuna' && !isSukunaDomainActive) {
      if (!this.isConservingEnergy || this.energy >= domainCost - 10) {
        if (absDist > 200 && absDist < 450 && this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.35) {
          this.state = 'ATTACK_E';
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // 9. GENERAL CE CONSERVATION & TACTICAL ENGAGEMENT
    // -------------------------------------------------------------
    if (this.isConservingEnergy) {
      // CE Storing Mode: We want to build up to 70/75/90 CE without burning it on random neutral shots
      const ceDeficit = domainCost - this.energy;

      // Close distance (< 130px): Punish or cross up, do NOT just spam retreat
      if (absDist < 130) {
        if (ceDeficit <= 12) {
          // Very close to Domain! Cross up or space out to secure the final CE ticks
          if (Math.random() > 0.4) {
            this.crossUpOverTarget();
          } else {
            this.state = 'SPACING';
          }
          return;
        }

        // We have plenty of leeway or player is open
        if (this.energy >= Q_COST + 20 && this.cooldowns.q <= 0 && Math.random() > 0.3) {
          this.state = 'ATTACK_Q';
        } else if (Math.random() > 0.5) {
          this.crossUpOverTarget();
        } else {
          this.state = 'SPACING';
        }
        return;
      }

      // Mid distance (130px - 320px): Optimal spacing zone for CE accumulation
      if (absDist <= 320) {
        // Punish player whiff or stationary target with E only if we have high CE buffer
        if (this.energy >= E_COST + 25 && this.cooldowns.e <= 0 && Math.random() > 0.6) {
          this.state = 'ATTACK_E';
        } else if (Math.random() > 0.75 && this.isGrounded) {
          // Dynamic jump-in mixup to keep pressure without spending CE
          this.vel.y = -13;
          this.vel.x = (this.facingRight ? 1 : -1) * 7;
          this.state = 'APPROACH';
        } else {
          this.state = 'SPACING';
        }
        return;
      }

      // Far distance (> 320px): Close in to maintain combat engagement
      this.state = 'APPROACH';
      return;
    }

    // -------------------------------------------------------------
    // 10. POST-DOMAIN / FULL OFFENSE (WHEN DOMAIN IS SPENT / ON CD)
    // -------------------------------------------------------------
    if (absDist > 450) {
      this.state = 'APPROACH';
    } else if (absDist > 200) {
      if (this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.3) {
        this.state = 'ATTACK_E';
      } else if (this.energy >= Q_COST && this.cooldowns.q <= 0 && Math.random() > 0.4) {
        this.state = 'ATTACK_Q';
      } else {
        this.state = 'APPROACH';
      }
    } else {
      // Close quarters infighting
      if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
        this.state = 'ATTACK_Q';
      } else if (this.energy >= E_COST && this.cooldowns.e <= 0 && Math.random() > 0.4) {
        this.state = 'ATTACK_E';
      } else if (Math.random() > 0.45) {
        this.crossUpOverTarget();
      } else {
        this.state = 'COMBO_RUSH';
      }
    }
  }

  private crossUpOverTarget() {
    if (!this.target) return;
    this.state = 'CROSS_UP';
    this.stateTimer = 400;
    const dir = this.target.pos.x > this.pos.x ? 1 : -1;
    this.crossUpDirection = dir;
    if (this.isGrounded) {
      this.vel.y = -15; // High athletic leap over opponent
      this.vel.x = dir * 11;
      this.isGrounded = false;
    }
  }

  executeState(
    dt: number, 
    projectiles: Projectile[], 
    particles: Particle[], 
    triggerShake: (amt?: number) => void, 
    isSukunaDomainActive: boolean = false, 
    isYujiDomainActive: boolean = false, 
    isMegumiDomainActive: boolean = false,
    activeBeams?: any[],
    visualSlashes?: any[]
  ) {
    let speed = 4.6;
    if (this.characterType === 'Gojo') speed *= 1.12;
    if (this.staminaPenaltyTimer > 0) speed *= 0.7;
    if (isSukunaDomainActive) speed *= 0.5;
    if (this.brainDamageTimer > 0) speed *= 0.7;
    if (this.slowTimer > 0) speed *= 0.7;

    if (this.stunTimer > 0) {
      this.state = 'IDLE';
      return;
    }

    if (this.latencyTimer > 0 && Math.random() < 0.2) {
      this.state = 'IDLE';
      return;
    }

    switch (this.state) {
      case 'APPROACH':
        this.vel.x = this.facingRight ? speed : -speed;
        break;

      case 'SPACING':
        if (this.target) {
          const currentDist = Math.abs(this.target.pos.x - this.pos.x);
          const targetDist = this.spacingTargetDist;
          
          if (currentDist < targetDist - 30) {
            // Soft spacing back-step (never endless retreat)
            this.vel.x = this.facingRight ? -speed * 0.75 : speed * 0.75;
          } else if (currentDist > targetDist + 30) {
            // Advance smoothly
            this.vel.x = this.facingRight ? speed * 0.85 : -speed * 0.85;
          } else {
            // Neutral weave footsies
            this.vel.x = (Math.sin(Date.now() * 0.008)) * (speed * 0.5);
          }
        }
        break;

      case 'CROSS_UP':
        this.vel.x = this.crossUpDirection * (speed * 1.6);
        if (this.stateTimer <= 0) {
          this.state = 'SPACING';
        }
        break;

      case 'COMBO_RUSH':
        this.vel.x = this.facingRight ? speed * 1.35 : -speed * 1.35;
        if (this.isGrounded && Math.random() > 0.85) {
          this.vel.y = -11;
        }
        break;

      case 'TACTICAL_BACKSTEP':
        this.vel.x = this.facingRight ? -speed * 0.9 : speed * 0.9;
        if (this.isGrounded && Math.random() > 0.8) {
          this.vel.y = -10;
        }
        break;

      case 'DOMAIN':
        // Ready to cast Domain Expansion in GameEngine
        this.vel.x *= 0.8;
        break;

      case 'ATTACK_E':
        if (this.target) {
          this.facingRight = this.target.pos.x + this.target.width / 2 > this.pos.x + this.width / 2;
        }
        const activeCharacterTypeE = this.mimicryTarget || this.characterType;
        
        if (activeCharacterTypeE === 'Sukuna') {
          if (!isSukunaDomainActive) {
            if (this.eChargeTimer === 0 && this.energy >= E_COST && this.cooldowns.e <= 0) {
              // Smart charge calculation based on distance (0.4s to 1.1s)
              const dist = this.target ? Math.abs(this.target.pos.x - this.pos.x) : 250;
              this.aiChargeTarget = Math.min(1200, 350 + dist * 1.5);
              this.eChargeTimer += dt;
            } else if (this.eChargeTimer > 0) {
              this.eChargeTimer += dt;
              if (this.eChargeTimer >= this.aiChargeTarget) {
                this.energy -= E_COST;
                this.cooldowns.e = 800 * 0.75;
                const chargeTime = this.eChargeTimer;
                this.eChargeTimer = 0;
                
                fireSukunaE(this, chargeTime, projectiles, particles, () => soundManager.playBlast());
                this.state = 'SPACING';
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
            if (isYujiDomainActive && activeCharacterTypeE === 'Yuji') {
              if (this.yujiDomainEWindowTimer > 0 && this.yujiDomainECastCount >= 5) {
                // Blocked
              } else {
                this.energy -= E_COST;
                this.cooldowns.e = 800;
                
                if (this.yujiDomainEWindowTimer <= 0) {
                  this.yujiDomainEWindowTimer = 5000;
                  this.yujiDomainECastCount = 1;
                } else {
                  this.yujiDomainECastCount++;
                }
                
                fireYujiDomainE(this, this.target, particles, activeBeams || [], visualSlashes || [], triggerShake, () => soundManager.playBeam());
              }
            } else {
              this.energy -= E_COST;
              this.cooldowns.e = 800;
              
              const vx = (this.facingRight ? 16 : -16);
              const vy = 0;
              
              let projColor = '#00ffff';
              let variant = 'normal';
              if (activeCharacterTypeE === 'Gojo') projColor = '#8a2be2';
              if (activeCharacterTypeE === 'Megumi') projColor = '#00008b';
              if (activeCharacterTypeE === 'Hakari') {
                const isPull = Math.random() > 0.5;
                projColor = isPull ? '#00ffff' : '#ffff00';
                variant = isPull ? 'pull' : 'knockback';
              }
              
              projectiles.push(new Projectile(
                this.pos.x + (this.facingRight ? this.width : -20), 
                this.pos.y + 20, 
                vx, vy, this.id, projColor, 'E', activeCharacterTypeE, 0, 0, variant
              ));
              
              for(let i=0; i<15; i++) {
                particles.push(new Particle(
                  this.pos.x + this.width/2, this.pos.y + this.height/2,
                  (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15 + vy,
                  400, projColor, 6
                ));
              }
            }
          }
          this.state = 'SPACING';
        }
        break;

      case 'ATTACK_Q':
        const activeCharacterTypeQ = this.mimicryTarget || this.characterType;
        if (this.energy >= Q_COST && this.cooldowns.q <= 0 && !this.qDisabled) {
          if (activeCharacterTypeQ === 'Sukuna' && isSukunaDomainActive) {
            this.energy -= Q_COST;
            this.cooldowns.q = 1000;
            fireSukunaQDomain(this, this.target, projectiles, particles, () => soundManager.playSlash(), triggerShake);
            this.vel.x = 0;
            this.state = 'IDLE';
          } else {
            this.energy -= Q_COST;
            this.cooldowns.q = 1500;
            this.phaseTimer = 15 * 16.66;
            let dashSpeed = 22;
            if (activeCharacterTypeQ === 'Gojo' || activeCharacterTypeQ === 'Megumi' || activeCharacterTypeQ === 'Hakari' || activeCharacterTypeQ === 'Sukuna') {
              dashSpeed *= 1.25;
            }
            if (isYujiDomainActive && activeCharacterTypeQ === 'Yuji') {
              dashSpeed *= 2.0;
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
            for(let i=0; i<30; i++) {
              particles.push(new Particle(
                this.pos.x + this.width/2, this.pos.y + this.height/2,
                (Math.random() - 0.5) * 40 - this.vel.x * 0.8, (Math.random() - 0.5) * 40,
                400 + Math.random() * 200, this.color, 15 + Math.random() * 15, 'line', { friction: 0.85 }
              ));
              particles.push(new Particle(
                this.pos.x + this.width/2, this.pos.y + this.height/2,
                (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60,
                600, '#ffffff', 4 + Math.random() * 6, 'star', { friction: 0.9, scaleInOut: true, angularVel: (Math.random()-0.5)*1.5 }
              ));
            }
          }
        }
        this.state = 'SPACING';
        break;

      case 'IDLE':
      default:
        break;
    }
  }
}
