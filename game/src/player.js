import { PHASES } from './state.js';
import { collideMove } from './world.js';

const direction = { x: 0, z: 0 };
const spawns = [{ x: 0, y: 0, z: 14 }, { x: -2.2, y: 0, z: 14 }, { x: 2.2, y: 0, z: 14 }];
let world = null;

export function setPlayerWorld(worldData) { world = worldData; }
export function eyeHeight(S) { return S.player.crouch ? 1.05 : 1.62; }
export function moveFactor(S) {
  const speed = Math.hypot(S.player.vel.x, S.player.vel.z);
  return Math.min(1, speed / (S.player.crouch ? 1.8 : 4.2));
}

export function stepPlayer(S, input, dt) {
  const p = S.player;
  const look = input.consumeLook();
  p.yaw += -look.x * 0.0022;
  p.pitch = Math.max(-1.5, Math.min(1.5, p.pitch - look.y * 0.0022));
  p.recoil = Math.max(0, p.recoil - 8 * dt);
  p.crouch = input.keys.has('ControlLeft') || input.keys.has('ControlRight') || input.keys.has('KeyC');
  if (p.hp <= 0 && p.alive) {
    p.alive = false;
    S.events.push({ type: 'player-died' });
  }
  if (!p.alive || S.phase !== PHASES.LIVE) return;

  const forward = (input.keys.has('KeyW') ? 1 : 0) - (input.keys.has('KeyS') ? 1 : 0);
  const strafe = (input.keys.has('KeyD') ? 1 : 0) - (input.keys.has('KeyA') ? 1 : 0);
  const length = Math.hypot(forward, strafe) || 1;
  direction.x = (-Math.sin(p.yaw) * forward + Math.cos(p.yaw) * strafe) / length;
  direction.z = (-Math.cos(p.yaw) * forward - Math.sin(p.yaw) * strafe) / length;
  const moving = forward !== 0 || strafe !== 0;
  const speed = p.crouch ? 1.8 : 4.2;
  const accel = moving ? 40 : 30;
  const tx = moving ? direction.x * speed : 0;
  const tz = moving ? direction.z * speed : 0;
  const change = Math.min(1, accel * dt);
  p.vel.x += (tx - p.vel.x) * change;
  p.vel.z += (tz - p.vel.z) * change;
  p.moveFactor = Math.min(1, Math.hypot(p.vel.x, p.vel.z) / speed);
  p.spread = p.moveFactor * 0.02 + p.recoil * 0.02;
  if (world) collideMove(p.pos, 0.3, p.crouch ? 1.1 : 1.7, p.vel, dt, world.colliders);
  else { p.pos.x += p.vel.x * dt; p.pos.z += p.vel.z * dt; }
}

export function respawnPlayer(S) {
  const p = S.player;
  Object.assign(p.pos, spawns[0]);
  p.vel.x = 0; p.vel.y = 0; p.vel.z = 0;
  p.hp = 100; p.alive = true; p.yaw = 0; p.pitch = 0; p.crouch = false; p.recoil = 0;
}
