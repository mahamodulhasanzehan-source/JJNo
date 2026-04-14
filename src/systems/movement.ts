import { InputManager } from '../game/InputManager';
import { Vector2, CharacterType } from '../game/Types';

export const STAMINA_MAX = 3000;
export const STAMINA_RECOVERY_RATE = 0.2; // 1s per 5s -> 1000ms per 5000ms
export const STAMINA_PENALTY_DURATION = 3000;

export function handlePlayerMovement(
  dt: number,
  input: InputManager,
  vel: Vector2,
  isGrounded: boolean,
  stamina: number,
  staminaPenaltyTimer: number,
  slowTimer: number,
  stunTimer: number,
  latencyTimer: number,
  isYujiDomainActive: boolean,
  characterType: CharacterType
): { newVel: Vector2, newStamina: number, newStaminaPenaltyTimer: number, facingRight: boolean | null } {
  let newVel = { ...vel };
  let newStamina = stamina;
  let newStaminaPenaltyTimer = staminaPenaltyTimer;
  let facingRight: boolean | null = null;

  // Handle latency (simplified: we just ignore input if latency is high, though true latency would queue inputs)
  if (latencyTimer > 0) {
    return { newVel, newStamina, newStaminaPenaltyTimer, facingRight };
  }

  if (stunTimer <= 0) {
    let speed = 5;
    if (characterType === 'Gojo') speed *= 1.1; // Gojo is 10% faster
    if (isYujiDomainActive) speed *= 1.2; // Yuji is 20% faster in his domain
    if (slowTimer > 0) speed *= 0.7; // 30% slow

    const isSprinting = input.isKeyDown('shift') && newStamina > 0 && newStaminaPenaltyTimer <= 0;
    
    if (isSprinting) {
      speed *= 1.8;
      // Yuji Infinite Stamina during domain
      if (!isYujiDomainActive) {
         newStamina -= dt;
      }
      if (newStamina <= 0) {
        newStamina = 0;
        newStaminaPenaltyTimer = STAMINA_PENALTY_DURATION;
      }
    } else {
      if (newStaminaPenaltyTimer <= 0) {
        newStamina = Math.min(STAMINA_MAX, newStamina + dt * STAMINA_RECOVERY_RATE);
      }
    }

    if (input.isKeyDown('a')) {
      newVel.x = -speed;
      facingRight = false;
    } else if (input.isKeyDown('d')) {
      newVel.x = speed;
      facingRight = true;
    }

    if (input.isKeyDown(' ') && isGrounded) {
      newVel.y = -12;
    }
  }

  return { newVel, newStamina, newStaminaPenaltyTimer, facingRight };
}
