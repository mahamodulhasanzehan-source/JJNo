import { Entity } from './Entity';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { Particle } from './Particle';
import { E_COST, Q_COST } from './Constants';
import { CharacterType } from './Types';

type AIState = 'IDLE' | 'APPROACH' | 'RETREAT' | 'ATTACK_E' | 'ATTACK_Q' | 'BAIT' | 'DESPERATION' | 'DOMAIN';

export class Abonant extends Entity {
  state: AIState = 'IDLE';
  stateTimer: number = 0;
  target: Player | null = null;
  reactionTimer: number = 0;

  constructor(id: string, x: number, y: number) {
    const types: CharacterType[] = ['Gojo', 'Sukuna', 'Yuji'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const colors = {
      'Gojo': '#8a2be2',
      'Sukuna': '#e74c3c',
      'Yuji': '#ff6b6b'
    };
    super(id, x, y, randomType, colors[randomType]);
  }

  update(dt: number, groundY: number, player: Player, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isSukunaDomainActive: boolean = false, isYujiDomainActive: boolean = false) {
    const statsResult = this.updateStats(dt);
    this.target = player;
    
    this.reactionTimer -= dt;
    if (this.reactionTimer <= 0) {
      this.think(projectiles);
      this.reactionTimer = 150 + Math.random() * 100; // 150-250ms reaction time
    }

    this.executeState(dt, projectiles, particles, triggerShake, isSukunaDomainActive, isYujiDomainActive);
    this.updatePhysics(dt, groundY);
    return statsResult;
  }

  think(projectiles: Projectile[]) {
    if (!this.target) return;
    const dist = this.target.pos.x - this.pos.x;
    const absDist = Math.abs(dist);

    this.facingRight = dist > 0;

    // Jump over incoming projectiles
    for (const p of projectiles) {
      if (p.ownerId !== this.id && p.active) {
        const pDist = p.pos.x - this.pos.x;
        // If projectile is approaching and close
        if (Math.abs(pDist) < 150 && Math.sign(pDist) !== Math.sign(p.vel.x) && this.isGrounded) {
          this.vel.y = -12;
          this.isGrounded = false;
          break;
        }
      }
    }

    if (this.target.phaseTimer > 0) {
      this.state = 'RETREAT';
      return;
    }

    // Domain Counter / Attempt Domain if player is low on health
    const domainCost = this.characterType === 'Gojo' ? 75 : 70;
    if (this.energy >= domainCost && this.target.hp < 50) {
       this.state = 'DOMAIN';
       return;
    }

    if (this.target.energy >= 50 && Math.random() > 0.8) {
       this.state = 'DESPERATION';
       return;
    }

    if (absDist > 400) {
      this.state = 'APPROACH';
    } else if (absDist > 200 && absDist <= 400) {
      // Baiting: stay just outside E range
      if (Math.random() > 0.5) {
        this.state = 'BAIT';
      } else if (this.energy >= E_COST && this.cooldowns.e <= 0) {
        this.state = 'ATTACK_E';
      } else {
        this.state = 'APPROACH';
      }
    } else {
      if (this.energy >= Q_COST && this.cooldowns.q <= 0 && Math.random() > 0.3) {
        this.state = 'ATTACK_Q';
      } else {
        this.state = 'RETREAT';
      }
    }
  }

  executeState(dt: number, projectiles: Projectile[], particles: Particle[], triggerShake: () => void, isSukunaDomainActive: boolean = false, isYujiDomainActive: boolean = false) {
    let speed = 4;
    if (this.staminaPenaltyTimer > 0) speed *= 0.7;
    if (isSukunaDomainActive) speed *= 0.5; // 50% slow
    if (this.brainDamageTimer > 0) speed *= 0.7; // 30% slow
    if (this.slowTimer > 0) speed *= 0.85; // 15% slow

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
        this.vel.x = (Math.random() > 0.5 ? speed : -speed) * 0.5;
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
        if (this.energy >= E_COST && this.cooldowns.e <= 0) {
          this.energy -= E_COST;
          this.cooldowns.e = 800;
          const vx = this.facingRight ? 15 : -15;
          projectiles.push(new Projectile(this.pos.x + (this.facingRight ? this.width : -20), this.pos.y + 20, vx, 0, this.id, '#ff0000', 'E', this.characterType));
          
          for(let i=0; i<15; i++) {
            particles.push(new Particle(
              this.pos.x + this.width/2, this.pos.y + this.height/2,
              (Math.random() - 0.5) * 15 + vx, (Math.random() - 0.5) * 15,
              400, '#ff0000', 6
            ));
          }
        }
        this.state = 'IDLE';
        break;
      case 'ATTACK_Q':
        if (this.energy >= Q_COST && this.cooldowns.q <= 0) {
          this.energy -= Q_COST;
          this.cooldowns.q = 1500;
          this.phaseTimer = 15 * 16.66;
          let dashSpeed = 20;
          if (this.characterType === 'Gojo') {
            dashSpeed *= 1.25;
          }
          this.vel.x = this.facingRight ? dashSpeed : -dashSpeed;
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
        this.state = 'IDLE';
        break;
      case 'IDLE':
      default:
        // Friction stops
        break;
    }
  }
}
