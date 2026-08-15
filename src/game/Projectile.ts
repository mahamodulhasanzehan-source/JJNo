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
      const time = performance.now() / 150;
      const cx = x + this.width / 2;
      const cy = y + this.height / 2;
      const r = 16 + this.sizeOverride * 0.5;

      // 1. Concentric pulsing limitless aura
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#e879f9');
      grad.addColorStop(0.6, '#9333ea');
      grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Void Core (Micro Singularity)
      ctx.fillStyle = '#05000a';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Dual Red/Blue Infinity Orbital Rings
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 2; i++) {
        const offset = i === 0 ? time * 2 : -time * 2;
        ctx.strokeStyle = i === 0 ? '#38bdf8' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.85, offset, offset + Math.PI * 0.9);
        ctx.stroke();
      }

    } else if (this.characterType === 'Sukuna') {
      const time = performance.now() / 100;
      const cx = x + this.width / 2;
      const cy = y + this.height / 2;
      const isRight = this.vel.x > 0;

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;

      // Blood-red Demonic Cleave Crescent Arc
      const mainAngle = Math.atan2(this.vel.y, this.vel.x);
      ctx.translate(cx, cy);
      ctx.rotate(mainAngle);

      // Primary razor slash blade
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.quadraticCurveTo(-10, -22, -26, -26);
      ctx.quadraticCurveTo(-14, 0, -26, 26);
      ctx.quadraticCurveTo(-10, 22, 18, 0);
      ctx.fill();

      // Inner glowing crimson core
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.quadraticCurveTo(-6, -14, -18, -18);
      ctx.quadraticCurveTo(-8, 0, -18, 18);
      ctx.quadraticCurveTo(-6, 14, 14, 0);
      ctx.fill();

      // Pure white razor edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-26, -26);
      ctx.quadraticCurveTo(8, -14, 18, 0);
      ctx.quadraticCurveTo(8, 14, -26, 26);
      ctx.stroke();

      // Sharp secondary bleed ticks
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(-20, -22);
      ctx.moveTo(-10, 15);
      ctx.lineTo(-20, 22);
      ctx.stroke();

    } else if (this.characterType === 'Yuji') {
      // Divergent Fist / Cursed Martial Arts Impact Core
      const time = performance.now() / 80;
      const cx = x + this.width / 2;
      const cy = y + this.height / 2;
      
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.6);

      // Outer gold/flame impact polygon
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const rad = i % 2 === 0 ? 18 : 12;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Intense Amber/Red Cursed Aura Core
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const rad = i % 2 === 0 ? 12 : 8;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // White hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Divergent second shock wave outline
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -12, 24, 24);

    } else if (this.characterType === 'Megumi') {
      // Ten Shadows Shikigami Talisman / Dark Shadow Shuriken
      const time = performance.now() / 90;
      const cx = x + this.width / 2;
      const cy = y + this.height / 2;

      ctx.translate(cx, cy);
      ctx.rotate(time * 1.5);

      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;

      // Dark shadow shuriken 4-point star
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const rad = i % 2 === 0 ? 19 : 7;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Cursed blue sacred pattern edges
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shikigami eye in center
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.characterType === 'Hakari') {
      // Pachinko / Roulette Gold & Neon Jackpot Token
      const time = performance.now() / 110;
      const cx = x + this.width / 2;
      const cy = y + this.height / 2;

      ctx.translate(cx, cy);
      ctx.rotate(time * 1.2);

      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 22;

      // Bright Pink / Cyan Neon Dice Token
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-12, -12, 24, 24);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(-12, -12, 24, 24);

      // Gold Lucky 7 / Jackpot center indicator
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle cross
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();

    } else {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.color;
      // Drawing a crystal-like shape
      ctx.translate(x + this.width / 2, y + this.height / 2);
      ctx.rotate(Date.now() * 0.01);
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
