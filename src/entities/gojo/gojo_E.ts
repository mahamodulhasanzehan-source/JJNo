import { Entity } from '../../game/Entity';

export function applyGojoE(target: Entity) {
  target.latencyTimer = 1000;
}
