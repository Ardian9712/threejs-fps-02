import * as THREE from 'three';
import { PALETTE } from './palette.js';

function box(scene, material, x, y, z, sx, sy, sz, colliders, blocks = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y + sy / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (blocks) colliders.push({ min: { x: x - sx / 2, y, z: z - sz / 2 }, max: { x: x + sx / 2, y: y + sy, z: z + sz / 2 } });
  return mesh;
}

export function buildWorld(scene, S) {
  const concrete = new THREE.MeshStandardMaterial({ color: PALETTE.concrete.hex, roughness: 0.92 });
  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.steel.hex, roughness: 0.84, metalness: 0.25 });
  const rust = new THREE.MeshStandardMaterial({ color: PALETTE.rust.hex, roughness: 0.78, metalness: 0.2 });
  const floorMat = new THREE.MeshStandardMaterial({ color: PALETTE.charcoal.hex, roughness: 0.97 });
  const siteAMat = new THREE.MeshStandardMaterial({ color: PALETTE.ember.hex, roughness: 0.8, emissive: PALETTE.ember.hex, emissiveIntensity: 0.2 });
  const siteBMat = new THREE.MeshStandardMaterial({ color: PALETTE.gold.hex, roughness: 0.8, emissive: PALETTE.gold.hex, emissiveIntensity: 0.18 });
  const furnaceMat = new THREE.MeshStandardMaterial({ color: PALETTE.rust.hex, emissive: PALETTE.ember.hex, emissiveIntensity: 1.35, roughness: 0.6 });
  scene.background = new THREE.Color(PALETTE.charcoal.hex);
  scene.fog = new THREE.Fog(PALETTE.charcoal.hex, 26, 62);
  scene.add(new THREE.HemisphereLight(0xb7c0c8, 0x25201c, 1.5));
  const sun = new THREE.DirectionalLight(0xffd1a1, 2.4);
  sun.position.set(-9, 18, 8);
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 36), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const colliders = [];
  const wall = 1;
  box(scene, concrete, 0, 0, -18, 44, 4, wall, colliders);
  box(scene, concrete, 0, 0, 18, 44, 4, wall, colliders);
  box(scene, concrete, -22, 0, 0, wall, 4, 36, colliders);
  box(scene, concrete, 22, 0, 0, wall, 4, 36, colliders);

  // Interior walls create west, center, and east routes while retaining a center firing gap.
  box(scene, concrete, -7, 0, -8, 1, 3.2, 15, colliders);
  box(scene, concrete, -7, 0, 10, 1, 3.2, 8, colliders);
  box(scene, concrete, 7, 0, -8, 1, 3.2, 15, colliders);
  box(scene, concrete, 7, 0, 10, 1, 3.2, 8, colliders);
  box(scene, concrete, 0, 0, -3, 8, 2.8, 1, colliders);
  box(scene, concrete, -15, 0, 1, 8, 2.8, 1, colliders);
  box(scene, concrete, 15, 0, 1, 8, 2.8, 1, colliders);

  const cover = [
    [-16, 1.1, 5, 2.4, 2.2], [-12, 2.2, -9, 2.4, 2.4], [-18, 1.1, -12, 2, 1.8],
    [-10, 1.1, 3, 2, 1.6], [-3, 2.2, 7, 2.4, 2.2], [3, 1.1, 4, 2, 2],
    [11, 2.2, 6, 2.4, 2], [16, 1.1, 4, 2, 1.8], [12, 1.1, -8, 2.2, 2],
    [18, 2.2, -12, 2.4, 2.2], [-3, 1.1, -12, 2, 1.6], [3, 2.2, -11, 2.4, 2],
    [-17, 2.2, -5, 2.4, 2], [17, 1.1, -4, 2, 2],
  ];
  for (let i = 0; i < cover.length; i++) {
    const [x, h, z, sx, sz] = cover[i];
    box(scene, i % 3 === 0 ? rust : steel, x, 0, z, sx, h, sz, colliders);
  }

  const sites = { A: { x: -16, z: -10, r: 3.1 }, B: { x: 16, z: -10, r: 3.1 } };
  for (const [site, material] of [[sites.A, siteAMat], [sites.B, siteBMat]]) {
    const marking = new THREE.Mesh(new THREE.CircleGeometry(site.r, 32), material);
    marking.rotation.x = -Math.PI / 2;
    marking.position.set(site.x, 0.025, site.z);
    scene.add(marking);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.6, 8), material);
    post.position.set(site.x, 1.3, site.z - site.r - 0.45);
    scene.add(post);
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.36, 0.08), material);
    label.position.set(site.x, 2.45, site.z - site.r - 0.45);
    scene.add(label);
  }

  const furnaces = [[-20, -8], [-20, 9], [20, -8], [20, 9]];
  for (const [x, z] of furnaces) {
    box(scene, steel, x, 0, z, 1.5, 2.2, 1.5, colliders);
    const glow = box(scene, furnaceMat, x, 0.7, z - 0.77, 0.8, 0.8, 0.12, colliders, false);
    glow.castShadow = false;
    const light = new THREE.PointLight(PALETTE.ember.hex, 7, 10, 2);
    light.position.set(x, 1.5, z - 1);
    scene.add(light);
  }

  const spawnMarks = [{ x: 0, z: 14 }, { x: -2.2, z: 14 }, { x: 2.2, z: 14 }];
  const slagSpawns = [{ x: -3.15, z: -14 }, { x: -1.05, z: -14 }, { x: 1.05, z: -14 }, { x: 3.15, z: -14 }];
  const markerMat = new THREE.MeshStandardMaterial({ color: PALETTE.ember.hex, emissive: PALETTE.ember.hex, emissiveIntensity: 0.4 });
  for (const p of spawnMarks) {
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.48, 20), markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(p.x, 0.04, p.z);
    scene.add(marker);
  }
  const waypoints = [
    { x: 0, z: 14 }, { x: -12, z: 12 }, { x: -12, z: 2 }, { x: -12, z: -5 },
    { x: -16, z: -10 }, { x: 10, z: 16 }, { x: 12, z: 12 }, { x: 12, z: 2 },
    { x: 12, z: -5 }, { x: 16, z: -10 }, { x: 0, z: 6 }, { x: -5, z: -1 },
    { x: -5, z: -6 }, { x: 0, z: -8 }, { x: 0, z: -14 }, { x: -7, z: 16 },
  ];
  S.worldSeed = S.seed;
  return { colliders, sites, spawns: { ember: spawnMarks, slag: slagSpawns }, waypoints, losBlockers: colliders };
}

