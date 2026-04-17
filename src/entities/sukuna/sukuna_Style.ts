// Separate visual styling and drawing logic for Sukuna

import { Vector2 } from '../../game/Types';

export function drawSukunaDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
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
}
