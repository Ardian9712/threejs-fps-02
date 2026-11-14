import { createRng } from './rng.js';

export const DT = 1 / 60;
export const PHASES = Object.freeze({ BUY: 'buy', LIVE: 'live', END: 'end' });
export const WEAPON_IDS = Object.freeze({ PISTOL: 'pistol', RIFLE: 'rifle', SMG: 'smg' });

export function createState(seed = 1) {
  return {
    seed,
    rng: createRng(seed),
    time: 0,
    tick: 0,
    phase: PHASES.BUY,
    phaseTime: 0,
    round: 1,
    buyOpen: true,
    cameraShot: null,
    worldSeed: seed,
    matchWinner: null,
    score: { ember: 0, slag: 0 },
    money: 800,
    roundTimer: 100,
    roundWinner: null,
    player: {
      team: 'ember',
      pos: { x: 0, y: 0, z: 14 },
      vel: { x: 0, y: 0, z: 0 },
      // Yaw 0 faces north (-z); yaw increases to the left. Forward is {-sin(yaw), -cos(yaw)}.
      yaw: 0,
      pitch: 0,
      hp: 100,
      crouch: false,
      alive: true,
      weapon: WEAPON_IDS.PISTOL,
      weapons: {
        pistol: { mag: 12, reserve: 36 },
        rifle: { mag: 0, reserve: 0 },
        smg: { mag: 0, reserve: 0 },
      },
      owned: { pistol: true, rifle: false, smg: false },
      grenades: { he: 0, smoke: 0 },
      reloading: 0,
      fireCooldown: 0,
      lastShotT: -1,
      fireTrigger: false,
      recoil: 0,
      spread: 0,
      moveFactor: 0,
      onGround: true,
    },
    bots: [],
    world: null,
    lastWinner: null,
    roundWinnerReason: '',
    bomb: { state: 'carried', carrier: 'player', site: null, plantT: 0, plantBeepT: 1, explodeT: 35, defuseT: 0, progress: 0, pos: { x: 0, y: 0, z: 0 } },
    buyMessageT: 0,
    grenades: [],
    smokes: [],
    tracers: [],
    flashes: [],
    particles: [],
    events: [],
    killfeed: [],
    shotMode: null,
    stats: { shots: 0, hits: 0, headshots: 0, kills: 0, damage: 0 },
  };
}
