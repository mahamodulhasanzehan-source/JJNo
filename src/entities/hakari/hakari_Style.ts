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

  // Vibrant shifting casino background
  const hue = (time * 50) % 360;
  ctx.fillStyle = `hsl(${hue}, 80%, 10%)`;
  ctx.fillRect(0, 0, width, height);
  
  // Moving Grid (Vaporwave/Casino style)
  ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 0.4)`;
  ctx.lineWidth = 3;
  const gridOffset = (time * 100) % 50;
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i - (camera.x % 50), 0); ctx.lineTo(i - (camera.x % 50), height); ctx.stroke();
  }
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i + gridOffset); ctx.lineTo(width, i + gridOffset); ctx.stroke();
  }

  // Falling Pachinko Balls
  ctx.fillStyle = '#C0C0C0'; // Silver
  for (let i = 0; i < 40; i++) {
    const px = (Math.sin(i * 11) * width + camera.x * 0.3) % width;
    const py = (Math.cos(i * 22) * height + time * 300 + i * 50) % height;
    const adjPx = px < 0 ? px + width : px;
    const adjPy = py < 0 ? py + height : py;
    
    ctx.beginPath();
    ctx.arc(adjPx, adjPy, 8 + i % 5, 0, Math.PI * 2);
    ctx.fill();
    // Shine on ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(adjPx - 2, adjPy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C0C0C0';
  }

  // Train Doors Sliding Logic (Abstract representation)
  const doorPhase = Math.sin(time * 2);
  const doorOpenness = Math.max(0, doorPhase) * 200; // 0 to 200px open
  ctx.fillStyle = `hsla(${hue}, 60%, 20%, 0.8)`;
  ctx.fillRect(0, 0, width / 2 - doorOpenness - (camera.x * 0.1), height);
  ctx.fillRect(width / 2 + doorOpenness - (camera.x * 0.1), 0, width / 2, height);
  
  // Door edges
  ctx.fillStyle = '#ffd700'; // Gold trim
  ctx.fillRect(width / 2 - doorOpenness - (camera.x * 0.1) - 10, 0, 10, height);
  ctx.fillRect(width / 2 + doorOpenness - (camera.x * 0.1), 0, 10, height);

  // Slot machine UI overlay (Centerpiece)
  const slotWidth = 700;
  const slotHeight = 220;
  const slotX = width / 2 - slotWidth / 2;
  const slotY = height / 2 - slotHeight / 2 - 150; // Moved up a bit

  // Glossy Machine Body
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.fillRect(slotX, slotY, slotWidth, slotHeight);
  
  // Neon Border
  ctx.strokeStyle = `hsl(${(hue + 90) % 360}, 100%, 60%)`;
  ctx.lineWidth = 6;
  ctx.strokeRect(slotX, slotY, slotWidth, slotHeight);

  ctx.font = 'bold 70px "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (hakariState === 'rolling') {
    const symbols = ['7', '💎', '🍒', '🔔', 'BAR'];
    const speed1 = 50; const speed2 = 80; const speed3 = 110;
    const s1 = symbols[Math.floor(Date.now() / speed1) % symbols.length];
    const s2 = symbols[Math.floor(Date.now() / speed2) % symbols.length];
    const s3 = symbols[Math.floor(Date.now() / speed3) % symbols.length];
    
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.fillText(`${s1} | ${s2} | ${s3}`, width / 2, slotY + slotHeight / 2);
    
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`PROBABILITIES SHIFTING... ${(hakariRollTimer/1000).toFixed(1)}s`, width / 2, slotY + slotHeight + 30);
    
  } else if (hakariState === 'jackpot') {
    // Crazy Jackpot Flashing
    const flash = Math.floor(time * 15) % 2 === 0;
    ctx.fillStyle = flash ? '#ffd700' : '#ff1493';
    
    // Massive text
    ctx.font = 'italic bold 90px "Impact", sans-serif';
    ctx.fillText('JACKPOT!', width / 2, slotY + slotHeight / 2 - 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    let text = "BONUS!";
    if (hakariBuff === 'infinite_ce') text = "INFINITE CURSED ENERGY (4min 11s)";
    if (hakariBuff === 'invulnerable') text = "INVULNERABILITY FRAME SHIFT";
    if (hakariBuff === 'mimicry') text = "COORDINATE MIMICRY ACQUIRED";
    ctx.fillText(text, width / 2, slotY + slotHeight / 2 + 40);

    // Exploding confetti
    for(let i=0; i<30; i++) {
        const cx = width/2 + Math.cos(i*123 + time*5)*300;
        const cy = slotY + Math.sin(i*321 + time*4)*200;
        ctx.fillStyle = `hsl(${i*30}, 100%, 50%)`;
        ctx.fillRect(cx, cy, 10, 10);
    }
  }
}
