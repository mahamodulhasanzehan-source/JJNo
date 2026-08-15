import { Vector2, Rect } from '../../game/Types';
import { Entity } from '../../game/Entity';
import { Particle } from '../../game/Particle';
import { Projectile } from '../../game/Projectile';
import { soundManager } from '../../game/SoundManager';
import { GRAVITY } from '../../game/Constants';

export type MahoragaState = 'spawning' | 'idle' | 'chase' | 'slash' | 'slam' | 'wheel_spin' | 'charge' | 'leap' | 'reposition' | 'dead';

interface JointPose {
  // Spine & Head
  torsoAngle: number;
  spineFlex: number;
  headAngle: number;
  
  // Right Arm (Weapon Arm)
  rShoulderAngle: number;
  rElbowAngle: number;
  rWristAngle: number;
  
  // Left Arm (Claw Arm)
  lShoulderAngle: number;
  lElbowAngle: number;
  lWristAngle: number;
  
  // Right Leg
  rHipAngle: number;
  rKneeAngle: number;
  rAnkleAngle: number;
  
  // Left Leg
  lHipAngle: number;
  lKneeAngle: number;
  lAnkleAngle: number;
}

export class Mahoraga {
  id: string = 'mahoraga_' + Math.random().toString(36).substr(2, 9);
  ownerId: string;
  target: Entity | null = null;
  pos: Vector2;
  vel: Vector2 = { x: 0, y: 0 };
  
  // 4x Scale (characters are 40x80 -> Mahoraga is 140x320)
  width: number = 140;
  height: number = 320;

  // 0.5x Health: 375 HP
  hp: number = 375;
  maxHp: number = 375;
  facingRight: boolean = true;
  isGrounded: boolean = false;
  
  state: MahoragaState = 'spawning';
  spawnTimer: number = 1800; // 1.8s smooth cinematic emergence
  totalSpawnTime: number = 1800;
  actionTimer: number = 0;
  
  // Wheel mechanics
  wheelAngle: number = 0;
  wheelSpinSpeed: number = 0.045;
  wheelBurstTimer: number = 0;
  isAdapted: boolean = false;
  adaptationTimer: number = 0;
  damageTakenRecently: number = 0;
  
  // Multi-joint IK/FK current and target poses for ultra-smooth interpolation
  currentPose: JointPose;
  targetPose: JointPose;
  
  // Sword Slash Trail buffer
  swordTrail: { tip: Vector2; base: Vector2; alpha: number }[] = [];
  
  // Physics & Animation
  wingFlapAngle: number = 0;
  walkCycle: number = 0;
  sashWave: number = 0;
  hitFlashTimer: number = 0;
  deathTimer: number = 0;
  active: boolean = true;

  // Slash hit tracking
  hasDealtSlashHit: boolean = false;

  // Ability Cooldowns (ms) - 1.25x Faster & Snappy
  cooldowns = {
    slash: 700,
    slam: 2500,
    wheel: 5000,
    charge: 2800,
    leap: 1600,
  };

  constructor(x: number, y: number, ownerId: string, facingRight: boolean = true) {
    this.ownerId = ownerId;
    this.pos = { x: x - 70, y: y - 240 };
    this.facingRight = facingRight;
    
    const basePose: JointPose = {
      torsoAngle: 0, spineFlex: 0, headAngle: 0,
      rShoulderAngle: 0.1, rElbowAngle: 0.3, rWristAngle: 0.1,
      lShoulderAngle: -0.1, lElbowAngle: 0.3, lWristAngle: 0,
      rHipAngle: 0.1, rKneeAngle: 0.2, rAnkleAngle: -0.1,
      lHipAngle: -0.1, lKneeAngle: 0.2, lAnkleAngle: -0.1,
    };
    this.currentPose = { ...basePose };
    this.targetPose = { ...basePose };
    
    soundManager.playMahoragaSummon();
  }

  takeDamage(amount: number, particles?: Particle[]): boolean {
    if (this.state === 'spawning' || this.state === 'dead') return false;

    let finalDamage = amount;
    // Adaptation resistance
    if (this.adaptationTimer > 0) {
      finalDamage *= 0.45; // 55% damage reduction
    }

    this.hp = Math.max(0, this.hp - finalDamage);
    this.hitFlashTimer = 120;
    this.damageTakenRecently += amount;

    // Reactively trigger wheel adaptation if took heavy damage
    if (this.damageTakenRecently >= 40 && this.cooldowns.wheel <= 0 && this.state !== 'slash' && this.state !== 'slam') {
      this.triggerWheelAdaptation(particles);
      this.damageTakenRecently = 0;
    }

    if (particles) {
      for (let i = 0; i < 12; i++) {
        particles.push(new Particle(
          this.pos.x + Math.random() * this.width,
          this.pos.y + Math.random() * this.height,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          300,
          '#ffffff',
          5 + Math.random() * 6
        ));
      }
    }

    if (this.hp <= 0) {
      this.state = 'dead';
      this.deathTimer = 2000;
    }

    return true;
  }

