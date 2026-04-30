import { Vector2 } from '../../game/Types';

export function drawGojoDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2, whiteFlashTimer: number) {
  if (whiteFlashTimer > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${whiteFlashTimer / 500})`;
    ctx.fillRect(0, 0, width, height);
  } else {
    const time = Date.now() * 0.001;

    // Base Void Environment
    ctx.fillStyle = '#02000a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    
    // 1. Swirling Galactic Vectors (Parallax)
    const cx = width / 2 - (camera.x * 0.05);
    const cy = height / 2 - (camera.y * 0.05);
    ctx.translate(cx, cy);
    for (let i = 0; i < 45; i++) {
      ctx.rotate(time * 0.05 + i * 0.1);
      ctx.beginPath();
      ctx.ellipse(0, 0, 200 + i * 50, 50 + i * 15, time * 0.1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(138, 43, 226, ${0.15 - i * 0.003})`;
      ctx.lineWidth = 1.5 + i * 0.1;
      ctx.stroke();
    }
    ctx.restore();

    // 2. "Information Overload" - Infinite Matrix-like data streams
    for (let i = 0; i < 180; i++) {
      const x = (Math.sin(i * 342.1) * width * 2 + time * 150 * (i % 3 + 1) + camera.x * 0.2) % width;
      const y = (Math.cos(i * 123.4) * height * 2 - time * 250 * (i % 2 + 1)) % height;
      const size = 1 + (i % 3);
      
      const adjX = x < 0 ? x + width : x;
      const adjY = y < 0 ? y + height : y;
      
      ctx.fillStyle = Math.random() > 0.95 ? '#ffffff' : `rgba(100, 220, 255, ${0.3 + (i % 5) * 0.1})`;
      ctx.fillRect(adjX, adjY, size, size * (10 + i % 25));
    }

    // 3. The Core/Eye of the Void
    ctx.save();
    ctx.translate(width / 2, height / 2);
    
    // Intense Eye Glow
    const pulse = Math.sin(time * 3) * 20;
    const eyeGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 200 + pulse);
    eyeGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    eyeGrad.addColorStop(0.15, 'rgba(100, 200, 255, 0.9)');
    eyeGrad.addColorStop(0.4, 'rgba(138, 43, 226, 0.5)');
    eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = eyeGrad;
    ctx.fillRect(-300 - pulse, -300 - pulse, 600 + pulse * 2, 600 + pulse * 2);
    
    // Core Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(time * 6) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
