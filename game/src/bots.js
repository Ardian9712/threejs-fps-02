import { collideMove, segmentBlocked, pointInSite } from './world.js';
import { fireHitscan, WEAPONS } from './weapons.js';
import { smokeBlocks } from './grenades.js';

const eye = { x: 0, y: 0, z: 0 }, dir = { x: 0, y: 0, z: 0 };
const starts = [
  { name: 'Ash', team: 'ember', x: -4, z: 14, weapon: 'rifle', state: 'patrol' },
  { name: 'Cinder', team: 'ember', x: 4, z: 14, weapon: 'smg', state: 'patrol' },
  { name: 'Slag-1', team: 'slag', x: -14, z: -8, weapon: 'rifle', state: 'hold' },
  { name: 'Slag-2', team: 'slag', x: -17, z: -9, weapon: 'rifle', state: 'hold' },
  { name: 'Slag-3', team: 'slag', x: 14, z: -8, weapon: 'rifle', state: 'hold' },
  { name: 'Slag-4', team: 'slag', x: 0, z: 0, weapon: 'rifle', state: 'patrol' },
];
const ROUTES = {
  west: [0, 15, 1, 2, 3, 4],
  east: [0, 5, 6, 7, 8, 9],
  mid: [0, 10, 11, 12, 13, 14],
};
const botRoutes = ['west', 'east', 'west', 'west', 'east', 'mid'];
const startRouteIdx = [0, 0, 4, 4, 5, 1];

export function spawnBots(S) {
  S.bots.length = 0;
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    S.bots.push({ id: i, name: s.name, team: s.team, pos: { x: s.x, y: 0, z: s.z }, vel: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, hp: 100, alive: true, weapon: s.weapon, ammo: { mag: s.weapon === 'smg' ? 30 : 25, reserve: s.weapon === 'smg' ? 90 : 75 }, state: s.state, route: ROUTES[botRoutes[i]], routeIdx: startRouteIdx[i], routeDir: 1, prevDist: Infinity, stuckT: 0, holdT: 2, reactionT: 0, burstLeft: 0, burstPause: 0, aimErr: 0.05, lastSeenPos: { x: 0, y: 0, z: 0 }, lastSeenT: -1, hearT: 0, speed: 3.2, crouch: false, fireCooldown: 0, reloadT: 0, recoil: 0, plantT: 0, defuseT: 0, scan: 0 });
  }
}

let Splayer = null;
function visible(S, bot, target) {
  const dx = target.pos.x - bot.pos.x, dz = target.pos.z - bot.pos.z, distance = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dx, -dz), delta = Math.atan2(Math.sin(yaw - bot.yaw), Math.cos(yaw - bot.yaw));
  return distance < 28 && Math.abs(delta) < Math.PI * 100 / 360 && !segmentBlocked(bot.pos.x, 1.45, bot.pos.z, target.pos.x, 1.35, target.pos.z, S.world.colliders) && !smokeBlocks(bot.pos.x, 1.45, bot.pos.z, target.pos.x, 1.35, target.pos.z, S.smokes);
}

