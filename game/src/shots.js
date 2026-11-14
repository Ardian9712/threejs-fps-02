import { spawnBots } from './bots.js';

export function applyShot(S, shot) {
  if (!['start', 'play', 'end'].includes(shot)) return;
  S.shotMode = shot; spawnBots(S);
  if (shot === 'start') { S.phase = 'buy'; S.round = 1; S.buyOpen = true; S.money = 800; S.player.pos.x = 0; S.player.pos.z = 14; S.player.yaw = 0; }
  else if (shot === 'play') {
    S.phase = 'live'; S.buyOpen = false; S.roundTimer = 78; S.player.pos.x = 2; S.player.pos.z = 8; S.player.yaw = 0.93; S.score.ember = 2; S.score.slag = 1; S.money = 2400; S.bomb.state = 'carried'; S.bomb.carrier = 'player';
    S.bots[2].pos.x = -6; S.bots[2].pos.z = 2; S.bots[3].pos.x = -9; S.bots[3].pos.z = 0; S.bots[0].pos.x = -1; S.bots[0].pos.z = 3;
    S.tracers.push({ from: { x: 2, y: 1.62, z: 8 }, to: { x: -6, y: 1.4, z: 2 }, t: 0, life: 10 }); S.flashes.push({ pos: { x: 2, y: 1.62, z: 8 }, t: 0, life: 10 });
  } else { S.phase = 'end'; S.roundWinner = 'ember'; S.lastWinner = 'ember'; S.roundWinnerReason = 'Bomb meledak'; S.score.ember = 5; S.score.slag = 3; S.round = 8; S.money = 4150; S.phaseTime = 0; S.cameraShot = true; }
}
