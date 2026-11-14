export function createInput(canvas, S) {
  const look = { x: 0, y: 0 };
  const input = {
    keys: new Set(),
    mouseDX: 0,
    mouseDY: 0,
    mouseButtons: 0,
    locked: false,
    actions: [],
    pressed: new Set(),
    consumeLook() {
      look.x = this.mouseDX; look.y = this.mouseDY;
      this.mouseDX = 0;
      this.mouseDY = 0;
      return look;
    },
  };
  const keydown = (event) => {
    if (event.repeat) return;
    input.keys.add(event.code);
    input.pressed.add(event.code);
    if (event.code === 'KeyR') input.actions.push('reload');
    if (event.code === 'Digit1') input.actions.push('pistol');
    if (event.code === 'Digit2') input.actions.push('rifle');
    if (event.code === 'Digit3') input.actions.push('smg');
    if (event.code === 'Digit4') input.actions.push('he');
    if (event.code === 'Digit5') input.actions.push('smoke');
    if (event.code === 'KeyE') input.actions.push('plant');
    if (event.code === 'KeyB') input.actions.push('buy');
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  };
  const keyup = (event) => input.keys.delete(event.code);
  const mousemove = (event) => {
    if (!input.locked) return;
    input.mouseDX += event.movementX || 0;
    input.mouseDY += event.movementY || 0;
  };
  const pointerchange = () => {
    input.locked = document.pointerLockElement === canvas;
    if (!input.locked && !S.shotMode) S.events.push({ type: 'pointerlock-lost' });
  };
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', keyup);
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('pointerlockchange', pointerchange);
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) input.mouseButtons |= 1;
    if (!S.shotMode && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  });
  addEventListener('mouseup', (event) => { if (event.button === 0) input.mouseButtons &= ~1; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  input.dispose = () => {
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('keyup', keyup);
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('pointerlockchange', pointerchange);
  };
  return input;
}
