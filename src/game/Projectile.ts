import { Vector2, Rect, CharacterType } from './Types';
import { Particle } from './Particle';
import { E_DMG } from './Constants';

export class Projectile {
  pos: Vector2;
  vel: Vector2;
  width: number = 20;
  height: number = 20;
  ownerId: string;
  active: boolean = true;
  color: string;
  abilityType: string;
  characterType: CharacterType;
  damageOverride: number;
  sizeOverride: number;
  variant: string;

  constructor(x: number, y: number, vx: number, vy: number, ownerId: string, color: string = '#00ffff', abilityType: string = 'E', characterType: CharacterType = 'Yuji', damageOverride: number = 0, sizeOverride: number = 0, variant: string = 'normal') {
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.width = 20 + sizeOverride;
    this.height = 20 + sizeOverride;
    this.ownerId = ownerId;
    this.color = color;
    this.abilityType = abilityType;
    this.characterType = characterType;
    this.damageOverride = damageOverride;
    this.sizeOverride = sizeOverride;
    this.variant = variant;
  }

  getRect(): Rect {
    return { x: this.pos.x, y: this.pos.y, width: this.width, height: this.height };
  }

  update(dt: number, particles: Particle[]) {
    this.pos.x += this.vel.x * (dt / 16.66);
    this.pos.y += this.vel.y * (dt / 16.66);
    
    // Cursed Trail particles
    if (Math.random() > 0.5) {
      let particleColor = this.color;
      if (this.characterType === 'Yuji') particleColor = '#f1c40f'; // Yellow divergent energy
      if (this.characterType === 'Gojo') particleColor = '#8a2be2'; // Purple aura
      if (this.characterType === 'Sukuna') particleColor = '#e74c3c'; // Crimson aura

      particles.push(new Particle(
        this.pos.x + this.width / 2 + (Math.random() - 0.5) * 10,
        this.pos.y + this.height / 2 + (Math.random() - 0.5) * 10,
        -this.vel.x * 0.2,
        -this.vel.y * 0.2,
        300,
        particleColor,
        3 + Math.random() * 3
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    ctx.save();
    if (this.variant === 'elephant') {
      ctx.fillStyle = '#4682b4'; // Steel blue
      ctx.fillRect(x, y, this.width, this.height);
      // Details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 10, y + this.height - 20, 15, 5); // Tusk L
      ctx.fillRect(x + this.width - 5, y + this.height - 20, 15, 5); // Tusk R
      ctx.fillStyle = '#2f4f4f';
      ctx.fillRect(x + this.width/2 - 10, y + this.height, 20, 40); // Trunk
    } else if (this.variant === 'fuga') {
      ctx.fillStyle = '#ff4500';
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      if (this.vel.x > 0) {
        ctx.moveTo(x, y + this.height/2);
        ctx.lineTo(x + this.width, y);
        ctx.lineTo(x + this.width + 20, y + this.height/2);
        ctx.lineTo(x + this.width, y + this.height);
      } else {
        ctx.moveTo(x + this.width, y + this.height/2);
        ctx.lineTo(x, y);
        ctx.lineTo(x - 20, y + this.height/2);
        ctx.lineTo(x, y + this.height);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + this.width/2, y + this.height/2, this.height/4, 0, Math.PI*2);
      ctx.fill();
    } else if (this.variant === 'world_slash') {
      const angle = Math.atan2(this.vel.y, this.vel.x);
      ctx.translate(x + this.width / 2, y + this.height / 2);
      // Rotate completely perfectly to face the angle
      ctx.rotate(angle);
      
      ctx.strokeStyle = '#ffffff'; // Outer bright aura
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 50;
      ctx.lineWidth = 40;
      
      ctx.beginPath();
      // Massive perpendicular cutting wave covering the entire screen, curved like a crescent blade
      ctx.moveTo(-200, -2500);
      ctx.quadraticCurveTo(300, 0, -200, 2500);
      ctx.stroke();
      
      // Pure black reality-splitting core
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 15;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-200, -2500);
      ctx.quadraticCurveTo(300, 0, -200, 2500);
      ctx.stroke();
    } else if (this.variant === 'omni_cleave') {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const angle = Math.atan2(this.vel.y, this.vel.x);
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 60, y + Math.sin(angle) * 60);
      ctx.stroke();
    } else if (this.characterType === 'Gojo') {
      ctx.globalAlpha = 0.1; // 90% transparent
      const grad = ctx.createRadialGradient(x + 10, y + 10, 0, x + 10, y + 10, 15);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#8a2be2');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    } else if (this.characterType === 'Sukuna') {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const isRight = this.vel.x > 0;
      ctx.moveTo(x + (isRight ? 0 : 20), y - 10);
      ctx.quadraticCurveTo(x + (isRight ? 30 : -10), y + 10, x + (isRight ? 0 : 20), y + 30);
      ctx.stroke();
    } else if (this.characterType === 'Yuji') {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(x, y, 20, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 20, 20);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(x, y, this.width, this.height);
    }
    ctx.restore();
  }
}
