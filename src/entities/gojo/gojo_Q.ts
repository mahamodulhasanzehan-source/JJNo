import { Entity } from '../../game/Entity';

export function applyGojoQ(target: Entity) {
  target.slowTimer = 1000;
}
