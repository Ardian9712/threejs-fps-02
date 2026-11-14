import * as THREE from 'three';
import { createState, DT } from './state.js';
import { buildWorld } from './world.js';
import { stepSim } from './sim.js';
import { createInput } from './input.js';
import { stepPlayer, eyeHeight, setPlayerWorld } from './player.js';
import { stepWeapons, setWeaponWorld } from './weapons.js';
import { spawnBots } from './bots.js';
import { stepBuy } from './buy.js';
import { throwGrenade } from './grenades.js';
import { initEffects, syncEffects, buildBotMeshes, initViewModel, syncViewModel, setViewModelVisible } from './effects.js';
import { applyShot } from './shots.js';
import { createAudio, stepAudio } from './audio.js';
import { initHUD, updateHUD } from './hud.js';

const params = new URLSearchParams(location.search);
const requestedShot = params.get('shot');
const shotMode = ['start', 'play', 'end'].includes(requestedShot) ? requestedShot : null;
const parsedSeed = Number.parseInt(params.get('seed') || '1', 10);
const S = createState(Number.isFinite(parsedSeed) ? parsedSeed : 1);
S.shotMode = shotMode;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
scene.add(camera);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.domElement.id = 'game-canvas';
document.body.appendChild(renderer.domElement);

const world = buildWorld(scene, S);
S.world = world;
setPlayerWorld(world);
setWeaponWorld(world);
spawnBots(S);
initEffects(scene); buildBotMeshes(scene, S); initViewModel(camera);
const input = createInput(renderer.domElement, S);
const audio = createAudio();
const hud = initHUD(document);
const caption = hud['shot-caption'];
if (shotMode) {
  applyShot(S, shotMode);
  caption.textContent = `EMBER FOUNDRY  /  ${shotMode.toUpperCase()}  /  ROUND ${S.round}`;
  if (shotMode === 'end') {
    setViewModelVisible(false);
    camera.position.set(0, 14, 18);
    camera.lookAt(-16, 0, -10);
  }
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

const forward = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
let previous = performance.now();
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min((now - previous) / 1000, 0.25);
  previous = now;
  accumulator += elapsed;
  let steps = 0;
  while (accumulator >= DT && steps < 5) {
    if (!shotMode) {
      stepPlayer(S, input, DT);
      stepBuy(S, input, DT);
      stepSim(S, DT, input);
      stepWeapons(S, input, DT);
      for (let i = S.events.length - 1; i >= 0; i--) if (S.events[i].type === 'grenade-request') { const e = S.events[i]; forward.set(-Math.sin(S.player.yaw), Math.sin(S.player.pitch), -Math.cos(S.player.yaw)).normalize(); throwGrenade(S, e.grenade, S.player.pos, forward); S.events.splice(i, 1); }
    }
    accumulator -= DT;
    steps++;
  }
  if (!shotMode) {
    camera.position.set(S.player.pos.x, S.player.pos.y + (S.player.alive ? eyeHeight(S) : 3), S.player.pos.z);
    euler.set(S.player.pitch + S.player.recoil, S.player.yaw, 0);
    camera.quaternion.setFromEuler(euler);
    forward.set(-Math.sin(S.player.yaw), 0, -Math.cos(S.player.yaw));
  } else if (shotMode === 'start' || shotMode === 'play') {
    camera.position.set(S.player.pos.x, S.player.pos.y + eyeHeight(S), S.player.pos.z);
    euler.set(S.player.pitch + S.player.recoil, S.player.yaw, 0);
    camera.quaternion.setFromEuler(euler);
  }
  syncViewModel(S);
  syncEffects(scene, S, elapsed);
  renderer.render(scene, camera);
  stepAudio(S, audio);
  updateHUD(S, hud);
  // Audio and HUD both observe the same frame events; clear only after both have consumed them.
  S.events.length = 0;
}
requestAnimationFrame(frame);
