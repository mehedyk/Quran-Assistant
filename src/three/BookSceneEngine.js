// BookSceneEngine: the full interactive book-scene state machine, adapted
// from complete-shelf-main/index.html's main script body (shelf carousel,
// openDetail/closeDetail transitions, curved drag-to-turn pages, an
// on-demand [not continuous] render loop). Ported as a class instead of
// top-level closures so React can own its lifecycle cleanly (one instance
// per mounted <BookScene>, torn down on unmount).
//
// HADI-specific notes:
// - `books` is the full surah list (up to 114). Unlike the original's
//   fixed 7, we do NOT eagerly build a rig for every book — see
//   `ensureRigsAround()`. Only books within `RIG_WINDOW` of the current
//   shelf position get a real rig; others are disposed. This is a direct
//   extension of the original's existing distance-based fade/cull logic
//   (snapRigToShelfSlot already fades opacity by distance) — we just also
//   skip building geometry/textures for anything far off-screen, which
//   the original never needed with only 7 volumes.
// - Page content (pageSurfaces[i].material.map) is left blank by
//   createBookRig; Phase 2 assigns live text textures onto it.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

import { createSharedAssets, createBookRig, LEAF_COUNT } from "./bookRig.js";
import { addRoom, addLights, addDust, computeResponsiveTargets, getInspectScale, applyDetailViewOffset } from "./sceneSetup.js";
import { seededRandom } from "./textures.js";
import { paginateAyat, renderPageFace, renderBlankFace } from "./pageContentTexture.js";

const damp = THREE.MathUtils.damp;
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smoothstep = (value) => value * value * (3 - 2 * value);
const smootherstep = (value) => value * value * value * (value * (value * 6 - 15) + 10);
const mod = (value, range) => ((value % range) + range) % range;

const PAGINATED_LEAF_COUNT = LEAF_COUNT - 2; // matches original's 4-of-6 (2 outer leaves stay static covers-of-the-block)
const SPREAD_COUNT = PAGINATED_LEAF_COUNT + 1;
const PAGE_TURN_COMMIT_PROGRESS = 0.18;
const COVER_OPEN_COMMIT_PROGRESS = 0.16;
const COVER_CLOSE_COMMIT_PROGRESS = 0.2;
const RIG_WINDOW = 6; // how many shelf slots either side of the current position get a real rig

