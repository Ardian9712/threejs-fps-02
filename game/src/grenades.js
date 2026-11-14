import { collideMove } from './world.js';

const up = { x: 0, y: 1, z: 0 };
export function smokeBlocks(ax, ay, az, bx, by, bz, smokes) {
  for (let i = 0; i < smokes.length; i++) {
    const s = smokes[i], dx = bx - ax, dy = by - ay, dz = bz - az;
    const denom = dx * dx + dy * dy + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((s.pos.x - ax) * dx + (s.pos.y - ay) * dy + (s.pos.z - az) * dz) / denom));
    const ex = ax + t * dx - s.pos.x, ey = ay + t * dy - s.pos.y, ez = az + t * dz - s.pos.z;
    if (ex * ex + ey * ey + ez * ez < s.r * s.r) return true;
  }
  return false;
}

export function throwGrenade(S, kind, fromPos, direction) {
  if (!S.player.grenades[kind] || S.phase !== 'live' || S.grenades.length >= 6) return false;
  S.player.grenades[kind]--;
  S.grenades.push({ kind, pos: { x: fromPos.x + direction.x * 0.5, y: fromPos.y + 1, z: fromPos.z + direction.z * 0.5 }, vel: { x: direction.x * 14, y: direction.y * 14 + 4, z: direction.z * 14 }, fuse: kind === 'he' ? 1.6 : 1.2, bounced: 0 });
  return true;
}

export function stepGrenades(S, dt) {
  for (let i = S.grenades.length - 1; i >= 0; i--) {
    const g = S.grenades[i]; g.vel.y -= 12 * dt;
    const beforeX = g.pos.x, beforeZ = g.pos.z;
    collideMove(g.pos, 0.12, 0.24, g.vel, dt, S.world.colliders);
    if (Math.abs(g.pos.x - (beforeX + g.vel.x * dt)) > 0.01) g.vel.x *= -0.4;
    if (Math.abs(g.pos.z - (beforeZ + g.vel.z * dt)) > 0.01) g.vel.z *= -0.4;
    if (g.pos.y < 0.1) { g.pos.y = 0.1; g.vel.y = Math.abs(g.vel.y) * 0.4; g.vel.x *= 0.85; g.vel.z *= 0.85; }
    g.fuse -= dt;
    if (g.fuse > 0) continue;
    if (g.kind === 'he') {
      S.events.push({ type: 'explosion', pos: { x: g.pos.x, y: g.pos.y, z: g.pos.z }, grenade: true });
      const apply = (target, isPlayer) => { if (!target.alive) return; const d = Math.hypot(target.pos.x - g.pos.x, target.pos.z - g.pos.z); if (d < 6) { const damage = 90 * (1 - d / 6); target.hp -= damage; if (target.hp <= 0) { target.hp = 0; target.alive = false; S.events.push({ type: isPlayer ? 'player-died' : 'kill', killer: 'grenade', victim: target.id }); if (!isPlayer) { S.money += 300; S.stats.kills++; S.killfeed.unshift({ text: `Kamu menghabisi ${target.name}`, time: S.time }); if (S.killfeed.length > 5) S.killfeed.length = 5; } } } };
      apply(S.player, true); for (let j = 0; j < S.bots.length; j++) apply(S.bots[j], false);
    } else {
      if (S.smokes.length >= 3) S.smokes.shift();
      S.smokes.push({ pos: { x: g.pos.x, y: 1.8, z: g.pos.z }, r: 4.5, t: 12 }); S.events.push({ type: 'smoke' });
    }
    S.grenades.splice(i, 1);
  }
  for (let i = S.smokes.length - 1; i >= 0; i--) { S.smokes[i].t -= dt; if (S.smokes[i].t <= 0) S.smokes.splice(i, 1); }
  for (let i = S.tracers.length - 1; i >= 0; i--) { S.tracers[i].t += dt; if (S.tracers[i].t >= S.tracers[i].life) S.tracers.splice(i, 1); }
  for (let i = S.flashes.length - 1; i >= 0; i--) { S.flashes[i].t += dt; if (S.flashes[i].t >= S.flashes[i].life) S.flashes.splice(i, 1); }
}
