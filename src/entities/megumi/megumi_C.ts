import { Entity } from '../../game/Entity';

export function handleMegumiDomainInput(player: Entity, domainManager: any) {
  // Activate Domain Expansion: Chimera Shadow Garden
  domainManager.active = true;
  domainManager.type = 'Megumi';
  domainManager.ownerId = player.id;
  domainManager.timer = 10000; // 10 seconds
  
  // Initialize Shikigami
  domainManager.shikigami = {
    nue: [
      { x: player.pos.x - 100, y: player.pos.y - 150, timer: 0 },
      { x: player.pos.x + 100, y: player.pos.y - 150, timer: 0 }
    ],
    dogs: [
      { x: player.pos.x - 50, y: player.pos.y, state: 'idle', cooldown: 0, dashTimer: 0, startX: 0, targetX: 0 },
      { x: player.pos.x + 50, y: player.pos.y, state: 'idle', cooldown: 0, dashTimer: 0, startX: 0, targetX: 0 }
    ]
  };
}