export class BookSceneEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   * @param {Array} options.books - full book descriptor list (see textures.js header for shape)
   * @param {(index: number) => void} [options.onSelectionChange]
   * @param {(book: object|null, spread: number, readingOpen: boolean) => void} [options.onDetailChange] - fired whenever the open book / current spread / reading-open state changes, so React can drive the accessible DOM mirror (Phase 2) and page nav buttons
   * @param {() => void} [options.onClosed]
   */
  constructor(canvas, { books, onSelectionChange, onDetailChange, onClosed, onAyahTap } = {}) {
    this.canvas = canvas;
    this.books = books || [];
    this.onSelectionChange = onSelectionChange || (() => {});
    this.onDetailChange = onDetailChange || (() => {});
    this.onClosed = onClosed || (() => {});
    this.onAyahTap = onAyahTap || (() => {});

    this.mode = "hero"; // hero | opening | detail | closing
    this.selectedIndex = 0;
    this.position = 0;
    this.targetPosition = 0;
    this.activeBook = null;
    this.readingOpen = false;
    this.currentSpread = 0;
    this.spacing = 0.62;
    this.transitionTime = 0;
    this.transitionDuration = 0.62;
    this.suspended = false;
    this.rafId = 0;
    this.lastTime = 0;
    this.pointerDirty = false;
    this.hoveredIndex = -1;
    this.detailBookHovered = false;
    this.wheelIdle = 0;

    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.reducedMotionQuery.matches;

    this.rigsByIndex = new Map(); // index -> rig, only for books within RIG_WINDOW of position
    this.hitTargets = [];

    this.pointer = { clientX: 0, clientY: 0, ndc: new THREE.Vector2() };
    this.raycaster = new THREE.Raycaster();

    this.pageDrag = {
      active: false, pointerId: null, startX: 0, startY: 0, progress: 0, peakProgress: 0,
      committed: false, progressVelocity: 0, verticalBias: 0, lastProgress: 0, lastTime: 0,
      direction: 0, kind: null
    };
    this.detailPress = { active: false, pointerId: null, startX: 0, startY: 0, moved: false, allowClick: false };

    // Reading content (Phase 2) — see setReadingContent/renderWindow.
    this.logicalPages = [];      // array of up to-PAGE_SIZE ayah arrays, whole surah
    this.windowStart = 0;        // index into logicalPages currently mapped to physical slot 0
    this.readLang = "off";
    this.activeVerseNumber = null;
    this.nextVerseNumber = null;
    this.surahNameAr = "";
    this._faceHitboxesBySlot = new Array(8).fill(null);

    this._initRenderer();
    this._initScene();
    this._bindEvents();
    this.resize();
    this.requestFrame();
  }

  // --- setup -------------------------------------------------------------

  _initRenderer() {
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    RectAreaLightUniformsLib.init();
    this.renderer = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    this.environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
  }

  _initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9dfcb);
    scene.environment = this.environmentTarget.texture;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

    this.shared = createSharedAssets(this.renderer);
    this.shelfStage = new THREE.Group();
    this.shelfStage.name = "shelf-stage";
    scene.add(this.shelfStage);

    addRoom(scene, this.shelfStage, this.shared, this.renderer);
    this.roomLights = addLights(scene);
    this.dust = addDust(scene, seededRandom);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enabled = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 7.5;
    this.controls.minPolarAngle = Math.PI * 0.28;
    this.controls.maxPolarAngle = Math.PI * 0.62;

    this.transitionCameraTarget = new THREE.Vector3();
    this.shelfCameraPosition = new THREE.Vector3();
    this.shelfCameraTarget = new THREE.Vector3();
    this.inspectPosition = new THREE.Vector3();
    this.inspectCameraPosition = new THREE.Vector3();
    this.inspectCameraTarget = new THREE.Vector3();
    this.inspectBookQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.055, -0.14, 0));
    this.inspectBookScale = new THREE.Vector3();
    this.inspectShelfPosition = new THREE.Vector3(0, -4.2, -3);
    this.shelfRestPosition = new THREE.Vector3(0, 0, 0);
    this.shelfBoardTop = 0.47;
    this.closingBookPosition = new THREE.Vector3();
    this.closingBookStartPosition = new THREE.Vector3();
    this.closingBookQuaternion = new THREE.Quaternion();
    this.closingBookStartQuaternion = new THREE.Quaternion();
    this.closingBookScale = new THREE.Vector3(1.09, 1.09, 1.09);
    this.closingBookStartScale = new THREE.Vector3();
    this.closingMotionPosition = new THREE.Vector3();
    this.closingMotionQuaternion = new THREE.Quaternion();
    this.closingCameraPosition = new THREE.Vector3();
    this.closingCameraTarget = new THREE.Vector3();
    this.closingShelfPosition = new THREE.Vector3();
    this.closingViewOffsetX = 0;
    this.openingBookPosition = new THREE.Vector3();
    this.openingBookQuaternion = new THREE.Quaternion();
    this.openingBookScale = new THREE.Vector3();
    this.openingMotionPosition = new THREE.Vector3();
    this.openingMotionQuaternion = new THREE.Quaternion();
    this.openingCameraPosition = new THREE.Vector3();
    this.openingCameraTarget = new THREE.Vector3();
    this.openingShelfPosition = new THREE.Vector3();
    this.openingViewOffsetX = 0;
    this.restingMotionPosition = new THREE.Vector3();
    this.restingMotionQuaternion = new THREE.Quaternion();
    this.currentViewOffsetX = 0;
    this.detailViewOffsetX = 0;
    this.detailSafeWidth = 0;

    this.ensureRigsAround(0);
    this.snapAllRigsToShelf();
  }

  // --- rig windowing (HADI addition — the original never needed this with only 7 books) ---

  ensureRigsAround(centerIndex) {
    const total = this.books.length;
    if (!total) return;
    const wanted = new Set();
    for (let offset = -RIG_WINDOW; offset <= RIG_WINDOW; offset += 1) {
      wanted.add(mod(Math.round(centerIndex) + offset, total));
    }
    wanted.forEach((index) => {
      if (this.rigsByIndex.has(index)) return;
      const rig = createBookRig(this.books[index], index, this.renderer, this.shared);
      rig.lastOffset = 0;
      this.shelfStage.add(rig.root);
      this.hitTargets.push(rig.hit);
      this.rigsByIndex.set(index, rig);
    });
    Array.from(this.rigsByIndex.keys()).forEach((index) => {
      if (wanted.has(index)) return;
      const rig = this.rigsByIndex.get(index);
      if (this.activeBook === rig) return;
      this._disposeRig(rig);
      this.rigsByIndex.delete(index);
    });
  }

  _disposeRig(rig) {
    this.hitTargets = this.hitTargets.filter((hit) => hit !== rig.hit);
    if (rig.root.parent) rig.root.parent.remove(rig.root);
    rig.root.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value?.isTexture && !value.userData?.isSharedAsset) value.dispose();
        });
        material.dispose();
      });
    });
  }

  get bookRigsInWindow() {
    return Array.from(this.rigsByIndex.values());
  }

  // --- shelf layout --------------------------------------------------------

  snapRigToShelfSlot(rig, index) {
    const total = this.books.length;
    let offset = index - this.position;
    offset -= Math.round(offset / total) * total;
    const distance = Math.abs(offset);
    const focus = 1 - clamp(distance, 0, 1);
    const fadeProgress = clamp((distance - 2.55) / 0.7, 0, 1);
    const opacity = 1 - smoothstep(fadeProgress);

    rig.root.position.set(
      offset * this.spacing,
      this.shelfBoardTop + rig.base.height * 0.5 + focus * 0.15,
      0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07
    );
    rig.root.rotation.set(0, -offset * 0.105, -offset * 0.018);
    rig.root.scale.setScalar(1 + focus * 0.09);
    rig.motion.position.set(0, 0, 0);
    rig.motion.rotation.set(0, 0, 0);
    rig.frontPivot.rotation.y = 0;
    rig.pagePivots.forEach((pagePivot) => {
      pagePivot.rotation.y = 0;
      pagePivot.rotation.z = 0;
      pagePivot.position.z = pagePivot.userData.restZ;
      this.updateFlexiblePage(pagePivot, 0, 0, true);
    });
    rig.opacity = opacity;
    rig.fadeMaterials.forEach((material) => { material.opacity = opacity; });
    rig.contactShadow.visible = true;
    rig.contactShadow.material.opacity = opacity * 0.24;
    rig.hit.visible = opacity > 0.12;
    rig.lastOffset = offset;
  }

  snapAllRigsToShelf() {
    this.rigsByIndex.forEach((rig, index) => this.snapRigToShelfSlot(rig, index));
  }

  alignShelfToSelection() {
    const total = this.books.length;
    const rounded = Math.round(this.targetPosition);
    const current = mod(rounded, total);
    let delta = this.selectedIndex - current;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    this.targetPosition = rounded + delta;
    this.position = this.targetPosition;
  }

  updateSelection(index, animate = true) {
    if (this.selectedIndex === index) return;
    this.selectedIndex = index;
    this.onSelectionChange(index);
    if (!animate) this.position = this.targetPosition;
  }

  navigate(direction) {
    if (this.mode !== "hero") return;
    const total = this.books.length;
    this.targetPosition = Math.round(this.targetPosition) + direction;
    this.updateSelection(mod(Math.round(this.targetPosition), total), true);
    this.requestFrame();
  }

  updateShelfLayout(delta) {
    const speed = this.reducedMotion ? 1000 : 9;
    this.position = damp(this.position, this.targetPosition, speed, delta);
    this.ensureRigsAround(this.position);
    this.rigsByIndex.forEach((rig, index) => {
      if (rig === this.activeBook) return;
      this.snapRigToShelfSlot(rig, index);
    });
  }

  // --- flexible page deformation (the curved-page-turn core) --------------

  updateFlexiblePage(pagePivot, targetCurve, delta, immediate = false, targetTwist = 0) {
    const flex = pagePivot.userData.flex;
    if (!flex) return;
    const settleImmediately = immediate || this.reducedMotion;
    const step = Math.min(delta, 0.033);
    let nextCurve = targetCurve;
    let nextTwist = targetTwist;

    if (settleImmediately) {
      flex.curveVelocity = 0;
      flex.twistVelocity = 0;
    } else {
      const curveAcceleration = (targetCurve - flex.curve) * 178 - flex.curveVelocity * 19;
      const twistAcceleration = (targetTwist - flex.twist) * 210 - flex.twistVelocity * 21;
      flex.curveVelocity = clamp(flex.curveVelocity + curveAcceleration * step, -1.8, 1.8);
      flex.twistVelocity = clamp(flex.twistVelocity + twistAcceleration * step, -1.6, 1.6);
      nextCurve = clamp(flex.curve + flex.curveVelocity * step, -0.025, 0.19);
      nextTwist = clamp(flex.twist + flex.twistVelocity * step, -0.12, 0.12);

      if (Math.abs(targetCurve - nextCurve) < 0.00002 && Math.abs(flex.curveVelocity) < 0.0008) {
        nextCurve = targetCurve;
        flex.curveVelocity = 0;
      }
      if (Math.abs(targetTwist - nextTwist) < 0.00002 && Math.abs(flex.twistVelocity) < 0.0008) {
        nextTwist = targetTwist;
        flex.twistVelocity = 0;
      }
    }

    if (
      !settleImmediately
      && Math.abs(nextCurve - flex.curve) < 0.00001 && Math.abs(targetCurve - nextCurve) < 0.00001
      && Math.abs(nextTwist - flex.twist) < 0.00001 && Math.abs(targetTwist - nextTwist) < 0.00001
    ) return;

    flex.curve = nextCurve;
    flex.twist = nextTwist;
    flex.surfaces.forEach((surface) => {
      const { position, base, direction } = surface;
      for (let vertex = 0; vertex < position.count; vertex += 1) {
        const offset = vertex * 3;
        const x = base[offset];
        const y = base[offset + 1];
        const u = x + 0.5;
        const mappedU = direction > 0 ? u : 1 - u;
        const arch = Math.sin(Math.PI * mappedU);
        const freeEdgeLift = mappedU * mappedU * 0.16;
        const shape = arch * 0.84 + freeEdgeLift;
        const diagonalTwist = nextTwist * y * Math.pow(mappedU, 1.35);
        const softRipple = nextTwist * Math.sin(mappedU * Math.PI * 2) * (1 - Math.min(1, Math.abs(y) * 1.65)) * 0.09;
        const z = (nextCurve * shape * (1 + y * 0.14) + diagonalTwist + softRipple) * direction;
        position.setXYZ(vertex, x, y, z);
      }
      position.needsUpdate = true;
      surface.geometry.computeVertexNormals();
    });
  }

  getDetailOpenAmount() {
    if (this.pageDrag.active && this.pageDrag.kind === "cover-open") return smoothstep(this.pageDrag.progress);
    if (!this.readingOpen) return 0;
    if (this.pageDrag.active && this.pageDrag.kind === "cover-close") return 1 - smoothstep(this.pageDrag.progress);
    return 1;
  }

  updatePaginatedBook(rig, delta, openAmount = 1) {
    const amount = clamp(openAmount, 0, 1);
    const speed = this.reducedMotion ? 1000 : 10.5;
    const hoverCrack = (this.mode === "detail" && !this.readingOpen && this.detailBookHovered && !this.reducedMotion) ? -0.16 : 0;
    const coverTarget = amount > 0 ? (-Math.PI + 0.055) * amount : hoverCrack;
    rig.frontPivot.rotation.y = damp(rig.frontPivot.rotation.y, coverTarget, speed, delta);

    rig.pagePivots.forEach((pagePivot, pageIndex) => {
      const leafOrder = rig.pagePivots.length - 1 - pageIndex;
      let pageTarget = 0;
      let positionTarget = pagePivot.userData.restZ;
      let pageTwistTarget = 0;
      let dragCurveBoost = 0;
      let flexTwistTarget = 0;

      if (leafOrder < PAGINATED_LEAF_COUNT) {
        const isTurned = leafOrder < this.currentSpread;
        const unturnedTarget = -0.038 + leafOrder * 0.008;
        const turnedTarget = -Math.PI + 0.085 + leafOrder * 0.014;
        pageTarget = isTurned ? turnedTarget : unturnedTarget;
        positionTarget = isTurned ? pagePivot.userData.turnedZ : pagePivot.userData.restZ;

        if (this.pageDrag.active && this.pageDrag.direction !== 0) {
          const dragLeafOrder = this.pageDrag.direction > 0 ? this.currentSpread : this.currentSpread - 1;
          if (leafOrder === dragLeafOrder) {
            const dragProgress = smoothstep(this.pageDrag.progress);
            const dragEnvelope = Math.sin(Math.PI * dragProgress);
            const speedResponse = clamp(Math.abs(this.pageDrag.progressVelocity) / 5.5, 0, 1);
            const signedSpeed = clamp(this.pageDrag.progressVelocity / 5.5, -1, 1);
            pageTarget = this.pageDrag.direction > 0
              ? lerp(unturnedTarget, turnedTarget, dragProgress)
              : lerp(turnedTarget, unturnedTarget, dragProgress);
            positionTarget = this.pageDrag.direction > 0
              ? lerp(pagePivot.userData.restZ, pagePivot.userData.turnedZ, dragProgress)
              : lerp(pagePivot.userData.turnedZ, pagePivot.userData.restZ, dragProgress);
            pageTwistTarget = this.pageDrag.direction * dragEnvelope * (0.014 + this.pageDrag.verticalBias * 0.026);
            dragCurveBoost = dragEnvelope * (0.032 + speedResponse * 0.064);
            flexTwistTarget = dragEnvelope * (this.pageDrag.verticalBias * 0.08 + signedSpeed * this.pageDrag.direction * 0.03);
          }
        }
        pagePivot.position.z = damp(pagePivot.position.z, pagePivot.userData.restZ + (positionTarget - pagePivot.userData.restZ) * amount, speed, delta);
      } else {
        pageTarget = -0.006 + (leafOrder - PAGINATED_LEAF_COUNT) * 0.003;
        pagePivot.position.z = damp(pagePivot.position.z, pagePivot.userData.restZ, speed, delta);
      }

      pagePivot.rotation.y = damp(pagePivot.rotation.y, pageTarget * amount, speed, delta);
      pagePivot.rotation.z = damp(pagePivot.rotation.z, pageTwistTarget * amount, speed, delta);
      const turnProgress = clamp(Math.abs(pagePivot.rotation.y) / Math.PI, 0, 1);
      const curveTarget = amount > 0 ? amount * (0.004 + Math.sin(Math.PI * turnProgress) * 0.082 + dragCurveBoost) : 0;
      this.updateFlexiblePage(pagePivot, curveTarget, delta, false, flexTwistTarget * amount);
    });
  }

  // --- open / close state machine -----------------------------------------

  openDetail() {
    if (this.mode !== "hero" || !this.books.length) return;
    this.mode = "opening";
    this.transitionTime = 0;
    this.readingOpen = false;
    this.detailBookHovered = false;
    this.currentSpread = 0;
    this.resetDetailPress();

    this.ensureRigsAround(this.selectedIndex);
    this.activeBook = this.rigsByIndex.get(this.selectedIndex);
    if (!this.activeBook) return;
    this.activeBook.contactShadow.visible = false;

    this.activeBook.root.updateWorldMatrix(true, true);
    this.activeBook.root.matrixWorld.decompose(this.openingBookPosition, this.openingBookQuaternion, this.openingBookScale);
    this.openingCameraPosition.copy(this.camera.position);
    this.openingCameraTarget.copy(this.transitionCameraTarget);
    this.openingShelfPosition.copy(this.shelfStage.position);
    this.openingMotionPosition.copy(this.activeBook.motion.position);
    this.openingMotionQuaternion.copy(this.activeBook.motion.quaternion);
    this.openingViewOffsetX = this.currentViewOffsetX;
    this.scene.add(this.activeBook.root);
    this.activeBook.root.position.copy(this.openingBookPosition);
    this.activeBook.root.quaternion.copy(this.openingBookQuaternion);
    this.activeBook.root.scale.copy(this.openingBookScale);
    this._applyDetailViewOffset();
    this.controls.enabled = false;

    this.onDetailChange(this.activeBook.data, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
    if (this.reducedMotion) this.finishOpening();
    this.requestFrame();
  }

  applyOpeningPose(progress) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const shelfClearEased = smootherstep(clamp(progress / 0.68, 0, 1));
    this.inspectBookScale.setScalar(this._inspectScale());
    this.shelfStage.position.lerpVectors(this.openingShelfPosition, this.inspectShelfPosition, shelfClearEased);
    this.activeBook.root.position.lerpVectors(this.openingBookPosition, this.inspectPosition, eased);
    this.activeBook.root.quaternion.slerpQuaternions(this.openingBookQuaternion, this.inspectBookQuaternion, eased);
    this.activeBook.root.scale.lerpVectors(this.openingBookScale, this.inspectBookScale, eased);
    this.activeBook.motion.position.lerpVectors(this.openingMotionPosition, this.restingMotionPosition, eased);
    this.activeBook.motion.quaternion.slerpQuaternions(this.openingMotionQuaternion, this.restingMotionQuaternion, eased);
    this.camera.position.lerpVectors(this.openingCameraPosition, this.inspectCameraPosition, eased);
    this.transitionCameraTarget.lerpVectors(this.openingCameraTarget, this.inspectCameraTarget, eased);
    this.currentViewOffsetX = lerp(this.openingViewOffsetX, this.detailViewOffsetX, eased);
    this._applyDetailViewOffset();
    this.camera.lookAt(this.transitionCameraTarget);
  }

  finishOpening() {
    if (!this.activeBook) return;
    this.applyOpeningPose(1);
    this.mode = "detail";
    this.transitionTime = 1;
    this.controls.target.copy(this.inspectCameraTarget);
    this.controls.enabled = true;
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.update();
  }

  closeDetail() {
    if (this.mode !== "detail" || !this.activeBook) return;
    this.cancelPageDrag();
    this.resetDetailPress();
    this.mode = "closing";
    this.transitionTime = 0;
    this.readingOpen = false;
    this.detailBookHovered = false;
    this.currentSpread = 0;
    this.controls.enabled = false;
    this.closingBookStartPosition.copy(this.activeBook.root.position);
    this.closingBookStartQuaternion.copy(this.activeBook.root.quaternion);
    this.closingBookStartScale.copy(this.activeBook.root.scale);
    this.closingMotionPosition.copy(this.activeBook.motion.position);
    this.closingMotionQuaternion.copy(this.activeBook.motion.quaternion);
    this.closingCameraPosition.copy(this.camera.position);
    this.closingCameraTarget.copy(this.controls.target);
    this.closingShelfPosition.copy(this.shelfStage.position);
    this.closingViewOffsetX = this.currentViewOffsetX;
    this.transitionCameraTarget.copy(this.closingCameraTarget);
    this.alignShelfToSelection();
    this.closingBookPosition.set(0, this.shelfBoardTop + this.activeBook.base.height * 0.5 + 0.15, 0.37);
    this.rigsByIndex.forEach((rig, index) => {
      if (rig !== this.activeBook && rig.root.parent === this.shelfStage) this.snapRigToShelfSlot(rig, index);
    });

    this.onDetailChange(this.activeBook.data, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
    if (this.reducedMotion) this.finishClosing();
    this.requestFrame();
  }

  applyClosingPose(progress) {
    const eased = smootherstep(clamp(progress, 0, 1));
    const shelfReturnEased = smootherstep(clamp((progress - 0.24) / 0.76, 0, 1));
    this.shelfStage.position.lerpVectors(this.closingShelfPosition, this.shelfRestPosition, shelfReturnEased);
    this.activeBook.root.position.lerpVectors(this.closingBookStartPosition, this.closingBookPosition, eased);
    this.activeBook.root.quaternion.slerpQuaternions(this.closingBookStartQuaternion, this.closingBookQuaternion, eased);
    this.activeBook.root.scale.lerpVectors(this.closingBookStartScale, this.closingBookScale, eased);
    this.activeBook.motion.position.lerpVectors(this.closingMotionPosition, this.restingMotionPosition, eased);
    this.activeBook.motion.quaternion.slerpQuaternions(this.closingMotionQuaternion, this.restingMotionQuaternion, eased);
    this.camera.position.lerpVectors(this.closingCameraPosition, this.shelfCameraPosition, eased);
    this.transitionCameraTarget.lerpVectors(this.closingCameraTarget, this.shelfCameraTarget, eased);
    this.currentViewOffsetX = lerp(this.closingViewOffsetX, 0, eased);
    this._applyDetailViewOffset();
    this.camera.lookAt(this.transitionCameraTarget);
  }

  finishClosing() {
    if (!this.activeBook) return;
    this.applyClosingPose(1);
    this.shelfStage.attach(this.activeBook.root);
    this.snapRigToShelfSlot(this.activeBook, this.selectedIndex);
    this.activeBook.contactShadow.visible = true;
    this.controls.target.copy(this.shelfCameraTarget);
    this.mode = "hero";
    this.transitionTime = 0;
    this.activeBook = null;
    this.onDetailChange(null, 0, false, []);
    this.onClosed();
  }

  resetInspectionView() {
    if (this.mode !== "detail") return;
    this.camera.position.copy(this.inspectCameraPosition);
    this.controls.target.copy(this.inspectCameraTarget);
    this.controls.update();
    this.requestFrame();
  }

  setReadingOpen(open) {
    if (this.mode !== "detail" || this.readingOpen === open) return;
    this.cancelPageDrag();
    this.readingOpen = open;
    if (!this.readingOpen) this.currentSpread = 0;
    // Defensive re-render: if the initial setReadingContent() call raced
    // with anything (renderer/WebGL readiness, a texture that failed to
    // decode, etc.) and left faces blank, opening to read is a natural,
    // low-cost point to self-heal by redrawing from current state.
    else if (this.logicalPages.length) this.renderWindow();
    this.onDetailChange(this.activeBook?.data ?? null, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
    this.requestFrame();
  }

  turnPage(direction) {
    if (this.mode !== "detail" || !this.readingOpen) return;
    const atForwardEdge = direction > 0 && this.currentSpread >= SPREAD_COUNT - 1;
    const atBackwardEdge = direction < 0 && this.currentSpread <= 0;

    if (atForwardEdge || atBackwardEdge) {
      const shifted = this._shiftWindow(direction > 0 ? 8 : -8);
      if (!shifted) return; // already at the very start/end of the surah
      this.currentSpread = direction > 0 ? 0 : SPREAD_COUNT - 1;
      this.renderWindow();
      this.onDetailChange(this.activeBook?.data ?? null, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
      this.requestFrame();
      return;
    }

    const nextSpread = clamp(this.currentSpread + direction, 0, SPREAD_COUNT - 1);
    if (nextSpread === this.currentSpread) return;
    this.currentSpread = nextSpread;
    this.onDetailChange(this.activeBook?.data ?? null, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
    this.requestFrame();
  }

  // --- reading content (Phase 2): dynamic pagination over the fixed 4-leaf/8-face rig ---
  //
  // The rig physically supports exactly 4 turnable leaves = 8 content
  // faces per "gathering" (see bookRig.js comments — slot order is
  // leaf0-front, leaf0-back, leaf1-front, ... leaf3-back, matching
  // pageSurfaces[] order directly). A surah with more than 8 logical
  // pages (PAGE_SIZE=6 ayat each) can't fit in one gathering, so
  // `windowStart` slides by a full gathering (8 logical pages) whenever
  // the reader turns past either edge — the same way a real multi-
  // signature book's gatherings work, just re-texturing the same 8 faces
  // instead of binding in new paper each time.

  /** Call after fetching a surah (or on language toggle) — chunks ayat and (re)draws the current window. */
  setReadingContent(ayat, lang, surahNameAr) {
    this.logicalPages = paginateAyat(ayat || []);
    this.readLang = lang || "off";
    this.surahNameAr = surahNameAr || "";
    this.windowStart = 0;
    this.currentSpread = 0;
    this.renderWindow();
    // The Arabic/translation fonts are loaded via CSS @font-face/@import;
    // if they weren't ready yet at the render above, canvas silently used
    // a fallback font for that draw (a raster snapshot, so it won't
    // auto-update later). Redraw once real fonts are confirmed ready so
    // the very first page a reader sees isn't stuck in a fallback font.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (this.logicalPages.length) this.renderWindow();
      });
    }
  }

  setReadLang(lang) {
    if (this.readLang === lang) return;
    this.readLang = lang;
    this.renderWindow();
  }

  /** Highlights the currently-playing (and about-to-play) ayah across whichever visible face contains it. */
  setActiveVerse(activeVerseNumber, nextVerseNumber = null) {
    if (this.activeVerseNumber === activeVerseNumber && this.nextVerseNumber === nextVerseNumber) return;
    this.activeVerseNumber = activeVerseNumber;
    this.nextVerseNumber = nextVerseNumber;
    this.renderWindow();
  }

  /** Ayat currently visible on the open spread — for the accessible DOM mirror and page-position display. */
  getVisibleAyahs() {
    const isLastSpread = this.currentSpread === SPREAD_COUNT - 1;
    const rightSlot = this.currentSpread === 0 ? 0 : (isLastSpread ? null : this.currentSpread * 2);
    const leftSlot = this.currentSpread === 0 ? null : this.currentSpread * 2 - 1;
    const collect = (slot) => (slot === null ? [] : (this.logicalPages[this.windowStart + slot] || []));
    return [...collect(leftSlot), ...collect(rightSlot)];
  }

  /** Jumps the open book to whichever page contains verseNumber — mirrors the flat reader's auto-follow-playback behavior. */
  goToVerse(verseNumber) {
    if (!this.readingOpen) return;
    const logicalIndex = this.logicalPages.findIndex((page) => page.some((ayah) => ayah.verse_number === verseNumber));
    if (logicalIndex < 0) return;
    const desiredWindowStart = Math.floor(logicalIndex / 8) * 8;
    const slot = logicalIndex - desiredWindowStart;
    const desiredSpread = slot === 0 ? 0 : Math.ceil(slot / 2);
    const windowChanged = desiredWindowStart !== this.windowStart;
    if (windowChanged) this.windowStart = desiredWindowStart;
    if (this.currentSpread === desiredSpread && !windowChanged) return;
    this.currentSpread = desiredSpread;
    if (windowChanged) this.renderWindow();
    this.onDetailChange(this.activeBook?.data ?? null, this.currentSpread, this.readingOpen, this.getVisibleAyahs());
    this.requestFrame();
  }

  _shiftWindow(delta) {
    const nextStart = this.windowStart + delta;
    if (nextStart < 0 || nextStart >= this.logicalPages.length) return false;
    this.windowStart = nextStart;
    return true;
  }

  _slotForLeafFace(leafOrder, isFront) {
    return leafOrder * 2 + (isFront ? 0 : 1);
  }

  /** Redraws all 8 physical faces from logicalPages[windowStart..windowStart+7], applying current lang/highlight. */
  renderWindow() {
    if (!this.activeBook) return;
    const total = this.logicalPages.length;
    for (let leafOrder = 0; leafOrder < PAGINATED_LEAF_COUNT; leafOrder += 1) {
      [true, false].forEach((isFront) => {
        const slot = this._slotForLeafFace(leafOrder, isFront);
        const logicalIndex = this.windowStart + slot;
        const pageIndex = this.activeBook.pagePivots.length - 1 - leafOrder; // matches bookRig's leafOrder<->pageIndex mapping
        const surface = isFront ? this.activeBook.pageSurfaces[pageIndex * 2] : this.activeBook.pageSurfaces[pageIndex * 2 + 1];
        if (!surface) return;

        const oldTexture = surface.material.map;
        // A failure rendering ONE face (bad ayah data, a canvas API quirk
        // on some device, etc.) must not abort the rest of the window —
        // an uncaught throw here would silently skip every remaining face
        // in this loop and leave them on whatever texture they had before
        // (often the blank shared paper texture), which is exactly the
        // "blank pages" failure mode this guards against.
        let result;
        try {
          result = logicalIndex < total
            ? renderPageFace(this.renderer, {
                ayahs: this.logicalPages[logicalIndex],
                lang: this.readLang,
                activeVerseNumber: this.activeVerseNumber,
                nextVerseNumber: this.nextVerseNumber,
                surahNameAr: this.surahNameAr,
                pageLabel: `${logicalIndex + 1} / ${total}`
              })
            : renderBlankFace(this.renderer);
        } catch (error) {
          console.error(`[BookSceneEngine] failed to render page face (leaf ${leafOrder}, ${isFront ? "front" : "back"}, logical page ${logicalIndex}):`, error);
          result = renderBlankFace(this.renderer);
        }

        surface.material.map = result.texture;
        surface.material.bumpMap = result.texture;
        surface.material.needsUpdate = true;
        this._faceHitboxesBySlot[slot] = { pageIndex, isFront, hitboxes: result.hitboxes };
        if (oldTexture && oldTexture !== result.texture && oldTexture.userData?.isPageContentTexture) oldTexture.dispose();
      });
    }
    this.requestFrame();
  }

  /** UV-hit-tests a tap against whichever page face was tapped, resolving to a verse number for tap-to-play. */
  _resolveAyahTapAtPointer() {
    if (!this.activeBook) return null;
    this.raycaster.setFromCamera(this.pointer.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.activeBook.pageSurfaces, false);
    if (!hits.length || !hits[0].uv) return null;
    const surface = hits[0].object;
    const entry = this._faceHitboxesBySlot.find((candidate) => candidate && (
      (candidate.isFront ? this.activeBook.pageSurfaces[candidate.pageIndex * 2] : this.activeBook.pageSurfaces[candidate.pageIndex * 2 + 1]) === surface
    ));
    if (!entry) return null;
    const { u, v } = hits[0].uv;
    const hit = entry.hitboxes.find((box) => u >= box.u0 && u <= box.u1 && v >= box.v0 && v <= box.v1);
    return hit ? hit.verseNumber : null;
  }

  // --- pointer / drag interaction ------------------------------------------

  _setPointerFromEvent(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.clientX = event.clientX;
    this.pointer.clientY = event.clientY;
    this.pointer.ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerDirty = true;
  }

  _bookIndexAtPointer() {
    this.raycaster.setFromCamera(this.pointer.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitTargets, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }

  _activeBookAtPointer() {
    if (this.mode !== "detail" || !this.activeBook) return false;
    this.activeBook.root.updateWorldMatrix(true, true);
    this.raycaster.setFromCamera(this.pointer.ndc, this.camera);
    return this.raycaster.intersectObject(this.activeBook.hit, false).length > 0;
  }

  _pageSurfaceAtPointer() {
    if (this.mode !== "detail" || !this.activeBook || !this.readingOpen) return null;
    this.activeBook.root.updateWorldMatrix(true, true);
    this.raycaster.setFromCamera(this.pointer.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.activeBook.pageGestureSurfaces, false);
    return hits.length ? hits[0].object : null;
  }

  _coverSurfaceAtPointer() {
    if (this.mode !== "detail" || !this.activeBook || this.currentSpread !== 0) return null;
    this.activeBook.root.updateWorldMatrix(true, true);
    this.raycaster.setFromCamera(this.pointer.ndc, this.camera);
    const hits = this.raycaster.intersectObject(this.activeBook.frontCover, false);
    return hits.length ? hits[0].object : null;
  }

  updateHover() {
    this.pointerDirty = false;
    if (this.mode === "detail" && this.activeBook) {
      this._setHovered(-1);
      if (this.readingOpen) {
        this.detailBookHovered = false;
      } else {
        this.detailBookHovered = Boolean(this._coverSurfaceAtPointer());
      }
      return;
    }
    this.detailBookHovered = false;
    if (this.mode !== "hero") {
      this._setHovered(-1);
      return;
    }
    this._setHovered(this._bookIndexAtPointer());
  }

  _setHovered(index) {
    if (this.hoveredIndex === index) return;
    this.hoveredIndex = index;
    this.requestFrame();
  }

  resetDetailPress() {
    this.detailPress.active = false;
    this.detailPress.pointerId = null;
    this.detailPress.moved = false;
    this.detailPress.allowClick = false;
  }

  resetPageDrag() {
    const capturedPointerId = this.pageDrag.pointerId;
    Object.assign(this.pageDrag, {
      active: false, pointerId: null, progress: 0, peakProgress: 0, committed: false,
      progressVelocity: 0, verticalBias: 0, lastProgress: 0, lastTime: 0, direction: 0, kind: null
    });
    this.controls.enabled = this.mode === "detail";
    if (capturedPointerId !== null && this.canvas.hasPointerCapture?.(capturedPointerId)) {
      this.canvas.releasePointerCapture(capturedPointerId);
    }
  }

  cancelPageDrag() { this.settlePageDrag(false); }

  applyPageReleaseImpulse(turnDirection) {
    if (!this.activeBook || turnDirection === 0) return;
    const leafOrder = turnDirection > 0 ? this.currentSpread : this.currentSpread - 1;
    const pageIndex = this.activeBook.pagePivots.length - 1 - leafOrder;
    const flex = this.activeBook.pagePivots[pageIndex]?.userData.flex;
    if (!flex) return;
    const speedResponse = clamp(Math.abs(this.pageDrag.progressVelocity) / 5.5, 0.12, 1);
    flex.curveVelocity = clamp(flex.curveVelocity + speedResponse * 0.46, -1.8, 1.8);
    flex.twistVelocity = clamp(
      flex.twistVelocity + this.pageDrag.verticalBias * 0.38 + clamp(this.pageDrag.progressVelocity / 5.5, -1, 1) * turnDirection * 0.14,
      -1.6, 1.6
    );
  }

  settlePageDrag(commitLatchedGesture = false) {
    if (!this.pageDrag.active) return false;
    const turnDirection = this.pageDrag.direction;
    const shouldCloseCover = commitLatchedGesture && this.pageDrag.kind === "cover-close" && this.pageDrag.committed;
    const shouldOpenCover = commitLatchedGesture && this.pageDrag.kind === "cover-open" && this.pageDrag.committed;
    const shouldTurnPage = commitLatchedGesture && this.pageDrag.kind === "page" && this.pageDrag.committed && turnDirection !== 0;
    if (shouldTurnPage) this.applyPageReleaseImpulse(turnDirection);
    this.resetPageDrag();
    if (shouldCloseCover) this.setReadingOpen(false);
    else if (shouldOpenCover) this.setReadingOpen(true);
    else if (shouldTurnPage) this.turnPage(turnDirection);
    else this.requestFrame();
    return shouldCloseCover || shouldOpenCover || shouldTurnPage;
  }

  _updatePageDragMotion(event, deltaY) {
    const eventTime = event.timeStamp || performance.now();
    const elapsed = clamp((eventTime - this.pageDrag.lastTime) / 1000, 0.008, 0.08);
    const instantVelocity = clamp((this.pageDrag.progress - this.pageDrag.lastProgress) / elapsed, -8, 8);
    this.pageDrag.progressVelocity = lerp(this.pageDrag.progressVelocity, instantVelocity, 0.42);
    this.pageDrag.verticalBias = lerp(this.pageDrag.verticalBias, clamp(deltaY / 180, -1, 1), 0.36);
    this.pageDrag.lastProgress = this.pageDrag.progress;
    this.pageDrag.lastTime = eventTime;
  }

  _updatePageDragFromEvent(event) {
    this._setPointerFromEvent(event);
    const deltaX = event.clientX - this.pageDrag.startX;
    const deltaY = event.clientY - this.pageDrag.startY;
    const horizontalDistance = Math.abs(deltaX);

    if (this.pageDrag.kind === "cover-open" || this.pageDrag.kind === "cover-close") {
      const openingCover = this.pageDrag.kind === "cover-open";
      const signedDistance = openingCover ? -deltaX : deltaX;
      const commitProgress = openingCover ? COVER_OPEN_COMMIT_PROGRESS : COVER_CLOSE_COMMIT_PROGRESS;
      this.pageDrag.direction = 0;
      this.pageDrag.progress = (horizontalDistance >= 3 && horizontalDistance >= Math.abs(deltaY) * 0.72)
        ? clamp(Math.max(0, signedDistance) / 140, 0, 1) : 0;
      this.pageDrag.peakProgress = Math.max(this.pageDrag.peakProgress, this.pageDrag.progress);
      if (this.pageDrag.peakProgress >= commitProgress) this.pageDrag.committed = true;
      this._updatePageDragMotion(event, deltaY);
      return;
    }

    if (horizontalDistance < 3 || horizontalDistance < Math.abs(deltaY) * 0.72) {
      this.pageDrag.progress = 0;
    } else {
      if (this.pageDrag.direction === 0 && horizontalDistance >= 6) {
        const direction = deltaX < 0 ? 1 : -1;
        const directionAvailable = direction > 0 ? this.currentSpread < SPREAD_COUNT - 1 : this.currentSpread > 0;
        this.pageDrag.direction = directionAvailable ? direction : 0;
      }
      const signedDistance = this.pageDrag.direction > 0 ? -deltaX : deltaX;
      this.pageDrag.progress = this.pageDrag.direction !== 0 ? clamp(Math.max(0, signedDistance) / 150, 0, 1) : 0;
      this.pageDrag.peakProgress = Math.max(this.pageDrag.peakProgress, this.pageDrag.progress);
      if (this.pageDrag.peakProgress >= PAGE_TURN_COMMIT_PROGRESS) this.pageDrag.committed = true;
    }
    this._updatePageDragMotion(event, deltaY);
  }

  onCanvasClick = (event) => {
    if (this.mode !== "hero") return;
    const index = this._bookIndexAtPointer();
    if (index < 0) return;
    if (index === this.selectedIndex) {
      this.openDetail();
    } else {
      this.updateSelection(index, true);
      this.targetPosition = Math.round(this.targetPosition) + this._shortestDelta(index);
    }
    this.requestFrame();
  };

  _shortestDelta(index) {
    const total = this.books.length;
    let delta = index - mod(Math.round(this.targetPosition), total);
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
  }

  onPointerMove = (event) => { this._setPointerFromEvent(event); };
  onPointerLeave = () => { this._setHovered(-1); };

  onDetailBookPointerDown = (event) => {
    if (this.mode !== "detail" || this.readingOpen || event.button !== 0 || event.isPrimary === false) return;
    this._setPointerFromEvent(event);
    this.detailPress.allowClick = false;
    if (!this._activeBookAtPointer()) return;
    this.detailPress.active = true;
    this.detailPress.pointerId = event.pointerId;
    this.detailPress.startX = event.clientX;
    this.detailPress.startY = event.clientY;
    this.detailPress.moved = false;
  };

  onDetailBookPointerMove = (event) => {
    if (!this.detailPress.active || event.pointerId !== this.detailPress.pointerId) return;
    if (Math.hypot(event.clientX - this.detailPress.startX, event.clientY - this.detailPress.startY) > 16) {
      this.detailPress.moved = true;
    }
  };

  onDetailBookPointerEnd = (event) => {
    if (!this.detailPress.active || event.pointerId !== this.detailPress.pointerId) return;
    this.detailPress.allowClick = event.type === "pointerup" && !this.detailPress.moved;
    this.detailPress.active = false;
    this.detailPress.pointerId = null;
    if (this.detailPress.allowClick) this.setReadingOpen(true);
  };

  onPagePointerDown = (event) => {
    if (this.mode !== "detail" || !this.activeBook || event.button !== 0 || event.isPrimary === false) return;
    this._setPointerFromEvent(event);
    const coverSurface = this._coverSurfaceAtPointer();
    const pageSurface = this.readingOpen ? this._pageSurfaceAtPointer() : null;
    if (!coverSurface && !pageSurface) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    Object.assign(this.pageDrag, {
      active: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      progress: 0, peakProgress: 0, committed: false, progressVelocity: 0, verticalBias: 0,
      lastProgress: 0, lastTime: event.timeStamp || performance.now(), direction: 0,
      kind: coverSurface ? (this.readingOpen ? "cover-close" : "cover-open") : "page"
    });
    this.controls.enabled = false;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.requestFrame();
  };

  onPagePointerMove = (event) => {
    if (!this.pageDrag.active || event.pointerId !== this.pageDrag.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this._updatePageDragFromEvent(event);
    this.requestFrame();
  };

  onPagePointerEnd = (event) => {
    if (!this.pageDrag.active || event.pointerId !== this.pageDrag.pointerId) return;
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "pointerup") this._updatePageDragFromEvent(event);
    const dragKind = this.pageDrag.kind;
    const releaseDistance = Math.hypot(event.clientX - this.pageDrag.startX, event.clientY - this.pageDrag.startY);
    const shouldClickOpen = event.type === "pointerup" && dragKind === "cover-open" && !this.pageDrag.committed && releaseDistance <= 12;
    // A near-stationary release on a page (not the cover) is a tap-to-play,
    // matching the flat reader's click-any-ayah-to-play behavior.
    const shouldTapAyah = event.type === "pointerup" && dragKind === "page" && !this.pageDrag.committed && releaseDistance <= 12;
    if (this.pageDrag.committed) {
      this.settlePageDrag(true);
    } else if (shouldClickOpen) {
      this.resetPageDrag();
      this.setReadingOpen(true);
    } else if (shouldTapAyah) {
      const verseNumber = this._resolveAyahTapAtPointer();
      this.resetPageDrag();
      if (verseNumber !== null) this.onAyahTap(verseNumber);
    } else {
      this.cancelPageDrag();
    }
  };

  onWindowPagePointerEnd = (event) => {
    if (!this.pageDrag.active || event.pointerId !== this.pageDrag.pointerId) return;
    if (event.type === "pointerup") this._updatePageDragFromEvent(event);
    this.settlePageDrag(true);
  };

  onKeyDown = (event) => {
    if (event.key === "Escape" && this.mode === "detail") {
      event.preventDefault();
      this.closeDetail();
      return;
    }
    if (this.mode === "detail" && !event.metaKey && !event.ctrlKey && !event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      this.turnPage(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (this.mode !== "hero" || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); this.navigate(-1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); this.navigate(1); }
  };

  onVisibilityChange = () => {
    this.suspended = document.hidden;
    if (!this.suspended) {
      this.lastTime = performance.now();
      this.requestFrame();
    } else {
      this.settlePageDrag(true);
      this.resetDetailPress();
      if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
    }
  };

  onWindowBlur = () => { this.settlePageDrag(true); this.resetDetailPress(); };

  onReducedMotionChange = (event) => {
    this.cancelPageDrag();
    this.resetDetailPress();
    this.reducedMotion = event.matches;
    this.controls.enableDamping = !this.reducedMotion;
    if (this.reducedMotion) this.position = this.targetPosition;
    this.requestFrame();
  };

  handleContextLost = (event) => {
    event.preventDefault();
    this.cancelPageDrag();
    this.resetDetailPress();
    this.suspended = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  };

  _bindEvents() {
    const canvas = this.canvas;
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("click", this.onCanvasClick);
    canvas.addEventListener("pointerdown", this.onDetailBookPointerDown, { capture: true });
    canvas.addEventListener("pointermove", this.onDetailBookPointerMove, { capture: true });
    canvas.addEventListener("pointerup", this.onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("pointercancel", this.onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("lostpointercapture", this.onDetailBookPointerEnd, { capture: true });
    canvas.addEventListener("pointerdown", this.onPagePointerDown, { capture: true });
    canvas.addEventListener("pointermove", this.onPagePointerMove, { capture: true });
    canvas.addEventListener("pointerup", this.onPagePointerEnd, { capture: true });
    canvas.addEventListener("pointercancel", this.onPagePointerEnd, { capture: true });
    canvas.addEventListener("lostpointercapture", this.onPagePointerEnd, { capture: true });
    window.addEventListener("pointerup", this.onWindowPagePointerEnd);
    window.addEventListener("pointercancel", this.onWindowPagePointerEnd);
    canvas.addEventListener("webglcontextlost", this.handleContextLost);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("blur", this.onWindowBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.reducedMotionQuery.addEventListener("change", this.onReducedMotionChange);

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(this.canvas.parentElement || this.canvas);
  }

  // --- responsive layout ---------------------------------------------------

  _inspectScale() {
    return getInspectScale({
      viewWidth: this.viewWidth, viewHeight: this.viewHeight, camera: this.camera,
      activeBookWidth: this.activeBook?.base.width, inspectCameraPosition: this.inspectCameraPosition,
      inspectPosition: this.inspectPosition, detailSafeWidth: this.detailSafeWidth
    });
  }

  _applyDetailViewOffset() {
    applyDetailViewOffset(this.camera, this.viewWidth, this.viewHeight, this.currentViewOffsetX);
  }

  resize() {
    const container = this.canvas.parentElement || this.canvas;
    const rect = container.getBoundingClientRect();
    this.viewWidth = Math.max(rect.width, 1);
    this.viewHeight = Math.max(rect.height, 1);
    this.renderer.setSize(this.viewWidth, this.viewHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.viewWidth < 820 ? 1.5 : 2));
    this.camera.aspect = this.viewWidth / this.viewHeight;
    this.camera.updateProjectionMatrix();

    const targets = computeResponsiveTargets(this.viewWidth, this.viewHeight, this.detailPanelBounds || null);
    this.shelfCameraPosition.copy(targets.shelfCameraPosition);
    this.shelfCameraTarget.copy(targets.shelfCameraTarget);
    this.inspectPosition.copy(targets.inspectPosition);
    this.inspectCameraPosition.copy(targets.inspectCameraPosition);
    this.inspectCameraTarget.copy(targets.inspectCameraTarget);
    this.detailViewOffsetX = targets.detailViewOffsetX;
    this.detailSafeWidth = targets.detailSafeWidth;

    if (this.mode === "hero") {
      this.camera.position.copy(this.shelfCameraPosition);
      this.transitionCameraTarget.copy(this.shelfCameraTarget);
      this.currentViewOffsetX = 0;
      this._applyDetailViewOffset();
      this.camera.lookAt(this.shelfCameraTarget);
    } else if (this.mode === "detail" && this.activeBook) {
      this.activeBook.root.position.copy(this.inspectPosition);
      this.activeBook.root.scale.setScalar(this._inspectScale());
      this.transitionCameraTarget.copy(this.inspectCameraTarget);
      this.currentViewOffsetX = this.detailViewOffsetX;
      this._applyDetailViewOffset();
      this.resetInspectionView();
    }
    this.requestFrame();
  }

  /** Called by React when the side detail panel's layout changes (wide-screen Read Mode chrome). */
  setDetailPanelBounds(rect) {
    this.detailPanelBounds = rect;
    this.resize();
  }

  // --- render loop (on-demand, not continuous — matches the original) -----

  requestFrame() {
    if (!this.rafId && !this.suspended) {
      this.rafId = requestAnimationFrame(this._frame);
    }
  }

  updateDust(elapsed) {
    if (this.dust) this.dust.rotation.y = elapsed * 0.01;
  }

  updateTransition(delta) {
    if (this.mode !== "opening" && this.mode !== "closing") return;
    this.transitionTime = Math.min(this.transitionTime + delta / this.transitionDuration, 1);
    const progress = this.transitionTime;
    if (this.mode === "opening") {
      this.applyOpeningPose(progress);
      if (progress >= 1) this.finishOpening();
    } else {
      this.applyClosingPose(progress);
      if (progress >= 1) this.finishClosing();
    }
  }

  _frame = (time) => {
    this.rafId = 0;
    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    const elapsed = time / 1000;
    this.lastTime = time;

    if (this.pointerDirty) this.updateHover();
    this.updateShelfLayout(delta);
    this.updateTransition(delta);
    this.updateDust(elapsed);

    if (this.mode === "detail" && this.activeBook) {
      if (this.pageDrag.active) {
        this.pageDrag.progressVelocity = damp(this.pageDrag.progressVelocity, 0, 9, delta);
      }
      this.controls.update();
      this.updatePaginatedBook(this.activeBook, delta, this.getDetailOpenAmount());
    }

    this.renderer.render(this.scene, this.camera);

    const shelfMoving = Math.abs(this.position - this.targetPosition) > 0.0005;
    const shouldContinue = !this.reducedMotion || this.mode === "opening" || this.mode === "closing" || shelfMoving;
    if (shouldContinue && !this.suspended) this.requestFrame();
  };

  // --- teardown --------------------------------------------------------------

  dispose() {
    this.suspended = true;
    this.cancelPageDrag();
    this.resetDetailPress();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;

    const canvas = this.canvas;
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("click", this.onCanvasClick);
    canvas.removeEventListener("pointerdown", this.onDetailBookPointerDown, true);
    canvas.removeEventListener("pointermove", this.onDetailBookPointerMove, true);
    canvas.removeEventListener("pointerup", this.onDetailBookPointerEnd, true);
    canvas.removeEventListener("pointercancel", this.onDetailBookPointerEnd, true);
    canvas.removeEventListener("lostpointercapture", this.onDetailBookPointerEnd, true);
    canvas.removeEventListener("pointerdown", this.onPagePointerDown, true);
    canvas.removeEventListener("pointermove", this.onPagePointerMove, true);
    canvas.removeEventListener("pointerup", this.onPagePointerEnd, true);
    canvas.removeEventListener("pointercancel", this.onPagePointerEnd, true);
    canvas.removeEventListener("lostpointercapture", this.onPagePointerEnd, true);
    window.removeEventListener("pointerup", this.onWindowPagePointerEnd);
    window.removeEventListener("pointercancel", this.onWindowPagePointerEnd);
    canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("blur", this.onWindowBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.reducedMotionQuery.removeEventListener("change", this.onReducedMotionChange);
    this._resizeObserver?.disconnect();

    this.controls?.dispose();
    this.scene?.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value?.isTexture && !value.userData?.isSharedAsset) value.dispose();
        });
        material.dispose();
      });
    });
    this.environmentTarget?.dispose();
    this.renderer?.dispose();
  }
}
