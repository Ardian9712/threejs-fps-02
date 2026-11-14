import { moveFactor } from './player.js';
import { segmentBlocked } from './world.js';
import { throwGrenade } from './grenades.js';

export const WEAPONS = Object.freeze({
  pistol: { name: 'Slag P9', damage: 30, headMult: 3, mag: 12, reserve: 36, rate: 0.3, reload: 1.4, baseSpread: 0.008, moveSpread: 0.018, recoil: 0.014, auto: false },
  rifle: { name: 'VK-7 Foundry', cost: 2700, damage: 32, headMult: 4, mag: 25, reserve: 75, rate: 0.1, reload: 2.2, baseSpread: 0.004, moveSpread: 0.025, recoil: 0.011, auto: true },
  smg: { name: 'Spark-9', cost: 1500, damage: 22, headMult: 2.5, mag: 30, reserve: 90, rate: 0.075, reload: 1.8, baseSpread: 0.01, moveSpread: 0.03, recoil: 0.008, auto: true },
  he: { name: 'HE Grenade', cost: 300 }, smoke: { name: 'Smoke', cost: 300 },
});

const dir = { x: 0, y: 0, z: 0 };
const origin = { x: 0, y: 0, z: 0 };
const end = { x: 0, y: 0, z: 0 };
const bestPoint = { x: 0, y: 0, z: 0 };
const hitResult = { hit: 'none', dist: 0, point: bestPoint, head: false, target: null };
let world = null;
export function setWeaponWorld(data) { world = data; }

function rayCylinder(from, direction, target) {
  const dx = target.pos.x - from.x, dz = target.pos.z - from.z;
  const b = dx * direction.x + dz * direction.z;
  const c = dx * dx + dz * dz - 0.35 * 0.35;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = b - Math.sqrt(disc);
  if (t < 0) return Infinity;
  const y = from.y + direction.y * t;
  return y >= target.pos.y && y <= target.pos.y + 1.7 ? t : Infinity;
}

export function fireHitscan(S, from, direction, shooterKind = 'player', opts = {}) {
  const maxDist = opts.range || 80;
  end.x = from.x + direction.x * maxDist; end.y = from.y + direction.y * maxDist; end.z = from.z + direction.z * maxDist;
  let nearestWall = maxDist;
  if (world && segmentBlocked(from.x, from.y, from.z, end.x, end.y, end.z, world.colliders)) {
    let lo = 0, hi = maxDist;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) * 0.5;
      end.x = from.x + direction.x * mid; end.y = from.y + direction.y * mid; end.z = from.z + direction.z * mid;
      if (segmentBlocked(from.x, from.y, from.z, end.x, end.y, end.z, world.colliders)) hi = mid; else lo = mid;
    }
    nearestWall = hi;
  }
  let nearest = nearestWall, target = null, head = false, kind = nearestWall < maxDist ? 'wall' : 'none';
  const targets = S.bots;
  for (let i = 0; i < targets.length + 1; i++) {
    const candidate = i === targets.length ? S.player : targets[i];
    if (!candidate || !candidate.alive || (shooterKind === 'player' ? candidate.team === 'ember' || candidate === S.player : candidate !== S.player && candidate.team === opts.shooter?.team)) continue;
    const t = rayCylinder(from, direction, candidate);
    if (t < nearest) { nearest = t; target = candidate; kind = candidate === S.player ? 'player' : 'bot'; head = from.y + direction.y * t > candidate.pos.y + 1.35; }
  }
  bestPoint.x = from.x + direction.x * nearest; bestPoint.y = from.y + direction.y * nearest; bestPoint.z = from.z + direction.z * nearest;
  hitResult.hit = kind; hitResult.dist = nearest;
  hitResult.point.x = bestPoint.x; hitResult.point.y = bestPoint.y; hitResult.point.z = bestPoint.z;
  hitResult.head = head; hitResult.target = target;
  return hitResult;
}

