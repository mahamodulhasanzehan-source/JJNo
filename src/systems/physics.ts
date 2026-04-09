import { Vector2, Rect } from '../game/Types';

export const GRAVITY = 0.5;
export const FRICTION = 0.8;
export const TERMINAL_VELOCITY = 20;

export function applyPhysics(
  pos: Vector2,
  vel: Vector2,
  width: number,
  height: number,
  dt: number,
  groundY: number,
  isGrounded: boolean,
  phaseTimer: number
): { newPos: Vector2, newVel: Vector2, newIsGrounded: boolean } {
  const timeScale = dt / 16.66;
  
  let newVel = { ...vel };
  let newPos = { ...pos };
  let newIsGrounded = isGrounded;

  // Gravity
  newVel.y += GRAVITY * timeScale;
  if (newVel.y > TERMINAL_VELOCITY) newVel.y = TERMINAL_VELOCITY;
  
  // Friction
  if (phaseTimer <= 0) {
    if (newIsGrounded) {
      // Ground friction
      const currentFriction = Math.abs(newVel.x) > 15 ? Math.pow(FRICTION, 0.5) : FRICTION;
      newVel.x *= Math.pow(currentFriction, timeScale);
    } else {
      // Air friction
      newVel.x *= Math.pow(0.95, timeScale);
    }
    if (Math.abs(newVel.x) < 0.1) newVel.x = 0;
  }
  
  newPos.x += newVel.x * timeScale;
  newPos.y += newVel.y * timeScale;
  
  // Ground collision
  if (newPos.y + height >= groundY) {
    newPos.y = groundY - height;
    newVel.y = 0;
    newIsGrounded = true;
  } else {
    newIsGrounded = false;
  }
  
  // Screen bounds (simple)
  if (newPos.x < 0) newPos.x = 0;
  if (newPos.x > 2000) newPos.x = 2000;

  return { newPos, newVel, newIsGrounded };
}

export function rectCollide(r1: Rect, r2: Rect): boolean {
  return !(r2.x > r1.x + r1.width || 
           r2.x + r2.width < r1.x || 
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

export function lineRectCollide(p1: Vector2, p2: Vector2, rect: Rect): boolean {
  // Simple AABB vs Line segment collision
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < rect.x || minX > rect.x + rect.width) return false;
  if (maxY < rect.y || minY > rect.y + rect.height) return false;

  return true; // Simplified for performance
}
