import { WEAPONS } from './weapons.js';

export function initHUD(doc) {
  const ids = ['health-value', 'health-fill', 'ammo-mag', 'ammo-reserve', 'weapon-name', 'timer', 'score', 'money', 'round-banner', 'killfeed', 'bomb-status', 'bomb-label', 'bomb-fill', 'buy-menu', 'hitmarker', 'shot-caption', 'crosshair', 'reload-indicator', 'hint'];
  const dom = {};
  for (let i = 0; i < ids.length; i++) dom[ids[i]] = doc.getElementById(ids[i]);
  dom.lines = dom.crosshair ? dom.crosshair.querySelectorAll('.line') : [];
  return dom;
}

export function updateHUD(S, dom) {
  const p = S.player, hp = Math.max(0, Math.round(p.hp));
  const bombActive = S.bomb.state === 'planted' || S.bomb.state === 'planting' || S.bomb.state === 'defusing';
  dom['bomb-status'].style.display = bombActive ? 'block' : 'none';
  dom.hint.style.display = S.phase === 'live' && !S.shotMode ? 'block' : 'none';
  dom['health-value'].textContent = String(hp);
  dom['health-fill'].style.width = `${hp}%`;
  dom['health-fill'].style.background = hp > 50 ? '#54b86a' : hp > 25 ? '#e0bd42' : '#e34c43';
  const def = WEAPONS[p.weapon], ammo = p.weapons[p.weapon];
  dom['weapon-name'].textContent = def.name;
  dom['ammo-mag'].textContent = String(ammo.mag);
  dom['ammo-reserve'].textContent = String(ammo.reserve);
  dom['reload-indicator'].textContent = p.reloading > 0 ? 'RELOAD' : '';
  const seconds = Math.max(0, Math.ceil(S.roundTimer));
  dom.timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  dom.timer.style.color = seconds < 10 ? '#ef5147' : '';
  dom.score.textContent = `EMBER ${S.score.ember} — ${S.score.slag} SLAG`;
  dom.money.textContent = `$${S.money}`;
  dom['round-banner'].textContent = S.phase === 'end' ? `${S.matchWinner ? `${S.matchWinner.toUpperCase()} MATCH` : `${S.roundWinner === 'ember' ? 'EMBER MENANG' : 'SLAG MENANG'}${S.roundWinnerReason ? ` — ${S.roundWinnerReason}` : ''}`}` : `ROUND ${S.round}`;
  dom['round-banner'].hidden = S.phase !== 'end' && S.phase !== 'buy';
  dom['buy-menu'].classList.toggle('hidden', S.phase !== 'buy' || !S.buyOpen);
  dom['buy-menu'].style.display = S.phase === 'buy' && S.buyOpen ? 'block' : 'none';
  if (S.buyMessageT > 0) dom.hint.textContent = 'Uang tidak cukup';
  else if (S.bomb.state === 'carried' && S.bomb.carrier === 'player') dom.hint.textContent = 'E: tanam bom di site A/B';
  else dom.hint.textContent = '';
  dom['shot-caption'].textContent = S.shotMode ? `EMBER FOUNDRY  /  ${S.shotMode.toUpperCase()}  /  ROUND ${S.round}` : '';
  while (S.killfeed.length && S.time - S.killfeed[S.killfeed.length - 1].time > 5) S.killfeed.pop();
  dom.killfeed.replaceChildren();
  for (let i = 0; i < Math.min(5, S.killfeed.length); i++) {
    const row = dom.killfeed.ownerDocument.createElement('div'); row.textContent = S.killfeed[i].text; dom.killfeed.appendChild(row);
  }
  const spread = Math.max(0, p.spread || 0);
  const gap = 6 + spread * 400;
  const lines = dom.lines;
  if (lines.length === 4) {
    lines[0].style.transform = `translateY(${-gap}px)`;
    lines[1].style.transform = `translateX(${gap}px)`;
    lines[2].style.transform = `translateY(${gap}px)`;
    lines[3].style.transform = `translateX(${-gap}px)`;
  }
  let hit = null;
  for (let i = 0; i < S.events.length; i++) if (S.events[i].type === 'hit') hit = S.events[i];
  if (hit) dom.hitmarkerUntil = performance.now() + 120;
  dom.hitmarker.style.opacity = performance.now() < (dom.hitmarkerUntil || 0) ? '1' : '0';
  dom.hitmarker.style.color = hit?.head ? '#f0a830' : '';
  if (S.bomb.state === 'planted') {
    dom['bomb-label'].textContent = `BOM MELEDAK ${Math.max(0, Math.ceil(S.bomb.explodeT))}s`;
    dom['bomb-fill'].style.width = `${Math.max(0, Math.min(100, (1 - S.bomb.explodeT / 35) * 100))}%`;
  } else if (S.bomb.state === 'planting' || S.bomb.state === 'defusing') {
    dom['bomb-label'].textContent = S.bomb.state === 'planting' ? 'MENANAM' : 'MENJINAKKAN';
    dom['bomb-fill'].style.width = `${Math.max(0, Math.min(100, (S.bomb.progress || 0) * 100))}%`;
  } else { dom['bomb-label'].textContent = ''; dom['bomb-fill'].style.width = '0%'; }
}