export function collideMove(pos, halfW, height, vel, dt, colliders) {
  let next = pos.x + vel.x * dt;
  for (const c of colliders) {
    if (pos.y + height <= c.min.y || pos.y >= c.max.y) continue;
    if (pos.z + halfW <= c.min.z || pos.z - halfW >= c.max.z) continue;
    if (next + halfW > c.min.x && next - halfW < c.max.x) next = vel.x > 0 ? c.min.x - halfW : c.max.x + halfW;
  }
  pos.x = next;
  next = pos.z + vel.z * dt;
  for (const c of colliders) {
    if (pos.y + height <= c.min.y || pos.y >= c.max.y) continue;
    if (pos.x + halfW <= c.min.x || pos.x - halfW >= c.max.x) continue;
    if (next + halfW > c.min.z && next - halfW < c.max.z) next = vel.z > 0 ? c.min.z - halfW : c.max.z + halfW;
  }
  pos.z = next;
  return pos;
}

export function segmentBlocked(ax, ay, az, bx, by, bz, colliders) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  for (const c of colliders) {
    let tmin = 0, tmax = 1;
    let hit = true;
    const min = c.min, max = c.max;
    let inv, t1, t2, swap;
    if (Math.abs(dx) < 1e-9) { if (ax < min.x || ax > max.x) hit = false; }
    else {
      inv = 1 / dx; t1 = (min.x - ax) * inv; t2 = (max.x - ax) * inv;
      if (t1 > t2) { swap = t1; t1 = t2; t2 = swap; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    }
    if (hit) {
      if (Math.abs(dy) < 1e-9) { if (ay < min.y || ay > max.y) hit = false; }
      else {
        inv = 1 / dy; t1 = (min.y - ay) * inv; t2 = (max.y - ay) * inv;
        if (t1 > t2) { swap = t1; t1 = t2; t2 = swap; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      }
    }
    if (hit) {
      if (Math.abs(dz) < 1e-9) { if (az < min.z || az > max.z) hit = false; }
      else {
        inv = 1 / dz; t1 = (min.z - az) * inv; t2 = (max.z - az) * inv;
        if (t1 > t2) { swap = t1; t1 = t2; t2 = swap; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      }
    }
    if (hit && tmax >= 0 && tmin <= 1) return true;
  }
  return false;
}

export function pointInSite(x, z, site) {
  const dx = x - site.x, dz = z - site.z;
  return dx * dx + dz * dz <= site.r * site.r;
}
