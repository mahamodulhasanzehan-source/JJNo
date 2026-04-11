import { Vector2 } from '../../game/Types';
import { Entity } from '../../game/Entity';

export function handleSukunaDomainInput(
  dt: number,
  isOwnerPlayer: boolean,
  player: Entity,
  abonant: Entity,
  mouseJustPressed: boolean,
  isMouseDown: boolean,
  mouseJustReleased: boolean,
  mouseX: number,
  mouseY: number,
  camera: Vector2,
  sukunaSlashesRemaining: number,
  setSukunaSlashesRemaining: (val: number) => void,
  sukunaCurrentLine: { start: Vector2, end: Vector2 } | null,
  setSukunaCurrentLine: (val: { start: Vector2, end: Vector2 } | null) => void,
  sukunaSlashes: { p1: Vector2, p2: Vector2, timer: number }[],
  lineRectCollide: (p1: Vector2, p2: Vector2, rect: any) => boolean,
  triggerShake: (val: number) => void,
  setImpactFrameTimer: (val: number) => void,
  playSound: () => void,
  slashRateLimitTimer: number,
  setSlashRateLimitTimer: (val: number) => void
) {
  const target = isOwnerPlayer ? abonant : player;
  target.takeDamage((5 * dt) / 1000); // 5 DMG/sec passive DoT

  if (slashRateLimitTimer > 0) {
    setSlashRateLimitTimer(slashRateLimitTimer - dt);
  }

  if (isOwnerPlayer) {
    if (mouseJustPressed && sukunaSlashesRemaining > 0 && slashRateLimitTimer <= 0) {
      setSukunaCurrentLine({
        start: { x: mouseX + camera.x, y: mouseY + camera.y },
        end: { x: mouseX + camera.x, y: mouseY + camera.y }
      });
    } else if (isMouseDown && sukunaCurrentLine) {
      setSukunaCurrentLine({
        start: sukunaCurrentLine.start,
        end: { x: mouseX + camera.x, y: mouseY + camera.y }
      });
    } else if (mouseJustReleased && sukunaCurrentLine) {
      const hit = lineRectCollide(sukunaCurrentLine.start, sukunaCurrentLine.end, abonant.getRect());
      if (hit) {
         abonant.takeDamage(14.4); // Doubled from 7.2
      }
      setSukunaSlashesRemaining(sukunaSlashesRemaining - 1);
      setSlashRateLimitTimer(500); // 500ms rate limit (2 per second)
      sukunaSlashes.push({
        p1: { ...sukunaCurrentLine.start },
        p2: { ...sukunaCurrentLine.end },
        timer: 300
      });
      setImpactFrameTimer(50); // 50ms impact frames
      triggerShake(10);
      playSound();
      setSukunaCurrentLine(null);
    }
  } else {
    // AI Sukuna targets player automatically
    if (sukunaSlashesRemaining > 0 && Math.random() < 0.05 && slashRateLimitTimer <= 0) {
      const p1 = { x: player.pos.x + player.width/2 + (Math.random() - 0.5) * 100, y: player.pos.y + player.height/2 + (Math.random() - 0.5) * 100 };
      const p2 = { x: player.pos.x + player.width/2 + (Math.random() - 0.5) * 100, y: player.pos.y + player.height/2 + (Math.random() - 0.5) * 100 };
      
      if (lineRectCollide(p1, p2, player.getRect())) {
         player.takeDamage(14.4); // Doubled from 7.2
         setSukunaSlashesRemaining(sukunaSlashesRemaining - 1);
         setSlashRateLimitTimer(500); // 500ms rate limit
         sukunaSlashes.push({
           p1: { ...p1 },
           p2: { ...p2 },
           timer: 300
         });
         setImpactFrameTimer(50);
         triggerShake(10);
         playSound();
      }
    }
  }
}
