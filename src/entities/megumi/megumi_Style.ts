import { Vector2 } from '../../game/Types';

export function drawMegumiDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
  const time = Date.now() * 0.001;

  // Base pitch black environment with suffocating deep teal glow
  const bgGrad = ctx.createRadialGradient(width/2, height, 0, width/2, height, height * 1.3);
  bgGrad.addColorStop(0, '#002222'); // Dark abyssal teal
  bgGrad.addColorStop(1, '#000000'); // Pure black void
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Inverse Gravity Particles (Shadow Spores / Liquid droplets flying up)
  ctx.fillStyle = 'rgba(0, 255, 180, 0.45)';
  for (let i = 0; i < 70; i++) {
    const px = (Math.sin(i * 77) * width + camera.x * 0.2) % width;
    const py = (height - (time * 180 * (i % 3 + 1) + i * 30)) % height;
    const adjPx = px < 0 ? px + width : px;
    const adjPy = py < 0 ? py + height : py;
    
    ctx.beginPath();
    ctx.arc(adjPx, adjPy, 1 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant lurking shadow eyes (Toads/Dogs observing)
  for (let i = 0; i < 6; i++) {
    const eyeX = (Math.sin(i * 123 + time * 0.5) * width/3 + width/2 - camera.x * 0.1) % width;
    const eyeY = height * 0.35 + Math.cos(i * 45 + time * 0.8) * 120;
    const alpha = Math.max(0, Math.sin(time * 1.5 + i * 2)); // Fade in and out menacingly
    
    ctx.fillStyle = `rgba(0, 255, 120, ${alpha * 0.9})`;
    const adjEyeX = eyeX < 0 ? eyeX + width : eyeX;
    
    // Draw slit-like twin eyes
    ctx.beginPath(); ctx.ellipse(adjEyeX - 18, eyeY, 10, 3, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(adjEyeX + 18, eyeY, 10, 3, -0.1, 0, Math.PI * 2); ctx.fill();
  }

  // Massive Spinal Cord / Shadow Roots structure looming
  ctx.strokeStyle = 'rgba(0, 15, 15, 0.95)';
  ctx.lineWidth = 55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const spineX = width / 2 - camera.x * 0.18;
  ctx.beginPath();
  ctx.moveTo(spineX, -100);
  for (let y = 0; y <= height; y += 80) {
    const sSway = Math.sin(y * 0.015 + time * 1.2) * 60;
    ctx.lineTo(spineX + sSway, y);
  }
  ctx.stroke();
  
  // Rib branches off the spine
  ctx.lineWidth = 15;
  for (let y = 100; y < height; y += 120) {
    const sSway = Math.sin(y * 0.015 + time * 1.2) * 60;
    ctx.beginPath(); ctx.moveTo(spineX + sSway, y); ctx.lineTo(spineX + sSway - 300, y - 80 + Math.cos(time)*20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(spineX + sSway, y); ctx.lineTo(spineX + sSway + 300, y - 80 + Math.sin(time)*20); ctx.stroke();
  }

  // Liquid Shadow Ocean Floor
  ctx.fillStyle = '#030303';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width; x += 40) {
    const wave = Math.sin(x * 0.012 + time * 3.5) * 25 + Math.cos(x * 0.025 - time * 2) * 18;
    ctx.lineTo(x, height - 160 + wave);
  }
  ctx.lineTo(width, height);
  ctx.fill();

  // Floor Reflection Highlights (Cyan/Teal edges on the shadow fluid)
  ctx.strokeStyle = 'rgba(0, 255, 180, 0.15)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 40) {
    const wave = Math.sin(x * 0.012 + time * 3.5) * 25 + Math.cos(x * 0.025 - time * 2) * 18;
    if (x === 0) ctx.moveTo(x, height - 150 + wave);
    else ctx.lineTo(x, height - 150 + wave);
  }
  ctx.stroke();
}