  triggerWheelAdaptation(particles?: Particle[]) {
    this.state = 'wheel_spin';
    this.actionTimer = 500;
    this.wheelBurstTimer = 800;
    this.adaptationTimer = 4500; // 4.5s adaptation buff
    this.cooldowns.wheel = 6500;
    soundManager.playWheelClick();

    if (particles) {
      const cx = this.pos.x + this.width / 2;
      const cy = this.pos.y + 40;
      for (let i = 0; i < 45; i++) {
        const angle = (Math.PI * 2 / 45) * i;
        particles.push(new Particle(
          cx, cy,
          Math.cos(angle) * 18, Math.sin(angle) * 18,
          600, '#ffd700', 8, 'star'
        ));
      }
    }
  }

  update(dt: number, groundY: number, target: Entity, particles: Particle[], projectiles: Projectile[], onShockwave?: (x: number, y: number) => void) {
    this.target = target;

    // Hit flash
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.adaptationTimer > 0) this.adaptationTimer -= dt;
    if (this.damageTakenRecently > 0) this.damageTakenRecently = Math.max(0, this.damageTakenRecently - dt * 0.02);

    // Cooldown ticks
    Object.keys(this.cooldowns).forEach(k => {
      const key = k as keyof typeof this.cooldowns;
      if (this.cooldowns[key] > 0) this.cooldowns[key] -= dt;
    });

    // Wheel rotation
    if (this.wheelBurstTimer > 0) {
      this.wheelBurstTimer -= dt;
      this.wheelAngle += 0.38; // Rapid spin during click/burst
    } else {
      this.wheelAngle += this.wheelSpinSpeed;
    }

    // Wing flap & sash fluid oscillations
    this.wingFlapAngle = Math.sin(Date.now() * 0.009) * 0.3;
    this.sashWave = Math.sin(Date.now() * 0.007) * 0.4;

    // Update & decay sword trail polygons
    for (let i = this.swordTrail.length - 1; i >= 0; i--) {
      this.swordTrail[i].alpha -= dt * 0.005;
      if (this.swordTrail[i].alpha <= 0) {
        this.swordTrail.splice(i, 1);
      }
    }

    // Dead state handling
    if (this.state === 'dead') {
      this.deathTimer -= dt;
      if (Math.random() > 0.3) {
        particles.push(new Particle(
          this.pos.x + Math.random() * this.width,
          this.pos.y + Math.random() * this.height,
          (Math.random() - 0.5) * 6,
          -Math.random() * 7,
          600, '#ffd700', 6, 'star'
        ));
      }
      if (this.deathTimer <= 0) {
        this.active = false;
      }
      return;
    }

    // Physics (Gravity & Floor)
    this.vel.y += GRAVITY * 1.35;
    this.pos.y += this.vel.y;
    this.pos.x += this.vel.x;

    if (this.pos.y + this.height >= groundY) {
      this.pos.y = groundY - this.height;
      this.vel.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    this.vel.x *= 0.88; // Friction

    // Spawning Breakout sequence (Cinematic shadow emergence, no blinding full-screen flash)
    if (this.state === 'spawning') {
      this.spawnTimer -= dt;
      
      // Shadow vortices and golden divine motes rising cleanly from the ground
      if (Math.random() > 0.3) {
        particles.push(new Particle(
          this.pos.x + Math.random() * this.width,
          groundY - 8,
          (Math.random() - 0.5) * 4,
          -2 - Math.random() * 5,
          450,
          Math.random() > 0.6 ? '#ffd700' : '#09090b',
          6
        ));
      }

      if (this.spawnTimer < 900 && this.spawnTimer > 800 && Math.random() > 0.75) {
        soundManager.playWheelClick();
      }

      // Smooth breakout emergence
      if (this.spawnTimer <= 0) {
        this.state = 'idle';
        soundManager.playHeavySlam();
        soundManager.playWheelClick();
        if (onShockwave) onShockwave(this.pos.x + this.width / 2, groundY);

        const cx = this.pos.x + this.width / 2;
        const cy = this.pos.y + this.height / 2;
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 6 + Math.random() * 14;
          particles.push(new Particle(
            cx, cy,
            Math.cos(angle) * spd, Math.sin(angle) * spd,
            500 + Math.random() * 300,
            i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#ffd700' : '#1e1b4b'),
            6 + Math.random() * 6,
            'star'
          ));
        }
      }
      return;
    }

    // AI & Combat Loop
    if (!target || target.hp <= 0) {
      this.state = 'idle';
      this.interpolateJoints(dt * 0.015);
      return;
    }

    const distToTarget = target.pos.x + target.width / 2 - (this.pos.x + this.width / 2);
    const absDist = Math.abs(distToTarget);

