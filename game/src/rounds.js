import { PHASES } from './state.js';
import { respawnPlayer } from './player.js';
import { spawnBots } from './bots.js';
import { closeBuyMenu } from './buy.js';

function finish(S, winner, reason) {
  if (S.phase !== PHASES.LIVE) return;
  S.roundWinner = winner; S.lastWinner = winner; S.roundWinnerReason = reason; S.score[winner]++; S.money += winner === 'ember' ? 3250 : 1900;
  S.phase = PHASES.END; S.phaseTime = 0; closeBuyMenu(S); S.events.push({ type: winner === 'ember' ? 'round-win' : 'round-lose' });
  if (!S.player.alive) { S.player.owned.rifle = false; S.player.owned.smg = false; S.player.weapon = 'pistol'; S.player.grenades.he = 0; S.player.grenades.smoke = 0; }
}

export function stepRounds(S, dt) {
  S.phaseTime += dt;
  if (S.phase === PHASES.BUY && S.phaseTime >= 15) { S.phase = PHASES.LIVE; S.phaseTime = 0; S.roundTimer = 100; S.buyOpen = false; }
  else if (S.phase === PHASES.LIVE) {
    S.roundTimer = Math.max(0, S.roundTimer - dt);
    let slag = 0, ember = S.player.alive ? 1 : 0;
    for (let i = 0; i < S.bots.length; i++) if (S.bots[i].alive) { if (S.bots[i].team === 'slag') slag++; else ember++; }
    if (S.bomb.state !== 'planted') {
      if (!slag) finish(S, 'ember', 'Tim Slag dihabisi');
      else if (!ember) finish(S, 'slag', 'Tim Ember dihabisi');
      else if (S.roundTimer <= 0) finish(S, 'slag', 'Waktu habis');
    }
  } else if (S.phase === PHASES.END && S.phaseTime >= 5) {
    S.round++;
    if (S.score.ember >= 8 || S.score.slag >= 8) { S.matchWinner = S.score.ember >= 8 ? 'ember' : 'slag'; S.score.ember = 0; S.score.slag = 0; S.round = 1; S.money = 800; S.events.push({ type: 'match-end', winner: S.matchWinner }); }
    S.phase = PHASES.BUY; S.phaseTime = 0; S.roundTimer = 100; S.roundWinner = null; S.lastWinner = null; S.roundWinnerReason = '';
    respawnPlayer(S); spawnBots(S); S.bomb.state = 'carried'; S.bomb.carrier = 'player'; S.bomb.site = null; S.bomb.plantT = 0; S.bomb.explodeT = 35; S.bomb.defuseT = 0; S.grenades.length = 0; S.smokes.length = 0; S.tracers.length = 0; S.flashes.length = 0; S.buyOpen = true;
    S.buyOpen = true;
  }
}
