import { Vector2 } from './Types';

export class Particle {
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'line';

  constructor(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number) {
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.opacity = 1;
    const r = Math.random();
    this.shape = r > 0.6 ? 'line' : (r > 0.3 ? 'circle' : 'rect');
  }

  update(dt: number) {
    this.pos.x += this.vel.x * (dt / 16.66);
    this.pos.y += this.vel.y * (dt / 16.66);
    this.life -= dt;
    this.opacity = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size / 2;
    
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    if (this.shape === 'rect') {
      ctx.fillRect(x, y, this.size, this.size);
    } else if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'line') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - this.vel.x * 2, y - this.vel.y * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}
