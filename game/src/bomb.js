import { pointInSite } from './world.js';

function finishPlant(S, siteName) {
  const b = S.bomb; b.state = 'planted'; b.site = siteName; b.plantT = 0; b.explodeT = 35; b.plantBeepT = 1; b.pos.x = S.world.sites[siteName].x; b.pos.z = S.world.sites[siteName].z;
  S.money += 300; S.events.push({ type: 'planted' });
}

export function tryPlant(S) {
  const b = S.bomb, p = S.player;
  if (S.phase !== 'live' || !p.alive || b.state !== 'carried' || b.carrier !== 'player') return false;
  for (const name of ['A', 'B']) if (pointInSite(p.pos.x, p.pos.z, S.world.sites[name])) { b.site = name; return true; }
  return false;
}

export function tryDefuse() { return false; }

export function stepBomb(S, input, dt) {
  const b = S.bomb;
  if (b.state === 'carried' && b.carrier === 'player' && !S.player.alive) { b.state = 'dropped'; b.pos.x = S.player.pos.x; b.pos.z = S.player.pos.z; }
  if (b.state === 'dropped') {
    let nearest = null, best = 1.5;
    for (let i = 0; i < S.bots.length; i++) { const bot = S.bots[i]; if (bot.alive && bot.team === 'ember') { const d = Math.hypot(bot.pos.x - b.pos.x, bot.pos.z - b.pos.z); if (d < best) { nearest = bot; best = d; } } }
    if (nearest) { b.state = 'carried'; b.carrier = `bot:${nearest.id}`; }
  }
  if (b.state === 'carried' && b.carrier?.startsWith('bot:')) {
    const carrier = S.bots[Number(b.carrier.slice(4))];
    if (carrier?.alive) {
      let site = S.world.sites.A, name = 'A';
      if (Math.hypot(carrier.pos.x - S.world.sites.B.x, carrier.pos.z - S.world.sites.B.z) < Math.hypot(carrier.pos.x - site.x, carrier.pos.z - site.z)) { site = S.world.sites.B; name = 'B'; }
      if (Math.hypot(carrier.pos.x - site.x, carrier.pos.z - site.z) < site.r) { carrier.plantT += dt; if (carrier.plantT >= 3) finishPlant(S, name); }
    }
  }
  if (b.state === 'carried' && b.carrier === 'player') {
    let inSite = null;
    for (const name of ['A', 'B']) if (pointInSite(S.player.pos.x, S.player.pos.z, S.world.sites[name])) inSite = name;
    const firing = !!(input.mouseButtons & 1) || S.player.fireTrigger;
    if (input.keys.has('KeyE') && inSite) { b.site = inSite; b.state = 'planting'; b.plantT += dt; if (b.plantT >= 3) finishPlant(S, inSite); }
    else if (b.state === 'planting' && (!inSite || firing || !input.keys.has('KeyE'))) { b.state = 'carried'; b.plantT = 0; }
  }
  if (b.state === 'planted' && S.phase === 'live') {
    let defuser = null, threat = false;
    const site = S.world.sites[b.site];
    if (S.player.alive && Math.hypot(S.player.pos.x - site.x, S.player.pos.z - site.z) < 8) threat = true;
    for (let i = 0; i < S.bots.length; i++) { const bot = S.bots[i]; if (!bot.alive) continue; const d = Math.hypot(bot.pos.x - site.x, bot.pos.z - site.z); if (bot.team === 'ember' && d < 8) threat = true; if (bot.team === 'slag' && d < 1.5 && !defuser) defuser = bot; }
    if (defuser && !threat) { defuser.defuseT += dt; b.defuseT = defuser.defuseT; b.state = 'defusing'; if (b.defuseT >= 5) { b.state = 'defused'; S.roundWinner = 'slag'; S.lastWinner = 'slag'; S.roundWinnerReason = 'Bomb dijinakkan'; S.score.slag++; S.money += 1900; S.phase = 'end'; S.phaseTime = 0; S.events.push({ type: 'round-lose' }); } }
    else if (b.state === 'defusing') { if (defuser) defuser.defuseT = 0; b.defuseT = 0; b.state = 'planted'; }
    if (S.phase !== 'live') return;
    b.explodeT -= dt; b.plantBeepT -= dt;
    if (b.plantBeepT <= 0) { b.plantBeepT += 1; S.events.push({ type: 'plant-beep' }); }
    if (b.explodeT <= 0) {
      const site = S.world.sites[b.site]; S.events.push({ type: 'explosion', pos: site });
      if (S.player.alive && Math.hypot(S.player.pos.x - site.x, S.player.pos.z - site.z) < 12) { S.player.hp = 0; S.player.alive = false; }
      for (let i = 0; i < S.bots.length; i++) { const bot = S.bots[i]; if (bot.alive && Math.hypot(bot.pos.x - site.x, bot.pos.z - site.z) < 12) { bot.hp = 0; bot.alive = false; } }
      b.state = 'exploded'; S.roundWinner = 'ember'; S.lastWinner = 'ember'; S.roundWinnerReason = 'Bomb meledak'; S.score.ember++; S.money += 3250; S.phase = 'end'; S.phaseTime = 0; S.events.push({ type: 'round-win' });
    }
  }
  b.progress = b.state === 'planting' ? b.plantT / 3 : b.state === 'defusing' ? b.defuseT / 5 : 0;
}
