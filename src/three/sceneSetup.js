// Room/shelf/lighting setup for the book scene, adapted from
// complete-shelf-main/index.html's addRoom/addLights/addDust and the
// camera/responsive-layout helpers around configureResponsiveTargets.
//
// The walnut shelf uses a procedural wood-grain texture (see textures.js
// makeWalnutMaps) rather than the original demo's embedded base64 photo —
// self-hosted/generated like everything else here, no external image
// asset dependency.

import * as THREE from "three";
import { makeContactShadowTexture } from "./textures.js";

function createMesh(geometry, material, name, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

/**
 * Adds the walnut shelf + wood uprights + paper floor/backdrop + contact
 * shadow to the scene. `shared` must include `box`/`plane` geometries and
 * `walnut`/`walnutDark` materials — extend createSharedAssets() from
 * bookRig.js with those two materials before calling this.
 */
export function addRoom(scene, shelfStage, shared, renderer) {
  const floor = createMesh(
    shared.plane,
    new THREE.MeshStandardMaterial({ color: 0xd8c8aa, roughness: 0.92, metalness: 0 }),
    "paper-floor", false, true
  );
  floor.scale.set(30, 20, 1);
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.y = -0.02;
  scene.add(floor);

  const back = createMesh(
    shared.plane,
    new THREE.MeshStandardMaterial({ color: 0xe9dfcb, roughness: 1, metalness: 0 }),
    "paper-backdrop", false, true
  );
  back.scale.set(28, 14, 1);
  back.position.set(0, 5.5, -3.3);
  scene.add(back);

  const shelf = createMesh(shared.box, shared.walnut, "walnut-shelf");
  shelf.scale.set(17, 0.28, 1.08);
  shelf.position.set(0, 0.33, -0.03);
  shelfStage.add(shelf);

  const shelfLip = createMesh(shared.box, shared.walnutDark, "walnut-shelf-lip");
  shelfLip.scale.set(17.05, 0.075, 1.14);
  shelfLip.position.set(0, 0.205, 0.02);
  shelfStage.add(shelfLip);

  const backRail = createMesh(shared.box, shared.walnut, "walnut-back-rail");
  backRail.scale.set(17, 0.17, 0.2);
  backRail.position.set(0, 0.68, -0.52);
  shelfStage.add(backRail);

  [-7.65, 7.65].forEach((x, index) => {
    const upright = createMesh(shared.box, shared.walnutDark, `shelf-upright-${index}`);
    upright.scale.set(0.2, 3.8, 0.72);
    upright.position.set(x, 2.05, -0.28);
    shelfStage.add(upright);
  });

  const shadowStrip = createMesh(
    shared.plane,
    new THREE.MeshBasicMaterial({
      color: 0x2f1d13,
      alphaMap: makeContactShadowTexture(renderer),
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    }),
    "shelf-contact-shadow", false, false
  );
  shadowStrip.scale.set(16, 0.85, 1);
  shadowStrip.rotation.x = -Math.PI * 0.5;
  shadowStrip.position.set(0, 0.49, 0.06);
  shelfStage.add(shadowStrip);

  return {
    floor: floor.material,
    wall: back.material,
    shelf: shared.walnut,
    shelfDark: shared.walnutDark,
    shadow: shadowStrip.material
  };
}

/** Adds the full editorial-library light rig (key, soft fill, rim, spine/page rakes). Returns each light by name for later theme-tinting. */
export function addLights(scene) {
  const roomLights = {};

  roomLights.hemisphere = new THREE.HemisphereLight(0xfff8e8, 0x5b4030, 0.56);
  scene.add(roomLights.hemisphere);

  const key = new THREE.DirectionalLight(0xffe8c2, 1.42);
  key.name = "shadow-key";
  key.position.set(-4.6, 7.4, 5.8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -1.5;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 18;
  key.shadow.bias = -0.00018;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 3.5;
  scene.add(key);
  roomLights.key = key;

  const softKey = new THREE.RectAreaLight(0xffe8c2, 5.4, 4.8, 5.6);
  softKey.name = "cloth-softbox";
  softKey.position.set(-3.2, 5.5, 4.6);
  softKey.lookAt(0, 1.45, 0);
  scene.add(softKey);
  roomLights.softKey = softKey;

  const fill = new THREE.DirectionalLight(0xd8e3e7, 0.3);
  fill.name = "cool-fill";
  fill.position.set(5.5, 3.6, 4.2);
  scene.add(fill);
  roomLights.fill = fill;

  const rim = new THREE.RectAreaLight(0xd5a45e, 3.45, 1.6, 4.8);
  rim.name = "foil-rake";
  rim.position.set(3.8, 3.6, -2.1);
  rim.lookAt(-0.2, 1.5, 0);
  scene.add(rim);
  roomLights.rim = rim;

  const backFill = new THREE.RectAreaLight(0xd8e3e7, 2.7, 3.8, 4.8);
  backFill.name = "back-cover-softbox";
  backFill.position.set(-1.8, 2.9, -4.5);
  backFill.lookAt(-0.1, 1.45, 0);
  scene.add(backFill);
  roomLights.backFill = backFill;

  const spineRake = new THREE.RectAreaLight(0xffe8c2, 1.9, 0.9, 4.6);
  spineRake.name = "spine-rake";
  spineRake.position.set(-4.6, 3.2, 1.1);
  spineRake.lookAt(-0.55, 1.5, 0);
  scene.add(spineRake);
  roomLights.spineRake = spineRake;

  const pageRake = new THREE.RectAreaLight(0xfff7e7, 2.15, 1.15, 3.8);
  pageRake.name = "page-edge-rake";
  pageRake.position.set(4.2, 4.8, 3.1);
  pageRake.lookAt(0.65, 1.55, 0);
  scene.add(pageRake);
  roomLights.pageRake = pageRake;

  return roomLights;
}

/** Ambient floating dust motes — a fixed, deterministically-seeded point cloud for atmosphere. */
export function addDust(scene, seededRandom) {
  const dustCount = 110;
  const positions = new Float32Array(dustCount * 3);
  const random = seededRandom(20260728);
  for (let index = 0; index < dustCount; index += 1) {
    positions[index * 3] = (random() - 0.5) * 14;
    positions[index * 3 + 1] = 0.7 + random() * 4.7;
    positions[index * 3 + 2] = -1.7 + random() * 4;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc3a97b, size: 0.014, transparent: true, opacity: 0.3, depthWrite: false
  });
  const dust = new THREE.Points(geometry, material);
  dust.name = "paper-dust";
  dust.userData.isDust = true;
  scene.add(dust);
  return dust;
}

const clamp = THREE.MathUtils.clamp;

/**
 * Computes shelf/inspect camera positions + the detail-panel view-offset
 * math, responsive to viewport width. HADI: `detailPanelBounds` replaces
 * the original's direct DOM query of a fixed #detail-panel element — pass
 * getBoundingClientRect() of whatever Hadi's equivalent side panel is (or
 * null if there isn't one at a given breakpoint).
 */
export function computeResponsiveTargets(viewWidth, viewHeight, detailPanelBounds) {
  const narrow = viewWidth < 820;
  const shelfCameraPosition = new THREE.Vector3(0, narrow ? 2.02 : 1.92, narrow ? 8.7 : 8.1);
  const shelfCameraTarget = new THREE.Vector3(0, narrow ? 1.57 : 1.55, 0);
  const inspectPosition = new THREE.Vector3(narrow ? 0 : -2.25, narrow ? 2.3 : 1.56, narrow ? 0.15 : 0);
  const inspectCameraPosition = new THREE.Vector3(narrow ? 0 : -0.52, narrow ? 2.46 : 1.78, narrow ? 5.7 : 5.25);
  const inspectCameraTarget = inspectPosition.clone();

  if (narrow) {
    return {
      narrow, shelfCameraPosition, shelfCameraTarget, inspectPosition, inspectCameraPosition, inspectCameraTarget,
      detailViewOffsetX: 0, detailSafeWidth: viewWidth
    };
  }

  const panelLeft = detailPanelBounds && detailPanelBounds.left > 0 ? detailPanelBounds.left : viewWidth * 0.64;
  const gutter = clamp(viewWidth * 0.035, 32, 56);
  const detailSafeWidth = Math.max(viewWidth * 0.42, panelLeft - gutter);
  const wideLayoutProgress = clamp((viewWidth - 820) / 620, 0, 1);
  const bookCenterRatio = THREE.MathUtils.lerp(0.55, 0.615, wideLayoutProgress);
  const desiredBookCenter = detailSafeWidth * bookCenterRatio;
  const detailViewOffsetX = Math.max(0, viewWidth * 0.5 - desiredBookCenter);

  return {
    narrow, shelfCameraPosition, shelfCameraTarget, inspectPosition, inspectCameraPosition, inspectCameraTarget,
    detailViewOffsetX, detailSafeWidth
  };
}

/** Scale factor to fit the open book within the safe (non-overlapping) viewport area. */
export function getInspectScale({ viewWidth, viewHeight, camera, activeBookWidth, inspectCameraPosition, inspectPosition, detailSafeWidth }) {
  if (!activeBookWidth || viewWidth < 820) return 0.82;
  const distance = Math.abs(inspectCameraPosition.z - inspectPosition.z);
  const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  const pixelsPerWorld = viewHeight / Math.max(worldHeight, 0.001);
  const estimatedBookWidth = activeBookWidth * pixelsPerWorld * 1.16;
  const scaleForSafeWidth = (detailSafeWidth * 0.72) / Math.max(estimatedBookWidth, 1);
  return clamp(scaleForSafeWidth, 0.9, 1.32);
}

/** Applies (or clears) the camera's asymmetric view-offset used to keep the open book clear of a side panel on wide screens. */
export function applyDetailViewOffset(camera, viewWidth, viewHeight, currentViewOffsetX) {
  if (Math.abs(currentViewOffsetX) < 0.5) {
    camera.clearViewOffset();
    return;
  }
  camera.setViewOffset(viewWidth, viewHeight, currentViewOffsetX, 0, viewWidth, viewHeight);
}
