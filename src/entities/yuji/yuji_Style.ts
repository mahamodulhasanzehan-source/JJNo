import { Vector2 } from '../../game/Types';

export function drawYujiDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
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
