import { CharacterType, Vector2 } from './Types';
import { Particle } from './Particle';
import { soundManager } from './SoundManager';
import { handleHakariDomainRoll } from '../entities/hakari/hakari_C';
import { drawSukunaDomainBackground } from '../entities/sukuna/sukuna_Style';
import { drawGojoDomainBackground } from '../entities/gojo/gojo_Style';
import { drawYujiDomainBackground } from '../entities/yuji/yuji_Style';
import { drawMegumiDomainBackground } from '../entities/megumi/megumi_Style';
import { drawHakariDomainBackground } from '../entities/hakari/hakari_Style';

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
      this.timer = 13000; // 13s duration
      this.maxTimer = 13000;
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
        this.hakariRollTimer = handleHakariDomainRoll(
          dt,
          this.hakariRollTimer,
          this.hakariUsedBuffs,
          (s) => this.hakariState = s,
          (t) => this.hakariShowTimer = t,
          (b) => this.hakariBuff = b,
          (arr) => this.hakariUsedBuffs = arr,
          () => soundManager.playSlotRoll(),
          () => soundManager.playJackpot()
        );
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
      // Dynamic blood pulse
      const pulse = Math.sin(Date.now() * 0.002) * 0.1;
      
      // Pitch black atmosphere with deep red vignette
      const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      bgGradient.addColorStop(0, `rgba(40, 0, 0, ${0.85 + pulse})`);
      bgGradient.addColorStop(0.7, `rgba(10, 0, 0, 0.95)`);
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Distant eerie smoke/dust layers
      ctx.fillStyle = `rgba(150, 0, 0, ${0.1 + pulse*0.5})`;
      for(let i=0; i<3; i++) {
        const offset = (Date.now() * 0.05 * (i+1)) % width;
        ctx.beginPath();
        ctx.arc(offset, height - 200 + Math.sin(offset*0.01)*50, 200, 0, Math.PI*2);
        ctx.arc(offset + width/2, height - 150 + Math.cos(offset*0.02)*80, 250, 0, Math.PI*2);
        ctx.fill();
      }
      
      // Sea of blood
      const bloodWave = Math.sin(Date.now() * 0.003) * 10;
      ctx.fillStyle = 'rgba(180, 0, 0, 0.7)';
      ctx.fillRect(0, height - 100 + bloodWave, width, 100 - bloodWave);
      ctx.fillStyle = 'rgba(100, 0, 0, 0.5)';
      ctx.fillRect(0, height - 80 - bloodWave*0.5, width, 80 + bloodWave*0.5);

      // Skeletal shrine silhouette
      ctx.fillStyle = '#050000';
      const shrineX = width / 2 - 150 - (camera.x * 0.2); // Parallax
      
      ctx.beginPath();
      // Complex multi-tiered roof
      ctx.moveTo(shrineX + 150, height - 400); // Top spire
      ctx.lineTo(shrineX + 180, height - 320);
      ctx.lineTo(shrineX + 350, height - 280); // Right eave
      ctx.lineTo(shrineX + 220, height - 250);
      ctx.lineTo(shrineX + 300, height - 100); // Right base
      ctx.lineTo(shrineX + 0, height - 100); // Left base
      ctx.lineTo(shrineX + 80, height - 250);
      ctx.lineTo(shrineX - 50, height - 280); // Left eave
      ctx.lineTo(shrineX + 120, height - 320);
      ctx.fill();
      
      // Ribs framing the shrine
      ctx.strokeStyle = '#3a0000';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      for (let i=0; i<7; i++) {
        const breathing = Math.sin(Date.now() * 0.005 + i) * 15;
        // Right ribs
        ctx.beginPath();
        ctx.moveTo(shrineX + 150, height - 350 + i * 35);
        ctx.quadraticCurveTo(shrineX + 250 + i*10 + breathing, height - 300 + i * 25, shrineX + 300 + i*20 + breathing, height - 100);
        ctx.stroke();
        // Left ribs
        ctx.beginPath();
        ctx.moveTo(shrineX + 150, height - 350 + i * 35);
        ctx.quadraticCurveTo(shrineX + 50 - i*10 - breathing, height - 300 + i * 25, shrineX + 0 - i*20 - breathing, height - 100);
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
      // Chimera Shadow Garden - Abyssal black sludge
      ctx.fillStyle = '#050a14'; // Deep dark greenish-black
      ctx.fillRect(0, 0, width, height);

      // Deep shadow layers rising and falling
      const t = Date.now() * 0.001;
      
      const shadowGrad = ctx.createLinearGradient(0, height*0.3, 0, height);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(0.5, 'rgba(5, 20, 30, 0.8)');
      shadowGrad.addColorStop(1, '#000000');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, width, height);

      // Giant floating shadow animal silhouettes in the background
      ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
      for(let i=0; i<4; i++) {
        const ax = (width * 0.3 * i + t * 20) % (width + 400) - 200;
        const ay = height*0.4 + Math.sin(t+i)*50;
        ctx.beginPath();
        ctx.ellipse(ax, ay, 150 + i*20, 80 + i*10, Math.sin(t*0.5+i)*0.2, 0, Math.PI*2);
        ctx.fill();
        // Glowing cyan eyes
        ctx.fillStyle = 'rgba(0, 255, 200, 0.6)';
        ctx.beginPath(); ctx.arc(ax - 50, ay - 20, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ax + 50, ay - 20, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
      }

      // Signature bone/spine structure rising from the shadows
      ctx.strokeStyle = 'rgba(180, 200, 255, 0.2)'; 
      ctx.fillStyle = 'rgba(180, 200, 255, 0.1)';
      ctx.lineWidth = 4;
      
      const spineX = width / 2 - (camera.x * 0.05); // Parallax
      
      // Draw massive spinal column
      for (let y = height; y > 100; y -= 60) {
        const offset = Math.sin(y * 0.02 + t) * 30;
        
        ctx.beginPath();
        // Vertebrae core
        ctx.arc(spineX + offset, y, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Ribs extending outwards
        ctx.beginPath();
        ctx.moveTo(spineX + offset - 20, y);
        ctx.quadraticCurveTo(spineX + offset - 150, y - 50, spineX + offset - 200, y + 50);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(spineX + offset + 20, y);
        ctx.quadraticCurveTo(spineX + offset + 150, y - 50, spineX + offset + 200, y + 50);
        ctx.stroke();
      }

      // Liquid black sludge floor with waves
      ctx.fillStyle = '#02050a';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for(let x=0; x<=width; x+=50) {
        ctx.lineTo(x, height - 120 + Math.sin(x*0.01 + t*2)*20 + Math.cos(x*0.02 - t*1.5)*15);
      }
      ctx.lineTo(width, height);
      ctx.fill();
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
