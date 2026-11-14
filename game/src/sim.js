import { stepRounds } from './rounds.js';
import { stepBots } from './bots.js';
import { stepBomb } from './bomb.js';
import { stepGrenades } from './grenades.js';

// Main owns player/weapons; this fixed-step system order resolves rounds before actors, bomb, and projectiles.
export function stepSim(S, dt, input) {
  S.time += dt;
  S.tick++;
  stepRounds(S, dt);
  stepBots(S, dt);
  stepBomb(S, input, dt);
  stepGrenades(S, dt);
}
