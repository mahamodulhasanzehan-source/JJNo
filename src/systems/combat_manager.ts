import { CharacterType } from '../game/Types';

export const ENERGY_MAX = 100;
export const ENERGY_PASSIVE_REGEN = 7; // 7 per sec

export function updateCombatStats(
  dt: number,
  energy: number,
  staminaPenaltyTimer: number,
  phaseTimer: number,
  stunTimer: number,
  latencyTimer: number,
  slowTimer: number,
  secondaryHitTimer: number,
  bleedTimer: number,
  brainDamageTimer: number,
  hp: number,
  bleedDamage: number
) {
  let newEnergy = Math.min(ENERGY_MAX, energy + ENERGY_PASSIVE_REGEN * (dt / 1000));
  let newStaminaPenaltyTimer = staminaPenaltyTimer > 0 ? staminaPenaltyTimer - dt : 0;
  let newPhaseTimer = phaseTimer > 0 ? phaseTimer - dt : 0;
  let newStunTimer = stunTimer > 0 ? stunTimer - dt : 0;
  let newLatencyTimer = latencyTimer > 0 ? latencyTimer - dt : 0;
  let newSlowTimer = slowTimer > 0 ? slowTimer - dt : 0;
  let newBrainDamageTimer = brainDamageTimer > 0 ? brainDamageTimer - dt : 0;
  
  let newHp = hp;
  let newSecondaryHitTimer = secondaryHitTimer;
  let newBleedTimer = bleedTimer;

  if (secondaryHitTimer > 0) {
    newSecondaryHitTimer -= dt;
    if (newSecondaryHitTimer <= 0) {
      newHp -= 3; // Secondary hit damage
    }
  }

  if (bleedTimer > 0) {
    newBleedTimer -= dt;
    if (newBleedTimer <= 0) {
      newHp -= bleedDamage;
    }
  }

  return {
    newEnergy,
    newStaminaPenaltyTimer,
    newPhaseTimer,
    newStunTimer,
    newLatencyTimer,
    newSlowTimer,
    newBrainDamageTimer,
    newHp,
    newSecondaryHitTimer,
    newBleedTimer
  };
}

export function calculateDamage(
  amount: number,
  phaseTimer: number,
  characterType: CharacterType,
  isDomainActive: boolean,
  domainType: CharacterType | null,
  domainOwnerId: string | null,
  entityId: string
): number {
  if (phaseTimer > 0) return 0; // Invulnerable
  
  if (isDomainActive && domainOwnerId === entityId) {
    if (characterType === 'Yuji' && domainType === 'Yuji') {
      return amount * 0.75; // 25% Damage Resistance
    }
    if ((characterType === 'Gojo' && domainType === 'Gojo') || 
        (characterType === 'Sukuna' && domainType === 'Sukuna')) {
      return amount * 0.85; // 15% Damage Resistance
    }
  }
  return amount;
}
