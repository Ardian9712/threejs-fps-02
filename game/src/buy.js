import { WEAPONS } from './weapons.js';

export function openBuyMenu(S) { if (S.phase === 'buy') S.buyOpen = true; }
export function closeBuyMenu(S) { S.buyOpen = false; }

export function stepBuy(S, input, dt) {
  S.buyMessageT = Math.max(0, S.buyMessageT - dt);
  if (S.phase !== 'buy') { S.buyOpen = false; return; }
  for (let i = input.actions.length - 1; i >= 0; i--) {
    const action = input.actions[i];
    if (action === 'buy') { S.buyOpen = !S.buyOpen; input.actions.splice(i, 1); continue; }
    if (!S.buyOpen) continue;
    const item = action === 'rifle' || action === 'smg' || action === 'he' || action === 'smoke' ? action : null;
    if (!item) continue;
    const cost = WEAPONS[item].cost;
    input.actions.splice(i, 1);
    if (S.money < cost || ((item === 'he' || item === 'smoke') && S.player.grenades[item] >= 2)) { S.events.push({ type: 'buy-fail' }); S.buyMessageT = 2; continue; }
    S.money -= cost;
    if (item === 'he' || item === 'smoke') S.player.grenades[item]++;
    else { S.player.owned[item] = true; S.player.weapons[item].mag = WEAPONS[item].mag; S.player.weapons[item].reserve = WEAPONS[item].reserve; S.player.weapon = item; }
    S.events.push({ type: 'buy', item });
  }
}
