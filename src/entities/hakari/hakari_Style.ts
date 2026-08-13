import { Vector2 } from '../../game/Types';

export function drawHakariDomainBackground(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  camera: Vector2,
  hakariState: 'rolling' | 'jackpot' | null,
  hakariRollTimer: number,
  hakariShowTimer: number,
  hakariBuff: 'infinite_ce' | 'invulnerable' | 'mimicry' | null
) {
  const time = Date.now() * 0.001;

  // 1. Cyberpunk / Pachinko Stage Dark Ambient Canvas
  const bgGrad = ctx.createRadialGradient(
    width / 2, height / 2, 50,
    width / 2, height / 2, Math.max(width, height)
  );
  if (hakariState === 'jackpot') {
    bgGrad.addColorStop(0, 'rgba(60, 0, 40, 0.98)');
    bgGrad.addColorStop(0.5, 'rgba(25, 0, 20, 0.99)');
    bgGrad.addColorStop(1, '#050008');
  } else {
    bgGrad.addColorStop(0, 'rgba(20, 5, 30, 0.95)');
    bgGrad.addColorStop(0.6, 'rgba(10, 2, 18, 0.98)');
    bgGrad.addColorStop(1, '#030005');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. High-Speed Perspective 3D Synthwave Grid Floor
  ctx.save();
  ctx.strokeStyle = hakariState === 'jackpot' 
    ? `hsla(${(time * 120) % 360}, 100%, 60%, 0.4)`
    : `hsla(320, 100%, 50%, ${0.25 + Math.sin(time * 4) * 0.1})`;
  ctx.lineWidth = 1.5;

  const perspectiveY = height * 0.55;
  const gridSpeed = (time * 250) % 40;

  // Horizontal receding lines
  for (let y = perspectiveY; y < height; y += (y - perspectiveY) * 0.18 + 4) {
    const adjY = y + (gridSpeed * (y - perspectiveY) / height);
    if (adjY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, adjY);
      ctx.lineTo(width, adjY);
      ctx.stroke();
    }
  }

  // Radial perspective lines converging at horizon
  const horizonX = width / 2 - camera.x * 0.05;
  for (let x = -width; x < width * 2; x += 60) {
    ctx.beginPath();
    ctx.moveTo(horizonX, perspectiveY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Sweeping Searchlight Beams & Stage Lasers
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const angle = Math.sin(time * 0.8 + i * 1.5) * 0.6;
    const beamGrad = ctx.createLinearGradient(horizonX, perspectiveY, horizonX + Math.sin(angle) * width, height);
    beamGrad.addColorStop(0, 'rgba(255, 20, 147, 0.35)');
    beamGrad.addColorStop(1, 'rgba(255, 20, 147, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(horizonX - 10, perspectiveY);
    ctx.lineTo(horizonX + Math.sin(angle) * width - 60, height);
    ctx.lineTo(horizonX + Math.sin(angle) * width + 60, height);
    ctx.lineTo(horizonX + 10, perspectiveY);
    ctx.fill();
  }
  ctx.restore();

  // 4. Falling & Bouncing Pachinko Pinballs
  ctx.save();
  for (let i = 0; i < 35; i++) {
    const bx = (Math.sin(i * 17.3 + i * i) * width * 0.8 + width * 0.5 - camera.x * 0.1) % width;
    const by = (time * 350 + i * 65) % (height + 50) - 25;
    const adjBx = bx < 0 ? bx + width : bx;

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(adjBx, by, 6, 0, Math.PI * 2);
    ctx.fill();

    // Metallic shine highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(adjBx - 2, by - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Motion spark tail
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(adjBx, by);
    ctx.lineTo(adjBx, by - 12);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Sliding Subway / Pachinko Train Doors ("Pure Love Train" - 私鉄純愛列車)
  const isReachMode = hakariRollTimer <= 2000 && hakariState === 'rolling';
  const doorRumble = isReachMode ? Math.sin(time * 50) * 3 : 0;
  
  // Door openness: partially open during spin, closing tightly during Reach Mode tension!
  let doorOpenPx = 280;
  if (hakariRollTimer <= 1000 && hakariState === 'rolling') {
    doorOpenPx = 160 + Math.sin(time * 12) * 20; // Tightening reach stage
  } else if (hakariState === 'jackpot') {
    doorOpenPx = 380; // Slammed open for Jackpot!
  }

  const leftDoorX = width / 2 - doorOpenPx - (camera.x * 0.08) + doorRumble;
  const rightDoorX = width / 2 + doorOpenPx - (camera.x * 0.08) + doorRumble;

  // Left Train Door
  const doorGradLeft = ctx.createLinearGradient(0, 0, leftDoorX, 0);
  doorGradLeft.addColorStop(0, '#0f0f1a');
  doorGradLeft.addColorStop(0.9, '#1e1e32');
  doorGradLeft.addColorStop(1, '#2d2d48');
  ctx.fillStyle = doorGradLeft;
  ctx.fillRect(0, 0, Math.max(0, leftDoorX), height);

  // Right Train Door
  const doorGradRight = ctx.createLinearGradient(rightDoorX, 0, width, 0);
  doorGradRight.addColorStop(0, '#2d2d48');
  doorGradRight.addColorStop(0.1, '#1e1e32');
  doorGradRight.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = doorGradRight;
  ctx.fillRect(Math.min(width, rightDoorX), 0, width - rightDoorX, height);

  // Yellow & Black Hazard Stripes & Gold Trim on Door Edges
  if (leftDoorX > 0) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(leftDoorX - 12, 0, 12, height);
    // Hazard Stripes
    ctx.fillStyle = '#000000';
    for (let sy = 0; sy < height; sy += 30) {
      ctx.beginPath();
      ctx.moveTo(leftDoorX - 12, sy);
      ctx.lineTo(leftDoorX, sy + 15);
      ctx.lineTo(leftDoorX, sy + 25);
      ctx.lineTo(leftDoorX - 12, sy + 10);
      ctx.fill();
    }
  }

  if (rightDoorX < width) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(rightDoorX, 0, 12, height);
    // Hazard Stripes
    ctx.fillStyle = '#000000';
    for (let sy = 0; sy < height; sy += 30) {
      ctx.beginPath();
      ctx.moveTo(rightDoorX, sy);
      ctx.lineTo(rightDoorX + 12, sy + 15);
      ctx.lineTo(rightDoorX + 12, sy + 25);
      ctx.lineTo(rightDoorX, sy + 10);
      ctx.fill();
    }
  }

  // 6. MAIN SLOT MACHINE REEL DISPLAY (Centerpiece)
  const slotWidth = Math.min(760, width - 40);
  const slotHeight = 260;
  const slotX = width / 2 - slotWidth / 2;
  const slotY = height / 2 - slotHeight / 2 - 30;

  // Glossy Metallic Machine Frame
  const machineGrad = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotHeight);
  machineGrad.addColorStop(0, '#181824');
  machineGrad.addColorStop(0.5, '#09090f');
  machineGrad.addColorStop(1, '#12121c');
  ctx.fillStyle = machineGrad;
  
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotWidth, slotHeight, 16);
    ctx.fill();
  } else {
    ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
  }

  // Neon Light Bulb Perimeter (Flashing Casino LEDs)
  const bulbCount = 36;
  for (let b = 0; b < bulbCount; b++) {
    const isLit = (Math.floor(time * 20) + b) % 2 === 0;
    const bulbColor = isLit ? '#ec4899' : '#38bdf8';
    let bx = slotX;
    let by = slotY;

    if (b < 12) {
      bx = slotX + (slotWidth / 12) * b + 15;
      by = slotY - 6;
    } else if (b < 18) {
      bx = slotX + slotWidth + 6;
      by = slotY + (slotHeight / 6) * (b - 12) + 15;
    } else if (b < 30) {
      bx = slotX + slotWidth - (slotWidth / 12) * (b - 18) - 15;
      by = slotY + slotHeight + 6;
    } else {
      bx = slotX - 6;
      by = slotY + slotHeight - (slotHeight / 6) * (b - 30) - 15;
    }

    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer Neon Border
  ctx.strokeStyle = hakariState === 'jackpot' ? '#facc15' : '#ec4899';
  ctx.lineWidth = 4;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotWidth, slotHeight, 16);
    ctx.stroke();
  } else {
    ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);
  }

  // 7. SLOT REELS (3 SEPARATE 3D CYLINDER WINDOWS)
  const reelWidth = 210;
  const reelHeight = 190;
  const reelY = slotY + (slotHeight - reelHeight) / 2;
  const reelXGap = 20;
  const reelStartX = slotX + (slotWidth - (reelWidth * 3 + reelXGap * 2)) / 2;

  // Determine Reel Locked Symbols based on Roll Timer
  // Reel 1 locks at timer <= 2000
  // Reel 3 locks at timer <= 1000
  // Reel 2 locks at timer <= 0 (Jackpot)
  const reel1Locked = hakariRollTimer <= 2000 || hakariState === 'jackpot';
  const reel3Locked = hakariRollTimer <= 1000 || hakariState === 'jackpot';
  const reel2Locked = hakariState === 'jackpot';

  const symbolsList = ['7', '🍒', '💎', '🔔', 'BAR', '愛'];

  for (let r = 0; r < 3; r++) {
    const rx = reelStartX + r * (reelWidth + reelXGap);
    
    // Reel Cylinder Background & Inner Shadow
    const reelGrad = ctx.createLinearGradient(rx, reelY, rx, reelY + reelHeight);
    reelGrad.addColorStop(0, '#020617');
    reelGrad.addColorStop(0.2, '#0f172a');
    reelGrad.addColorStop(0.5, '#1e293b');
    reelGrad.addColorStop(0.8, '#0f172a');
    reelGrad.addColorStop(1, '#020617');
    
    ctx.fillStyle = reelGrad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(rx, reelY, reelWidth, reelHeight, 8);
      ctx.fill();
    } else {
      ctx.fillRect(rx, reelY, reelWidth, reelHeight);
    }

    // Determine current symbol to display
    let displaySymbol = '7';
    let isSpinning = false;

    if (r === 0) { // Left Reel
      if (!reel1Locked) {
        displaySymbol = symbolsList[Math.floor((Date.now() / 60) + r * 3) % symbolsList.length];
        isSpinning = true;
      } else {
        displaySymbol = '7';
      }
    } else if (r === 2) { // Right Reel
      if (!reel3Locked) {
        displaySymbol = symbolsList[Math.floor((Date.now() / 70) + r * 5) % symbolsList.length];
        isSpinning = true;
      } else {
        displaySymbol = '7';
      }
    } else { // Center Reel (Reel 2)
      if (!reel2Locked) {
        // Slow tension spin when left & right are locked!
        const spinSpeed = (reel1Locked && reel3Locked) ? 140 : 50;
        displaySymbol = symbolsList[Math.floor((Date.now() / spinSpeed) + r * 2) % symbolsList.length];
        isSpinning = true;
      } else {
        displaySymbol = '7';
      }
    }

    // Draw Symbol & Motion Blur
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isSpinning) {
      // Blur trail lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(rx + 20, reelY + 20, reelWidth - 40, 10);
      ctx.fillRect(rx + 20, reelY + reelHeight - 30, reelWidth - 40, 10);

      // Symbol
      ctx.font = 'bold 85px "Impact", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(displaySymbol, rx + reelWidth / 2, reelY + reelHeight / 2 + Math.sin(time * 30 + r) * 12);
    } else {
      // Locked Golden '7' Symbol
      ctx.font = 'bold 95px "Impact", sans-serif';
      
      // Glow behind locked '7'
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 25;
      
      // Symbol fill gradient
      const goldTextGrad = ctx.createLinearGradient(rx, reelY + 30, rx, reelY + reelHeight - 30);
      goldTextGrad.addColorStop(0, '#fef08a');
      goldTextGrad.addColorStop(0.5, '#facc15');
      goldTextGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = goldTextGrad;
      
      ctx.fillText('7', rx + reelWidth / 2, reelY + reelHeight / 2);
      ctx.shadowBlur = 0; // Reset shadow
    }
    ctx.restore();

    // Reel Border Highlight
    const isLocked = (r === 0 && reel1Locked) || (r === 2 && reel3Locked) || (r === 1 && reel2Locked);
    ctx.strokeStyle = isLocked ? '#facc15' : '#334155';
    ctx.lineWidth = isLocked ? 3.5 : 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(rx, reelY, reelWidth, reelHeight, 8);
      ctx.stroke();
    } else {
      ctx.strokeRect(rx, reelY, reelWidth, reelHeight);
    }
  }

  // 8. "REACH MODE!" (立直) DRAMATIC BANNER & PROBABILITY OVERRIDE
  if (reel1Locked && reel3Locked && !reel2Locked && hakariState === 'rolling') {
    ctx.save();
    // Flashing Tension Banner above slot box
    const reachPulse = Math.sin(time * 25) > 0;
    ctx.fillStyle = reachPulse ? '#dc2626' : '#ec4899';
    ctx.fillRect(slotX, slotY - 45, slotWidth, 38);

    ctx.font = 'italic bold 24px "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ REACH MODE ACTIVATED! (立直) - 99.9% PROBABILITY SHIFT ⚡', width / 2, slotY - 26);
    ctx.restore();
  } else if (hakariState === 'rolling') {
    // Normal Roll Stage Indicator
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(slotX + 100, slotY - 38, slotWidth - 200, 32);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`私鉄純愛列車 | PROBABILITIES SHIFTING... ${(hakariRollTimer / 1000).toFixed(1)}s`, width / 2, slotY - 22);
  }

  // 9. JACKPOT ANNOUNCEMENT & BUFF DISPLAY (`hakariState === 'jackpot'`)
  if (hakariState === 'jackpot') {
    ctx.save();

    // Golden Radial Starburst Behind Banner
    const starCount = 12;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    for (let s = 0; s < starCount; s++) {
      const sa = (Math.PI * 2 / starCount) * s + time * 0.5;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(width / 2 + Math.cos(sa) * width, height / 2 + Math.sin(sa) * height);
      ctx.lineTo(width / 2 + Math.cos(sa + 0.2) * width, height / 2 + Math.sin(sa + 0.2) * height);
      ctx.fill();
    }

    // Exploding Golden Confetti Particles
    for (let c = 0; c < 40; c++) {
      const cx = width / 2 + Math.cos(c * 137.5 + time * 4) * (200 + (c * 8) % 300);
      const cy = height / 2 + Math.sin(c * 99.1 + time * 3) * (150 + (c * 6) % 200);
      ctx.fillStyle = `hsl(${(c * 25 + time * 200) % 360}, 100%, 60%)`;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + (c % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating Golden '777' Text Above Slot
    ctx.font = 'italic bold 70px "Impact", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 30;
    ctx.textAlign = 'center';
    ctx.fillText('確変大当り 777', width / 2, slotY - 50);

    // Bottom Jackpot Buff Card
    const cardWidth = Math.min(680, width - 40);
    const cardHeight = 70;
    const cardX = width / 2 - cardWidth / 2;
    const cardY = slotY + slotHeight + 20;

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY);
    cardGrad.addColorStop(0, '#991b1b');
    cardGrad.addColorStop(0.5, '#dc2626');
    cardGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = cardGrad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
      ctx.fill();
    } else {
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    }

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
      ctx.stroke();
    } else {
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    }

    // Buff Title
    let buffTitle = "INFINITE CURSED ENERGY (4min 11s) - 無限呪力";
    if (hakariBuff === 'invulnerable') buffTitle = "INVULNERABILITY FRAME SHIFT - 無敵確率";
    if (hakariBuff === 'mimicry') buffTitle = "COORDINATE MIMICRY ACQUIRED - 模倣術式";

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${buffTitle} ⚡`, width / 2, cardY + cardHeight / 2);

    ctx.restore();
  }
}
