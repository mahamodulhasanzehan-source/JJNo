import { CharacterType, Vector2 } from './Types';
import { Particle } from './Particle';

export class DomainManager {
  active: boolean = false;
  ownerId: string | null = null;
  type: CharacterType | null = null;
  timer: number = 0;
  maxTimer: number = 0;
  
  // Gojo specific
  purpleVectors: { start: Vector2, end: Vector2 }[] = [];
  whiteFlashTimer: number = 0;
  
  // Sukuna specific
  sukunaSlashesRemaining: number = 0;
  sukunaCurrentLine: { start: Vector2, end: Vector2 } | null = null;
  sukunaSlashes: { p1: Vector2, p2: Vector2, timer: number }[] = [];
  sukunaSlashRateLimitTimer: number = 0;
  impactFrameTimer: number = 0;

  activate(ownerId: string, type: CharacterType) {
    this.active = true;
    this.ownerId = ownerId;
    this.type = type;
    
    if (type === 'Gojo') {
      this.timer = 5000; // 5s total duration
      this.maxTimer = 5000;
      this.purpleVectors = [];
      this.whiteFlashTimer = 500; // 500ms white flash
    } else if (type === 'Sukuna') {
      this.timer = 8000; // 8s duration
      this.maxTimer = 8000;
      this.sukunaSlashesRemaining = 10;
      this.sukunaCurrentLine = null;
      this.sukunaSlashes = [];
    } else if (type === 'Yuji') {
      this.timer = 30000;
      this.maxTimer = 30000;
    }
  }

  update(dt: number, particles: Particle[]) {
    if (!this.active) return;
    
    this.timer -= dt;
    if (this.timer <= 0) {
      this.deactivate();
      return;
    }

    if (this.type === 'Gojo') {
      if (this.whiteFlashTimer > 0) this.whiteFlashTimer -= dt;
      // Spawn ambient void particles
      if (Math.random() > 0.8) {
        particles.push(new Particle(
          Math.random() * 2000, Math.random() * 600,
          0, -1, 1000, '#8a2be2', Math.random() * 3
        ));
      }
    } else if (this.type === 'Sukuna') {
      if (this.impactFrameTimer > 0) this.impactFrameTimer -= dt;
      for (let i = this.sukunaSlashes.length - 1; i >= 0; i--) {
        this.sukunaSlashes[i].timer -= dt;
        if (this.sukunaSlashes[i].timer <= 0) {
          this.sukunaSlashes.splice(i, 1);
        }
      }
      // Ambient shrine particles
      if (Math.random() > 0.7) {
        particles.push(new Particle(
          Math.random() * 2000, Math.random() * 600,
          (Math.random() - 0.5) * 2, -2, 800, '#ff0000', Math.random() * 4
        ));
      }
    }
  }

  deactivate() {
    this.active = false;
    this.ownerId = null;
    this.type = null;
  }

  drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
    if (!this.active) return;

    ctx.save();
    if (this.type === 'Gojo') {
      if (this.whiteFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteFlashTimer / 500})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        // "Eye in the Void" nebula
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.1, 'rgba(138, 43, 226, 0.8)');
        gradient.addColorStop(0.5, 'rgba(10, 0, 40, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw eye center
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(width/2, height/2, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'Sukuna') {
      // "Sea of Blood" with central skeletal shrine
      ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
      ctx.fillRect(0, 0, width, height);
      
      // Sea of blood
      ctx.fillStyle = 'rgba(150, 0, 0, 0.6)';
      ctx.fillRect(0, height - 100, width, 100);

      // Skeletal shrine silhouette
      ctx.fillStyle = '#0a0000';
      const shrineX = width / 2 - 150 - (camera.x * 0.2); // Parallax
      ctx.beginPath();
      ctx.moveTo(shrineX + 150, height - 300);
      ctx.lineTo(shrineX + 300, height - 100);
      ctx.lineTo(shrineX, height - 100);
      ctx.fill();
      
      // Ribs
      ctx.strokeStyle = '#220000';
      ctx.lineWidth = 5;
      for (let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.moveTo(shrineX + 150, height - 250 + i * 20);
        ctx.quadraticCurveTo(shrineX + 200 + i*10, height - 200 + i * 20, shrineX + 250 + i*15, height - 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(shrineX + 150, height - 250 + i * 20);
        ctx.quadraticCurveTo(shrineX + 100 - i*10, height - 200 + i * 20, shrineX + 50 - i*15, height - 100);
        ctx.stroke();
      }
    } else if (this.type === 'Yuji') {
      // Underground cage with flickering spotlights
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
      ctx.fillRect(0, 0, width, height);
      
      // Chainlink fence pattern
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
      ctx.lineWidth = 2;
      for(let i = -height; i < width + height; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - (camera.x % 40), 0); ctx.lineTo(i - height - (camera.x % 40), height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i - (camera.x % 40), 0); ctx.lineTo(i + height - (camera.x % 40), height); ctx.stroke();
      }

      // Flickering spotlights
      if (Math.random() > 0.1) {
        const spotGrad1 = ctx.createRadialGradient(width * 0.3, 0, 0, width * 0.3, height, height);
        spotGrad1.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        spotGrad1.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGrad1;
        ctx.beginPath();
        ctx.moveTo(width * 0.3, 0);
        ctx.lineTo(width * 0.1, height);
        ctx.lineTo(width * 0.5, height);
        ctx.fill();

        const spotGrad2 = ctx.createRadialGradient(width * 0.7, 0, 0, width * 0.7, height, height);
        spotGrad2.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        spotGrad2.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGrad2;
        ctx.beginPath();
        ctx.moveTo(width * 0.7, 0);
        ctx.lineTo(width * 0.5, height);
        ctx.lineTo(width * 0.9, height);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