export function tryFire(S, shooter = S.player, dt = 0) {
  const p = shooter;
  if (p.fireCooldown > 0 || p.reloading > 0) return false;
  const def = WEAPONS[p.weapon];
  const ammo = p.weapons[p.weapon];
  if (!def || !ammo) return false;
  if (ammo.mag <= 0) {
    S.events.push({ type: 'dry-click' });
    if (ammo.reserve > 0) p.reloading = def.reload;
    return false;
  }
  ammo.mag--; p.fireCooldown = def.rate; p.lastShotT = S.time; S.stats.shots++;
  const spread = def.baseSpread + def.moveSpread * (shooter === S.player ? moveFactor(S) : 0) + (p.recoil || 0) * 0.02;
  p.spread = spread;
  const yaw = p.yaw, pitch = p.pitch + (p.recoil || 0);
  dir.x = -Math.sin(yaw) * Math.cos(pitch) + S.rng.range(-spread, spread);
  dir.y = Math.sin(pitch) + S.rng.range(-spread, spread);
  dir.z = -Math.cos(yaw) * Math.cos(pitch) + S.rng.range(-spread, spread);
  const length = Math.hypot(dir.x, dir.y, dir.z) || 1; dir.x /= length; dir.y /= length; dir.z /= length;
  origin.x = p.pos.x; origin.y = p.pos.y + 1.5; origin.z = p.pos.z;
  const result = fireHitscan(S, origin, dir, 'player');
  if (result.target) {
    const damage = def.damage * (result.head ? def.headMult : 1);
    result.target.hp -= damage;
    S.stats.hits++; S.stats.damage += def.damage * (result.head ? def.headMult : 1);
    S.events.push({ type: 'hit', head: result.head });
    if (result.target.hp <= 0 && result.target !== S.player) {
      result.target.hp = 0; result.target.alive = false; S.stats.kills++; S.money += 300;
      S.killfeed.unshift({ text: `Kamu menghabisi ${result.target.name}`, time: S.time });
      if (S.killfeed.length > 5) S.killfeed.length = 5;
      S.events.push({ type: 'kill', killer: 'player', victim: result.target.id });
    } else if (result.target === S.player && result.target.hp <= 0) {
      result.target.alive = false; S.events.push({ type: 'player-died' });
    }
  }
  p.recoil = (p.recoil || 0) + def.recoil;
  S.tracers.push({ from: { x: origin.x, y: origin.y, z: origin.z }, to: { x: result.point.x, y: result.point.y, z: result.point.z }, t: 0, life: 0.06 });
  if (S.tracers.length > 24) S.tracers.shift();
  S.flashes.push({ pos: { x: origin.x, y: origin.y, z: origin.z }, t: 0, life: 0.05 });
  if (S.flashes.length > 8) S.flashes.shift();
  S.events.push({ type: 'shot', weapon: p.weapon, pos: { x: origin.x, y: origin.y, z: origin.z }, team: shooter === S.player ? 'ember' : shooter.team });
  return true;
}

export function stepWeapons(S, input, dt) {
  const p = S.player;
  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  if (p.reloading > 0) {
    p.reloading = Math.max(0, p.reloading - dt);
    if (p.reloading === 0) {
      const def = WEAPONS[p.weapon], ammo = p.weapons[p.weapon];
      const load = Math.min(def.mag - ammo.mag, ammo.reserve);
      ammo.mag += load; ammo.reserve -= load;
      S.events.push({ type: 'reload' });
    }
  }
  for (let i = 0; i < input.actions.length; i++) {
    const action = input.actions[i];
    if (action === 'reload' && p.reloading <= 0) p.reloading = WEAPONS[p.weapon].reload;
    else if (action in p.owned && p.owned[action]) p.weapon = action;
    else if (action === 'he' || action === 'smoke') {
      dir.x = -Math.sin(p.yaw) * Math.cos(p.pitch); dir.y = Math.sin(p.pitch); dir.z = -Math.cos(p.yaw) * Math.cos(p.pitch);
      origin.x = p.pos.x; origin.y = p.pos.y + 1.5; origin.z = p.pos.z;
      throwGrenade(S, action, origin, dir);
    }
  }
  input.actions.length = 0;
  if (p.weapons[p.weapon].mag === 0 && p.weapons[p.weapon].reserve > 0 && p.reloading <= 0) p.reloading = WEAPONS[p.weapon].reload;
  const firing = (input.mouseButtons & 1) !== 0 || p.fireTrigger;
  p.fireTrigger = false;
  if (firing && (WEAPONS[p.weapon].auto || p.fireCooldown <= dt)) tryFire(S, p, dt);
  p.spread = WEAPONS[p.weapon].baseSpread + WEAPONS[p.weapon].moveSpread * moveFactor(S) + p.recoil * 0.02;
}
