export type CharacterType = 'Gojo' | 'Sukuna' | 'Yuji';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  player: any;
  abonant: any;
  particles: any[];
  projectiles: any[];
  domainManager: any;
  camera: Vector2;
  screenShake: number;
  chromaticAberration: number;
}
