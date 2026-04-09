import { Vector2 } from '../../game/Types';
import { Entity } from '../../game/Entity';

export function handleGojoDomainInput(
  isOwnerPlayer: boolean,
  player: Entity,
  abonant: Entity,
  mouseJustPressed: boolean,
  isMouseDown: boolean,
  mouseX: number,
  mouseY: number,
  camera: Vector2,
  purpleVectors: { start: Vector2, end: Vector2 }[]
) {
  // Freeze AI
  abonant.vel.x = 0;
  abonant.vel.y = 0;
  // Freeze Player movement but allow targeting
  player.vel.x = 0;
  player.vel.y = 0;
  
  if (isOwnerPlayer) {
    if (mouseJustPressed && purpleVectors.length < 5) {
      purpleVectors.push({
        start: { x: player.pos.x + player.width/2, y: player.pos.y + player.height/2 },
        end: { x: mouseX + camera.x, y: mouseY + camera.y }
      });
    } else if (isMouseDown && purpleVectors.length > 0) {
      purpleVectors[purpleVectors.length - 1].end = {
        x: mouseX + camera.x, y: mouseY + camera.y
      };
    }
  } else {
    // AI Gojo targets player automatically
    if (purpleVectors.length < 5 && Math.random() < 0.05) {
      purpleVectors.push({
        start: { x: abonant.pos.x + abonant.width/2, y: abonant.pos.y + abonant.height/2 },
        end: { x: player.pos.x + player.width/2 + (Math.random() - 0.5) * 100, y: player.pos.y + player.height/2 + (Math.random() - 0.5) * 100 }
      });
    }
  }
}

export function applyGojoDomainCollapse(
  player: Entity,
  abonant: Entity,
  isOwnerPlayer: boolean,
  playSound: () => void
) {
  const target = isOwnerPlayer ? abonant : player;
  target.slowTimer = 3000; // 30% slow for 3s
  playSound();
}
