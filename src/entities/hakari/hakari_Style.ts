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
  
  if (hakariState === 'rolling') {
    const symbols = ['7', 'BAR', 'CHERRY', 'BELL', 'DIAMOND'];
    const s1 = symbols[Math.floor(Date.now() / 100) % symbols.length];
    const s2 = symbols[Math.floor(Date.now() / 120) % symbols.length];
    const s3 = symbols[Math.floor(Date.now() / 150) % symbols.length];
    
    ctx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ffff00';
    ctx.fillText(`${s1} | ${s2} | ${s3}`, width / 2, height / 2);
  } else if (hakariState === 'jackpot') {
    ctx.fillStyle = '#00ff00';
    let text = "JACKPOT!";
    if (hakariBuff === 'infinite_ce') text = "INFINITE CE!";
    if (hakariBuff === 'invulnerable') text = "INVULNERABLE!";
    if (hakariBuff === 'mimicry') text = "MIMICRY!";
    ctx.fillText(text, width / 2, height / 2);
  }
}
