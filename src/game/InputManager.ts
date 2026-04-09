export class InputManager {
  keys: Record<string, boolean> = {};
  mouse: { x: number; y: number; isDown: boolean } = { x: 0, y: 0, isDown: false };

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'Shift') this.keys['shift'] = true;
      if (e.key === ' ') this.keys['space'] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') this.keys['shift'] = false;
      if (e.key === ' ') this.keys['space'] = false;
    });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', () => (this.mouse.isDown = true));
    window.addEventListener('mouseup', () => (this.mouse.isDown = false));
  }

  isKeyDown(key: string): boolean {
    return !!this.keys[key.toLowerCase()];
  }
}
