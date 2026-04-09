import { Entity } from '../../game/Entity';

export function applySukunaQ(target: Entity, isPlayer: boolean, setBlur: (val: number) => void) {
  target.bleedTimer = 3000;
  target.bleedDamage = 5;
  if (isPlayer) {
    setBlur(20);
  }
}
