// The "book rig": constructs every mesh + PBR material for one physical
// book — covers, spine, page block, page-turn leaves, headbands, ribbon
// bookmark, page signatures, edges, hit target, contact shadow.
// Adapted from complete-shelf-main/index.html's createBookRig() (~700
// lines in the original). Ported as faithfully as possible; deliberate
// changes from the source are called out inline with "HADI:" comments.
//
// HADI: the original's `book.id === "cursor"` special-case (one-off
// material tweak for a specific hardcoded volume) is dropped — nothing
// like that applies to a generated set of 114 surahs.
//
// HADI: interior page *content* is NOT baked in here. The rig only builds
// 6 physical "leaf" meshes (a fixed visual mechanism for the drag-turn
// gesture, not one mesh per real content page — the original demo already
// worked this way, reusing a small leaf count and retexturing them as you
// turn). Real Arabic/translation text is applied afterwards by Phase 2's
// pagination layer, which redraws each leaf's canvas texture as the reader
// moves through the surah. This means we do NOT need N meshes for N pages
// — a fixed handful of leaves is enough, which is a much smaller problem
// than it first looked.
//
// `book` descriptor shape (extends the one in textures.js):
//   {
//     seed, cloth, foil, motifKey, titleAr, titleSub, eyebrow,
//     width, height, depth,                 // physical dimensions (meters, three.js units)
//     palette: { paperPale, shelfDark, inkSoft }
//   }

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  createFadeMaterial,
  hashSeed,
  makeCoverTexture,
  makeFoilTexture,
  makeClothBumpTexture,
  makeClothSurfaceMaps,
  makeEmbossMap,
  makeBlankPaperTexture,
  makeEndpaperTexture,
  makeContactShadowTexture,
  makePageEdgeTextures,
  makeSpineTexture,
  makeSpineFoilTexture,
  makeBackCoverTexture,
  makeBackFoilTexture,
  makeWalnutMaps
} from "./textures.js";
import { createRoundedPlaneGeometry, createPageBlockGeometry } from "./geometry.js";

export const FLEXIBLE_PAGE_SEGMENTS = 18;
export const FLEXIBLE_PAGE_VERTICAL_SEGMENTS = 8;
export const LEAF_COUNT = 6;

/**
 * Base geometries/materials reused across every book in a scene (paper
 * color, headband color, etc. don't vary per surah — only the cover does).
 * Call once per scene and pass the result into every createBookRig call.
 */
export function createSharedAssets(renderer) {
  const walnutMaps = makeWalnutMaps(renderer);
  return {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    page: new THREE.MeshPhysicalMaterial({
      color: 0xe7dfcf,
      roughness: 0.95,
      metalness: 0,
      sheen: 0.025,
      sheenRoughness: 1
    }),
    pageSheet: new THREE.MeshPhysicalMaterial({
      color: 0xeee6d7,
      roughness: 0.955,
      metalness: 0,
      sheen: 0.02,
      sheenRoughness: 1,
      side: THREE.DoubleSide
    }),
    headband: new THREE.MeshPhysicalMaterial({
      color: 0xc6a66d,
      roughness: 0.58,
      metalness: 0.16,
      sheen: 0.14,
      sheenRoughness: 0.76
    }),
    // HADI: solid colors for now — see sceneSetup.js TODO for adding a real wood-grain texture map later
    // Procedural wood-grain — see textures.js makeWalnutMaps (self-hosted,
    // no external image asset). Falls back to a solid color if renderer
    // isn't provided (shouldn't happen in practice).
    walnut: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: walnutMaps?.color, roughnessMap: walnutMaps?.roughness, roughness: 0.62, metalness: 0.05
    }),
    walnutDark: new THREE.MeshStandardMaterial({
      color: 0x8a8a8a, map: walnutMaps?.color, roughnessMap: walnutMaps?.roughness, roughness: 0.7, metalness: 0.04
    })
  };
}

