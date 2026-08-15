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
import { handleMegumiSummonMahoraga } from '../entities/megumi/megumi_C';
import { Mahoraga } from '../entities/mahoraga/Mahoraga';

import { applyHakariE } from '../entities/hakari/hakari_E';
import { applyHakariQ } from '../entities/hakari/hakari_Q';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  player: Player;
  abonant: Abonant;
  domainManager: DomainManager;
  mahoraga: Mahoraga | null = null;
  
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  
  input: InputManager;
  
  camera: Vector2 = { x: 0, y: 0 };
  screenShake: number = 0;
  chromaticAberration: number = 0;
  graphicsMode: 'HIGH' | 'LOW' = 'HIGH';
  globalImpactFrameTimer: number = 0;
  hitStopTimer: number = 0;
  blackFlashTimer: number = 0;
  blackFlashPos: Vector2 | null = null;
  
  lastTime: number = 0;
  groundY: number = 500;
  worldWidth: number = 2000;

  lastMouseDown: boolean = false;
  activeBeams: { start: Vector2, end: Vector2, timer: number, maxTimer: number, color?: string }[] = [];
  pendingYujiGhostDashes: {
    ownerId: string;
    targetId: string;
    delayTimer: number;
    initialFacingRight: boolean;
    phase: 'WAITING' | 'DASHING';
    dashTimer: number;
    ghostPos: Vector2;
    ghostVel: Vector2;
    hasHit: boolean;
  }[] = [];

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

  backgroundVariant: number = 0;

  constructor(canvas: HTMLCanvasElement, mode: 'single' | 'multi' = 'single', role?: 'host' | 'guest') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputManager(true);
    this.opponentInput = new InputManager(false);
    this.mode = mode;
    this.role = role;
    this.backgroundVariant = Math.floor(Math.random() * 4);
    
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

  applyAbilityEffects(target: Entity, sourceCharacter: CharacterType, abilityType: 'E' | 'Q' | string, sourceEntity: Entity) {
    const isYujiDomainActive = this.domainManager.active && this.domainManager.type === 'Yuji';
    if (sourceCharacter === 'Yuji') {
      if (abilityType === 'E') {
        applyYujiE(target, sourceEntity);
      } else if (abilityType === 'Q') {
        applyYujiQ(target, sourceEntity, isYujiDomainActive);
      }
      if (isYujiDomainActive) {
        target.stunTimer = 0;
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
    } else if (sourceCharacter === 'Hakari') {
      if (abilityType === 'E') {
        applyHakariE(target);
      } else if (abilityType === 'Q') {
        applyHakariQ(target, sourceEntity);
      }
    }
  }

  triggerWhiteVoid(x: number, y: number) {
    this.triggerShake(35);
    this.chromaticAberration = 40;
    this.hitStopTimer = 50; 
    const mult = this.graphicsMode === 'HIGH' ? 5 : 1;
    
    // Core explosion flash
    for (let i = 0; i < 40 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60,
        1500 + Math.random() * 800, 
        Math.random() > 0.5 ? '#ffffff' : '#8a2be2', 
        10 + Math.random() * 50,
        'glow',
        { friction: 0.9, scaleInOut: true }
      ));
    }
    // High-velocity streaks
    for (let i = 0; i < 30 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120,
        300 + Math.random() * 500, 
        '#ffffff', 
        2 + Math.random() * 5,
        'line',
        { friction: 0.95 }
      ));
    }
  }

  triggerYujiBurst(x: number, y: number) {
    this.triggerShake(14);
    const mult = this.graphicsMode === 'HIGH' ? 3 : 1;
    for (let i = 0; i < 25 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35,
        400 + Math.random() * 300,
        Math.random() > 0.4 ? '#ef4444' : '#fbbf24',
        6 + Math.random() * 8,
        'rect',
        { friction: 0.9, scaleInOut: true, angularVel: (Math.random() - 0.5) * 1.0 }
      ));
    }
  }

  triggerMegumiShadowBurst(x: number, y: number) {
    this.triggerShake(12);
    const mult = this.graphicsMode === 'HIGH' ? 3 : 1;
    for (let i = 0; i < 30 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25 - 3,
        500 + Math.random() * 300,
        Math.random() > 0.5 ? '#1e1b4b' : '#38bdf8',
        5 + Math.random() * 9,
        'circle',
        { friction: 0.92, scaleInOut: true }
      ));
    }
  }

  triggerHakariJackpotBurst(x: number, y: number) {
    this.triggerShake(15);
    const mult = this.graphicsMode === 'HIGH' ? 3 : 1;
    const colors = ['#f43f5e', '#06b6d4', '#eab308', '#ec4899'];
    for (let i = 0; i < 28 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40,
        450 + Math.random() * 300,
        colors[Math.floor(Math.random() * colors.length)],
        6 + Math.random() * 10,
        'star',
        { friction: 0.9, scaleInOut: true, angularVel: (Math.random() - 0.5) * 1.2 }
      ));
    }
  }

  triggerSlashOverlay(x: number, y: number) {
    this.triggerShake(25);
    this.chromaticAberration = 20;
    const mult = this.graphicsMode === 'HIGH' ? 4 : 1;
    
    // Blood explosion
    for (let i = 0; i < 60 * mult; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30,
        800 + Math.random() * 400, 
        Math.random() > 0.4 ? '#ff0000' : '#8b0000', 
        5 + Math.random() * 15,
        'circle',
        { gravity: true, friction: 0.98, scaleInOut: true }
      ));
    }
    // Dark slash marks
    for (let i = 0; i < 15 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80,
        400 + Math.random() * 200, 
        '#000000', 
        10 + Math.random() * 20,
        'arc',
        { friction: 0.8, angularVel: (Math.random() - 0.5) * 2 }
      ));
    }
  }

  triggerHitSpark(x: number, y: number, color: string) {
    this.triggerShake(10);
    const mult = this.graphicsMode === 'HIGH' ? 4 : 1;
    
    // Core sparks
    for (let i = 0; i < 25 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40,
        400 + Math.random() * 200, 
        color, 
        4 + Math.random() * 8,
        'star',
        { friction: 0.92, scaleInOut: true, angularVel: (Math.random() - 0.5) * 0.5 }
      ));
    }
    
    // Outer blast ring
    this.particles.push(new Particle(
      x, y, 0, 0,
      300, 
      color, 
      100,
      'arc',
      { scaleInOut: true }
    ));
  }

  triggerBlackFlash(x: number, y: number) {
    this.hitStopTimer = 250; // Massively extended hit stop
    this.blackFlashTimer = 250;
    this.blackFlashPos = { x, y };
    this.triggerShake(60);
    this.chromaticAberration = 50;
    
    const mult = this.graphicsMode === 'HIGH' ? 5 : 1;
    
    // Black & Red extreme explosion
    for (let i = 0; i < 80 * mult; i++) {
      this.particles.push(new Particle(
        x, y, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100,
        600 + Math.random() * 500, 
        Math.random() > 0.6 ? '#000000' : '#ff0000', 
        10 + Math.random() * 30,
        'rect',
        { friction: 0.85, scaleInOut: true, angularVel: (Math.random() - 0.5) * 1.5, flicker: true }
      ));
    }
    
    // Massive spreading ring
    this.particles.push(new Particle(
        x, y, 0, 0,
        500, 
        '#000000', 
        300,
        'arc',
        { scaleInOut: true, flicker: true }
    ));
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

    if (this.globalImpactFrameTimer > 0) {
      this.globalImpactFrameTimer -= dt;
    }
    if (this.blackFlashTimer > 0) {
      this.blackFlashTimer -= dt;
    }
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
    }

    const mouseJustPressed = this.input.mouse.isDown && !this.lastMouseDown;
    const mouseJustReleased = !this.input.mouse.isDown && this.lastMouseDown;
    this.lastMouseDown = this.input.mouse.isDown;

    // Domain Expansion Input (Player)
    const playerDomainCost = this.player.characterType === 'Gojo' ? 75 : (this.player.characterType === 'Megumi' ? 90 : (this.player.characterType === 'Yuji' ? 80 : C_COST));
    const canPlayerActivateDomain = (!this.domainManager.active || this.domainManager.type !== 'Yuji') && 
      !(this.player.characterType === 'Hakari' && this.player.infiniteCeTimer > 0) &&
      !(this.player.characterType === 'Megumi' && this.player.hasSpawnedMahoraga);
    if (this.input.isKeyDown('c') && this.player.energy >= playerDomainCost && this.player.cooldowns.c <= 0 && canPlayerActivateDomain) {
      if (this.player.characterType === 'Megumi') {
        this.player.energy -= 90;
        this.player.cooldowns.c = 2000;
        this.player.hasSpawnedMahoraga = true;
        this.mahoraga = handleMegumiSummonMahoraga(this.player, this.abonant);
        this.chromaticAberration = 8;
        this.triggerShake(14);
      } else {
        this.player.energy -= playerDomainCost;
        this.player.cooldowns.c = 1000; // 1s cooldown to prevent double taps
        this.domainManager.activate(this.player.id, this.player.characterType);
        this.chromaticAberration = 10;
        this.triggerShake(10);
        soundManager.playDomainActivation();
        if (this.player.characterType === 'Yuji') {
          soundManager.playBoxingBell();
        }
      }
    }

    // Domain Expansion (Abonant)
    const abonantDomainCost = this.abonant.characterType === 'Gojo' ? 75 : (this.abonant.characterType === 'Megumi' ? 90 : (this.abonant.characterType === 'Yuji' ? 80 : C_COST));
    const canAbonantActivateDomain = (!this.domainManager.active || this.domainManager.type !== 'Yuji') && 
      !(this.abonant.characterType === 'Hakari' && this.abonant.infiniteCeTimer > 0) &&
      !(this.abonant.characterType === 'Megumi' && this.abonant.hasSpawnedMahoraga);
    if (this.abonant.state === 'DOMAIN' && this.abonant.energy >= abonantDomainCost && this.abonant.cooldowns.c <= 0 && canAbonantActivateDomain) {
      if (this.abonant.characterType === 'Megumi') {
        this.abonant.energy -= 90;
        this.abonant.cooldowns.c = 2000;
        this.abonant.hasSpawnedMahoraga = true;
        this.mahoraga = handleMegumiSummonMahoraga(this.abonant, this.player);
        this.chromaticAberration = 8;
        this.triggerShake(14);
      } else {
        this.abonant.energy -= abonantDomainCost;
        this.abonant.cooldowns.c = 1000; // 1s cooldown
        this.domainManager.activate(this.abonant.id, this.abonant.characterType);
        this.chromaticAberration = 10;
        this.triggerShake(10);
        soundManager.playDomainActivation();
        if (this.abonant.characterType === 'Yuji') {
          soundManager.playBoxingBell();
        }
      }
      this.abonant.state = 'IDLE';
    }

    const wasDomainActive = this.domainManager.active;
    const currentDomainType = this.domainManager.type;
    const currentDomainOwner = this.domainManager.ownerId;
    this.domainManager.update(dt, this.particles);
    const isDomainActive = this.domainManager.active;

    // Apply 5s (5000ms) burnout cooldown when any domain ends
    if (wasDomainActive && !isDomainActive) {
      this.player.cooldowns.c = 5000;
      this.abonant.cooldowns.c = 5000;
      // Add a visual burnout indication (gray screen flash or screen shake)
      this.triggerShake(5);
    }

    // Mahoraga Summon AI & Physics Loop
    if (this.mahoraga && this.mahoraga.active) {
      const mTarget = this.mahoraga.ownerId === this.player.id ? this.abonant : this.player;
      this.mahoraga.update(dt, this.groundY, mTarget, this.particles, this.projectiles, (x, y) => {
        this.triggerShake(20);
        this.chromaticAberration = 15;
      });
    }

    // Domain Activation Burst
    if (!wasDomainActive && isDomainActive) {
      this.triggerShake(40); // Massive shake
      this.chromaticAberration = 40; // Heavy chromatic aberration
      this.globalImpactFrameTimer = 150; // 150ms of global impact frames
      const mult = this.graphicsMode === 'HIGH' ? 6 : 1;
      
      const owner = currentDomainOwner === this.player.id ? this.player : this.abonant;
      const tX = owner.pos.x + owner.width/2;
      const tY = owner.pos.y + owner.height/2;

      let primaryColor = '#ffffff';
      let secondaryColor = '#888888';
      
      if (currentDomainType === 'Sukuna') {
        primaryColor = '#ff0000'; secondaryColor = '#000000';
      } else if (currentDomainType === 'Gojo') {
        primaryColor = '#8a2be2'; secondaryColor = '#0000ff';
      } else if (currentDomainType === 'Hakari') {
        primaryColor = '#ff1493'; secondaryColor = '#00ffff';
      } else if (currentDomainType === 'Megumi') {
        primaryColor = '#00008b'; secondaryColor = '#101020';
      } else if (currentDomainType === 'Yuji') {
        primaryColor = '#f1c40f'; secondaryColor = '#8b0000';
      }

      // Shockwave ring explosion
      for(let i=0; i<80 * mult; i++) {
        const angle = (Math.PI * 2 / (80 * mult)) * i;
        const speed = 25 + Math.random() * 15;
        this.particles.push(new Particle(
          tX, tY,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          800 + Math.random() * 400, primaryColor, 8 + Math.random() * 12
        ));
      }

      // Lingering thick smoke / dust ("blue smoke" feeling but themed to character)
      for(let i=0; i<150 * mult; i++) {
        this.particles.push(new Particle(
          tX + (Math.random() - 0.5) * 400, 
          tY + (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 10, -Math.random() * 15, // Float upwards
          2000 + Math.random() * 1500, // Lingers for a long time
          Math.random() > 0.5 ? primaryColor : secondaryColor, 
          15 + Math.random() * 30 // Immense size
        ));
      }
    }

    // Hakari Domain Logic
    if (isDomainActive && currentDomainType === 'Hakari') {
      if (this.domainManager.hakariState === 'jackpot') {
        const owner = currentDomainOwner === this.player.id ? this.player : this.abonant;
        const target = currentDomainOwner === this.player.id ? this.abonant : this.player;
        
        if (this.domainManager.hakariBuff === 'infinite_ce') {
          owner.infiniteCeTimer = 10000; // 10s
        } else if (this.domainManager.hakariBuff === 'invulnerable') {
          owner.invulnerableTimer = 15000; // 15s
        } else if (this.domainManager.hakariBuff === 'mimicry') {
          owner.mimicryTarget = target.characterType;
          owner.color = target.color;
          target.qDisabled = true;
        }
      }
    }

    // Dash Trails
    if (this.graphicsMode === 'HIGH') {
      [this.player, this.abonant].forEach(entity => {
        if (entity.isDashing && Math.random() > 0.3) {
          let color = entity.color;
          if (entity.characterType === 'Hakari') {
            color = Math.random() > 0.5 ? '#00ffff' : '#ffff00';
          }
          this.particles.push(new Particle(entity.pos.x + entity.width/2, entity.pos.y + entity.height/2, 0, 0, 200, color, 8));
        }
      });

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
        currentDomainOwner === this.player.id && this.input.isKeyDown('e'),
        this.domainManager.sukunaOmniCleaveTimer,
        (val) => { this.domainManager.sukunaOmniCleaveTimer = val; },
        this.domainManager.sukunaOmniCleaveCount,
        (val) => { this.domainManager.sukunaOmniCleaveCount = val; },
        this.projectiles,
        (val) => this.triggerShake(val),
        (val) => { this.domainManager.impactFrameTimer = val; },
        () => soundManager.playSlash()
      );
    }

    const isHakariFrozen = isDomainActive && currentDomainType === 'Hakari' && (this.domainManager.hakariState === 'rolling' || this.domainManager.hakariState === 'jackpot');

    if (!(isDomainActive && currentDomainType === 'Gojo') && !isHakariFrozen) {
      const playerStats = this.player.update(
        dt, 
        this.groundY, 
        this.projectiles, 
        this.particles, 
        () => this.triggerShake(5), 
        isDomainActive && currentDomainType === 'Yuji' && currentDomainOwner === this.player.id, 
        isDomainActive && currentDomainType === 'Megumi', 
        isDomainActive && currentDomainType === 'Sukuna' && currentDomainOwner === this.player.id, 
        this.abonant,
        this.activeBeams,
        this.visualSlashes
      );
      
      const abonantStats = this.abonant.update(
        dt, 
        this.groundY, 
        this.player, 
        this.projectiles, 
        this.particles, 
        () => this.triggerShake(5), 
        isDomainActive && currentDomainType === 'Sukuna' && currentDomainOwner === this.abonant.id, 
        isDomainActive && currentDomainType === 'Yuji' && currentDomainOwner === this.abonant.id, 
        isDomainActive && currentDomainType === 'Megumi',
        isDomainActive && currentDomainOwner === this.player.id, // isEnemyDomainActive
        this.activeBeams,
        this.visualSlashes
      );

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
        
        // Megumi Q Tether Logic
        if (anyEntity.qTether) {
          anyEntity.qTether.timer -= dt;
          const dx = anyEntity.qTether.x - entity.pos.x;
          const dy = anyEntity.qTether.y - entity.pos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (anyEntity.qTether.timer <= 0 || dist < 30) {
            anyEntity.qTetherTrap = { x: anyEntity.qTether.x, y: anyEntity.qTether.y, armed: false };
            anyEntity.qTether = null;
          } else {
            // Strong pull towards the tether point
            entity.vel.x += (dx / dist) * 2.5;
            entity.vel.y += (dy / dist) * 2.5;
          }
        }

        // Megumi Q Tether Trap Logic
        if (anyEntity.qTetherTrap) {
          const dx = anyEntity.qTetherTrap.x - entity.pos.x;
          const dy = anyEntity.qTetherTrap.y - entity.pos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (!anyEntity.qTetherTrap.armed) {
            if (dist > 50) {
              anyEntity.qTetherTrap.armed = true;
            }
          } else {
            if (dist < 30) {
              if (entity.takeDamage(5, isDomainActive, currentDomainType, currentDomainOwner)) {
                this.triggerHitSpark(entity.pos.x + entity.width/2, entity.pos.y + entity.height/2, '#00008b');
              }
              anyEntity.qTetherTrap = null;
            }
          }
        }

        // Hakari Q Shadow Anchor Logic
        if (anyEntity.shadowAnchor) {
          anyEntity.shadowAnchor.timer -= dt;
          const dx = anyEntity.shadowAnchor.x - entity.pos.x;
          const dy = anyEntity.shadowAnchor.y - entity.pos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (anyEntity.shadowAnchor.timer <= 0) {
            anyEntity.shadowAnchor = null;
          } else if (dist > 100) { // Rubber band effect if they go too far
            entity.vel.x += (dx / dist) * 3.0;
            entity.vel.y += (dy / dist) * 3.0;
          }
        }
      });
      
      if (playerStats?.didSecondaryHit || playerStats?.didBleedHit) {
        this.spawnVisualSlash(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2, '#ff0000');
        this.triggerShake(5);
      }
      if (abonantStats?.didSecondaryHit || abonantStats?.didBleedHit) {
        this.spawnVisualSlash(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2, '#ff0000');
        this.triggerShake(5);
      }
    }

    // Update Beams (e.g. Yuji Domain Laser E)
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      beam.timer -= dt;
      if (beam.timer <= 0) {
        this.activeBeams.splice(i, 1);
      }
    }

    // Yuji Domain Ghost Replica Dash Triggering
    if (isDomainActive && currentDomainType === 'Yuji') {
      const yujiEntity = currentDomainOwner === this.player.id ? this.player : this.abonant;
      const targetEntity = currentDomainOwner === this.player.id ? this.abonant : this.player;

      if (yujiEntity.characterType === 'Yuji' || yujiEntity.mimicryTarget === 'Yuji') {
        const isDashingNow = yujiEntity.isDashing || yujiEntity.phaseTimer > 0;
        if (isDashingNow) {
          if (this.checkCollision(yujiEntity.getRect(), targetEntity.getRect())) {
            if (!(yujiEntity as any).hasTriggeredYujiGhostDash) {
              (yujiEntity as any).hasTriggeredYujiGhostDash = true;

              this.pendingYujiGhostDashes.push({
                ownerId: yujiEntity.id,
                targetId: targetEntity.id,
                delayTimer: 1000, // 1 second gap!
                initialFacingRight: yujiEntity.facingRight,
                phase: 'WAITING',
                dashTimer: 250,
                ghostPos: { x: targetEntity.pos.x + (yujiEntity.facingRight ? 200 : -200), y: targetEntity.pos.y },
                ghostVel: { x: yujiEntity.facingRight ? -35 : 35, y: 0 },
                hasHit: false
              });
            }
          }
        } else {
          (yujiEntity as any).hasTriggeredYujiGhostDash = false;
        }
      }
    }

    // Update Pending Yuji Domain Ghost Dashes
    for (let i = this.pendingYujiGhostDashes.length - 1; i >= 0; i--) {
      const ghost = this.pendingYujiGhostDashes[i];
      const target = ghost.targetId === this.player.id ? this.player : this.abonant;
      const owner = ghost.ownerId === this.player.id ? this.player : this.abonant;

      if (ghost.phase === 'WAITING') {
        ghost.delayTimer -= dt;
        if (ghost.delayTimer <= 0) {
          ghost.phase = 'DASHING';
          ghost.dashTimer = 250;
          const ghostFacingRight = !ghost.initialFacingRight;
          ghost.ghostPos = {
            x: target.pos.x + (ghostFacingRight ? -250 : 250),
            y: target.pos.y
          };
          ghost.ghostVel = {
            x: ghostFacingRight ? 45 : -45,
            y: 0
          };
          soundManager.playDash();
        }
      } else if (ghost.phase === 'DASHING') {
        ghost.dashTimer -= dt;
        ghost.ghostPos.x += ghost.ghostVel.x * (dt / 16.66);

        // Ghost trail particles
        if (Math.random() > 0.2) {
          this.particles.push(new Particle(
            ghost.ghostPos.x + 20, ghost.ghostPos.y + 40,
            (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10,
            300, '#ff1744', 12, 'line'
          ));
        }

        // 100% sure to hit target!
        const ghostRect = { x: ghost.ghostPos.x, y: ghost.ghostPos.y, width: 40, height: 80 };
        if (!ghost.hasHit && (this.checkCollision(ghostRect, target.getRect()) || ghost.dashTimer < 125)) {
          ghost.hasHit = true;
          
          const damage = 25;
          target.hp -= damage; // Direct 100% sure hit bypassing phase/invuln
          owner.energy = Math.min(100, owner.energy + 5);
          owner.hp = Math.min(owner.maxHp, owner.hp + damage * 0.2);

          this.triggerBlackFlash(target.pos.x + target.width / 2, target.pos.y + target.height / 2);
          this.triggerShake(12);
          soundManager.playSlash();
        }

        if (ghost.dashTimer <= 0) {
          this.pendingYujiGhostDashes.splice(i, 1);
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.particles);
      
      // Blue Pull Logic
      if ((p.characterType === 'Gojo' && p.abilityType === 'E') || (p.characterType === 'Hakari' && p.variant === 'pull')) {
        const target = p.ownerId === this.player.id ? this.abonant : this.player;
        const dx = p.pos.x + p.width/2 - (target.pos.x + target.width/2);
        const dy = p.pos.y + p.height/2 - (target.pos.y + target.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 250) { // Pull radius
          const pullStrength = 0.375; // 25% of 1.5
          target.vel.x += (dx / dist) * pullStrength;
          target.vel.y += (dy / dist) * pullStrength;
          
          // Visual pull effect
          if (Math.random() > 0.7) {
            this.particles.push(new Particle(target.pos.x + target.width/2, target.pos.y + target.height/2, (dx/dist)*5, (dy/dist)*5, 200, p.color, 3));
          }
        }
      }
      
      // Elephant Ground Collision
      if (p.variant === 'elephant' && p.pos.y + p.height > this.groundY) {
        p.active = false;
        this.triggerHitSpark(p.pos.x + p.width/2, this.groundY, p.color);
        this.triggerShake(15);
        
        const target = p.ownerId === this.player.id ? this.abonant : this.player;
        const dist = Math.abs((p.pos.x + p.width/2) - (target.pos.x + target.width/2));
        if (dist < 150) {
          target.takeDamage(15, isDomainActive, currentDomainType, currentDomainOwner);
          target.stunTimer = 500;
        }
      }
      
      // Collision with entities
      const pRect = p.getRect();
      if (p.ownerId !== this.player.id && this.checkCollision(pRect, this.player.getRect())) {
        let damage = E_DMG + p.damageOverride;
        if (p.abilityType === 'Q') damage = Q_DMG + p.damageOverride;

        if (p.characterType === 'Sukuna') {
          if (p.abilityType === 'E' || p.abilityType === 'DOMAIN_E' || p.variant === 'omni_cleave') {
            damage = (4 + p.damageOverride) / 3;
            if (isDomainActive && this.domainManager.type === 'Sukuna' && this.domainManager.ownerId === p.ownerId) {
              damage *= 0.4; // Reduced by another 50% in domain (0.8 * 0.5 = 0.4)
            }
          } else if (p.abilityType === 'Q' || p.variant === 'world_slash') {
            damage = Q_DMG + p.damageOverride;
            if (isDomainActive && this.domainManager.type === 'Sukuna' && this.domainManager.ownerId === p.ownerId) {
              damage *= 0.8; // Reduce Q damage by 20% in domain
            }
          }
        }

        if (p.characterType === 'Megumi') damage -= 3;
        if (p.variant === 'elephant') damage = 15;
        
        if (this.player.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
          this.abonant.energy += 3; 
          this.abonant.hp = Math.min(this.abonant.maxHp, this.abonant.hp + damage * 0.2); // 20% Lifesteal
          
          if (p.characterType === 'Yuji' && p.abilityType === 'E') {
            this.abonant.yujiEComboTimer = 200; // 200ms window for Black Flash
          }
          
          if (p.variant === 'elephant') {
            this.player.stunTimer = 500;
            this.triggerShake(15);
          } else if (p.variant === 'world_slash') {
            this.player.stunTimer = 250;
            this.triggerShake(20);
          } else {
            this.applyAbilityEffects(this.player, p.characterType, p.abilityType, this.abonant);
          }
          
          // Yuji Knockback (2x)
          if (p.characterType === 'Yuji') {
            this.player.vel.y = -10; // Reduced upward pop
            this.player.vel.x = p.vel.x > 0 ? 45 : -45; // Increased backward pop
            this.triggerHitSpark(p.pos.x, p.pos.y, '#f1c40f');
          }
          
          // Hakari E Knockback
          if (p.characterType === 'Hakari' && p.variant === 'knockback') {
            this.player.vel.y = -10;
            this.player.vel.x = p.vel.x > 0 ? 45 : -45;
            this.triggerHitSpark(p.pos.x, p.pos.y, '#ff1493');
          }
          
          // VFX Triggers
          if (p.characterType === 'Gojo') {
            this.triggerWhiteVoid(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Sukuna') {
            this.triggerSlashOverlay(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Yuji') {
            this.triggerYujiBurst(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Megumi') {
            this.triggerMegumiShadowBurst(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Hakari') {
            this.triggerHakariJackpotBurst(p.pos.x, p.pos.y);
          }

          p.active = false;
        }
      } else if (p.ownerId !== this.abonant.id && this.checkCollision(pRect, this.abonant.getRect())) {
        let damage = E_DMG + p.damageOverride;
        if (p.abilityType === 'Q') damage = Q_DMG + p.damageOverride;

        if (p.characterType === 'Sukuna') {
          if (p.abilityType === 'E' || p.abilityType === 'DOMAIN_E' || p.variant === 'omni_cleave') {
            damage = (4 + p.damageOverride) / 3;
            if (isDomainActive && this.domainManager.type === 'Sukuna' && this.domainManager.ownerId === p.ownerId) {
              damage *= 0.4; // Reduced by another 50% in domain (0.8 * 0.5 = 0.4)
            }
          } else if (p.abilityType === 'Q' || p.variant === 'world_slash') {
            damage = Q_DMG + p.damageOverride;
            if (isDomainActive && this.domainManager.type === 'Sukuna' && this.domainManager.ownerId === p.ownerId) {
              damage *= 0.8; // Reduce Q damage by 20% in domain
            }
          }
        }

        if (p.characterType === 'Megumi') damage -= 3;
        if (p.variant === 'elephant') damage = 15;
        
        if (p.ownerId === this.player.id && isDomainActive && this.domainManager.type === 'Yuji') {
          damage *= 1.5;
        }
        if (this.abonant.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
          this.player.energy += 3;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + damage * 0.2); // 20% Lifesteal
          
          if (p.characterType === 'Yuji' && p.abilityType === 'E') {
            this.player.yujiEComboTimer = 200; // 200ms window for Black Flash
          }
          
          if (p.variant === 'elephant') {
            this.abonant.stunTimer = 500;
            this.triggerShake(15);
          } else if (p.variant === 'world_slash') {
            this.abonant.stunTimer = 250;
            this.triggerShake(20);
          } else {
            this.applyAbilityEffects(this.abonant, p.characterType, p.abilityType, this.player);
          }
          
          // Yuji Knockback (2x)
          if (p.characterType === 'Yuji') {
            this.abonant.vel.y = -10; // Reduced upward pop
            this.abonant.vel.x = p.vel.x > 0 ? 45 : -45; // Increased backward pop
            this.triggerHitSpark(p.pos.x, p.pos.y, '#f1c40f');
          }

          // Hakari E Knockback
          if (p.characterType === 'Hakari' && p.variant === 'knockback') {
            this.abonant.vel.y = -10;
            this.abonant.vel.x = p.vel.x > 0 ? 45 : -45;
            this.triggerHitSpark(p.pos.x, p.pos.y, '#ff1493');
          }

          // VFX Triggers
          if (p.characterType === 'Gojo') {
            this.triggerWhiteVoid(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Sukuna') {
            this.triggerSlashOverlay(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Yuji') {
            this.triggerYujiBurst(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Megumi') {
            this.triggerMegumiShadowBurst(p.pos.x, p.pos.y);
          } else if (p.characterType === 'Hakari') {
            this.triggerHakariJackpotBurst(p.pos.x, p.pos.y);
          }

          p.active = false;
        }
      }

      // Projectile Collision with Mahoraga
      if (this.mahoraga && this.mahoraga.active && this.mahoraga.state !== 'dead' && this.mahoraga.state !== 'spawning') {
        if (p.ownerId !== this.mahoraga.ownerId && this.checkCollision(pRect, this.mahoraga.getRect())) {
          let damage = E_DMG + p.damageOverride;
          if (p.abilityType === 'Q') damage = Q_DMG + p.damageOverride;
          this.mahoraga.takeDamage(damage, this.particles);
          this.triggerHitSpark(p.pos.x + p.width / 2, p.pos.y + p.height / 2, '#ffd700');
          p.active = false;
        }
      }
      
      if (!p.active || p.pos.x < 0 || p.pos.x > this.worldWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    // Melee Collision (Q Dash)
    if (this.player.phaseTimer > 0 && !this.player.hasHitDash && this.checkCollision(this.player.getRect(), this.abonant.getRect())) {
      let damage = (isDomainActive && this.domainManager.type === 'Yuji' && (this.player.characterType === 'Yuji' || this.player.mimicryTarget === 'Yuji')) ? Q_DMG * 0.8 : Q_DMG;
      if (this.player.characterType === 'Megumi') damage -= 3;
      
      let isBlackFlash = false;
      if (this.player.characterType === 'Yuji' && this.player.yujiEComboTimer > 0) {
        isBlackFlash = true;
        damage *= 3;
      }
      
      if (this.abonant.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
        this.player.energy += 5;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + damage * 0.2); // 20% Lifesteal
        this.applyAbilityEffects(this.abonant, this.player.characterType, 'Q', this.player);
        
        if (isBlackFlash) {
          this.triggerBlackFlash(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2);
        }
        
        // Hakari Q Knockback
        if ((this.abonant as any).hakariQKnockback) {
          (this.abonant as any).hakariQKnockback = false;
          this.abonant.vel.y = -10;
          this.abonant.vel.x = this.player.vel.x > 0 ? 45 : -45;
        }
        
        this.player.hasHitDash = true;
        this.triggerHitSpark(this.abonant.pos.x + this.abonant.width/2, this.abonant.pos.y + this.abonant.height/2, this.player.color);
        if (!isBlackFlash) {
          this.triggerShake(8);
          this.globalImpactFrameTimer = 50;
        }
      }
    }
    if (this.abonant.phaseTimer > 0 && !this.abonant.hasHitDash && this.checkCollision(this.abonant.getRect(), this.player.getRect())) {
      let damage = (isDomainActive && this.domainManager.type === 'Yuji' && (this.abonant.characterType === 'Yuji' || this.abonant.mimicryTarget === 'Yuji')) ? Q_DMG * 0.8 : Q_DMG;
      if (this.abonant.characterType === 'Megumi') damage -= 3;
      
      let isBlackFlash = false;
      if (this.abonant.characterType === 'Yuji' && this.abonant.yujiEComboTimer > 0) {
        isBlackFlash = true;
        damage *= 3;
      }
      
      if (this.player.takeDamage(damage, isDomainActive, this.domainManager.type, this.domainManager.ownerId)) {
        this.abonant.energy += 5;
        this.abonant.hp = Math.min(this.abonant.maxHp, this.abonant.hp + damage * 0.2); // 20% Lifesteal
        this.applyAbilityEffects(this.player, this.abonant.characterType, 'Q', this.abonant);
        
        if (isBlackFlash) {
          this.triggerBlackFlash(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2);
        }
        
        // Hakari Q Knockback
        if ((this.player as any).hakariQKnockback) {
          (this.player as any).hakariQKnockback = false;
          this.player.vel.y = -10;
          this.player.vel.x = this.abonant.vel.x > 0 ? 45 : -45;
        }
        
        this.abonant.hasHitDash = true;
        this.triggerHitSpark(this.player.pos.x + this.player.width/2, this.player.pos.y + this.player.height/2, this.abonant.color);
        if (!isBlackFlash) {
          this.triggerShake(8);
          this.globalImpactFrameTimer = 50;
        }
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
        this.triggerDismantle(this.abonant);
      } else if (this.player.hp <= 0) {
        this.gameOver = true;
        this.winner = 'abonant';
        this.slowMoTimer = 2000;
        this.triggerDismantle(this.player);
      }
    }
  }

  triggerDismantle(entity: Entity) {
    if (entity.isDismantled) return;
    entity.isDismantled = true;
    this.triggerShake(20);
    
    const mult = this.graphicsMode === 'HIGH' ? 3 : 1;
    for (let i = 0; i < 40 * mult; i++) {
      const p = new Particle(
        entity.pos.x + Math.random() * entity.width,
        entity.pos.y + Math.random() * entity.height,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30 - 10,
        1000 + Math.random() * 1000,
        entity.color,
        10 + Math.random() * 15
      );
      p.shape = 'rect'; // Force rectangular chunks
      p.hasGravity = true;
      this.particles.push(p);
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
    
    // Black Flash Impact Frames
    if (this.blackFlashTimer > 0) {
      this.ctx.save();
      const colors = ['#000000', '#ff0000'];
      const color = colors[Math.floor(this.blackFlashTimer / 16) % colors.length];
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
    if (!this.player.isDismantled) {
      this.player.draw(this.ctx, this.camera);
    }
    this.ctx.shadowBlur = 0;
    
    if (!this.abonant.isDismantled) {
      this.abonant.draw(this.ctx, this.camera);
    }

    // Draw Tracking Diamonds
    this.ctx.save();
    
    // Player Diamond (Blue)
    if (!this.player.isDismantled) {
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
    }

    // Abonant Diamond (Red)
    if (!this.abonant.isDismantled) {
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
    }

    this.ctx.restore();
    
    for (const p of this.projectiles) {
      if (p.variant === 'elephant') {
        const x = p.pos.x - this.camera.x;
        const y = p.pos.y - this.camera.y;
        this.ctx.fillStyle = '#4682b4'; // Steel blue
        this.ctx.fillRect(x, y, p.width, p.height);
        // Details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x - 10, y + p.height - 20, 15, 5); // Tusk L
        this.ctx.fillRect(x + p.width - 5, y + p.height - 20, 15, 5); // Tusk R
        this.ctx.fillStyle = '#2f4f4f';
        this.ctx.fillRect(x + p.width/2 - 10, y + p.height, 20, 40); // Trunk
      } else if (p.variant === 'fuga') {
        const x = p.pos.x - this.camera.x;
        const y = p.pos.y - this.camera.y;
        this.ctx.fillStyle = '#ff4500';
        this.ctx.beginPath();
        if (p.vel.x > 0) {
          this.ctx.moveTo(x, y + p.height/2);
          this.ctx.lineTo(x + p.width, y);
          this.ctx.lineTo(x + p.width, y + p.height);
        } else {
          this.ctx.moveTo(x + p.width, y + p.height/2);
          this.ctx.lineTo(x, y);
          this.ctx.lineTo(x, y + p.height);
        }
        this.ctx.fill();
        
        if (Math.random() > 0.2) {
          this.particles.push(new Particle(p.pos.x + Math.random()*p.width, p.pos.y + Math.random()*p.height, (Math.random()-0.5)*2, -Math.random()*2, 300, '#ff8c00', 4));
        }
      } else {
        p.draw(this.ctx, this.camera);
      }
    }
    for (const p of this.particles) p.draw(this.ctx, this.camera);

    // Draw Mahoraga Entity (Summoned by Megumi)
    if (this.mahoraga && this.mahoraga.active) {
      this.mahoraga.draw(this.ctx, this.camera);
    }

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
      
      if (anyEntity.qTether) {
        const startX = entity.pos.x + entity.width/2 - this.camera.x;
        const startY = entity.pos.y + entity.height/2 - this.camera.y;
        const endX = anyEntity.qTether.x - this.camera.x;
        const endY = anyEntity.qTether.y - this.camera.y;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // White band for Q
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw anchor point
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 5, 0, Math.PI*2);
        this.ctx.fill();
      }

      if (anyEntity.qTetherTrap) {
        const trapX = anyEntity.qTetherTrap.x - this.camera.x;
        const trapY = anyEntity.qTetherTrap.y - this.camera.y;
        
        // Draw trap mark on the ground
        this.ctx.fillStyle = anyEntity.qTetherTrap.armed ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(trapX, trapY, 15, 5, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(trapX, trapY, 15, 5, 0, 0, Math.PI*2);
        this.ctx.stroke();
      }

      if (anyEntity.shadowAnchor) {
        const startX = entity.pos.x + entity.width/2 - this.camera.x;
        const startY = entity.pos.y + entity.height/2 - this.camera.y;
        const endX = anyEntity.shadowAnchor.x - this.camera.x;
        const endY = anyEntity.shadowAnchor.y - this.camera.y;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan band for Hakari Q
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw anchor point
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 5, 0, Math.PI*2);
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
        const radius = 30 + 150 * progress;
        
        const x = vec.start.x - this.camera.x;
        const y = vec.start.y - this.camera.y;
        const time = performance.now() / 150;

        this.ctx.save();
        
        // Massive Outer Gravity Void Pulse
        const outerPulse = radius * (1.2 + Math.sin(time * 2) * 0.08);
        const outerGrad = this.ctx.createRadialGradient(x, y, radius * 0.2, x, y, outerPulse);
        outerGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        outerGrad.addColorStop(0.5, 'rgba(126, 34, 206, 0.25)');
        outerGrad.addColorStop(0.85, 'rgba(59, 7, 100, 0.15)');
        outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = outerGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerPulse, 0, Math.PI * 2);
        this.ctx.fill();

        // High Intensity Energy Bloom
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = '#c084fc';
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.15, '#e879f9');
        grad.addColorStop(0.4, '#a855f7');
        grad.addColorStop(0.75, 'rgba(88, 28, 135, 0.85)');
        grad.addColorStop(1, 'rgba(30, 0, 60, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pure Absolute Singularity Core (Black Hole with White corona)
        this.ctx.fillStyle = '#05010a';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 4 Multi-layered Hyper-fast Orbital Accretion Rings
        for (let j = 0; j < 4; j++) {
          this.ctx.beginPath();
          const angleOffset = (Math.PI * 2 / 4) * j + (j % 2 === 0 ? time * 1.8 : -time * 1.4);
          this.ctx.strokeStyle = j % 2 === 0 ? 'rgba(232, 121, 249, 0.9)' : 'rgba(56, 189, 248, 0.9)';
          this.ctx.lineWidth = 3.5;
          this.ctx.arc(x, y, radius * (0.45 + j * 0.15), angleOffset, angleOffset + Math.PI * 0.7);
          this.ctx.stroke();
        }

        // Crackling Purple/Cyan Singularity Lightning Tendrils
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#f0abfc';
        for (let l = 0; l < 5; l++) {
          const lAngle = (Math.PI * 2 / 5) * l + time * 0.8;
          const lDist = radius * (0.5 + ((l * 17) % 5) * 0.1);
          const midDist = lDist * 0.6;
          const mx = x + Math.cos(lAngle + 0.3) * midDist;
          const my = y + Math.sin(lAngle + 0.3) * midDist;
          const ex = x + Math.cos(lAngle) * lDist;
          const ey = y + Math.sin(lAngle) * lDist;

          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(mx, my);
          this.ctx.lineTo(ex, ey);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      }
    }

    for (const hp of this.activeHollowPurples) {
      this.ctx.save();
      const x = hp.pos.x - this.camera.x;
      const y = hp.pos.y - this.camera.y;
      const radius = hp.radius;
      const time = performance.now() / 120;

      // 1. Huge Spatial Distortion Outer Glow
      const pulseRadius = radius * (1.25 + Math.sin(time * 2.5) * 0.08);
      const outerGrad = this.ctx.createRadialGradient(x, y, radius * 0.2, x, y, pulseRadius);
      outerGrad.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
      outerGrad.addColorStop(0.45, 'rgba(126, 34, 206, 0.3)');
      outerGrad.addColorStop(0.8, 'rgba(59, 7, 100, 0.15)');
      outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = outerGrad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. High-energy Vibrant Core Body
      this.ctx.shadowBlur = 45;
      this.ctx.shadowColor = '#c084fc';
      const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.18, '#f472b6');
      grad.addColorStop(0.42, '#9333ea');
      grad.addColorStop(0.78, 'rgba(76, 29, 149, 0.9)');
      grad.addColorStop(1, 'rgba(20, 0, 45, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 3. Absolute Void Singularity Core (Pitch Black Hole + Crisp Edge)
      this.ctx.fillStyle = '#05000a';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.38, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3.5;
      this.ctx.stroke();

      // 4. Violent Swirling Accretion Arcs (Dual Red + Blue merged into Purple)
      for (let j = 0; j < 5; j++) {
        this.ctx.beginPath();
        const angleOffset = (Math.PI * 2 / 5) * j + (j % 2 === 0 ? time * 2.2 : -time * 1.8);
        this.ctx.strokeStyle = j % 2 === 0 ? 'rgba(244, 114, 182, 0.95)' : 'rgba(56, 189, 248, 0.95)';
        this.ctx.lineWidth = 4;
        this.ctx.arc(x, y, radius * (0.48 + (j % 3) * 0.18), angleOffset, angleOffset + Math.PI * 0.65);
        this.ctx.stroke();
      }

      // 5. Singularity Lightning Arcs
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#ffffff';
      for (let l = 0; l < 6; l++) {
        const lAngle = (Math.PI * 2 / 6) * l + time * 1.1;
        const lDist = radius * (0.55 + ((l * 13) % 4) * 0.12);
        const mx = x + Math.cos(lAngle + 0.25) * (lDist * 0.6);
        const my = y + Math.sin(lAngle + 0.25) * (lDist * 0.6);
        const ex = x + Math.cos(lAngle) * lDist;
        const ey = y + Math.sin(lAngle) * lDist;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(mx, my);
        this.ctx.lineTo(ex, ey);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }

    // Draw Sukuna Slashes
    if (this.domainManager.active && this.domainManager.type === 'Sukuna') {
      // Omni-Directional Cleave projectiles are drawn in the projectile loop
    }

    // Draw Active Beams (e.g. Yuji Domain Laser E)
    for (const beam of this.activeBeams) {
      const sx = beam.start.x - this.camera.x;
      const sy = beam.start.y - this.camera.y;
      const ex = beam.end.x - this.camera.x;
      const ey = beam.end.y - this.camera.y;
      const alpha = Math.max(0, beam.timer / beam.maxTimer);

      this.ctx.save();
      this.ctx.shadowBlur = 25;
      this.ctx.shadowColor = beam.color || '#ff1744';

      this.ctx.strokeStyle = beam.color || '#ff1744';
      this.ctx.lineWidth = 26 * alpha;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 8 * alpha;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Draw Yuji Domain Ghost Replicas
    for (const ghost of this.pendingYujiGhostDashes) {
      if (ghost.phase === 'DASHING') {
        const gx = ghost.ghostPos.x - this.camera.x;
        const gy = ghost.ghostPos.y - this.camera.y;

        this.ctx.save();
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = '#ff1744';

        // Ghost body silhouette
        this.ctx.fillStyle = 'rgba(255, 23, 68, 0.75)';
        this.ctx.fillRect(gx, gy, 40, 80);

        // Golden aura border
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(gx, gy, 40, 80);

        // Glowing Eyes
        this.ctx.fillStyle = '#ffffff';
        const eyeX = ghost.ghostVel.x > 0 ? gx + 28 : gx + 8;
        this.ctx.fillRect(eyeX, gy + 18, 6, 6);

        // Label
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GHOST', gx + 20, gy - 8);

        this.ctx.restore();
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
    this.ctx.translate(this.player.pos.x + this.player.width / 2 - this.camera.x, this.player.pos.y - 40 - Math.sin(Date.now() * 0.005) * 5 - this.camera.y);
    this.ctx.rotate(Math.PI / 4 + Date.now() * 0.001); // 45 degrees + spin
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#3b82f6';
    this.ctx.fillRect(-6, -6, 12, 12);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-2, -2, 4, 4);
    this.ctx.restore();

    // Draw Enemy Diamond Indicator
    this.ctx.save();
    this.ctx.translate(this.abonant.pos.x + this.abonant.width / 2 - this.camera.x, this.abonant.pos.y - 40 - Math.sin(Date.now() * 0.005 + Math.PI) * 5 - this.camera.y);
    this.ctx.rotate(Math.PI / 4 - Date.now() * 0.001); // 45 degrees + reverse spin
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'; // Red
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ef4444';
    this.ctx.fillRect(-6, -6, 12, 12);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-2, -2, 4, 4);
    this.ctx.restore();
  }

  drawCityscape() {
    const { ctx, canvas, camera } = this;
    const time = Date.now() * 0.001;
    
    // Choose theme based on variant
    const themes = [
      { // 0: Midnight Purple
        top: '#02000a', mid: '#0f0a20', bot: '#2c1e40',
        moonGlow: '#8a2be2', moonCenter: '#ffffff', moonCore: '#fcf5d8', moonAura: 'rgba(138, 43, 226, 0.4)',
        cloud: 'rgba(40, 20, 60, 0.4)', bldgFar: '#0a0515', window1: '#ff0044', window2: '#00ffff'
      },
      { // 1: Blood Eclipse
        top: '#050000', mid: '#2a0505', bot: '#500505',
        moonGlow: '#ff0000', moonCenter: '#ffaaaa', moonCore: '#ff2222', moonAura: 'rgba(255, 0, 0, 0.4)',
        cloud: 'rgba(60, 10, 10, 0.5)', bldgFar: '#110202', window1: '#ffdd00', window2: '#ff5500'
      },
      { // 2: Toxic Sludge (Dawn)
        top: '#000500', mid: '#051a0b', bot: '#113a20',
        moonGlow: '#00ff44', moonCenter: '#eaffea', moonCore: '#88ffaa', moonAura: 'rgba(0, 255, 68, 0.3)',
        cloud: 'rgba(10, 40, 20, 0.4)', bldgFar: '#021105', window1: '#ccff00', window2: '#00ff88'
      },
      { // 3: Cold Night
        top: '#000210', mid: '#05112a', bot: '#0f2250',
        moonGlow: '#0088ff', moonCenter: '#ffffff', moonCore: '#aaddff', moonAura: 'rgba(0, 136, 255, 0.4)',
        cloud: 'rgba(15, 30, 60, 0.4)', bldgFar: '#020815', window1: '#ffffff', window2: '#44aaff'
      }
    ];

    const t = themes[this.backgroundVariant] || themes[0];
    
    // Position variance based on variant
    const moonOffsetX = [-250, -400, canvas.width/2 - 200, canvas.width/2 + 200][this.backgroundVariant];
    const moonOffsetY = [200, 150, 250, 100][this.backgroundVariant];

    // Dynamic Sky gradient (changing based on time)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, t.top); // pitch black
    skyGrad.addColorStop(0.5, t.mid); // deep purple void
    skyGrad.addColorStop(1, t.bot); // cursed purple horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ominous Moon with immense glow
    ctx.save();
    const moonX = canvas.width + moonOffsetX - camera.x * 0.02;
    const moonY = moonOffsetY;
    
    ctx.shadowBlur = 100;
    ctx.shadowColor = t.moonGlow;
    
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 150);
    moonGrad.addColorStop(0, t.moonCenter);
    moonGrad.addColorStop(0.2, t.moonCore);
    moonGrad.addColorStop(0.8, t.moonAura);
    moonGrad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant cursed clouds
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = t.cloud;
      const cx = (canvas.width * (c / 5) - time * 10 - camera.x * 0.05 + canvas.width * 10) % canvas.width;
      ctx.beginPath();
      ctx.ellipse(cx, moonOffsetY + 30 + Math.sin(c * 2 + time) * 20, 300, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far Background Buildings (Parallax 0.1)
    ctx.fillStyle = t.bldgFar;
    for (let i = -10; i < 60; i++) {
        const h = 250 + Math.sin(i * 123 + this.backgroundVariant * 11) * 150;
        const w = 120 + Math.cos(i * 321 + this.backgroundVariant * 22) * 80;
        const x = (i * 200) - (camera.x * 0.1);
        ctx.fillRect(x, this.groundY - h, w, h);
    }

    // Midground Buildings (Parallax 0.25)
    for (let i = -10; i < 80; i++) {
      const h = 200 + Math.sin(i * 333 + this.backgroundVariant * 33) * 250;
      const w = 100 + Math.cos(i * 444 + this.backgroundVariant * 44) * 60;
      const x = (i * 150) - (camera.x * 0.25);
      
      // Gradient building faces
      const bGrad = ctx.createLinearGradient(x, this.groundY - h, x, this.groundY);
      bGrad.addColorStop(0, t.mid || '#100a20');
      bGrad.addColorStop(1, '#05020a');
      ctx.fillStyle = bGrad;
      ctx.fillRect(x, this.groundY - h, w, h);
      
      // Ominous windows
      ctx.fillStyle = (i % 3 === 0) ? t.window1 : t.window2;
      if (Math.sin(i * Math.PI) > 0.5) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(x + 20, this.groundY - h + 30, 15, 30);
        ctx.fillRect(x + w - 35, this.groundY - h + 80, 15, 30);
        ctx.shadowBlur = 0;
      }
    }

    // Foreground Concrete Barrier/Fence (Parallax 0.6)
    ctx.fillStyle = '#050505';
    for(let i = -10; i < canvas.width/100 + 10; i++) {
        const x = (i * 200) - (camera.x * 0.6);
        ctx.fillRect(x, this.groundY - 40, 180, 40); // Block
        ctx.fillRect(x + 180, this.groundY - 10, 20, 10); // Gap
    }
    
    // Floor
    const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, canvas.height);
    floorGrad.addColorStop(0, '#1a1025');
    floorGrad.addColorStop(1, '#000000');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, this.groundY, canvas.width, canvas.height - this.groundY);
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
