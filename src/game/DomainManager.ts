import { CharacterType, Vector2 } from './Types';
import { Particle } from './Particle';

import { soundManager } from './SoundManager';

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
  sukunaOmniCleaveTimer: number = 0;
  sukunaOmniCleaveCount: number = 0;
  impactFrameTimer: number = 0;
  
  // Megumi specific
  shikigami: {
    nue: { x: number, y: number, timer: number }[],
    dogs: { x: number, y: number, state: string, cooldown: number, dashTimer: number, startX: number, targetX: number }[],
    elephantTimer: number
  } | null = null;

  // Hakari specific
  hakariState: 'rolling' | 'jackpot' | null = null;
  hakariRollTimer: number = 0;
  hakariShowTimer: number = 0;
  hakariBuff: 'infinite_ce' | 'invulnerable' | 'mimicry' | null = null;
  hakariMimicTarget: CharacterType | null = null;
  hakariUsedBuffs: string[] = [];

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
      this.sukunaOmniCleaveTimer = 0;
      this.sukunaOmniCleaveCount = 0;
    } else if (type === 'Yuji') {
      this.timer = 30000;
      this.maxTimer = 30000;
    } else if (type === 'Megumi') {
      this.timer = 10000; // 10s duration
      this.maxTimer = 10000;
      this.shikigami = {
        nue: [
          { x: 0, y: 0, timer: 0 },
          { x: 0, y: 0, timer: 0 }
        ],
        dogs: [
          { x: 0, y: 0, state: 'idle', cooldown: 0, dashTimer: 0, startX: 0, targetX: 0 },
          { x: 0, y: 0, state: 'idle', cooldown: 0, dashTimer: 0, startX: 0, targetX: 0 }
        ],
        elephantTimer: 4000
      };
    } else if (type === 'Hakari') {
      this.hakariState = 'rolling';
      this.hakariRollTimer = 3000; // 3 seconds roll
      this.timer = 5000; // 5 seconds total (3s roll + 2s show)
      this.maxTimer = 5000;
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
      // Ambient shrine particles
      if (Math.random() > 0.7) {
        particles.push(new Particle(
          Math.random() * 2000, Math.random() * 600,
          (Math.random() - 0.5) * 2, -2, 800, '#ff0000', Math.random() * 4
        ));
      }
    } else if (this.type === 'Hakari') {
      if (this.hakariState === 'rolling') {
        this.hakariRollTimer -= dt;
        if (Math.random() > 0.95) soundManager.playSlotRoll();
        if (this.hakariRollTimer <= 0) {
          this.hakariState = 'jackpot';
          this.hakariShowTimer = 2000;
          soundManager.playJackpot();
          
          const allBuffs = ['infinite_ce', 'invulnerable', 'mimicry'];
          let availableBuffs = allBuffs.filter(b => !this.hakariUsedBuffs.includes(b));
          
          if (availableBuffs.length === 0) {
            this.hakariUsedBuffs = [];
            availableBuffs = allBuffs;
          }
          
          const rollIndex = Math.floor(Math.random() * availableBuffs.length);
          this.hakariBuff = availableBuffs[rollIndex] as any;
          this.hakariUsedBuffs.push(this.hakariBuff!);
        }
      } else if (this.hakariState === 'jackpot') {
        this.hakariShowTimer -= dt;
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
    } else if (this.type === 'Megumi') {
      // Gray/White corridor theme
      ctx.fillStyle = '#e0e0e0'; // Light gray background
      ctx.fillRect(0, 0, width, height);
      
      // Corridor perspective lines
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width / 2, height / 2);
      ctx.moveTo(width, 0);
      ctx.lineTo(width / 2, height / 2);
      ctx.moveTo(0, height);
      ctx.lineTo(width / 2, height / 2);
      ctx.moveTo(width, height);
      ctx.lineTo(width / 2, height / 2);
      ctx.stroke();

      // Liquid shadow floor overlay
      ctx.fillStyle = 'rgba(20, 20, 30, 0.4)';
      ctx.fillRect(0, height / 2, width, height / 2);
      
      // Signature blue "spinal cord" structure
      ctx.strokeStyle = 'rgba(0, 0, 139, 0.8)'; // Deep blue, slightly more opaque
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      
      const spineX = width / 2 - (camera.x * 0.1); // Slight parallax
      
      ctx.beginPath();
      ctx.moveTo(spineX, 0);
      // Draw wavy spine
      for (let y = 0; y < height; y += 40) {
        const xOffset = Math.sin(y * 0.05 + Date.now() * 0.002) * 20;
        ctx.lineTo(spineX + xOffset, y);
      }
      ctx.stroke();
      
      // Draw ribs
      ctx.lineWidth = 5;
      for (let y = 50; y < height; y += 60) {
        const xOffset = Math.sin(y * 0.05 + Date.now() * 0.002) * 20;
        ctx.beginPath();
        ctx.moveTo(spineX + xOffset, y);
        ctx.lineTo(spineX + xOffset - 100, y - 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(spineX + xOffset, y);
        ctx.lineTo(spineX + xOffset + 100, y - 30);
        ctx.stroke();
      }
    } else if (this.type === 'Hakari') {
      // Casino theme
      ctx.fillStyle = '#110022';
      ctx.fillRect(0, 0, width, height);
      
      // Neon grid
      ctx.strokeStyle = 'rgba(255, 20, 147, 0.3)'; // Neon pink
      ctx.lineWidth = 2;
      for(let i = 0; i < width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i - (camera.x % 50), 0); ctx.lineTo(i - (camera.x % 50), height); ctx.stroke();
      }
      for(let i = 0; i < height; i += 50) {
        ctx.beginPath(); ctx.moveTo(0, i - (camera.y % 50)); ctx.lineTo(width, i - (camera.y % 50)); ctx.stroke();
      }
      
      // Slot machine UI overlay
      const slotWidth = 800;
      const slotHeight = 250;
      const slotX = width / 2 - slotWidth / 2;
      const slotY = height / 2 - slotHeight / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 8;
      ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);
      
      ctx.font = 'bold 80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (this.hakariState === 'rolling') {
        const symbols = ['7', 'BAR', 'CHERRY', 'BELL', 'DIAMOND'];
        const s1 = symbols[Math.floor(Date.now() / 100) % symbols.length];
        const s2 = symbols[Math.floor(Date.now() / 120) % symbols.length];
        const s3 = symbols[Math.floor(Date.now() / 150) % symbols.length];
        
        ctx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ffff00';
        ctx.fillText(`${s1} | ${s2} | ${s3}`, width / 2, height / 2);
      } else if (this.hakariState === 'jackpot') {
        ctx.fillStyle = '#00ff00';
        let text = "JACKPOT!";
        if (this.hakariBuff === 'infinite_ce') text = "INFINITE CE!";
        if (this.hakariBuff === 'invulnerable') text = "INVULNERABLE!";
        if (this.hakariBuff === 'mimicry') text = "MIMICRY!";
        ctx.fillText(text, width / 2, height / 2);
      }
    }
    ctx.restore();
  }
}