function createMesh(geometry, material, name, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function addTurnIns(pivot, book, shared, side, width, height, insideZ, material) {
  const stripDepth = 0.002;
  const border = 0.018;
  const longWidth = width - border * 0.7;
  const longHeight = height - border * 2.2;
  const definitions = [
    ["head", width * 0.5, height * 0.5 - border * 0.56, longWidth, border, stripDepth],
    ["tail", width * 0.5, -height * 0.5 + border * 0.56, longWidth, border, stripDepth],
    ["spine", border * 0.56, 0, border, longHeight, stripDepth],
    ["fore", width - border * 0.56, 0, border, longHeight, stripDepth]
  ];

  definitions.forEach(([edge, x, y, stripWidth, stripHeight, depth]) => {
    const strip = createMesh(shared.box, material, `${book.seed}-${side}-turn-in-${edge}`, false, true);
    strip.scale.set(stripWidth, stripHeight, depth);
    strip.position.set(x, y, insideZ);
    pivot.add(strip);
  });
}

/**
 * Builds one complete book rig. `renderer` is needed for texture quality
 * settings; `shared` comes from createSharedAssets(). Returns everything
 * the scene/interaction layer needs: the root Object3D to add to the
 * scene, the leaf pivots + surfaces (so Phase 2 can swap page textures),
 * the hit target (for raycasting), and every material (for fade in/out
 * during open/close transitions).
 */
export function createBookRig(book, index, renderer, shared) {
  const root = new THREE.Group();
  root.name = `book-${book.seed}`;
  root.userData.index = index;

  const motion = new THREE.Group();
  motion.name = `${book.seed}-motion`;
  root.add(motion);

  const width = book.width;
  const height = book.height;
  const depth = book.depth;
  const board = 0.032;
  const coverRadius = 0.0045;
  const pageRadius = 0.0025;
  const spineRadius = 0.0015;
  const spineBoardThickness = 0.014;
  const spineWidth = 0.082;
  const pageWidth = width - 0.074;
  const pageHeight = height - 0.068;
  const pageDepth = depth - 0.026;
  const numericSeed = hashSeed(book.seed);

  const coverTexture = makeCoverTexture(book, renderer);
  const foilTexture = makeFoilTexture(book, renderer);
  const clothBumpTexture = makeClothBumpTexture(book, renderer);
  const clothSurfaceMaps = makeClothSurfaceMaps(book, renderer);
  const paperFaceTexture = makeBlankPaperTexture(renderer);
  const endpaperTexture = makeEndpaperTexture(book, renderer);
  const pageEdgeTextures = makePageEdgeTextures(renderer);
  const spineTexture = makeSpineTexture(book, renderer);
  const spineFoilTexture = makeSpineFoilTexture(book, renderer);
  const backCoverTexture = makeBackCoverTexture(book, renderer);
  const backFoilTexture = makeBackFoilTexture(book, renderer);
  const foilEmbossTexture = makeEmbossMap(foilTexture, renderer, `${book.seed}-front-foil-emboss`);
  const spineEmbossTexture = makeEmbossMap(spineFoilTexture, renderer, `${book.seed}-spine-foil-emboss`);
  const backEmbossTexture = makeEmbossMap(backFoilTexture, renderer, `${book.seed}-back-foil-emboss`);

  const cloth = new THREE.MeshPhysicalMaterial({
    color: book.cloth,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughnessMap: clothSurfaceMaps.roughness,
    roughness: 0.98,
    metalness: 0.02,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0045,
    sheen: 0.34,
    sheenRoughness: 0.76,
    sheenColor: new THREE.Color(book.foil),
    transparent: true
  });
  const coverArt = new THREE.MeshPhysicalMaterial({
    map: coverTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0035,
    roughness: 0.92,
    metalness: 0.035,
    clearcoat: 0.06,
    clearcoatRoughness: 0.72,
    sheen: 0.26,
    sheenRoughness: 0.78,
    transparent: true
  });
  const foilArt = new THREE.MeshPhysicalMaterial({
    color: book.foil,
    map: foilTexture,
    alphaMap: foilTexture,
    bumpMap: foilEmbossTexture,
    bumpScale: 0.016,
    roughness: 0.2,
    metalness: 0.94,
    clearcoat: 0.18,
    clearcoatRoughness: 0.12,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2
  });
  const spineArt = new THREE.MeshPhysicalMaterial({
    map: spineTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.004,
    roughness: 0.95,
    metalness: 0.025,
    sheen: 0.27,
    sheenRoughness: 0.78,
    transparent: true,
    side: THREE.DoubleSide
  });
  const spineFoilArt = new THREE.MeshPhysicalMaterial({
    color: book.foil,
    map: spineFoilTexture,
    alphaMap: spineFoilTexture,
    bumpMap: spineEmbossTexture,
    bumpScale: 0.017,
    roughness: 0.19,
    metalness: 0.92,
    clearcoat: 0.16,
    clearcoatRoughness: 0.13,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    side: THREE.DoubleSide
  });
  const backArt = new THREE.MeshPhysicalMaterial({
    map: backCoverTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0035,
    roughness: 0.96,
    metalness: 0.025,
    sheen: 0.25,
    sheenRoughness: 0.8,
    transparent: true,
    side: THREE.DoubleSide
  });
  const backFoilArt = new THREE.MeshPhysicalMaterial({
    color: book.foil,
    map: backFoilTexture,
    alphaMap: backFoilTexture,
    bumpMap: backEmbossTexture,
    bumpScale: 0.016,
    roughness: 0.21,
    metalness: 0.9,
    clearcoat: 0.14,
    clearcoatRoughness: 0.14,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    side: THREE.DoubleSide
  });
  const endpaperMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(book.palette.paperPale).lerp(new THREE.Color(0xf2ead8), 0.5),
    map: endpaperTexture,
    bumpMap: paperFaceTexture,
    bumpScale: 0.0018,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.025,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true
  });
  const foreEdgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: pageEdgeTextures.fore,
    bumpMap: pageEdgeTextures.fore,
    bumpScale: 0.0022,
    roughness: 0.93,
    metalness: 0,
    sheen: 0.018,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true
  });
  const headTailEdgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: pageEdgeTextures.headTail,
    bumpMap: pageEdgeTextures.headTail,
    bumpScale: 0.0015,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.014,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true
  });
  const grooveMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(book.cloth).multiplyScalar(0.42),
    roughness: 0.9,
    metalness: 0,
    bumpMap: clothBumpTexture,
    bumpScale: 0.006,
    side: THREE.DoubleSide,
    transparent: true
  });
  const pageMaterial = createFadeMaterial(shared.page);
  const headbandMaterial = createFadeMaterial(shared.headband);

  // HADI: blank for now — Phase 2 assigns live per-leaf Arabic/translation
  // canvas textures onto these materials' `.map` as the reader turns pages.
  const leafMaterials = Array.from({ length: LEAF_COUNT * 2 }, () => {
    const material = createFadeMaterial(shared.pageSheet);
    material.map = paperFaceTexture;
    material.bumpMap = paperFaceTexture;
    material.bumpScale = 0.0012;
    material.roughness = 0.96;
    material.side = THREE.FrontSide;
    material.needsUpdate = true;
    return material;
  });
  const blankPageMaterial = createFadeMaterial(shared.pageSheet);
  blankPageMaterial.map = paperFaceTexture;
  blankPageMaterial.bumpMap = paperFaceTexture;
  blankPageMaterial.bumpScale = 0.0012;
  blankPageMaterial.roughness = 0.96;
  blankPageMaterial.side = THREE.FrontSide;
  blankPageMaterial.needsUpdate = true;
  const signatureMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8d816f).lerp(new THREE.Color(book.palette.paperPale), 0.34),
    roughness: 0.98,
    metalness: 0,
    transparent: true
  });
  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(book.foil).lerp(new THREE.Color(book.cloth), 0.28),
    roughness: 0.62,
    metalness: 0.08,
    sheen: 0.36,
    sheenRoughness: 0.68,
    side: THREE.DoubleSide,
    transparent: true
  });

  pageMaterial.map = paperFaceTexture;
  pageMaterial.bumpMap = paperFaceTexture;
  pageMaterial.bumpScale = 0.0014;
  pageMaterial.roughness = 0.95;
  pageMaterial.needsUpdate = true;

  const coverGeometry = new RoundedBoxGeometry(width, height, board, 2, coverRadius);
  const pageGeometry = createPageBlockGeometry(pageWidth, pageHeight, pageDepth, pageRadius);
  const coverSurfaceGeometry = createRoundedPlaneGeometry(width - 0.007, height - 0.007, 0.0035);
  const endpaperGeometry = createRoundedPlaneGeometry(width - 0.045, height - 0.045, 0.003);

  root.userData.construction = {
    board, coverRadius, pageRadius, spineRadius, spineBoardThickness,
    flexiblePageSegments: FLEXIBLE_PAGE_SEGMENTS,
    turnInStrips: 8,
    ribbonBookmark: true,
    pageSignatures: pageGeometry.userData.pageSignatures,
    gutterCompression: pageGeometry.userData.gutterCompression,
    coverArtInset: 0.007,
    coverOverhangX: (width - pageWidth) * 0.5,
    coverOverhangY: (height - pageHeight) * 0.5
  };

  const pageBlock = createMesh(pageGeometry, pageMaterial, `${book.seed}-page-block`);
  pageBlock.position.x = 0.018;
  motion.add(pageBlock);

  const backPivot = new THREE.Group();
  backPivot.name = `${book.seed}-back-cover-pivot`;
  backPivot.position.set(-width * 0.5, 0, -depth * 0.5 - board * 0.5);
  const backCover = createMesh(coverGeometry, cloth, `${book.seed}-back-cover`);
  backCover.position.x = width * 0.5;
  backPivot.add(backCover);

  const backPlane = createMesh(coverSurfaceGeometry, backArt, `${book.seed}-back-cover-art`, false, false);
  backPlane.position.set(width * 0.5, 0, -board * 0.55);
  backPlane.rotation.y = Math.PI;
  backPivot.add(backPlane);

  const backFoilPlane = createMesh(coverSurfaceGeometry, backFoilArt, `${book.seed}-back-foil-art`, false, false);
  backFoilPlane.position.set(width * 0.5, 0, -board * 0.605);
  backFoilPlane.rotation.y = Math.PI;
  backPivot.add(backFoilPlane);

  const backEndpaper = createMesh(endpaperGeometry, endpaperMaterial, `${book.seed}-back-endpaper`, false, true);
  backEndpaper.position.set(width * 0.5, 0, board * 0.515);
  backPivot.add(backEndpaper);
  addTurnIns(backPivot, book, shared, "back", width, height, board * 0.53, cloth);

  const backGroove = createMesh(shared.plane, grooveMaterial, `${book.seed}-back-hinge-groove`, false, false);
  backGroove.scale.set(0.012, height * 0.94, 1);
  backGroove.position.set(0.038, 0, -board * 0.535);
  backGroove.rotation.y = Math.PI;
  backPivot.add(backGroove);
  motion.add(backPivot);

  const frontPivot = new THREE.Group();
  frontPivot.name = `${book.seed}-front-cover-pivot`;
  frontPivot.position.set(-width * 0.5, 0, depth * 0.5 + board * 0.5);
  const frontCover = createMesh(coverGeometry, cloth, `${book.seed}-front-cover`);
  frontCover.position.x = width * 0.5;
  frontPivot.add(frontCover);

  const coverPlane = createMesh(coverSurfaceGeometry, coverArt, `${book.seed}-cover-art`, false, false);
  coverPlane.position.set(width * 0.5, 0, board * 0.55);
  frontPivot.add(coverPlane);

  const foilPlane = createMesh(coverSurfaceGeometry, foilArt, `${book.seed}-foil-art`, false, false);
  foilPlane.position.set(width * 0.5, 0, board * 0.605);
  frontPivot.add(foilPlane);

  const frontEndpaper = createMesh(endpaperGeometry, endpaperMaterial, `${book.seed}-front-endpaper`, false, true);
  frontEndpaper.position.set(width * 0.5, 0, -board * 0.515);
  frontEndpaper.rotation.y = Math.PI;
  frontPivot.add(frontEndpaper);
  addTurnIns(frontPivot, book, shared, "front", width, height, -board * 0.53, cloth);

  const frontGroove = createMesh(shared.plane, grooveMaterial, `${book.seed}-front-hinge-groove`, false, false);
  frontGroove.scale.set(0.012, height * 0.94, 1);
  frontGroove.position.set(0.038, 0, board * 0.655);
  frontPivot.add(frontGroove);
  motion.add(frontPivot);

  const pagePivots = [];
  const pageSurfaces = [];
  for (let pageIndex = 0; pageIndex < LEAF_COUNT; pageIndex += 1) {
    const leafOrder = LEAF_COUNT - 1 - pageIndex;
    const frontPageMaterial = leafMaterials[leafOrder * 2] || blankPageMaterial;
    const backPageMaterial = leafMaterials[leafOrder * 2 + 1] || blankPageMaterial;
    const pagePivot = new THREE.Group();
    pagePivot.name = `${book.seed}-page-${pageIndex}`;
    pagePivot.position.set(-width * 0.5 + spineWidth * 0.65, 0, pageDepth * 0.5 + 0.0015 + pageIndex * 0.0015);
    pagePivot.userData.restZ = pagePivot.position.z;
    pagePivot.userData.turnedZ = depth * 0.5 + board + 0.004 + leafOrder * 0.0015;
    pagePivot.userData.leafIndex = pageIndex;
    const frontPageGeometry = new THREE.PlaneGeometry(1, 1, FLEXIBLE_PAGE_SEGMENTS, FLEXIBLE_PAGE_VERTICAL_SEGMENTS);
    const backPageGeometry = new THREE.PlaneGeometry(1, 1, FLEXIBLE_PAGE_SEGMENTS, FLEXIBLE_PAGE_VERTICAL_SEGMENTS);
    const visiblePageWidth = pageWidth - spineWidth * 0.42;
    const frontPage = createMesh(frontPageGeometry, frontPageMaterial, `${book.seed}-page-sheet-${pageIndex}-front`, false, true);
    frontPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
    frontPage.position.set(visiblePageWidth * 0.5, 0, 0.00022);
    pagePivot.add(frontPage);
    pageSurfaces.push(frontPage);

    const backPage = createMesh(backPageGeometry, backPageMaterial, `${book.seed}-page-sheet-${pageIndex}-back`, false, true);
    backPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
    backPage.position.set(visiblePageWidth * 0.5, 0, -0.00022);
    backPage.rotation.y = Math.PI;
    pagePivot.add(backPage);
    pageSurfaces.push(backPage);
    pagePivot.userData.flex = {
      curve: 0,
      curveVelocity: 0,
      twist: 0,
      twistVelocity: 0,
      surfaces: [
        { geometry: frontPageGeometry, position: frontPageGeometry.attributes.position, base: Float32Array.from(frontPageGeometry.attributes.position.array), direction: 1 },
        { geometry: backPageGeometry, position: backPageGeometry.attributes.position, base: Float32Array.from(backPageGeometry.attributes.position.array), direction: -1 }
      ]
    };
    motion.add(pagePivot);
    pagePivots.push(pagePivot);
  }

  const spineGeometry = new RoundedBoxGeometry(spineBoardThickness, height - 0.012, depth + board * 1.88, 1, spineRadius);
  const spine = createMesh(spineGeometry, spineArt, `${book.seed}-flat-spine`);
  spine.position.x = -width * 0.5 - spineBoardThickness * 0.35;
  motion.add(spine);

  const spineFoil = createMesh(shared.plane, spineFoilArt, `${book.seed}-spine-foil`, false, false);
  spineFoil.scale.set(depth + board * 1.82, height - 0.018, 1);
  spineFoil.rotation.y = -Math.PI * 0.5;
  spineFoil.position.set(spine.position.x - spineBoardThickness * 0.505, 0, 0);
  motion.add(spineFoil);

  const spineLining = createMesh(
    new RoundedBoxGeometry(spineWidth * 0.68, height - 0.056, Math.max(0.045, pageDepth - 0.008), 1, 0.0015),
    endpaperMaterial,
    `${book.seed}-spine-lining`
  );
  spineLining.position.set(-width * 0.5 + spineWidth * 0.38, 0, 0);
  motion.add(spineLining);

  [-1, 1].forEach((direction) => {
    const headbandGeometry = new THREE.CylinderGeometry(0.012, 0.012, pageDepth * 0.88, 12, 1, false);
    const headband = createMesh(headbandGeometry, headbandMaterial, `${book.seed}-headband-${direction}`);
    headband.rotation.x = Math.PI * 0.5;
    headband.position.set(-pageWidth * 0.5 + 0.046, direction * (pageHeight * 0.5 - 0.004), 0);
    motion.add(headband);
  });

  const ribbonGeometry = createRoundedPlaneGeometry(0.034, pageHeight * 0.76, 0.002);
  const ribbon = createMesh(ribbonGeometry, ribbonMaterial, `${book.seed}-ribbon-bookmark`, false, true);
  ribbon.position.set(-pageWidth * 0.5 + 0.09 + (numericSeed % 3) * 0.018, -pageHeight * 0.17, pageDepth * 0.5 + 0.003);
  ribbon.rotation.z = (numericSeed % 2 ? -1 : 1) * 0.014;
  motion.add(ribbon);

  for (let signatureIndex = 0; signatureIndex < 6; signatureIndex += 1) {
    const signature = createMesh(shared.box, signatureMaterial, `${book.seed}-page-signature-${signatureIndex + 1}`, false, true);
    signature.scale.set(0.0035, 0.00135, pageDepth * 0.91);
    signature.position.set(0.018 + pageWidth * 0.5 + 0.001, -pageHeight * 0.5 + ((signatureIndex + 1) / 7) * pageHeight, 0);
    motion.add(signature);
  }

  const foreEdge = createMesh(shared.plane, foreEdgeMaterial, `${book.seed}-fore-edge`, false, true);
  foreEdge.scale.set(pageDepth * 0.94, pageHeight - 0.028, 1);
  foreEdge.rotation.y = Math.PI * 0.5;
  foreEdge.position.set(0.018 + pageWidth * 0.5 + 0.002, 0, 0);
  motion.add(foreEdge);

  [-1, 1].forEach((direction) => {
    const edge = createMesh(shared.plane, headTailEdgeMaterial, `${book.seed}-${direction > 0 ? "head" : "tail"}-edge`, false, true);
    edge.scale.set(pageWidth - 0.035, pageDepth * 0.94, 1);
    edge.rotation.x = direction > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    edge.position.set(0.018, direction * (pageHeight * 0.5 + 0.002), 0);
    motion.add(edge);
  });

  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hit = createMesh(shared.box, hitMaterial, `${book.seed}-hit-target`, false, false);
  hit.scale.set(width * 1.34, height * 1.2, Math.max(depth * 4, 1));
  hit.position.set(-spineWidth * 0.18, 0, 0.12);
  hit.userData.index = index;
  motion.add(hit);

  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(book.palette.shelfDark),
    alphaMap: makeContactShadowTexture(renderer),
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const contactShadow = createMesh(shared.plane, contactShadowMaterial, `${book.seed}-contact-shadow`, false, false);
  contactShadow.scale.set(width * 1.22, depth * 2.05, 1);
  contactShadow.rotation.x = -Math.PI * 0.5;
  contactShadow.position.set(0, -height * 0.5 - 0.022, 0.025);
  root.add(contactShadow);

  const fadeMaterials = [
    cloth, coverArt, foilArt, spineArt, spineFoilArt, backArt, backFoilArt,
    endpaperMaterial, foreEdgeMaterial, headTailEdgeMaterial, grooveMaterial,
    pageMaterial, ...leafMaterials, blankPageMaterial, headbandMaterial,
    signatureMaterial, ribbonMaterial
  ];

  return {
    data: book,
    root,
    motion,
    frontPivot,
    frontCover,
    pageBlock,
    pagePivots,
    pageSurfaces,          // Phase 2 writes live text textures onto pageSurfaces[i].material.map
    pageGestureSurfaces: [...pageSurfaces, pageBlock],
    hit,
    contactShadow,
    opacity: 1,
    fadeMaterials,
    materials: [...fadeMaterials, contactShadowMaterial, hitMaterial],
    base: { width, height, depth }
  };
}
