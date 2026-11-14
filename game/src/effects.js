import * as THREE from 'three';

let botGroups = new Map(), tracerPool = [], flashPool = [], smokePool = [], particleGeometry = null, particleMaterial = null, particlePoints = null;
let viewModel = null, viewCamera = null;

export function initEffects(scene) {
  const lineMat = new THREE.LineBasicMaterial({ color: 0xff9b35, transparent: true, opacity: 0.9, depthWrite: false });
  for (let i = 0; i < 24; i++) { const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(6, 3)); const line = new THREE.Line(geometry, lineMat); line.frustumCulled = false; scene.add(line); tracerPool.push(line); }
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffa02e, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 8; i++) { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), flashMat); mesh.visible = false; scene.add(mesh); flashPool.push(mesh); }
  const smokeGeo = new THREE.SphereGeometry(1, 12, 8), smokeMat = new THREE.MeshStandardMaterial({ color: 0x747b80, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 3; i++) { const mesh = new THREE.Mesh(smokeGeo, smokeMat); mesh.visible = false; scene.add(mesh); smokePool.push(mesh); }
  particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(180), 3));
  particleMaterial = new THREE.PointsMaterial({ color: 0xff7028, size: 0.13, transparent: true, opacity: 0.9 }); particlePoints = new THREE.Points(particleGeometry, particleMaterial); particlePoints.visible = false; scene.add(particlePoints);
}

export function buildBotMeshes(scene, S) {
  const bodyGeo = new THREE.BoxGeometry(0.62, 0.9, 0.38), headGeo = new THREE.BoxGeometry(0.36, 0.36, 0.34), gunGeo = new THREE.BoxGeometry(0.12, 0.12, 0.72);
  for (let i = 0; i < S.bots.length; i++) {
    const bot = S.bots[i], group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: bot.team === 'ember' ? 0xc45a27 : 0x424d59, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = 0.9; group.add(body);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: bot.team === 'ember' ? 0xe68238 : 0x71808a })); head.position.y = 1.55; group.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.04), new THREE.MeshBasicMaterial({ color: bot.team === 'ember' ? 0xffb14b : 0x64b4c4 })); visor.position.set(0, 1.58, -0.18); group.add(visor);
    const gun = new THREE.Mesh(gunGeo, new THREE.MeshStandardMaterial({ color: 0x22272b, metalness: 0.5 })); gun.position.set(0.38, 1.1, -0.35); group.add(gun);
    group.userData.botId = bot.id; scene.add(group); botGroups.set(bot.id, group);
  }
}

export function initViewModel(camera) {
  viewCamera = camera; viewModel = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d8891, metalness: 0.35, roughness: 0.5 });
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.52), mat); receiver.position.set(0.26, -0.20, -0.52); viewModel.add(receiver);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.36), mat); barrel.position.set(0.26, -0.17, -0.88); viewModel.add(barrel);
  camera.add(viewModel);
}

export function syncViewModel(S) {
  if (!viewModel) return;
  viewModel.position.y = -Math.min(0.15, S.player.reloading > 0 ? 0.15 : 0) - Math.min(0.08, S.player.recoil * 0.08);
  viewModel.position.z = Math.min(0.08, S.player.recoil * 0.08);
}

export function setViewModelVisible(visible) {
  if (viewModel) viewModel.visible = visible;
}

export function syncEffects(_scene, S, dt) {
  for (let i = 0; i < tracerPool.length; i++) {
    const line = tracerPool[i], tracer = S.tracers[S.tracers.length - 1 - i]; line.visible = !!tracer;
    if (tracer) { const a = line.geometry.attributes.position; a.array[0] = tracer.from.x; a.array[1] = tracer.from.y; a.array[2] = tracer.from.z; a.array[3] = tracer.to.x; a.array[4] = tracer.to.y; a.array[5] = tracer.to.z; a.needsUpdate = true; line.material.opacity = Math.max(0, 1 - tracer.t / tracer.life); }
  }
  for (let i = 0; i < flashPool.length; i++) { const m = flashPool[i], f = S.flashes[S.flashes.length - 1 - i]; m.visible = !!f; if (f) { m.position.set(f.pos.x, f.pos.y, f.pos.z); m.material.opacity = Math.max(0, 1 - f.t / f.life); } }
  for (let i = 0; i < smokePool.length; i++) { const m = smokePool[i], s = S.smokes[i]; m.visible = !!s; if (s) { m.position.set(s.pos.x, s.pos.y, s.pos.z); const scale = s.r * (0.95 + Math.sin(S.time * 2 + i) * 0.025); m.scale.set(scale, scale * 0.72, scale); } }
  for (let i = 0; i < S.bots.length; i++) { const b = S.bots[i], group = botGroups.get(b.id); if (group) { group.visible = b.alive; group.position.set(b.pos.x, b.pos.y, b.pos.z); group.rotation.y = b.yaw; } }
  for (let i = 0; i < S.events.length; i++) if (S.events[i].type === 'explosion' && !S.events[i]._effectPlayed) {
    const event = S.events[i], attr = particleGeometry.attributes.position;
    for (let j = 0; j < 60; j++) { const a = j * 3, theta = S.rng.range(0, Math.PI * 2), z = S.rng.range(-1, 1), r = Math.sqrt(1 - z * z) * S.rng.range(1, 5); attr.array[a] = event.pos.x + Math.cos(theta) * r; attr.array[a + 1] = event.pos.y + z * r; attr.array[a + 2] = event.pos.z + Math.sin(theta) * r; }
    attr.needsUpdate = true; particlePoints.visible = true; particleMaterial.opacity = 0.9; event._effectPlayed = true;
  }
  if (particlePoints.visible) { particleMaterial.opacity = Math.max(0, particleMaterial.opacity - dt * 0.8); if (!particleMaterial.opacity) particlePoints.visible = false; }
}
