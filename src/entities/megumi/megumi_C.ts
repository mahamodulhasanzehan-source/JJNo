import { Entity } from '../../game/Entity';
import { Mahoraga } from '../mahoraga/Mahoraga';

export function handleMegumiSummonMahoraga(player: Entity, target: Entity): Mahoraga {
  player.hasSpawnedMahoraga = true;
  const spawnX = player.pos.x + (player.facingRight ? 120 : -120);
  const mahoraga = new Mahoraga(spawnX, player.pos.y, player.id, player.facingRight);
  return mahoraga;
}
