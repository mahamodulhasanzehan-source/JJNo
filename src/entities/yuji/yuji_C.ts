import { Entity } from '../../game/Entity';

export function applyYujiDomainBuffs(entity: Entity) {
  // Yuji's domain buffs are handled implicitly in takeDamage (25% resistance)
  // and in cooldown reduction logic in Player/Abonant updates.
  // This file serves as a placeholder for future explicit Yuji domain logic.
}
