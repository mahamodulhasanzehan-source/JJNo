import { Vector2 } from './Types';

export class Particle {
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'line' | 'star' | 'cross' | 'arc' | 'glow';
  hasGravity: boolean = false;
  friction: number = 1;
  rotation: number = 0;
  angularVel: number = 0;
  scaleInOut: boolean = false;
  flicker: boolean = false;

  constructor(
    x: number, 
    y: number, 
    vx: number, 
    vy: number, 
    life: number, 
    color: string, 
    size: number, 
    shape?: 'rect' | 'circle' | 'line' | 'star' | 'cross' | 'arc' | 'glow',
    options?: { gravity?: boolean, friction?: number, angularVel?: number, scaleInOut?: boolean, flicker?: boolean }
  ) {
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.opacity = 1;
    this.rotation = Math.random() * Math.PI * 2;
    
    if (shape) {
      this.shape = shape;
    } else {
      const r = Math.random();
      this.shape = r > 0.8 ? 'star' : (r > 0.6 ? 'circle' : (r > 0.4 ? 'line' : (r > 0.2 ? 'glow' : 'rect')));
    }

    if (options) {
      this.hasGravity = options.gravity || false;
      this.friction = options.friction || 1;
      this.angularVel = options.angularVel || (Math.random() - 0.5) * 0.2;
      this.scaleInOut = options.scaleInOut || false;
      this.flicker = options.flicker || false;
    } else {
      this.angularVel = (Math.random() - 0.5) * 0.2;
    }
  }

  update(dt: number) {
    if (this.hasGravity) {
      this.vel.y += 0.5 * (dt / 16.66);
    }
    this.vel.x *= Math.pow(this.friction, dt / 16.66);
    this.vel.y *= Math.pow(this.friction, dt / 16.66);
    
    this.pos.x += this.vel.x * (dt / 16.66);
    this.pos.y += this.vel.y * (dt / 16.66);
    
    this.rotation += this.angularVel * (dt / 16.66);
    this.life -= dt;
    
    let lifeProgress = this.life / this.maxLife;
    this.opacity = Math.max(0, Math.min(1, lifeProgress));

    if (this.flicker) {
      this.opacity *= Math.random() > 0.1 ? 1 : 0.5;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    
    let drawSize = this.size;
    if (this.scaleInOut) {
      const lifeProgress = 1 - (this.life / this.maxLife);
      // Bell curve scale: starts small, gets big, gets small
      drawSize = this.size * Math.sin(lifeProgress * Math.PI);
    }
    
    ctx.lineWidth = Math.max(1, drawSize / 3);
    
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    if (this.shape === 'rect') {
      ctx.fillRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'line') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Scale length by velocity
      const mag = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      ctx.lineTo(-mag, 0); // draw stretching backward
      ctx.stroke();
    } else if (this.shape === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos(i * 4 * Math.PI / 5) * drawSize, Math.sin(i * 4 * Math.PI / 5) * drawSize);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'cross') {
      ctx.beginPath();
      ctx.moveTo(-drawSize, 0);
      ctx.lineTo(drawSize, 0);
      ctx.moveTo(0, -drawSize);
      ctx.lineTo(0, drawSize);
      ctx.stroke();
    } else if (this.shape === 'arc') {
      ctx.beginPath();
      ctx.arc(0, 0, drawSize, 0, Math.PI);
      ctx.stroke();
    } else if (this.shape === 'glow') {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = drawSize * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, drawSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}
