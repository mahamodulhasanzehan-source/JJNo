import { Vector2 } from '../../game/Types';

export function drawSukunaDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
  const time = Date.now() * 0.001;

  // Deep, oppressive sky
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#2a0000');
  bgGradient.addColorStop(0.5, '#0a0000');
  bgGradient.addColorStop(1, '#000000');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Giant Blood Moon (Parallax)
  ctx.save();
  const moonX = width * 0.8 - camera.x * 0.05;
  const moonY = height * 0.3 - camera.y * 0.05;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 200);
  moonGrad.addColorStop(0, '#ffffff');
  moonGrad.addColorStop(0.08, '#ff2222');
  moonGrad.addColorStop(0.4, 'rgba(180, 0, 0, 0.6)');
  moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Falling Ash / Cinders
  ctx.fillStyle = 'rgba(255, 80, 30, 0.8)';
  for (let i = 0; i < 150; i++) {
    const ax = (Math.sin(i * 99) * width * 2 + time * 60 + camera.x * 0.3) % width;
    const ay = (Math.cos(i * 33) * height * 2 + time * 120) % height;
    const size = 1 + (i % 4);
    
    const adjAx = ax < 0 ? ax + width : ax;
    const adjAy = ay < 0 ? ay + height : ay;
    ctx.fillRect(adjAx, adjAy, size, size);
  }

  // Torii Gates fading into the distance (Extreme Parallax)
  ctx.lineCap = 'square';
  for (let i = 5; i >= 0; i--) {
    const scale = 1 - (i * 0.16);
    const alpha = 1 - (i * 0.18);
    const parallaxX = width / 2 - (camera.x * (0.05 + i * 0.03));
    
    ctx.fillStyle = `rgba(60, 5, 5, ${alpha})`;
    ctx.strokeStyle = `rgba(80, 8, 8, ${alpha})`;
    ctx.lineWidth = 20 * scale;
    
    // Pillars
    ctx.fillRect(parallaxX - 350 * scale, height - 400 * scale, 40 * scale, 500 * scale);
    ctx.fillRect(parallaxX + 310 * scale, height - 400 * scale, 40 * scale, 500 * scale);
    
    // Top crossbars
    ctx.beginPath(); ctx.moveTo(parallaxX - 420 * scale, height - 330 * scale); ctx.lineTo(parallaxX + 420 * scale, height - 330 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(parallaxX - 380 * scale, height - 260 * scale); ctx.lineTo(parallaxX + 380 * scale, height - 260 * scale); ctx.stroke();
  }

  // Skeletal Shrine Centerpiece
  const shrineX = width / 2 - camera.x * 0.15;
  
  // Shrine Roofs
  ctx.fillStyle = '#030000';
  ctx.beginPath();
  ctx.moveTo(shrineX, height - 500); // Tip
  ctx.lineTo(shrineX + 300, height - 250);
  ctx.lineTo(shrineX + 200, height - 150);
  ctx.lineTo(shrineX - 200, height - 150);
  ctx.lineTo(shrineX - 300, height - 250);
  ctx.fill();

  // Rib cage framing (Breathing animation)
  ctx.strokeStyle = '#1a0000';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const breathing = Math.sin(time * 2.5 + i) * 15;
    ctx.beginPath();
    ctx.moveTo(shrineX + 100, height - 350 + i * 30);
    ctx.quadraticCurveTo(shrineX + 300 + i * 20 + breathing, height - 250, shrineX + 150 + i * 15, height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(shrineX - 100, height - 350 + i * 30);
    ctx.quadraticCurveTo(shrineX - 300 - i * 20 - breathing, height - 250, shrineX - 150 - i * 15, height);
    ctx.stroke();
  }

  // Rippling Sea of Blood (Foreground)
  ctx.fillStyle = 'rgba(160, 0, 0, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width; x += 40) {
    const wave = Math.sin(x * 0.015 + time * 5) * 18 + Math.cos(x * 0.04 - time * 3) * 12;
    ctx.lineTo(x, height - 100 + wave);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  
  // Blood Highlights
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.2)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 40) {
    const wave = Math.sin(x * 0.015 + time * 5) * 18 + Math.cos(x * 0.04 - time * 3) * 12;
    if(x === 0) ctx.moveTo(x, height - 90 + wave);
    else ctx.lineTo(x, height - 90 + wave);
  }
  ctx.stroke();
}
