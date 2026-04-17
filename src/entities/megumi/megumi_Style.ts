import { Vector2 } from '../../game/Types';

export function drawMegumiDomainBackground(ctx: CanvasRenderingContext2D, width: number, height: number, camera: Vector2) {
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
}
