import { Player } from './Player';
import { Abonant } from './Abonant';
import { DomainManager } from './DomainManager';
import { Particle } from './Particle';
import { Projectile } from './Projectile';
import { InputManager } from './InputManager';
import { Vector2, Rect, CharacterType } from './Types';
import { E_DMG, Q_DMG, C_COST } from './Constants';
import { soundManager } from './SoundManager';
import { Entity } from './Entity';

import { applyYujiE } from '../entities/yuji/yuji_E';
import { applyYujiQ } from '../entities/yuji/yuji_Q';
import { applyGojoE } from '../entities/gojo/gojo_E';
import { applyGojoQ } from '../entities/gojo/gojo_Q';
import { applySukunaE } from '../entities/sukuna/sukuna_E';
import { applySukunaQ } from '../entities/sukuna/sukuna_Q';
import { handleGojoDomainInput, applyGojoDomainCollapse } from '../entities/gojo/gojo_C';
import { handleSukunaDomainInput } from '../entities/sukuna/sukuna_C';

import { applyMegumiE } from '../entities/megumi/megumi_E';
import { applyMegumiQ } from '../entities/megumi/megumi_Q';
import { handleMegumiDomainInput } from '../entities/megumi/megumi_C';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  player: Player;
  abonant: Abonant;
  domainManager: DomainManager;
  
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  
  input: InputManager;
  
  camera: Vector2 = { x: 0, y: 0 };
  screenShake: number = 0;
  chromaticAberration: number = 0;
  graphicsMode: 'HIGH' | 'LOW' = 'HIGH';
  globalImpactFrameTimer: number = 0;
  
  lastTime: number = 0;
  groundY: number = 500;
  worldWidth: number = 2000;

  lastMouseDown: boolean = false;
  activeBeams: { start: Vector2, end: Vector2, timer: number, maxTimer: number }[] = [];

  gameOver: boolean = false;
  winner: 'player' | 'abonant' | null = null;
  slowMoTimer: number = 0;
  
  isRunning: boolean = false;
  animationFrameId: number | null = null;

  mode: 'single' | 'multi' = 'single';
  role?: 'host' | 'guest';
  opponentInput: InputManager;
  onStateUpdate?: (state: any) => void;
  onClientInput?: (input: any) => void;

  activeHollowPurples: {
    pos: Vector2;
    vel: Vector2;
    radius: number;
    targetRadius: number;
    damageTimer: number;
    ownerId: string;
    formingTimer: number;
    hasDamaged: boolean;
  }[] = [];

  visualSlashes: {
    x: number;
    y: number;
    angle: number;
    timer: number;
    maxTimer: number;
    color: string;
  }[] = [];

  megumiDogs: any[] = [];

  constructor(canvas: HTMLCanvasElement, mode: 'single' | 'multi' = 'single', role?: 'host' | 'guest') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputManager(true);
    this.opponentInput = new InputManager(false);
    this.mode = mode;
    this.role = role;
    
    this.player = new Player('player', 200, 300, this.input);
    if (mode === 'multi') {
      this.abonant = new Abonant('abonant', 800, 300, this.opponentInput);
    } else {
      this.abonant = new Abonant('abonant', 800, 300);
    }
    this.domainManager = new DomainManager();
    
    this.groundY = this.canvas.height - 50;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  triggerShake(amount: number = 5) {
    this.screenShake = amount;
  }

  checkCollision(r1: Rect, r2: Rect): boolean {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
  }

  lineLineCollide(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2): boolean {
    const denom = ((p4.y-p3.y)*(p2.x-p1.x) - (p4.x-p3.x)*(p2.y-p1.y));
    if (denom === 0) return false;
    const uA = ((p4.x-p3.x)*(p1.y-p3.y) - (p4.y-p3.y)*(p1.x-p3.x)) / denom;
    const uB = ((p2.x-p1.x)*(p1.y-p3.y) - (p2.y-p1.y)*(p1.x-p3.x)) / denom;
    return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
  }

  lineRectCollide(p1: Vector2, p2: Vector2, r: Rect, padding: number = 0): boolean {
    const rect = {
      x: r.x - padding,
      y: r.y - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2
    };
    
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    
    if (maxX < rect.x || minX > rect.x + rect.width || maxY < rect.y || minY > rect.y + rect.height) {
      return false;
    }
    
    const edges = [
      [{x: rect.x, y: rect.y}, {x: rect.x + rect.width, y: rect.y}],
      [{x: rect.x + rect.width, y: rect.y}, {x: rect.x + rect.width, y: rect.y + rect.height}],
      [{x: rect.x + rect.width, y: rect.y + rect.height}, {x: rect.x, y: rect.y + rect.height}],
      [{x: rect.x, y: rect.y + rect.height}, {x: rect.x, y: rect.y}]
    ];
    
    for (const edge of edges) {
      if (this.lineLineCollide(p1, p2, edge[0], edge[1])) return true;
    }
    
    if (p1.x >= rect.x && p1.x <= rect.x + rect.width && p1.y >= rect.y && p1.y <= rect.y + rect.height) return true;
    
    return false;
  }

  applyAbilityEffects(target: Entity, sourceCharacter: CharacterType, abilityType: 'E' | 'Q', sourceEntity: Entity) {
    if (sourceCharacter === 'Yuji') {
      if (abilityType === 'E') {
        applyYujiE(target, sourceEntity);
      } else if (abilityType === 'Q') {
        applyYujiQ(target, sourceEntity);
      }
    } else if (sourceCharacter === 'Gojo') {
      if (abilityType === 'E') {
        applyGojoE(target);
      } else if (abilityType === 'Q') {
        applyGojoQ(target);
      }
    } else if (sourceCharacter === 'Sukuna') {
      if (abilityType === 'E') {
        applySukunaE(target);
      } else if (abilityType === 'Q') {
        applySukunaQ(target, target.id === this.player.id, (val) => { this.chromaticAberration = val; });
      }
    } else if (sourceCharacter === 'Megumi') {
      if (abilityType === 'E') {
        applyMegumiE(target, sourceEntity);
      } else if (abilityType === 'Q') {
        applyMegumiQ(target, sourceEntity);
      }
    }
  }

  triggerWhiteVoid(x: number, y: number) {
    this.triggerShake(20);
    this.chromaticAberration = 10;
    const mult = this.graphicsMode === 'HIGH' ? 3 : 0.5;
    for (let i = 0; i < 60 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30,
        800 + Math.random() * 400, i % 2 === 0 ? '#ffffff' : '#8a2be2', 4 + Math.random() * 8
      ));
    }
  }

  triggerSlashOverlay(x: number, y: number) {
    this.triggerShake(15);
    this.chromaticAberration = 15;
    const mult = this.graphicsMode === 'HIGH' ? 3 : 0.5;
    for (let i = 0; i < 40 * mult; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15,
        500 + Math.random() * 300, Math.random() > 0.5 ? '#ff0000' : '#8b0000', 3 + Math.random() * 4
      ));
    }
  }

  triggerHitSpark(x: number, y: number, color: string) {
    const mult = this.graphicsMode === 'HIGH' ? 3 : 0.5;
    for (let i = 0; i < 20 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
        300 + Math.random() * 200, color, 3 + Math.random() * 5
      ));
    }
  }

  getState() {
    return {
      player: {
        pos: this.player.pos, vel: this.player.vel, hp: this.player.hp, energy: this.player.energy, stamina: this.player.stamina,
        facingRight: this.player.facingRight, phaseTimer: this.player.phaseTimer,
        cooldowns: this.player.cooldowns, characterType: this.player.characterType, isDashing: this.player.isDashing
      },
      abonant: {
        pos: this.abonant.pos, vel: this.abonant.vel, hp: this.abonant.hp, energy: this.abonant.energy, stamina: this.abonant.stamina,
        state: this.abonant.state, facingRight: this.abonant.facingRight, phaseTimer: this.abonant.phaseTimer,
        cooldowns: this.abonant.cooldowns, characterType: this.abonant.characterType, isDashing: this.abonant.isDashing
      },
      projectiles: this.projectiles.map(p => ({
        pos: p.pos, vel: p.vel, active: p.active, ownerId: p.ownerId, color: p.color, characterType: p.characterType, abilityType: p.abilityType
      })),
      domain: {
        active: this.domainManager.active, type: this.domainManager.type, ownerId: this.domainManager.ownerId, timer: this.domainManager.timer
      },
      camera: this.camera,
      screenShake: this.screenShake,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }

  setState(state: any) {
    if (!state) return;
    
    if (this.role === 'guest') {
      Object.assign(this.abonant, state.player);
      Object.assign(this.player, state.abonant);
      
      // Swap IDs back so local logic works
      this.player.id = 'player';
      this.abonant.id = 'abonant';
    } else {
      Object.assign(this.player, state.player);
      Object.assign(this.abonant, state.abonant);
    }

    this.domainManager.active = state.domain.active;
    this.domainManager.type = state.domain.type;
    this.domainManager.ownerId = this.role === 'guest' 
      ? (state.domain.ownerId === 'player' ? 'abonant' : 'player')
      : state.domain.ownerId;
    this.domainManager.timer = state.domain.timer;
    this.camera = state.camera;
    this.screenShake = state.screenShake;
    this.gameOver = state.gameOver;
    this.winner = this.role === 'guest' && state.winner
      ? (state.winner === 'player' ? 'abonant' : 'player')
      : state.winner;
    
    // Reconstruct projectiles simply for visual sync
    this.projectiles = state.projectiles.map((p: any) => {
      const ownerId = this.role === 'guest' 
        ? (p.ownerId === 'player' ? 'abonant' : 'player')
        : p.ownerId;
      const proj = new Projectile(p.pos.x, p.pos.y, p.vel.x, p.vel.y, ownerId, p.color, p.abilityType, p.characterType);
      proj.active = p.active;
      proj.abilityType = p.abilityType;
      return proj;
    });
  }

  update(dt: number) {
    if (this.gameOver) {
      if (this.slowMoTimer > 0) {
        this.slowMoTimer -= dt;
        dt *= 0.1; // Slow motion effect
      } else {
        return; // Stop updating after slowmo
      }
    }

    this.player.activeDogs = this.megumiDogs.filter(d => d.ownerId === this.player.id).length;
    this.abonant.activeDogs = this.megumiDogs.filter(d => d.ownerId === this.abonant.id).length;

    if (this.globalImpactFrameTimer > 0) {
      this.globalImpactFrameTimer -= dt;
    }

    const mouseJustPressed = this.input.mouse.isDown && !this.lastMouseDown;
    const mouseJustReleased = !this.input.mouse.isDown && this.lastMouseDown;
    this.lastMouseDown = this.input.mouse.isDown;

    // Domain Expansion Input (Player)
    const playerDomainCost = this.player.characterType === 'Gojo' ? 75 : C_COST;
    const canPlayerActivateDomain = !this.domainManager.active || (this.domainManager.type !== 'Yuji' && this.domainManager.ownerId !== this.player.id);
    if (this.input.isKeyDown('c') && this.player.energy >= playerDomainCost && this.player.cooldowns.c <= 0 && canPlayerActivateDomain) {
      this.player.energy -= playerDomainCost;
      this.player.cooldowns.c = 15000; // 15s cooldown
      this.domainManager.activate(this.player.id, this.player.characterType);
      this.chromaticAberration = 10;
      this.triggerShake(10);
      soundManager.playDomainActivation();
      if (this.player.characterType === 'Yuji') {
        soundManager.playBoxingBell();
      }
    }

    // Domain Expansion (Abonant)
    const abonantDomainCost = this.abonant.characterType === 'Gojo' ? 75 : C_COST;
    const canAbonantActivateDomain = !this.domainManager.active || (this.domainManager.type !== 'Yuji' && this.domainManager.ownerId !== this.abonant.id);
    if (this.abonant.state === 'DOMAIN' && this.abonant.energy >= abonantDomainCost && this.abonant.cooldowns.c <= 0 && canAbonantActivateDomain) {
      this.abonant.energy -= abonantDomainCost;
      this.abonant.cooldowns.c = 15000;
      this.domainManager.activate(this.abonant.id, this.abonant.characterType);
      this.chromaticAberration = 10;
      this.triggerShake(10);
      soundManager.playDomainActivation();
      if (this.abonant.characterType === 'Yuji') {
        soundManager.playBoxingBell();
      }
    }

    const wasDomainActive = this.domainManager.active;
    const currentDomainType = this.domainManager.type;
    const currentDomainOwner = this.domainManager.ownerId;
    this.domainManager.update(dt, this.particles);
    const isDomainActive = this.domainManager.active;

    // Megumi Domain Shikigami Logic
    if (isDomainActive && this.domainManager.type === 'Megumi' && this.domainManager.shikigami) {
      const owner = this.domainManager.ownerId === this.player.id ? this.player : this.abonant;
      const target = this.domainManager.ownerId === this.player.id ? this.abonant : this.player;
      
      // Nue (Flying)
      this.domainManager.shikigami.nue.forEach((nue, index) => {
        // Hover above target loosely, roaming freely
        const targetX = target.pos.x + Math.sin(Date.now() * 0.002 + index * Math.PI) * 200;
        const targetY = target.pos.y - 250 + Math.cos(Date.now() * 0.003 + index * Math.PI) * 80;
        nue.x += (targetX - nue.x) * 0.03;
        nue.y += (targetY - nue.y) * 0.03;
        
        nue.timer -= dt;
        if (nue.timer <= 0) {
          nue.timer = 666 + Math.random() * 333; // Fire 3x faster (every 0.66-1 seconds)
          const dx = target.pos.x + target.width/2 - nue.x;
          const dy = target.pos.y + target.height/2 - nue.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const speed = 20; // 2x faster projectiles
          this.projectiles.push(new Projectile(nue.x, nue.y, (dx/dist)*speed, (dy/dist)*speed, owner.id, '#00008b', 'E', 'Megumi'));
        }
      });
      
      // Divine Dogs (Ground)
      this.domainManager.shikigami.dogs.forEach((dog, index) => {
        if (dog.cooldown > 0) dog.cooldown -= dt;
        
        if (dog.state === 'idle') {
          // Prowl around target loosely, not forced left/right
          const targetX = target.pos.x + Math.sin(Date.now() * 0.004 + index * Math.PI) * 150;
          dog.x += (targetX - dog.x) * 0.05;
          dog.y = this.groundY - 40; // Ground level
          
          // Check proximity to target
          const distToTarget = Math.abs(dog.x - (target.pos.x + target.width/2));
          if (distToTarget < 300 && dog.cooldown <= 0) {
            dog.state = 'dashing';
            dog.dashTimer = 600; // 600ms dash
            dog.startX = dog.x;
            dog.targetX = target.pos.x + target.width/2 + (dog.x < target.pos.x ? 250 : -250); // Dash through
          }
        } else if (dog.state === 'dashing') {
          dog.dashTimer -= dt;
          const progress = 1 - Math.max(0, dog.dashTimer / 600);
          dog.x = dog.startX + (dog.targetX - dog.startX) * progress;
          
          // Check collision with target
          if (Math.abs(dog.x - (target.pos.x + target.width/2)) < 40 && target.phaseTimer <= 0) {
            if (target.takeDamage(5, true, 'Megumi', owner.id)) { // 5 damage
              this.triggerHitSpark(target.pos.x + target.width/2, target.pos.y + target.height/2, '#00008b');
              target.phaseTimer = 200; // Brief invuln
            }
          }
          
          if (dog.dashTimer <= 0) {
            dog.state = 'idle';
            dog.cooldown = 1500; // 1.5 second cooldown
          }
        }
      });
    }

    // Domain Activation Burst
    if (!wasDomainActive && isDomainActive) {
      this.triggerShake(25);
      this.chromaticAberration = 20;
      this.globalImpactFrameTimer = 100; // 100ms of global impact frames
      const mult = this.graphicsMode === 'HIGH' ? 3 : 0.5;
      for(let i=0; i<100 * mult; i++) {
        this.particles.push(new Particle(
          this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2,
          (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40,
          1000 + Math.random() * 500, '#ffffff', 5 + Math.random() * 10
        ));
      }
    }

    // Dash Trails
    if (this.graphicsMode === 'HIGH') {
      if (this.player.isDashing && Math.random() > 0.3) {
        this.particles.push(new Particle(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2, 0, 0, 200, this.player.color, 8));
      }
      if (this.abonant.isDashing && Math.random() > 0.3) {
        this.particles.push(new Particle(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2, 0, 0, 200, this.abonant.color, 8));
      }

      // Megumi Shadow Aura
      [this.player, this.abonant].forEach(entity => {
        if (entity.characterType === 'Megumi' && Math.random() > 0.7) {
          this.particles.push(new Particle(
            entity.pos.x + Math.random() * entity.width,
            entity.pos.y + entity.height,
            (Math.random() - 0.5) * 2,
            -Math.random() * 5, // Float up
            400 + Math.random() * 300,
            'rgba(10, 10, 10, 0.6)', // Dark shadow color
            3 + Math.random() * 4
          ));
        }
      });

      // Projectile Trails
      for (const p of this.projectiles) {
        if (Math.random() > 0.4) {
          this.particles.push(new Particle(p.pos.x + p.width/2, p.pos.y + p.height/2, -p.vel.x * 0.1, -p.vel.y * 0.1, 300, p.color, 4));
        }
      }
    }

    // Gojo Domain Logic
    if (isDomainActive && currentDomainType === 'Gojo') {
      handleGojoDomainInput(
        currentDomainOwner === this.player.id,
        this.player,
        this.abonant,
        mouseJustPressed,
        this.input.mouse.isDown,
        this.input.mouse.x,
        this.input.mouse.y,
        this.camera,
        this.domainManager.purpleVectors
      );
    } else if (wasDomainActive && !isDomainActive && currentDomainType === 'Gojo') {
      applyGojoDomainCollapse(
        this.player,
        this.abonant,
        currentDomainOwner === this.player.id,
        () => soundManager.playBeam()
      );
      
      const owner = currentDomainOwner === this.player.id ? this.player : this.abonant;
      const target = currentDomainOwner === this.player.id ? this.abonant : this.player;
      
      if (this.domainManager.purpleVectors.length > 0) {
        const vec = this.domainManager.purpleVectors[0];
        const dx = vec.end.x - vec.start.x;
        const dy = vec.end.y - vec.start.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 400; // px per second
        this.activeHollowPurples.push({
          pos: { ...vec.start },
          vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
          radius: 160,
          targetRadius: 160,
          damageTimer: 0,
          ownerId: currentDomainOwner!,
          formingTimer: 0,
          hasDamaged: false
        });
      } else {
        const dx = target.pos.x - owner.pos.x;
        const dy = target.pos.y - owner.pos.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 400;
        this.activeHollowPurples.push({
          pos: { x: owner.pos.x + owner.width/2, y: owner.pos.y + owner.height/2 },
          vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
          radius: 20,
          targetRadius: 160,
          damageTimer: 0,
          ownerId: currentDomainOwner!,
          formingTimer: 2000,
          hasDamaged: false
        });
      }
      this.domainManager.purpleVectors = [];
    }

    // Update Hollow Purples
    for (let i = this.activeHollowPurples.length - 1; i >= 0; i--) {
      const hp = this.activeHollowPurples[i];
      const target = hp.ownerId === this.player.id ? this.abonant : this.player;
      
      if (hp.formingTimer > 0) {
        hp.formingTimer -= dt;
        hp.radius = hp.targetRadius - (hp.targetRadius - 10) * Math.max(0, hp.formingTimer / 2000);
      } else {
        hp.pos.x += hp.vel.x * (dt / 1000);
        hp.pos.y += hp.vel.y * (dt / 1000);
        
        const dx = hp.pos.x - (target.pos.x + target.width/2);
        const dy = hp.pos.y - (target.pos.y + target.height/2);
        const dist = Math.hypot(dx, dy);
        
        if (dist < hp.radius * 4) {
          const force = 2400 / Math.max(dist / 50, 1);
          target.vel.x += (dx / dist) * force * (dt / 1000);
          target.vel.y += (dy / dist) * force * (dt / 1000);
          
          if (dist < hp.radius) {
            if (!hp.hasDamaged) {
              if (target.takeDamage(75, false, 'Gojo', hp.ownerId)) {
                this.triggerHitSpark(target.pos.x + target.width/2, target.pos.y + target.height/2, '#8a2be2');
                this.triggerShake(15);
              }
              hp.hasDamaged = true;
            }
          }
        }
      }
      
      if (hp.pos.x < -1000 || hp.pos.x > this.worldWidth + 1000 || hp.pos.y < -1000 || hp.pos.y > this.canvas.height + 1000) {
        this.activeHollowPurples.splice(i, 1);
      }
    }

    // Sukuna Domain Logic
    if (isDomainActive && currentDomainType === 'Sukuna') {
      handleSukunaDomainInput(
        dt,
        currentDomainOwner === this.player.id,
        this.player,
        this.abonant,
        mouseJustPressed,
        this.input.mouse.isDown,
        mouseJustReleased,
        this.input.mouse.x,
        this.input.mouse.y,
        this.camera,
        this.domainManager.sukunaSlashesRemaining,
        (val) => { this.domainManager.sukunaSlashesRemaining = val; },
        this.domainManager.sukunaCurrentLine,
        (val) => { this.domainManager.sukunaCurrentLine = val; },
        this.domainManager.sukunaSlashes,
        this.lineRectCollide.bind(this),
        (val) => this.triggerShake(val),
        (val) => { this.domainManager.impactFrameTimer = val; },
        () => soundManager.playSlash(),
        this.domainManager.sukunaSlashRateLimitTimer,
        (val) => { this.domainManager.sukunaSlashRateLimitTimer = val; }
      );
    }

    if (!(isDomainActive && currentDomainType === 'Gojo')) {
      const playerStats = this.player.update(dt, this.groundY, this.projectiles, this.particles, () => this.triggerShake(5), isDomainActive && currentDomainType === 'Yuji' && currentDomainOwner === this.player.id, isDomainActive && currentDomainType === 'Megumi');
      const abonantStats = this.abonant.update(dt, this.groundY, this.player, this.projectiles, this.particles, () => this.triggerShake(5), isDomainActive && currentDomainType === 'Sukuna', isDomainActive && currentDomainType === 'Yuji' && currentDomainOwner === this.abonant.id, isDomainActive && currentDomainType === 'Megumi');

      // Megumi E Tether Logic
      [this.player, this.abonant].forEach(entity => {
        const anyEntity = entity as any;
        if (anyEntity.shadowAnchor) {
          anyEntity.shadowAnchor.timer -= dt;
          if (anyEntity.shadowAnchor.timer <= 0) {
            anyEntity.shadowAnchor = null;
          } else {
            const dx = entity.pos.x - anyEntity.shadowAnchor.x;
            const dy = entity.pos.y - anyEntity.shadowAnchor.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxRadius = 150;
            if (dist > maxRadius) {
              // Pull back
              const pullStrength = (dist - maxRadius) * 0.1;
              entity.vel.x -= (dx / dist) * pullStrength;
              entity.vel.y -= (dy / dist) * pullStrength;
            }
          }
        }
        
        // Spawn Megumi Q Dogs
        if (anyEntity.spawnDogQ) {
          anyEntity.spawnDogQ = false;
          const existingColors = this.megumiDogs.filter(d => d.ownerId === entity.id).map(d => d.colorIndex);
          const colorIndex = existingColors.includes(0) ? 1 : 0; // 0 for white, 1 for black
          
          const dir = entity.facingRight ? 1 : -1;
          
          this.megumiDogs.push({
            ownerId: entity.id,
            x: entity.pos.x + entity.width/2,
            y: this.groundY - 40,
            startX: entity.pos.x + entity.width/2,
            targetX: entity.pos.x + entity.width/2 + dir * 400, // Dash distance
            state: 'dashing',
            dashTimer: 600, // 600ms dash
            lifeTimer: 3000, // 3 seconds
            colorIndex: colorIndex,
            cooldown: 0,
            hasHitDash: false,
            dashCount: 1
          });
        }
      });
      
      // Update Megumi Q Dogs
      for (let i = this.megumiDogs.length - 1; i >= 0; i--) {
        const dog = this.megumiDogs[i];
        dog.lifeTimer -= dt;
        if (dog.lifeTimer <= 0) {
          this.megumiDogs.splice(i, 1);
          continue;
        }
        
        const owner = dog.ownerId === this.player.id ? this.player : this.abonant;
        const target = dog.ownerId === this.player.id ? this.abonant : this.player;
        
        if (dog.cooldown > 0) dog.cooldown -= dt;
        
        if (dog.state === 'dashing') {
          dog.dashTimer -= dt;
          const progress = 1 - Math.max(0, dog.dashTimer / 600);
          dog.x = dog.startX + (dog.targetX - dog.startX) * progress;
          
          // Collision with target
          if (!dog.hasHitDash && Math.abs(dog.x - (target.pos.x + target.width/2)) < 40 && target.phaseTimer <= 0) {
            if (dog.dashCount === 1) {
              if (target.takeDamage(5, isDomainActive, currentDomainType, currentDomainOwner)) { // 5 damage
                this.triggerHitSpark(target.pos.x + target.width/2, target.pos.y + target.height/2, '#00008b');
                dog.hasHitDash = true;
              }
            } else {
              target.slowTimer = 1500; // 1.5 second slow
              this.triggerHitSpark(target.pos.x + target.width/2, target.pos.y + target.height/2, '#4a90e2');
              dog.hasHitDash = true;
            }
          }
          
          if (dog.dashTimer <= 0) {
            if (dog.dashCount >= 2) {
              this.megumiDogs.splice(i, 1);
              continue;
            }
            dog.state = 'idle';
            dog.cooldown = 1000;
          }
        } else if (dog.state === 'idle') {
          // Prowl around target
          const targetX = target.pos.x + Math.sin(Date.now() * 0.004 + dog.colorIndex * Math.PI) * 150;
          dog.x += (targetX - dog.x) * 0.05;
          
          const distToTarget = Math.abs(dog.x - (target.pos.x + target.width/2));
          if (distToTarget < 300 && dog.cooldown <= 0) {
            dog.state = 'dashing';
            dog.dashTimer = 600;
            dog.startX = dog.x;
            dog.targetX = target.pos.x + target.width/2 + (dog.x < target.pos.x ? 250 : -250);
            dog.hasHitDash = false;
            dog.dashCount++;
          }
        }
      }

      if (playerStats?.didSecondaryHit || playerStats?.didBleedHit) {
        this.spawnVisualSlash(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2, '#ff0000');
        this.triggerShake(5);
      }
      if (abonantStats?.didSecondaryHit || abonantStats?.didBleedHit) {
        this.spawnVisualSlash(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2, '#ff0000');
        this.triggerShake(5);
      }
    }

    // Update Beams (Removed as per instructions)

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.particles);
      
      // Collision with entities
      const pRect = p.getRect();
      if (p.ownerId !== this.player.id && this.checkCollision(pRect, this.player.getRect())) {
        let damage = p.characterType === 'Sukuna' ? 4 : E_DMG;
        if (p.characterType === 'Megumi') damage -= 3;
        if (this.player.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
          this.abonant.energy += 3; 
          this.applyAbilityEffects(this.player, p.characterType, p.abilityType, this.abonant);
          
          // Yuji Knockback (2x)
          if (p.characterType === 'Yuji') {
            this.player.vel.y = -10; // Reduced upward pop
            this.player.vel.x = p.vel.x > 0 ? 45 : -45; // Increased backward pop
            this.triggerHitSpark(p.pos.x, p.pos.y, '#f1c40f');
          }
          
          // VFX Triggers
          if (p.characterType === 'Gojo') {
            this.triggerWhiteVoid(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Sukuna') {
            this.triggerSlashOverlay(p.pos.x, p.pos.y);
          }

          p.active = false;
        }
      } else if (p.ownerId !== this.abonant.id && this.checkCollision(pRect, this.abonant.getRect())) {
        let damage = p.characterType === 'Sukuna' ? 4 : E_DMG;
        if (p.characterType === 'Megumi') damage -= 3;
        if (p.ownerId === this.player.id && isDomainActive && this.domainManager.type === 'Yuji') {
          damage *= 1.5;
        }
        if (this.abonant.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
          this.player.energy += 3;
          this.applyAbilityEffects(this.abonant, p.characterType, p.abilityType, this.player);
          
          // Yuji Knockback (2x)
          if (p.characterType === 'Yuji') {
            this.abonant.vel.y = -10; // Reduced upward pop
            this.abonant.vel.x = p.vel.x > 0 ? 45 : -45; // Increased backward pop
            this.triggerHitSpark(p.pos.x, p.pos.y, '#f1c40f');
          }

          // VFX Triggers
          if (p.characterType === 'Gojo') {
            this.triggerWhiteVoid(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Sukuna') {
            this.triggerSlashOverlay(p.pos.x, p.pos.y);
          }

          p.active = false;
        }
      }
      
      if (!p.active || p.pos.x < 0 || p.pos.x > this.worldWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    // Melee Collision (Q Dash)
    if (this.player.phaseTimer > 0 && !this.player.hasHitDash && this.checkCollision(this.player.getRect(), this.abonant.getRect())) {
      let damage = (isDomainActive && this.domainManager.type === 'Yuji') ? Q_DMG * 1.5 : Q_DMG;
      if (this.player.characterType === 'Megumi') damage -= 3;
      if (this.abonant.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
        this.player.energy += 5;
        this.applyAbilityEffects(this.abonant, this.player.characterType, 'Q', this.player);
        this.player.hasHitDash = true;
        this.triggerHitSpark(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2, this.player.color);
        this.triggerShake(8);
        this.globalImpactFrameTimer = 50;
      }
    }
    if (this.abonant.phaseTimer > 0 && !this.abonant.hasHitDash && this.checkCollision(this.abonant.getRect(), this.player.getRect())) {
      let damage = Q_DMG;
      if (this.abonant.characterType === 'Megumi') damage -= 3;
      if (this.player.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
        this.abonant.energy += 5;
        this.applyAbilityEffects(this.player, this.abonant.characterType, 'Q', this.abonant);
        this.abonant.hasHitDash = true;
        this.triggerHitSpark(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2, this.abonant.color);
        this.triggerShake(8);
        this.globalImpactFrameTimer = 50;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Camera follow
    const targetCamX = this.player.pos.x - this.canvas.width / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.canvas.width));

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    if (this.chromaticAberration > 0) {
      this.chromaticAberration *= 0.95;
      if (this.chromaticAberration < 0.5) this.chromaticAberration = 0;
    }

    // Check Win/Loss
    if (!this.gameOver) {
      if (this.abonant.hp <= 0) {
        this.gameOver = true;
        this.winner = 'player';
        this.slowMoTimer = 2000; // 2 seconds of slowmo
      } else if (this.player.hp <= 0) {
        this.gameOver = true;
        this.winner = 'abonant';
        this.slowMoTimer = 2000;
      }
    }
  }

  spawnVisualSlash(x: number, y: number, color: string) {
    this.visualSlashes.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      angle: Math.random() * Math.PI * 2,
      timer: 200,
      maxTimer: 200,
      color
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    
    // Screen shake
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }

    // Background
    // Global Impact Frames
    if (this.globalImpactFrameTimer > 0) {
      this.ctx.save();
      const colors = ['#000000', '#ffffff'];
      const color = colors[Math.floor(this.globalImpactFrameTimer / 16) % colors.length];
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      return; // Skip rest of drawing for impact frame
    }

    // Impact Frames (Sukuna Domain)
    if (this.domainManager.active && this.domainManager.type === 'Sukuna' && this.domainManager.impactFrameTimer > 0) {
      const colors = ['#000000', '#ffffff', '#ff0000'];
      const color = colors[Math.floor(this.domainManager.impactFrameTimer / 16) % colors.length];
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      return;
    }

    if (!this.domainManager.active) {
      this.drawCityscape();
    }
    
    this.domainManager.drawBackground(this.ctx, this.canvas.width, this.canvas.height, this.camera);

    // Ground / Road
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    this.ctx.fillStyle = '#f39c12';
    for (let i = 0; i < this.canvas.width + 200; i += 100) {
      const lineX = i - (this.camera.x % 100);
      this.ctx.fillRect(lineX, this.groundY + 20, 60, 5);
    }

    // Chromatic Aberration
    if (this.chromaticAberration > 0) {
      this.ctx.globalCompositeOperation = 'screen';
      
      this.ctx.save();
      this.ctx.translate(this.chromaticAberration, 0);
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      this.drawWorld();
      this.ctx.restore();
      
      this.ctx.save();
      this.ctx.translate(-this.chromaticAberration, 0);
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
      this.drawWorld();
      this.ctx.restore();
      
      this.ctx.globalCompositeOperation = 'source-over';
    } else {
      this.drawWorld();
    }

    // Gojo vectors (removed as per instructions)
    this.ctx.restore();
  }

  drawWorld() {
    const isYujiDomainActive = this.domainManager.active && this.domainManager.type === 'Yuji';
    
    if (isYujiDomainActive) {
      this.ctx.shadowColor = '#ffaa00';
      this.ctx.shadowBlur = 15;
    }
    this.player.draw(this.ctx, this.camera);
    this.ctx.shadowBlur = 0;
    
    this.abonant.draw(this.ctx, this.camera);

    // Draw Tracking Diamonds
    this.ctx.save();
    
    // Player Diamond (Blue)
    this.ctx.fillStyle = '#00aaff';
    this.ctx.shadowColor = '#00aaff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    const px = this.player.pos.x + this.player.width / 2 - this.camera.x;
    const py = this.player.pos.y - 30 - this.camera.y + Math.sin(performance.now() / 200) * 5;
    this.ctx.moveTo(px, py - 10);
    this.ctx.lineTo(px + 10, py);
    this.ctx.lineTo(px, py + 10);
    this.ctx.lineTo(px - 10, py);
    this.ctx.fill();

    // Abonant Diamond (Red)
    this.ctx.fillStyle = '#ff0044';
    this.ctx.shadowColor = '#ff0044';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    const ax = this.abonant.pos.x + this.abonant.width / 2 - this.camera.x;
    const ay = this.abonant.pos.y - 30 - this.camera.y + Math.sin(performance.now() / 200 + Math.PI) * 5;
    this.ctx.moveTo(ax, ay - 10);
    this.ctx.lineTo(ax + 10, ay);
    this.ctx.lineTo(ax, ay + 10);
    this.ctx.lineTo(ax - 10, ay);
    this.ctx.fill();

    this.ctx.restore();
    
    for (const p of this.projectiles) p.draw(this.ctx, this.camera);
    for (const p of this.particles) p.draw(this.ctx, this.camera);

    // Draw Megumi Shikigami
    if (this.domainManager.active && this.domainManager.type === 'Megumi' && this.domainManager.shikigami) {
      this.ctx.save();
      // Nue
      this.ctx.fillStyle = '#1e90ff'; // Dodger blue
      this.domainManager.shikigami.nue.forEach(nue => {
        // Body
        this.ctx.beginPath();
        this.ctx.arc(nue.x - this.camera.x, nue.y - this.camera.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        // Mask/Face
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(nue.x - this.camera.x, nue.y - this.camera.y + 5, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1e90ff';
        
        // Wings
        this.ctx.beginPath();
        this.ctx.moveTo(nue.x - this.camera.x, nue.y - this.camera.y);
        this.ctx.lineTo(nue.x - this.camera.x - 40, nue.y - this.camera.y - 25 + Math.sin(Date.now()*0.01)*15);
        this.ctx.lineTo(nue.x - this.camera.x - 15, nue.y - this.camera.y + 15);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(nue.x - this.camera.x, nue.y - this.camera.y);
        this.ctx.lineTo(nue.x - this.camera.x + 40, nue.y - this.camera.y - 25 + Math.sin(Date.now()*0.01)*15);
        this.ctx.lineTo(nue.x - this.camera.x + 15, nue.y - this.camera.y + 15);
        this.ctx.fill();
      });
      
      // Divine Dogs
      this.domainManager.shikigami.dogs.forEach((dog, index) => {
        this.ctx.fillStyle = index === 0 ? '#f8f8ff' : '#111111'; // White and Black Dog
        const target = this.domainManager.ownerId === this.player.id ? this.abonant : this.player;
        const dir = dog.state === 'dashing' ? (dog.targetX > dog.startX ? 1 : -1) : (dog.x > target.pos.x ? -1 : 1);
        
        // Body (longer)
        this.ctx.fillRect(dog.x - 25 - this.camera.x, dog.y - 25 - this.camera.y, 50, 25);
        
        // Head
        this.ctx.fillRect(dog.x + (dir * 20) - 15 - this.camera.x, dog.y - 40 - this.camera.y, 30, 25);
        
        // Snout
        this.ctx.fillRect(dog.x + (dir * 35) - 10 - this.camera.x, dog.y - 30 - this.camera.y, 20, 15);
        
        // Ears
        this.ctx.beginPath();
        this.ctx.moveTo(dog.x + (dir * 10) - this.camera.x, dog.y - 40 - this.camera.y);
        this.ctx.lineTo(dog.x + (dir * 5) - this.camera.x, dog.y - 55 - this.camera.y);
        this.ctx.lineTo(dog.x + (dir * 20) - this.camera.x, dog.y - 40 - this.camera.y);
        this.ctx.fill();

        // Legs
        this.ctx.fillRect(dog.x - 20 - this.camera.x, dog.y - this.camera.y, 10, 15); // Back leg
        this.ctx.fillRect(dog.x + 10 - this.camera.x, dog.y - this.camera.y, 10, 15); // Front leg
        
        // Tail
        this.ctx.beginPath();
        this.ctx.moveTo(dog.x - (dir * 25) - this.camera.x, dog.y - 20 - this.camera.y);
        this.ctx.lineTo(dog.x - (dir * 40) - this.camera.x, dog.y - 30 - this.camera.y);
        this.ctx.lineTo(dog.x - (dir * 25) - this.camera.x, dog.y - 10 - this.camera.y);
        this.ctx.fill();
        
        // Eye (red glow)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(dog.x + (dir * 25) - 2 - this.camera.x, dog.y - 35 - this.camera.y, 4, 4);
      });
      this.ctx.restore();
    }

    // Draw Megumi Q Dogs
    this.megumiDogs.forEach(dog => {
      this.ctx.save();
      this.ctx.fillStyle = dog.colorIndex === 0 ? '#f8f8ff' : '#111111'; // White and Black Dog
      const target = dog.ownerId === this.player.id ? this.abonant : this.player;
      const dir = dog.state === 'dashing' ? (dog.targetX > dog.startX ? 1 : -1) : (dog.x > target.pos.x ? -1 : 1);
      
      // Body (longer)
      this.ctx.fillRect(dog.x - 25 - this.camera.x, dog.y - 25 - this.camera.y, 50, 25);
      
      // Head
      this.ctx.fillRect(dog.x + (dir * 20) - 15 - this.camera.x, dog.y - 40 - this.camera.y, 30, 25);
      
      // Snout
      this.ctx.fillRect(dog.x + (dir * 35) - 10 - this.camera.x, dog.y - 30 - this.camera.y, 20, 15);
      
      // Ears
      this.ctx.beginPath();
      this.ctx.moveTo(dog.x + (dir * 10) - this.camera.x, dog.y - 40 - this.camera.y);
      this.ctx.lineTo(dog.x + (dir * 5) - this.camera.x, dog.y - 55 - this.camera.y);
      this.ctx.lineTo(dog.x + (dir * 20) - this.camera.x, dog.y - 40 - this.camera.y);
      this.ctx.fill();

      // Legs
      this.ctx.fillRect(dog.x - 20 - this.camera.x, dog.y - this.camera.y, 10, 15); // Back leg
      this.ctx.fillRect(dog.x + 10 - this.camera.x, dog.y - this.camera.y, 10, 15); // Front leg
      
      // Tail
      this.ctx.beginPath();
      this.ctx.moveTo(dog.x - (dir * 25) - this.camera.x, dog.y - 20 - this.camera.y);
      this.ctx.lineTo(dog.x - (dir * 40) - this.camera.x, dog.y - 30 - this.camera.y);
      this.ctx.lineTo(dog.x - (dir * 25) - this.camera.x, dog.y - 10 - this.camera.y);
      this.ctx.fill();
      
      // Eye (red glow)
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(dog.x + (dir * 25) - 2 - this.camera.x, dog.y - 35 - this.camera.y, 4, 4);
      this.ctx.restore();
    });

    // Draw Megumi Tethers
    [this.player, this.abonant].forEach(entity => {
      const anyEntity = entity as any;
      if (anyEntity.shadowAnchor) {
        const startX = entity.pos.x + entity.width/2 - this.camera.x;
        const startY = entity.pos.y + entity.height/2 - this.camera.y;
        const endX = anyEntity.shadowAnchor.x - this.camera.x;
        const endY = anyEntity.shadowAnchor.y - this.camera.y;
        const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const sag = Math.min(dist * 0.15, 40);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 + sag;
        
        // Draw jagged/slash-like tether
        this.ctx.strokeStyle = 'rgba(0, 0, 139, 0.8)'; // Deep blue
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX, midY, endX, endY);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(10, 10, 10, 0.9)'; // Black core
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX + (Math.random() - 0.5) * 10, midY + (Math.random() - 0.5) * 10, endX, endY);
        this.ctx.stroke();
        
        // Draw anchor point
        this.ctx.fillStyle = '#00008b';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 6, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.fillStyle = '#111111';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 3, 0, Math.PI*2);
        this.ctx.fill();
      }
    });

    // Draw Gojo Lasers / Hollow Purple
    if (this.domainManager.active && this.domainManager.type === 'Gojo') {
      this.ctx.strokeStyle = 'rgba(138, 43, 226, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      for (const vec of this.domainManager.purpleVectors) {
        this.ctx.beginPath();
        this.ctx.moveTo(vec.start.x - this.camera.x, vec.start.y - this.camera.y);
        this.ctx.lineTo(vec.end.x - this.camera.x, vec.end.y - this.camera.y);
        this.ctx.stroke();
      }
      this.ctx.setLineDash([]);

      if (this.domainManager.timer <= 2000 && this.domainManager.purpleVectors.length > 0) {
        const vec = this.domainManager.purpleVectors[0];
        const progress = 1 - (this.domainManager.timer / 2000);
        const radius = 20 + 140 * progress;
        
        this.ctx.save();
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#8a2be2';
        
        const x = vec.start.x - this.camera.x;
        const y = vec.start.y - this.camera.y;

        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#8a2be2');
        grad.addColorStop(0.8, 'rgba(75, 0, 130, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1a0033';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
        this.ctx.lineWidth = 4;
        const time = performance.now() / 200;
        for (let j = 0; j < 3; j++) {
          this.ctx.beginPath();
          const angleOffset = (Math.PI * 2 / 3) * j + time;
          this.ctx.arc(x, y, radius * 0.3, angleOffset, angleOffset + Math.PI);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      }
    }

    for (const hp of this.activeHollowPurples) {
      this.ctx.save();
      this.ctx.shadowBlur = 30;
      this.ctx.shadowColor = '#8a2be2';
      
      const x = hp.pos.x - this.camera.x;
      const y = hp.pos.y - this.camera.y;
      const radius = hp.radius;

      const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, '#8a2be2');
      grad.addColorStop(0.8, 'rgba(75, 0, 130, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#1a0033'; // Dark purple instead of black
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Swirling effects inside
      this.ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
      this.ctx.lineWidth = 4;
      const time = performance.now() / 200;
      for (let j = 0; j < 3; j++) {
        this.ctx.beginPath();
        const angleOffset = (Math.PI * 2 / 3) * j + time;
        this.ctx.arc(x, y, radius * 0.3, angleOffset, angleOffset + Math.PI);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }

    // Draw Sukuna Slashes
    if (this.domainManager.active && this.domainManager.type === 'Sukuna') {
      if (this.domainManager.sukunaCurrentLine) {
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.domainManager.sukunaCurrentLine.start.x - this.camera.x, this.domainManager.sukunaCurrentLine.start.y - this.camera.y);
        this.ctx.lineTo(this.domainManager.sukunaCurrentLine.end.x - this.camera.x, this.domainManager.sukunaCurrentLine.end.y - this.camera.y);
        this.ctx.stroke();
      }
      for (const slash of this.domainManager.sukunaSlashes) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 4 * (slash.timer / 300);
        
        // Draw jagged line paths
        this.ctx.beginPath();
        this.ctx.moveTo(slash.p1.x - this.camera.x, slash.p1.y - this.camera.y);
        
        const dx = slash.p2.x - slash.p1.x;
        const dy = slash.p2.y - slash.p1.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(2, Math.floor(dist / 20));
        
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const x = slash.p1.x + dx * t + (Math.random() - 0.5) * 20;
          const y = slash.p1.y + dy * t + (Math.random() - 0.5) * 20;
          this.ctx.lineTo(x - this.camera.x, y - this.camera.y);
        }
        
        this.ctx.lineTo(slash.p2.x - this.camera.x, slash.p2.y - this.camera.y);
        this.ctx.stroke();
      }
    }

    // Draw Visual Slashes
    for (let i = this.visualSlashes.length - 1; i >= 0; i--) {
      const slash = this.visualSlashes[i];
      slash.timer -= 16.66; // approx dt
      if (slash.timer <= 0) {
        this.visualSlashes.splice(i, 1);
        continue;
      }
      
      const progress = 1 - (slash.timer / slash.maxTimer);
      const length = 100 * Math.sin(progress * Math.PI);
      const thickness = 10 * (1 - progress);
      
      this.ctx.save();
      this.ctx.translate(slash.x - this.camera.x, slash.y - this.camera.y);
      this.ctx.rotate(slash.angle);
      this.ctx.fillStyle = slash.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = slash.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, length, thickness, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, length * 0.8, thickness * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw Player Diamond Indicator
    this.ctx.save();
    this.ctx.translate(this.player.pos.x + this.player.width / 2 - this.camera.x, this.player.pos.y - 30 - this.camera.y);
    this.ctx.rotate(Math.PI / 4); // 45 degrees for diamond
    this.ctx.fillStyle = '#3b82f6'; // Blue
    this.ctx.fillRect(-8, -8, 16, 16);
    this.ctx.restore();

    // Draw Enemy Diamond Indicator
    this.ctx.save();
    this.ctx.translate(this.abonant.pos.x + this.abonant.width / 2 - this.camera.x, this.abonant.pos.y - 30 - this.camera.y);
    this.ctx.rotate(Math.PI / 4); // 45 degrees for diamond
    this.ctx.fillStyle = '#ef4444'; // Red
    this.ctx.fillRect(-8, -8, 16, 16);
    this.ctx.restore();
  }

  drawCityscape() {
    const { ctx, canvas, camera } = this;
    
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0a0a2a');
    skyGrad.addColorStop(1, '#2a1a3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Moon
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(canvas.width - 200 - camera.x * 0.05, 150, 60, 0, Math.PI * 2);
    ctx.fill();

    // Distant buildings (parallax 0.2)
    ctx.fillStyle = '#1a1a2e';
    for (let i = -5; i < 40; i++) {
      const h = 200 + Math.sin(i * 123) * 100;
      const w = 100 + Math.cos(i * 321) * 50;
      const x = (i * 150) - (camera.x * 0.2);
      ctx.fillRect(x, this.groundY - h, w, h);
    }

    // Midground buildings (parallax 0.5)
    for (let i = -5; i < 60; i++) {
      const h = 150 + Math.sin(i * 333) * 150;
      const w = 80 + Math.cos(i * 444) * 60;
      const x = (i * 120) - (camera.x * 0.5);
      ctx.fillStyle = '#16213e';
      ctx.fillRect(x, this.groundY - h, w, h);
      
      // Windows
      ctx.fillStyle = '#e94560';
      if (Math.sin(i) > 0) {
        ctx.fillRect(x + 20, this.groundY - h + 20, 10, 20);
        ctx.fillRect(x + 50, this.groundY - h + 50, 10, 20);
      }
    }
  }

  loop(time: number) {
    if (!this.isRunning) return;

    const dt = time - this.lastTime;
    this.lastTime = time;
    
    // Cap dt to prevent huge jumps if tab is inactive
    const cappedDt = Math.min(dt, 32);
    
    if (this.mode === 'multi' && this.role === 'guest') {
      // Guest only sends inputs and draws received state
      if (this.onClientInput) {
        // Convert keys object to array for serialization
        const keysArray = Object.keys(this.input.keys).filter(k => this.input.keys[k]);
        this.onClientInput({
          keys: keysArray,
          mouse: this.input.mouse
        });
      }
      this.draw();
    } else {
      // Single or Host mode
      if (this.mode === 'multi' && this.role === 'host') {
        // Apply remote inputs to abonant
        if (!this.abonant.input) {
          // We already created a new InputManager for opponentInput in constructor
          this.abonant.input = this.opponentInput;
        }
      }

      this.update(cappedDt);
      this.draw();

      if (this.mode === 'multi' && this.role === 'host' && this.onStateUpdate) {
        this.onStateUpdate(this.getState());
      }
    }
    
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
}