export function stepBots(S, dt) {
  const w = S.world; if (!w) return;
  Splayer = S.player;
  for (let e = 0; e < S.events.length; e++) {
    const ev = S.events[e]; if (ev.type !== 'shot' || !ev.pos) continue;
    for (let i = 0; i < S.bots.length; i++) { const b = S.bots[i]; if (b.alive && Math.hypot(b.pos.x - ev.pos.x, b.pos.z - ev.pos.z) < 30) { b.lastSeenPos.x = ev.pos.x; b.lastSeenPos.z = ev.pos.z; b.hearT = 3; if (b.state !== 'hold') b.state = 'patrol'; } }
  }
  for (let i = 0; i < S.bots.length; i++) {
    const b = S.bots[i]; if (!b.alive) continue;
    b.fireCooldown = Math.max(0, b.fireCooldown - dt); b.burstPause = Math.max(0, b.burstPause - dt); b.hearT = Math.max(0, b.hearT - dt);
    let target = null;
    if (b.team === 'slag' && S.player.alive && visible(S, b, S.player)) target = S.player;
    for (let j = 0; j < S.bots.length; j++) { const t = S.bots[j]; if (t !== b && t.alive && t.team !== b.team && visible(S, b, t)) { target = t; break; } }
    if (target) {
      if (b.state !== 'engage') b.reactionT = 0.25 + S.rng.range(0, 0.2);
      b.state = 'engage'; b.lastSeenPos.x = target.pos.x; b.lastSeenPos.z = target.pos.z; b.lastSeenT = S.time;
    } else if (b.state === 'engage' && S.time - b.lastSeenT > 2) b.state = 'patrol';
    if (b.team === 'slag' && S.bomb.state === 'planted') b.state = 'rush';
    if (b.team === 'ember' && S.bomb.state === 'carried' && S.bomb.carrier === 'player' && Math.hypot(b.pos.x - S.player.pos.x, b.pos.z - S.player.pos.z) > 4) { b.state = 'rush'; b.lastSeenPos.x = S.player.pos.x; b.lastSeenPos.z = S.player.pos.z; }
    if (b.reloadT > 0) { b.reloadT = Math.max(0, b.reloadT - dt); if (!b.reloadT) { const load = Math.min(WEAPONS[b.weapon].mag - b.ammo.mag, b.ammo.reserve); b.ammo.mag += load; b.ammo.reserve -= load; } continue; }
    if (b.state === 'engage' && target) {
      const dx = target.pos.x - b.pos.x, dz = target.pos.z - b.pos.z; b.yaw = Math.atan2(-dx, -dz);
      b.aimErr = Math.max(0.015, b.aimErr - dt * 0.035);
      b.reactionT = Math.max(0, b.reactionT - dt);
      if (!b.burstLeft && !b.burstPause) b.burstLeft = S.rng.int(3, 5);
      if (!S.shotMode && !b.reactionT && b.burstLeft && !b.fireCooldown) {
        eye.x = b.pos.x; eye.y = b.pos.y + 1.5; eye.z = b.pos.z;
        const yaw = b.yaw + S.rng.range(-b.aimErr, b.aimErr), pitch = S.rng.range(-b.aimErr * 0.5, b.aimErr * 0.5);
        dir.x = -Math.sin(yaw) * Math.cos(pitch); dir.y = Math.sin(pitch); dir.z = -Math.cos(yaw) * Math.cos(pitch);
        const result = fireHitscan(S, eye, dir, 'bot', { shooter: b, range: 65 });
        S.tracers.push({ from: { x: eye.x, y: eye.y, z: eye.z }, to: { x: result.point.x, y: result.point.y, z: result.point.z }, t: 0, life: 0.06 });
        if (S.tracers.length > 24) S.tracers.shift();
        S.flashes.push({ pos: { x: eye.x, y: eye.y, z: eye.z }, t: 0, life: 0.05 });
        if (S.flashes.length > 8) S.flashes.shift();
        S.events.push({ type: 'shot', weapon: b.weapon, pos: { x: eye.x, y: eye.y, z: eye.z }, team: b.team });
        if (result.target) {
          const damage = WEAPONS[b.weapon].damage * (result.head ? WEAPONS[b.weapon].headMult : 1);
          result.target.hp -= damage;
          if (result.target.hp <= 0) {
            if (result.target === S.player) { result.target.hp = 0; result.target.alive = false; S.events.push({ type: 'player-died', killer: b.name }); S.killfeed.unshift({ text: `${b.name} menghabisi Kamu`, time: S.time }); }
            else { result.target.hp = 0; damageBot(S, result.target, 0, b.name); }
          }
        }
        b.ammo.mag--; b.fireCooldown = WEAPONS[b.weapon].rate; b.burstLeft--;
        if (!b.burstLeft) b.burstPause = S.rng.range(0.6, 1.1);
        if (!b.ammo.mag) b.reloadT = 2.2;
      }
      continue;
    }
    let tx, tz;
    if (b.state === 'rush') {
      const site = S.bomb.state === 'planted' ? w.sites[S.bomb.site] : null;
      if (site) { tx = site.x; tz = site.z; }
      else { tx = b.lastSeenPos.x; tz = b.lastSeenPos.z; }
    } else if (b.state === 'hold') {
      b.holdT -= dt; b.scan += dt * 0.45; b.yaw += Math.sin(b.scan) * dt * 0.15;
      if (b.holdT <= 0) { b.state = 'patrol'; b.holdT = 2 + S.rng.range(0, 1); }
      continue;
    } else {
      const wp = w.waypoints[b.route[b.routeIdx]];
      tx = wp.x; tz = wp.z;
      const dist = Math.hypot(tx - b.pos.x, tz - b.pos.z);
      if (dist < 1.1) {
        b.routeIdx += b.routeDir;
        if (b.routeIdx < 0) { b.routeDir = 1; b.routeIdx = 1; }
        else if (b.routeIdx >= b.route.length) { b.routeDir = -1; b.routeIdx = b.route.length - 2; }
        b.prevDist = Infinity; b.stuckT = 0;
        b.holdT = 0;
      } else {
        if (b.prevDist - dist > 0.05) b.stuckT = 0;
        else b.stuckT += dt;
        b.prevDist = dist;
        if (b.stuckT >= 1.5) {
          b.routeIdx += b.routeDir;
          if (b.routeIdx < 0) { b.routeDir = 1; b.routeIdx = 1; }
          else if (b.routeIdx >= b.route.length) { b.routeDir = -1; b.routeIdx = b.route.length - 2; }
          b.prevDist = Infinity; b.stuckT = 0;
          const nextWp = w.waypoints[b.route[b.routeIdx]];
          tx = nextWp.x; tz = nextWp.z;
        }
      }
    }
    if (tx === undefined) continue;
    const dx = tx - b.pos.x, dz = tz - b.pos.z, dist = Math.hypot(dx, dz), speed = Math.min(b.speed, dist * 2);
    const desiredX = dist ? dx / dist * speed : 0, desiredZ = dist ? dz / dist * speed : 0;
    b.vel.x += (desiredX - b.vel.x) * Math.min(1, dt * 6); b.vel.z += (desiredZ - b.vel.z) * Math.min(1, dt * 6);
    collideMove(b.pos, 0.3, 1.7, b.vel, dt, w.colliders);
    if (Math.hypot(b.vel.x, b.vel.z) > 0.1) b.yaw = Math.atan2(-b.vel.x, -b.vel.z);
  }
  Splayer = null;
}

export function damageBot(S, bot, amount, killer = 'player') {
  if (!bot.alive) return;
  bot.hp -= amount;
  if (bot.hp <= 0) { bot.hp = 0; bot.alive = false; S.events.push({ type: 'kill', killer, victim: bot.id }); S.killfeed.unshift({ text: `${killer === 'player' ? 'Kamu' : killer} menghabisi ${bot.name}`, time: S.time }); if (S.killfeed.length > 5) S.killfeed.length = 5; if (killer === 'player') { S.money += 300; S.stats.kills++; } }
}

export { pointInSite };
