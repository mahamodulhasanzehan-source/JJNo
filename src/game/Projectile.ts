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
    if (Math.random() > 0.3) {
      let particleColor = this.color;
      let pShape: any = 'glow';
      if (this.characterType === 'Yuji') { particleColor = Math.random() > 0.5 ? '#f1c40f' : '#ff3300'; pShape = 'rect'; }
      if (this.characterType === 'Gojo') { particleColor = Math.random() > 0.5 ? '#8a2be2' : '#ffffff'; pShape = 'star'; }
      if (this.characterType === 'Sukuna') { particleColor = Math.random() > 0.5 ? '#e74c3c' : '#000000'; pShape = 'arc'; }
      if (this.characterType === 'Megumi') { particleColor = Math.random() > 0.5 ? '#2c3e50' : '#8e44ad'; pShape = 'circle'; }

      particles.push(new Particle(
        this.pos.x + this.width / 2 + (Math.random() - 0.5) * this.width,
        this.pos.y + this.height / 2 + (Math.random() - 0.5) * this.height,
        (-this.vel.x * 0.1) + (Math.random() - 0.5) * 5,
        (-this.vel.y * 0.1) + (Math.random() - 0.5) * 5,
        200 + Math.random() * 300,
        particleColor,
        4 + Math.random() * 8,
        pShape,
        { friction: 0.95, scaleInOut: true, angularVel: (Math.random() - 0.5) * 0.5 }
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    const x = this.pos.x - camera.x;
    const y = this.pos.y - camera.y;

    ctx.save();
    
    // Default intense glow for all projectiles
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    if (this.variant === 'elephant') {
      ctx.shadowBlur = 30; // Massive drop shadow
      ctx.shadowColor = '#000000';
      ctx.fillStyle = '#4682b4'; // Steel blue
      ctx.fillRect(x, y, this.width, this.height);
      // Details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 10, y + this.height - 20, 15, 5); // Tusk L
      ctx.fillRect(x + this.width - 5, y + this.height - 20, 15, 5); // Tusk R
      ctx.fillStyle = '#2f4f4f';
      ctx.fillRect(x + this.width/2 - 10, y + this.height, 20, 40); // Trunk
      
      // Eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 10, y + 20, 10, 10);
      ctx.fillRect(x + this.width - 20, y + 20, 10, 10);
      
    } else if (this.variant === 'fuga') {
      const time = Date.now();
      ctx.fillStyle = '#ff4500';
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 40 + Math.sin(time * 0.01) * 20;

      ctx.beginPath();
      // Arrowhead shape with pulsating core
      if (this.vel.x > 0) {
        ctx.moveTo(x, y + this.height/2);
        ctx.lineTo(x + this.width * 0.8, y);
        ctx.lineTo(x + this.width + 40, y + this.height/2); // Extends further
        ctx.lineTo(x + this.width * 0.8, y + this.height);
      } else {
        ctx.moveTo(x + this.width, y + this.height/2);
        ctx.lineTo(x + this.width * 0.2, y);
        ctx.lineTo(x - 40, y + this.height/2);
        ctx.lineTo(x + this.width * 0.2, y + this.height);
      }
      ctx.fill();
      
      // Secondary flame layer
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      if (this.vel.x > 0) {
        ctx.moveTo(x + 20, y + this.height/2);
        ctx.lineTo(x + this.width * 0.8, y + 10);
        ctx.lineTo(x + this.width + 20, y + this.height/2);
        ctx.lineTo(x + this.width * 0.8, y + this.height - 10);
      } else {
        ctx.moveTo(x + this.width - 20, y + this.height/2);
        ctx.lineTo(x + this.width * 0.2, y + 10);
        ctx.lineTo(x - 20, y + this.height/2);
        ctx.lineTo(x + this.width * 0.2, y + this.height - 10);
      }
      ctx.fill();

      // Superhot Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + this.width/2 + (this.vel.x > 0 ? 10 : -10), y + this.height/2, this.height/3, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.variant === 'world_slash') {
      const angle = Math.atan2(this.vel.y, this.vel.x);
      ctx.translate(x + this.width / 2, y + this.height / 2);
      ctx.rotate(angle);
      
      const time = Date.now();
      const pulse = Math.sin(time * 0.05) * 10;

      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 80 + pulse;
      ctx.lineWidth = 60 + pulse;
      
      ctx.beginPath();
      ctx.moveTo(-300, -3500);
      ctx.quadraticCurveTo(500, 0, -300, 3500);
      ctx.stroke();
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 20;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-300, -3500);
      ctx.quadraticCurveTo(500, 0, -300, 3500);
      ctx.stroke();
      
      // Space-tearing glitch lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 15; i++) {
        const offset = (Math.random() - 0.5) * 100;
        ctx.beginPath();
        ctx.moveTo(offset, (Math.random() - 0.5) * 4000);
        ctx.lineTo(offset + (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 4000);
        ctx.stroke();
      }
    } else if (this.variant === 'omni_cleave') {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const angle = Math.atan2(this.vel.y, this.vel.x);
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 60, y + Math.sin(angle) * 60);
      ctx.stroke();
    } else if (this.characterType === 'Gojo') {
      const time = Date.now();
      // Multi-layered Hollow Purple / Limitless glow
      ctx.globalAlpha = 0.8;
      
      // Outer ripple
      ctx.strokeStyle = `rgba(138, 43, 226, ${Math.abs(Math.sin(time*0.01))})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 25 + Math.sin(time*0.02) * 5, 0, Math.PI * 2);
      ctx.stroke();

      const grad = ctx.createRadialGradient(x + 10, y + 10, 0, x + 10, y + 10, 20);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ff00ff');
      grad.addColorStop(0.8, '#8a2be2');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Reality distortion black hole in the center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1.0;
    } else if (this.characterType === 'Sukuna') {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      const isRight = this.vel.x > 0;
      
      // Triple slash effect
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (isRight ? -10 : 30) + i * 5, y - 15 + i * 10);
        ctx.quadraticCurveTo(x + (isRight ? 40 : -20), y + 10, x + (isRight ? -10 : 30) - i * 5, y + 35 - i * 10);
        ctx.stroke();
      }
    } else if (this.characterType === 'Yuji') {
      // Divergent Fist / Black Flash energy
      const time = Date.now();
      const isBlackFlash = Math.random() > 0.8; 
      const energyColor = isBlackFlash ? '#000000' : '#f1c40f';
      const auraColor = isBlackFlash ? '#ff0000' : '#ffffff';

      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 20;

      ctx.fillStyle = energyColor;
      ctx.translate(x + 10, y + 10);
      ctx.rotate(time * 0.01);
      
      ctx.beginPath();
      ctx.rect(-10 - Math.random() * 5, -10 - Math.random() * 5, 20 + Math.random() * 10, 20 + Math.random() * 10);
      ctx.fill();
      
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(-15, -15, 30, 30);
    } else {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.color;
      // Drawing a crystal-like shape
      ctx.translate(x + this.width / 2, y + this.height / 2);
      ctx.rotate(Date.now() * + 0.01);
      ctx.beginPath();
      ctx.moveTo(0, -this.height / 1.5);
      ctx.lineTo(this.width / 1.5, 0);
      ctx.lineTo(0, this.height / 1.5);
      ctx.lineTo(-this.width / 1.5, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}