    // State Timer
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
    }

    // 1.25x Faster Movement & Animations
    switch (this.state) {
      case 'idle':
      case 'chase':
        this.facingRight = distToTarget > 0;
        this.walkCycle += dt * 0.0175; // 1.25x faster walk cycle
        const moveDir = this.facingRight ? 1 : -1;

        // Fluid Multi-Joint Stride IK
        const sinWalk = Math.sin(this.walkCycle);
        const cosWalk = Math.cos(this.walkCycle);
        
        this.targetPose = {
          torsoAngle: moveDir * 0.09,
          spineFlex: sinWalk * 0.06,
          headAngle: -moveDir * 0.05,
          // Right Arm (Sword)
          rShoulderAngle: sinWalk * 0.65 + 0.2,
          rElbowAngle: 0.4 + Math.max(0, cosWalk * 0.35),
          rWristAngle: 0.1,
          // Left Arm (Claw)
          lShoulderAngle: -sinWalk * 0.65 - 0.2,
          lElbowAngle: 0.4 + Math.max(0, -cosWalk * 0.35),
          lWristAngle: -0.1,
          // Right Leg
          rHipAngle: sinWalk * 0.7,
          rKneeAngle: Math.max(0, -cosWalk * 0.75) + 0.2,
          rAnkleAngle: sinWalk * 0.35,
          // Left Leg
          lHipAngle: -sinWalk * 0.7,
          lKneeAngle: Math.max(0, cosWalk * 0.75) + 0.2,
          lAnkleAngle: -sinWalk * 0.35,
        };

        // Long distance behavior -> Agile Leap or Charge (1.25x faster)
        if (absDist > 380) {
          if (this.cooldowns.charge <= 0 && Math.random() > 0.3) {
            this.state = 'charge';
            this.actionTimer = 650;
            this.cooldowns.charge = 3200;
            this.vel.x = moveDir * 20; // 1.25x speed
            soundManager.playDash();
            break;
          } else if (this.cooldowns.leap <= 0 && this.isGrounded && Math.random() > 0.4) {
            this.state = 'leap';
            this.actionTimer = 600;
            this.cooldowns.leap = 2000;
            this.vel.y = -22; // High athletic leap
            this.vel.x = moveDir * 15; // 1.25x speed
            soundManager.playDash();
            break;
          }
        }

        // Mid distance behavior -> Ground slam or fast sprint
        if (absDist > 180) {
          this.state = 'chase';
          this.vel.x = moveDir * 12.5; // 1.25x speed running

          if (absDist < 360 && this.cooldowns.slam <= 0 && this.isGrounded && Math.random() > 0.4) {
            this.state = 'slam';
            this.actionTimer = 850;
            this.cooldowns.slam = 3200;
            this.vel.y = -21; // Sky leap
            this.vel.x = moveDir * 10.6; // 1.25x speed
            break;
          }
        } else {
          // Close distance -> Slash Through!
          if (this.cooldowns.slash <= 0) {
            this.state = 'slash';
            this.actionTimer = 450;
            this.cooldowns.slash = 1100;
            this.hasDealtSlashHit = false;
            // Initiate forward slash-through rush (1.25x speed)
            this.vel.x = moveDir * 16.25;
            soundManager.playSlash();
          } else if (this.isGrounded && Math.random() > 0.7) {
            // Agile repositioning hop to prevent sticking
            this.state = 'reposition';
            this.actionTimer = 320;
            this.vel.y = -12;
            this.vel.x = (Math.random() > 0.5 ? 1 : -1) * 13.75;
          } else {
            this.state = 'idle';
          }
        }
        break;

      case 'slash':
        // Dynamic arm & sword swing arc
        const slashProgress = 1 - Math.max(0, this.actionTimer / 450);
        const slashDir = this.facingRight ? 1 : -1;
        this.vel.x = slashDir * 16.25; // 1.25x speed

        // Fully articulated joint keyframing for slash
        const rShoulder = -Math.PI * 0.75 + slashProgress * (Math.PI * 1.6);
        const rElbow = 0.2 + Math.sin(slashProgress * Math.PI) * 0.4;
        const rWrist = -0.2 + slashProgress * 0.6;
        
        this.targetPose = {
          torsoAngle: slashDir * (0.2 + slashProgress * 0.2),
          spineFlex: Math.sin(slashProgress * Math.PI) * 0.15,
          headAngle: 0.1,
          rShoulderAngle: rShoulder,
          rElbowAngle: rElbow,
          rWristAngle: rWrist,
          lShoulderAngle: -0.4,
          lElbowAngle: 0.8,
          lWristAngle: -0.2,
          rHipAngle: 0.4,
          rKneeAngle: 0.6,
          rAnkleAngle: -0.2,
          lHipAngle: -0.4,
          lKneeAngle: 0.3,
          lAnkleAngle: 0.1,
        };

        // Deal damage during active swing frames (2x current = 22.5 damage)
        if (!this.hasDealtSlashHit && this.actionTimer <= 320 && this.actionTimer >= 120) {
          const slashReach = 220;
          const targetDist = Math.abs((target.pos.x + target.width / 2) - (this.pos.x + this.width / 2));
          
          if (targetDist < slashReach && target.phaseTimer <= 0) {
            this.hasDealtSlashHit = true;
            target.takeDamage(22.5, false); // 2x current damage (22.5)
            target.vel.x = slashDir * 18;
            target.vel.y = -9;
            target.phaseTimer = 250;
            soundManager.playSlash();

            for (let i = 0; i < 20; i++) {
              particles.push(new Particle(
                target.pos.x + target.width / 2,
                target.pos.y + target.height / 2,
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 14,
                350, '#ffd700', 7, 'star'
              ));
            }
          }

          // Emit Holy Blade Crescent Projectile (2x current = 20.0 damage, 1.25x speed = 27.5)
          projectiles.push(new Projectile(
            this.pos.x + (this.facingRight ? this.width + 15 : -45),
            this.pos.y + 110,
            slashDir * 27.5,
            0,
            this.ownerId,
            '#ffd700',
            'SWORD_OF_EXTERMINATION',
            'Megumi',
            20, // 2x damage
            36,
            'mahoraga_slash'
          ));
        }

        if (this.actionTimer <= 0) {
          // Reposition leap after slashing through
          this.state = 'reposition';
          this.actionTimer = 280;
          this.vel.y = -10;
          this.vel.x = -slashDir * 8.75;
        }
        break;

      case 'slam':
        // Raising both arms with blade pointed down for devastating crash
        if (this.actionTimer > 400) {
          // Windup in mid-air
          this.targetPose = {
            torsoAngle: -0.15, spineFlex: -0.1, headAngle: -0.2,
            rShoulderAngle: -Math.PI * 0.85, rElbowAngle: 0.3, rWristAngle: -0.3,
            lShoulderAngle: -Math.PI * 0.85, lElbowAngle: 0.3, lWristAngle: -0.3,
            rHipAngle: -0.4, rKneeAngle: 0.8, rAnkleAngle: 0.3,
            lHipAngle: -0.2, lKneeAngle: 0.9, lAnkleAngle: 0.3,
          };
        } else {
          // Crashing downwards
          this.targetPose = {
            torsoAngle: 0.3, spineFlex: 0.25, headAngle: 0.2,
            rShoulderAngle: Math.PI * 0.4, rElbowAngle: 0.1, rWristAngle: 0.3,
            lShoulderAngle: Math.PI * 0.4, lElbowAngle: 0.1, lWristAngle: 0.3,
            rHipAngle: 0.5, rKneeAngle: 0.9, rAnkleAngle: -0.3,
            lHipAngle: 0.5, lKneeAngle: 0.9, lAnkleAngle: -0.3,
          };
        }

        // Falling down to smash
        if (this.isGrounded && this.actionTimer < 650) {
          this.state = 'reposition';
          this.actionTimer = 320;
          soundManager.playHeavySlam();
          if (onShockwave) onShockwave(this.pos.x + this.width / 2, groundY);

          // Direct slam damage: 27.5 (2x current)
          const slamDist = Math.abs((target.pos.x + target.width / 2) - (this.pos.x + this.width / 2));
          if (slamDist < 260 && target.phaseTimer <= 0) {
            target.takeDamage(27.5, false);
            target.vel.y = -15;
            target.vel.x = (distToTarget > 0 ? 1 : -1) * 13;
            target.phaseTimer = 300;
          }

          // Ground shockwaves (12.5 damage, 2x current)
          projectiles.push(new Projectile(
            this.pos.x + this.width / 2, groundY - 40,
            20, 0, this.ownerId, '#ffffff', 'MAHORAGA_SHOCKWAVE', 'Megumi', 12.5, 26, 'shockwave'
          ));
          projectiles.push(new Projectile(
            this.pos.x + this.width / 2, groundY - 40,
            -20, 0, this.ownerId, '#ffffff', 'MAHORAGA_SHOCKWAVE', 'Megumi', 12.5, 26, 'shockwave'
          ));

          for (let i = 0; i < 45; i++) {
            particles.push(new Particle(
              this.pos.x + this.width / 2 + (Math.random() - 0.5) * 180,
              groundY - 5,
              (Math.random() - 0.5) * 18,
              -Math.random() * 14,
              550, '#ffffff', 9
            ));
          }
        }
        break;

      case 'charge':
        const cDir = this.facingRight ? 1 : -1;
        this.vel.x = cDir * 20; // 1.25x speed
        
        // Spear thrust athletic forward charge pose
        this.targetPose = {
          torsoAngle: cDir * 0.35, spineFlex: 0.2, headAngle: -0.1,
          rShoulderAngle: Math.PI * 0.5, rElbowAngle: 0.1, rWristAngle: 0.1,
          lShoulderAngle: -Math.PI * 0.4, lElbowAngle: 0.7, lWristAngle: -0.2,
          rHipAngle: 0.6, rKneeAngle: 0.8, rAnkleAngle: -0.2,
          lHipAngle: -0.6, lKneeAngle: 0.4, lAnkleAngle: 0.2,
        };

        if (Math.random() > 0.2) {
          particles.push(new Particle(
            this.pos.x + Math.random() * this.width,
            this.pos.y + Math.random() * this.height,
            -cDir * 5, (Math.random() - 0.5) * 4, 250, '#ffffff', 7
          ));
        }

        // 17.5 damage on charge hit (2x current)
        if (absDist < 120 && target.phaseTimer <= 0) {
          target.takeDamage(17.5, false);
          target.vel.x = cDir * 19;
          target.vel.y = -8;
          target.phaseTimer = 250;
          soundManager.playHeavySlam();
          this.state = 'reposition';
          this.actionTimer = 280;
          this.vel.y = -12;
        }

        if (this.actionTimer <= 0) {
          this.state = 'idle';
        }
        break;

      case 'leap':
        this.targetPose = {
          torsoAngle: (this.facingRight ? 1 : -1) * 0.1, spineFlex: -0.1, headAngle: -0.1,
          rShoulderAngle: -0.4, rElbowAngle: 0.5, rWristAngle: 0,
          lShoulderAngle: -0.4, lElbowAngle: 0.5, lWristAngle: 0,
          rHipAngle: -0.5, rKneeAngle: 1.1, rAnkleAngle: 0.4,
          lHipAngle: -0.3, lKneeAngle: 1.0, lAnkleAngle: 0.4,
        };
        if (this.isGrounded && this.actionTimer < 350) {
          this.state = 'idle';
        }
        break;

      case 'reposition':
        this.targetPose = {
          torsoAngle: (this.facingRight ? -1 : 1) * 0.15, spineFlex: 0.1, headAngle: 0,
          rShoulderAngle: 0.2, rElbowAngle: 0.4, rWristAngle: 0,
          lShoulderAngle: 0.2, lElbowAngle: 0.4, lWristAngle: 0,
          rHipAngle: 0.3, rKneeAngle: 0.6, rAnkleAngle: -0.1,
          lHipAngle: 0.3, lKneeAngle: 0.6, lAnkleAngle: -0.1,
        };
        if (this.actionTimer <= 0) {
          this.state = 'idle';
        }
        break;

      case 'wheel_spin':
        this.targetPose = {
          torsoAngle: 0, spineFlex: -0.2, headAngle: -0.3,
          rShoulderAngle: -Math.PI * 0.6, rElbowAngle: 0.6, rWristAngle: 0,
          lShoulderAngle: -Math.PI * 0.6, lElbowAngle: 0.6, lWristAngle: 0,
          rHipAngle: 0.1, rKneeAngle: 0.3, rAnkleAngle: 0,
          lHipAngle: -0.1, lKneeAngle: 0.3, lAnkleAngle: 0,
        };
        if (this.actionTimer <= 0) {
          this.state = 'idle';
        }
        break;
    }

    // Smoothly interpolate all skeletal joints toward target pose (1.25x faster response)
    this.interpolateJoints(Math.min(1, dt * 0.02));
  }

  private interpolateJoints(t: number) {
    const keys = Object.keys(this.targetPose) as (keyof JointPose)[];
    for (const key of keys) {
      this.currentPose[key] += (this.targetPose[key] - this.currentPose[key]) * t;
    }
  }

  getRect(): Rect {
    return { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    if (!this.active) return;
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    ctx.save();

    // Spawning Emergence Sequence (Smooth, clear, cinematic)
    if (this.state === 'spawning') {
      this.drawSpawningSequence(ctx, x, y);
      ctx.restore();
      return;
    }

    // Death fade
    if (this.state === 'dead') {
      ctx.globalAlpha = Math.max(0, this.deathTimer / 2000);
    }

    // Hit Flash
    if (this.hitFlashTimer > 0) {
      ctx.filter = 'brightness(200%) contrast(140%)';
    }

    // Adaptation Golden Divine Aura
    if (this.adaptationTimer > 0) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 35 + Math.sin(Date.now() * 0.01) * 15;
    }

    const dir = this.facingRight ? 1 : -1;
    const cx = x + this.width / 2;

    // Draw dynamic sword slash ribbon trail
    this.drawSwordTrails(ctx);

    // 1. Draw Golden Eight-Grip Wheel (Dharmachakra) floating above head (3D perspective tilt)
    this.drawGoldenWheel(ctx, cx, y - 48);

    // 2. Draw Left Leg (Rear Multi-Joint Leg)
    this.drawMultiJointLeg(ctx, cx - dir * 18, y + 175, this.currentPose.lHipAngle, this.currentPose.lKneeAngle, this.currentPose.lAnkleAngle, dir, false);

    // 3. Draw Left Arm (Rear Multi-Joint Arm with Claw)
    this.drawMultiJointArm(ctx, cx - dir * 28, y + 80, this.currentPose.lShoulderAngle, this.currentPose.lElbowAngle, this.currentPose.lWristAngle, dir, false);

    // 4. Draw Layered Facial Wings
    this.drawFaceWings(ctx, cx, y + 36, dir);

    // 5. Draw Multi-Segmented Divine White Torso & Spine with dynamic curvature
    this.drawMultiSegmentedBody(ctx, cx, y, dir);

    // 6. Draw Right Leg (Front Multi-Joint Leg)
    this.drawMultiJointLeg(ctx, cx + dir * 18, y + 175, this.currentPose.rHipAngle, this.currentPose.rKneeAngle, this.currentPose.rAnkleAngle, dir, true);

    // 7. Draw Right Arm with Sacred Sword of Extermination & Blade Arc
    this.drawMultiJointArm(ctx, cx + dir * 28, y + 80, this.currentPose.rShoulderAngle, this.currentPose.rElbowAngle, this.currentPose.rWristAngle, dir, true);

    // 8. Draw Divine Boss HP Bar above Mahoraga
    this.drawBossHpBar(ctx, cx, y - 88);

    ctx.restore();
  }

  private drawSwordTrails(ctx: CanvasRenderingContext2D) {
    if (this.swordTrail.length < 2) return;
    ctx.save();
    for (let i = 0; i < this.swordTrail.length - 1; i++) {
      const p1 = this.swordTrail[i];
      const p2 = this.swordTrail[i + 1];
      
      const grad = ctx.createLinearGradient(p1.base.x, p1.base.y, p1.tip.x, p1.tip.y);
      grad.addColorStop(0, `rgba(255, 215, 0, ${p1.alpha * 0.4})`);
      grad.addColorStop(0.7, `rgba(255, 255, 255, ${p1.alpha * 0.8})`);
      grad.addColorStop(1, `rgba(255, 215, 0, ${p1.alpha * 0.9})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p1.base.x, p1.base.y);
      ctx.lineTo(p1.tip.x, p1.tip.y);
      ctx.lineTo(p2.tip.x, p2.tip.y);
      ctx.lineTo(p2.base.x, p2.base.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGoldenWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    ctx.translate(cx, cy);

    // Dynamic tilt based on movement and state
    const tilt = (this.facingRight ? 1 : -1) * Math.min(0.25, Math.abs(this.vel.x) * 0.015);
    ctx.rotate(tilt);

    const angle = this.wheelAngle;

    // Glowing Wheel Radiant Halo
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 24;

    // Outer Thick Golden Ring (Radius 50)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred Concentric Inset Ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();

    // Center Sunburst Golden Hub
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // 8 Ornate Dharma Wheel Handles with Spoke Crests
    for (let i = 0; i < 8; i++) {
      const spokeAngle = angle + (Math.PI * 2 / 8) * i;
      const cos = Math.cos(spokeAngle);
      const sin = Math.sin(spokeAngle);

      // Inner spoke column
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cos * 14, sin * 14);
      ctx.lineTo(cos * 50, sin * 50);
      ctx.stroke();

      // Golden Spoke Highlight
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cos * 16, sin * 16);
      ctx.lineTo(cos * 48, sin * 48);
      ctx.stroke();

      // Outer Handle Grips (Diamond / Spherical finial)
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cos * 59, sin * 59, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawFaceWings(ctx: CanvasRenderingContext2D, cx: number, headY: number, dir: number) {
    ctx.save();
    const flap = this.wingFlapAngle;
    const wingOriginX = cx + dir * 18;
    const wingOriginY = headY + 8;

    // 3 Layered Articulated Feathered Wings on Face Crest
    // Layer 1: Top Major Wing
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wingOriginX, wingOriginY - 4);
    ctx.quadraticCurveTo(
      wingOriginX - dir * 75, wingOriginY - 60 + flap * 35,
      wingOriginX - dir * 125, wingOriginY - 35 + flap * 50
    );
    ctx.quadraticCurveTo(
      wingOriginX - dir * 90, wingOriginY - 10,
      wingOriginX, wingOriginY + 4
    );
    ctx.fill();
    ctx.stroke();

    // Layer 2: Mid Wing
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(wingOriginX, wingOriginY + 8);
    ctx.quadraticCurveTo(
      wingOriginX - dir * 65, wingOriginY + 20 + flap * 28,
      wingOriginX - dir * 105, wingOriginY + 42 + flap * 40
    );
    ctx.quadraticCurveTo(
      wingOriginX - dir * 60, wingOriginY + 36,
      wingOriginX, wingOriginY + 20
    );
    ctx.fill();
    ctx.stroke();

    // Layer 3: Lower Feather Flange
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(wingOriginX, wingOriginY + 22);
    ctx.quadraticCurveTo(
      wingOriginX - dir * 45, wingOriginY + 50 + flap * 20,
      wingOriginX - dir * 70, wingOriginY + 70 + flap * 25
    );
    ctx.quadraticCurveTo(
      wingOriginX - dir * 35, wingOriginY + 55,
      wingOriginX, wingOriginY + 30
    );
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawMultiSegmentedBody(ctx: CanvasRenderingContext2D, cx: number, y: number, dir: number) {
    const time = Date.now() * 0.003;
    const breath = Math.sin(time) * 3;
    const torsoTilt = this.currentPose.torsoAngle;
    const spineFlex = this.currentPose.spineFlex;

    ctx.save();
    ctx.translate(cx, y + 140);
    ctx.rotate(torsoTilt);

    // 1. Flowing Loincloth / Sacred Sash with dynamic wind wave
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, 55);
    ctx.lineTo(35, 55);
    ctx.quadraticCurveTo(dir * 25 + this.sashWave * 25, 125, -dir * 30 + this.sashWave * 15, 145);
    ctx.fill();
    ctx.stroke();

    // 2. Multi-Segmented Abdominal Plates & Chitin Spine
    // Pelvic Base Segment
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-36, 25 + breath * 0.3, 72, 28, 6);
    ctx.fill();
    ctx.stroke();

    // Lumbar Segment 3
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-44 + spineFlex * 10, -5 + breath * 0.5, 88, 28, 7);
    ctx.fill();
    ctx.stroke();

    // Thoracic Segment 2
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-50 + spineFlex * 20, -35 + breath * 0.7, 100, 28, 8);
    ctx.fill();
    ctx.stroke();

    // Massive Muscular Pectoral Chest Plates
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-64 + spineFlex * 25, -78 + breath, 128, 46, 12);
    ctx.fill();
    ctx.stroke();

    // Pectoral center division and muscular ridges
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(spineFlex * 25, -78 + breath);
    ctx.lineTo(spineFlex * 10, 35 + breath);
    ctx.stroke();

    // Broad Armored Shoulder Deltoid Caps
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-66 + spineFlex * 25, -66 + breath, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(66 + spineFlex * 25, -66 + breath, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Neck & Sculpted Chitin Skull
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-16 + spineFlex * 28, -95 + breath, 32, 20);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(spineFlex * 30, -108 + breath, 32, 38, this.currentPose.headAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fierce Crimson Glowing Eyes in Dark Orbital Hollows
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(dir * 12 + spineFlex * 30, -112 + breath, 13, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(dir * 14 + spineFlex * 30, -112 + breath, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawMultiJointArm(
    ctx: CanvasRenderingContext2D,
    shoulderX: number,
    shoulderY: number,
    shoulderAngle: number,
    elbowAngle: number,
    wristAngle: number,
    dir: number,
    isRightArm: boolean
  ) {
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(shoulderAngle * dir);

    ctx.fillStyle = isRightArm ? '#ffffff' : '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;

    // 1. Shoulder Deltoid & Upper Arm (Bicep/Tricep Segment)
    ctx.beginPath();
    ctx.ellipse(0, 24, 15, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Elbow Joint
    ctx.translate(0, 48);
    ctx.rotate(elbowAngle * dir);

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Forearm Segment (Muscular with chitin plates)
    ctx.fillStyle = isRightArm ? '#ffffff' : '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, 26, 13, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Wrist Joint & Hand
    ctx.translate(0, 52);
    ctx.rotate(wristAngle * dir);

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isRightArm) {
      // Golden Sword Gauntlet & Holy Sword of Extermination
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-11, -16, 22, 38);
      ctx.strokeRect(-11, -16, 22, 38);

      // Sword of Extermination Blade (175px radiant double-edged blade!)
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 28;

      // Outer Golden Divine Edge
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(dir * 145, -16);
      ctx.lineTo(dir * 178, 0); // Blade Point
      ctx.lineTo(dir * 145, 16);
      ctx.lineTo(0, 9);
      ctx.closePath();
      ctx.fill();

      // Brilliant Pure White Sanctified Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(dir * 135, -7);
      ctx.lineTo(dir * 162, 0);
      ctx.lineTo(dir * 135, 7);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();

      // Store current sword tip and base for dynamic ribbon trail
      if (this.state === 'slash' || this.state === 'charge') {
        const matrix = ctx.getTransform();
        const tipPos = { x: matrix.a * (dir * 178) + matrix.e, y: matrix.b * (dir * 178) + matrix.f };
        const basePos = { x: matrix.e, y: matrix.f };
        this.swordTrail.push({ tip: tipPos, base: basePos, alpha: 1.0 });
        if (this.swordTrail.length > 14) this.swordTrail.shift();
      }
    } else {
      // Left Hand Multi-Joint Armored Claws
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, 8, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7, 12);
        ctx.lineTo(i * 9 + dir * 8, 28);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawMultiJointLeg(
    ctx: CanvasRenderingContext2D,
    hipX: number,
    hipY: number,
    hipAngle: number,
    kneeAngle: number,
    ankleAngle: number,
    dir: number,
    isFrontLeg: boolean
  ) {
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(hipAngle * dir);

    ctx.fillStyle = isFrontLeg ? '#ffffff' : '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;

    // 1. Thigh / Femur Segment
    ctx.beginPath();
    ctx.ellipse(0, 30, 20, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Knee Joint (Articulated kneecap shield)
    ctx.translate(0, 60);
    ctx.rotate(kneeAngle * dir);

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-14, -8, 28, 16, 6);
    ctx.fill();
    ctx.stroke();

    // 3. Shin / Calf Segment
    ctx.fillStyle = isFrontLeg ? '#f8fafc' : '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(0, 30, 16, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Ankle Joint & Digitigrade Talon Claws
    ctx.translate(0, 60);
    ctx.rotate(ankleAngle * dir);

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Foot / Armored Talons
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-18 + (dir * 6), -2, 38, 18);
    ctx.strokeRect(-18 + (dir * 6), -2, 38, 18);

    // Talon claws
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(18 * dir, 6);
    ctx.lineTo(28 * dir, 16);
    ctx.lineTo(16 * dir, 16);
    ctx.fill();

    ctx.restore();
  }

  private drawSpawningSequence(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const cx = x + this.width / 2;
    const progress = 1 - Math.max(0, this.spawnTimer / this.totalSpawnTime); // 0 -> 1

    ctx.save();

    // 1. Swirling Shadow Pool at the Ground (Ten Shadows depth)
    const poolRadius = 90 + Math.sin(Date.now() * 0.01) * 10;
    const poolGrad = ctx.createRadialGradient(cx, y + this.height, 10, cx, y + this.height, poolRadius);
    poolGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    poolGrad.addColorStop(0.5, 'rgba(30, 27, 75, 0.8)');
    poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(cx, y + this.height, poolRadius, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Descending Golden Wheel with gentle divine aura
    const wheelY = (y - 48) - (1 - progress) * 80;
    this.drawGoldenWheel(ctx, cx, wheelY);

    // 3. Towering Emerging Mummified Cocoon (Rising from shadows)
    const riseHeight = this.height * Math.min(1, progress * 1.3);
    const cocoonTopY = y + this.height - riseHeight;

    ctx.save();
    // Clip to rising bounds so it smoothly emerges out of the ground pool
    ctx.beginPath();
    ctx.rect(cx - 70, cocoonTopY - 10, 140, riseHeight + 20);
    ctx.clip();

    // Shadow Cocoon Base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 56, cocoonTopY, 112, riseHeight);

    // Bandage layers with dark aesthetic
    const layerCount = Math.floor(riseHeight / 16);
    for (let i = 0; i < layerCount; i++) {
      const bY = y + this.height - (i + 1) * 16;
      ctx.fillStyle = i % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
      ctx.fillRect(cx - 58 + Math.sin(i * 1.5) * 4, bY, 116, 14);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 58 + Math.sin(i * 1.5) * 4, bY, 116, 14);
    }

    // Sealing Talismans with red cursed Kanji
    for (let i = 0; i < 5; i++) {
      const tY = y + 50 + i * 45;
      if (tY >= cocoonTopY && tY <= y + this.height - 30) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 24, tY, 48, 26);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 24, tY, 48, 26);

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('封印', cx - 13, tY + 18);
      }
    }

    // Glowing Red Eyes glowing through bandages in top section
    if (progress > 0.4) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx - 14, y + 36, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 14, y + 36, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 4. Subtle golden cracking effect as it approaches 100% emergence
    if (progress > 0.75) {
      const crackAlpha = (progress - 0.75) / 0.25;
      ctx.strokeStyle = `rgba(255, 215, 0, ${crackAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, y + 40);
      ctx.lineTo(cx - 20, y + 90);
      ctx.lineTo(cx + 15, y + 140);
      ctx.lineTo(cx - 10, y + 200);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBossHpBar(ctx: CanvasRenderingContext2D, cx: number, barY: number) {
    const barWidth = 190;
    const barHeight = 11;
    const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.save();

    // Background track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - barWidth / 2, barY, barWidth, barHeight);
    ctx.strokeRect(cx - barWidth / 2, barY, barWidth, barHeight);

    // Fill bar
    const fillGrad = ctx.createLinearGradient(cx - barWidth / 2, barY, cx + barWidth / 2, barY);
    fillGrad.addColorStop(0, '#ffd700');
    fillGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = fillGrad;
    ctx.fillRect(cx - barWidth / 2 + 1.5, barY + 1.5, (barWidth - 3) * hpPct, barHeight - 3);

    // Title label
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DIVINE GENERAL MAHORAGA', cx, barY - 6);

    ctx.restore();
  }
}
