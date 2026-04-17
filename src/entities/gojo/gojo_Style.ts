import { Vector2 } from '../../game/Types';

export function drawGojoDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2, whiteFlashTimer: number) {
  if (whiteFlashTimer > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${whiteFlashTimer / 500})`;
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
}
