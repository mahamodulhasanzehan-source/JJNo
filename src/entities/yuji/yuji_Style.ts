import { Vector2 } from '../../game/Types';

export function drawYujiDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
  const time = Date.now() * 0.001;

  // Deep grungy underground / Concrete void
  const bgGrad = ctx.createRadialGradient(width/2, height, 0, width/2, height, height * 1.5);
  bgGrad.addColorStop(0, '#11111a');
  bgGrad.addColorStop(0.6, '#08080a');
  bgGrad.addColorStop(1, '#020202');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background Chainlink Fence (Parallax, slightly darker & thinner)
  ctx.strokeStyle = 'rgba(25, 25, 35, 0.5)';
  ctx.lineWidth = 2;
  const bgOffsetX = (camera.x * 0.15) % 80;
  for (let i = -height; i < width + height; i += 80) {
    ctx.beginPath(); ctx.moveTo(i - bgOffsetX, 0); ctx.lineTo(i - height - bgOffsetX, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i - bgOffsetX, 0); ctx.lineTo(i + height - bgOffsetX, height); ctx.stroke();
  }

  // Volumetric Swaying Spotlights from the ceiling
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    const sway = Math.sin(time * 0.8 + i * 2.5) * 0.25; // Dramatic sway
    const spotX = width * (0.15 + i * 0.25) - (camera.x * 0.08);
    
    ctx.translate(spotX, -80);
    ctx.rotate(sway);
    
    const spotGrad = ctx.createLinearGradient(0, 0, 0, height);
    spotGrad.addColorStop(0, `rgba(255, 255, 220, 0.15)`);
    spotGrad.addColorStop(0.5, `rgba(255, 255, 240, 0.06)`);
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(250, height * 1.3);
    ctx.lineTo(-250, height * 1.3);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Floating Dust/Sweat/Blood Motes caught in the light
  ctx.fillStyle = 'rgba(220, 220, 255, 0.6)';
  for (let i = 0; i < 200; i++) {
    const mx = (Math.sin(i * 555) * width * 2 + time * 40 + camera.x * 0.4) % width;
    const my = (Math.cos(i * 444) * height * 2 - time * 70) % height;
    
    const adjMx = mx < 0 ? mx + width : mx;
    const adjMy = my < 0 ? my + height : my;
    
    // Motes are only visible if they enter the "light cones" (approximated by height & sine waves)
    if (adjMy > height * 0.15 && Math.sin(adjMx * 0.015 + time) > -0.2) {
        ctx.fillRect(adjMx, adjMy, 2, 2 + i % 2);
    }
  }

  // Foreground Chainlink Fence (Massive, strong parallax, dark silhouette for depth)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = 12;
  const fgOffsetX = (camera.x * 0.7) % 200;
  for (let i = -height; i < width + height; i += 200) {
    ctx.beginPath(); ctx.moveTo(i - fgOffsetX, 0); ctx.lineTo(i - height - fgOffsetX, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i - fgOffsetX, 0); ctx.lineTo(i + height - fgOffsetX, height); ctx.stroke();
  }
}
