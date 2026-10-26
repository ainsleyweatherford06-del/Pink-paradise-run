import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  AssetLibrary,
  CharacterRig,
  createCharacterRig,
  createGemMesh,
  createObstacleMesh,
  createSceneryProp,
} from "./models";
import { sound } from "./sound";
import { computeSpeedAtTime, generateNextWave } from "./spawner";
import { createParadiseTextures, ParadiseTextures } from "./textures";
import {
  CharacterId,
  GameScreen,
  GameStats,
  HudCallout,
  LANE_WIDTH,
  LaneIndex,
  OBSTACLE_SPECS,
  ObstacleType,
  POINTS_PER_GEM,
} from "./types";

const BEST_SCORE_KEY = "pink_paradise_run_best_score";

const GRAVITY = 38.0;
const SINGLE_JUMP_VELOCITY = 12.6; // Peaks around ~2.09m (clears low obstacles <= 1.08m easily)
const DOUBLE_JUMP_VELOCITY = 14.8; // Boosts high (~3.4m - 4.3m) to clear Towering Makeup (2.08m)
const SLIDE_DURATION = 0.68;
const DOUBLE_TAP_WINDOW_MS = 650;

const SPAWN_HORIZON_Z = -128;
const DESPAWN_BEHIND_Z = 14;

interface ActiveObstacle {
  type: ObstacleType;
  lane: LaneIndex;
  x: number;
  z: number;
  mesh: THREE.Group;
}

interface ActiveGem {
  lane: LaneIndex;
  x: number;
  baseY: number;
  z: number;
  phase: number;
  group: THREE.Group;
  crystal: THREE.Mesh;
}

interface SceneryItem {
  mesh: THREE.Group;
  z: number;
}

interface SparkleParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface EngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onScreenChange: (screen: GameScreen) => void;
  onCallout: (callout: HudCallout) => void;
}

// Module-scope reusable vectors (zero GC allocations per frame)
const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement("canvas");
    const gl = probeCanvas.getContext("webgl2");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class ParadiseEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ParadiseTextures;
  private assetLib!: AssetLibrary;

  private frameId = 0;
  private disposed = false;
  private lastTimestamp = 0;

  // Camera smooth tracking state
  private currentLookAt = new THREE.Vector3(0, 1.2, 0);
  private shakeIntensity = 0;

  // Game & Character State
  private screen: GameScreen = GameScreen.Menu;
  private selectedCharacter: CharacterId = CharacterId.Bella;
  private characterRigs = new Map<CharacterId, CharacterRig>();
  private characterRig: CharacterRig | null = null;
  private characterSelectSpin = 0;

  // Runner Kinematics
  private targetLane: LaneIndex = 0;
  private playerX = 0;
  private playerY = 0;
  private playerVy = 0;
  private isGrounded = true;
  private hasDoubleJumped = false;
  private doubleJumpSpin = 0;
  private slideTimer = 0;
  private fastDropActive = false;
  private runCycle = 0;

  // Spacebar Double-Tap & Input Buffering
  private lastSpacePressMs = 0;
  private spaceTapCount = 0;
  private bufferedJumpUntilMs = 0;

  // Scoring & Progress
  private score = 0;
  private gemsCollected = 0;
  private distanceMeters = 0;
  private elapsedSeconds = 0;
  private currentSpeed = 14.5;
  private bestScore = 0;
  private lastHudSyncMs = 0;
  private calloutCounter = 0;

  // Track & World Objects
  private runwayMesh!: THREE.Mesh;
  private runwayScrollOffset = 0;
  private activeObstacles: ActiveObstacle[] = [];
  private activeGems: ActiveGem[] = [];
  private distanceUntilNextWave = 18;
  private sceneryItems: SceneryItem[] = [];
  private skyClouds: THREE.Group[] = [];

  // Burst Sparkle Particle System (Points)
  private readonly maxSparkles = 90;
  private sparkles: SparkleParticle[] = [];
  private sparklePositions!: Float32Array;
  private sparkleGeo!: THREE.BufferGeometry;
  private sparklePoints!: THREE.Points;

  // Ambient Floating Paradise Glitter
  private ambientGlitter!: THREE.Points;

  constructor(
    container: HTMLElement,
    initialCharacter: CharacterId,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.selectedCharacter = initialCharacter;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    try {
      const savedBest = window.localStorage.getItem(BEST_SCORE_KEY);
      if (savedBest) this.bestScore = parseInt(savedBest, 10) || 0;
    } catch {
      this.bestScore = 0;
    }

    this.initScene();
    this.buildEnvironment();
    this.initParticles();
    for (const id of [CharacterId.Bella, CharacterId.Chloe, CharacterId.Maya]) {
      this.characterRigs.set(
        id,
        createCharacterRig(id, this.assetLib, this.isSoftwareGl)
      );
    }
    this.setCharacter(initialCharacter, false);
    this.attachListeners();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.lastTimestamp = performance.now();
    // Kick off first render frame immediately via rAF before pacing subsequent frames
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  private initScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // WebGL context resilience
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
    });

    this.scene = new THREE.Scene();
    const horizonHex = 0xffcce5;
    this.scene.background = new THREE.Color(horizonHex);
    this.scene.fog = new THREE.FogExp2(horizonHex, 0.011);

    // Procedural studio environment map for metallic rose-gold & crystal gems
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const isWide = width >= 1024;
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 180);
    this.camera.position.set(isWide ? 0.35 : 0, isWide ? 1.45 : 1.75, isWide ? 4.15 : 5.1);
    this.currentLookAt.set(isWide ? 0.22 : 0, isWide ? 0.98 : 0.65, 0.5);
    this.camera.lookAt(this.currentLookAt);

    this.textures = createParadiseTextures(this.renderer);
    this.assetLib = new AssetLibrary(this.textures, this.isSoftwareGl);

    // 3-Point Warm/Cool Lighting Rig (calibrated to avoid blown-out highlights)
    const hemiLight = new THREE.HemisphereLight(0xffeaf5, 0xb85283, 0.68);
    hemiLight.position.set(0, 40, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff2e6, 1.15);
    keyLight.position.set(12, 22, 14);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff80bf, 0.45);
    rimLight.position.set(-10, 8, -16);
    this.scene.add(rimLight);
  }

  private buildEnvironment(): void {
    // 1. Outdoor Pastel Pink Meadow Floor extending cleanly to horizon
    const meadowGeo = new THREE.PlaneGeometry(280, 260);
    const meadowMat = new THREE.MeshStandardMaterial({
      color: 0xf08ebe,
      roughness: 0.88,
      metalness: 0.02,
    });
    const meadow = new THREE.Mesh(meadowGeo, meadowMat);
    meadow.rotation.x = -Math.PI / 2;
    meadow.position.set(0, -0.04, -75);
    meadow.receiveShadow = true;
    this.scene.add(meadow);

    // 2. Three-Lane Pearlescent Pink Paradise Runway (width = 3 * 2.6 = 7.8m + borders = 8.4m)
    const runwayLength = 190;
    const runwayGeo = new THREE.PlaneGeometry(8.2, runwayLength);
    const runwayMat = new THREE.MeshStandardMaterial({
      map: this.textures.runwayTile,
      roughness: 0.34,
      metalness: 0.08,
    });
    this.runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
    this.runwayMesh.rotation.x = -Math.PI / 2;
    this.runwayMesh.position.set(0, 0, -75);
    this.runwayMesh.receiveShadow = true;
    this.scene.add(this.runwayMesh);

    // Raised Rose-Gold & Hot-Pink Side Curbs flanking the 3 lanes
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.3,
      metalness: 0.35,
    });
    const goldRailMat = new THREE.MeshStandardMaterial({
      color: 0xf6c453,
      roughness: 0.2,
      metalness: 0.85,
    });

    [-1, 1].forEach((side) => {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.18, runwayLength),
        curbMat
      );
      curb.position.set(side * 4.25, 0.09, -75);
      curb.receiveShadow = true;
      this.scene.add(curb);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.06, runwayLength),
        goldRailMat
      );
      rail.position.set(side * 4.25, 0.21, -75);
      this.scene.add(rail);
    });

    // Soft pastel rolling hills placed well outside the playable perimeter (|x| >= 30)
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0xe879b0,
      roughness: 0.85,
      metalness: 0.02,
    });
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(6.5 + (i % 3) * 2.2, 18, 12),
        hillMat
      );
      hill.scale.set(1.2, 0.48, 1.6);
      hill.position.set(
        side * (31 + (i % 3) * 6),
        -1.0,
        -6 - i * 12
      );
      this.scene.add(hill);
    }

    // Populate conveyor of Blossom Trees, Heart Boulevard Lamps & Fairytale Spires
    const spanCount = 18;
    for (let i = 0; i < spanCount; i++) {
      const z = 12 - i * 8.5;
      [-1, 1].forEach((side) => {
        const lamp = createSceneryProp("lamp", this.assetLib, this.isSoftwareGl);
        lamp.position.set(side * 4.95, 0, z);
        this.scene.add(lamp);
        this.sceneryItems.push({ mesh: lamp, z });

        const tree = createSceneryProp("tree", this.assetLib, this.isSoftwareGl);
        const xJitter = (i % 3) * 1.6;
        tree.position.set(side * (7.8 + xJitter), 0, z - 3.5);
        const s = 0.88 + ((i * 7) % 5) * 0.08;
        tree.scale.setScalar(s);
        this.scene.add(tree);
        this.sceneryItems.push({ mesh: tree, z: z - 3.5 });

        if (i % 4 === 0) {
          const spire = createSceneryProp("spire", this.assetLib, this.isSoftwareGl);
          spire.position.set(side * (24 + (i % 2) * 5), -0.5, z - 6);
          this.scene.add(spire);
          this.sceneryItems.push({ mesh: spire, z: z - 6 });
        }
      });
    }

    // Dreamy Pink Cotton-Candy Sky Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xfff0f7,
      emissive: 0xffb8dc,
      emissiveIntensity: 0.25,
      roughness: 0.9,
    });
    for (let c = 0; c < 10; c++) {
      const cloudGroup = new THREE.Group();
      for (let p = 0; p < 3; p++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(2.2 - p * 0.35, 12, 12),
          cloudMat
        );
        puff.position.set((p - 1) * 1.9, (p % 2) * 0.4, 0);
        puff.scale.set(1.3, 0.65, 0.8);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(
        (c % 2 === 0 ? -1 : 1) * (10 + (c % 4) * 7),
        13 + (c % 3) * 3.5,
        -15 - c * 14
      );
      this.scene.add(cloudGroup);
      this.skyClouds.push(cloudGroup);
    }
  }

  private initParticles(): void {
    // 1. Burst Sparkle Pool (gem pickups, double jump, crash)
    this.sparklePositions = new Float32Array(this.maxSparkles * 3);
    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
      });
      this.sparklePositions[i * 3 + 1] = -100;
    }

    this.sparkleGeo = new THREE.BufferGeometry();
    this.sparkleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.sparklePositions, 3)
    );

    const sparkleMat = new THREE.PointsMaterial({
      size: 0.55,
      map: this.textures.sparkleSprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffd1ea,
    });

    this.sparklePoints = new THREE.Points(this.sparkleGeo, sparkleMat);
    this.sparklePoints.frustumCulled = false;
    this.scene.add(this.sparklePoints);

    // 2. Ambient Floating Paradise Glitter in Air
    const ambCount = 110;
    const ambPos = new Float32Array(ambCount * 3);
    for (let i = 0; i < ambCount; i++) {
      ambPos[i * 3] = (Math.random() - 0.5) * 26;
      ambPos[i * 3 + 1] = 0.6 + Math.random() * 8.5;
      ambPos[i * 3 + 2] = 6 - Math.random() * 95;
    }
    const ambGeo = new THREE.BufferGeometry();
    ambGeo.setAttribute("position", new THREE.BufferAttribute(ambPos, 3));
    const ambMat = new THREE.PointsMaterial({
      size: 0.34,
      map: this.textures.sparkleSprite,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      color: 0xffffff,
    });
    this.ambientGlitter = new THREE.Points(ambGeo, ambMat);
    this.ambientGlitter.frustumCulled = false;
    this.scene.add(this.ambientGlitter);
  }

  private spawnSparkleBurst(
    originX: number,
    originY: number,
    originZ: number,
    count: number
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.sparkles.length && spawned < count; i++) {
      const sp = this.sparkles[i];
      if (!sp.active) {
        sp.active = true;
        sp.x = originX + (Math.random() - 0.5) * 0.4;
        sp.y = originY + (Math.random() - 0.5) * 0.4;
        sp.z = originZ + (Math.random() - 0.5) * 0.4;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.2 + Math.random() * 3.8;
        sp.vx = Math.cos(angle) * speed;
        sp.vy = 2.0 + Math.random() * 4.5;
        sp.vz = Math.sin(angle) * speed;
        sp.life = 0;
        sp.maxLife = 0.42 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  public setCharacter(characterId: CharacterId, playPreviewSpin = true): void {
    this.selectedCharacter = characterId;
    if (this.characterRig) {
      this.scene.remove(this.characterRig.root);
    }

    let nextRig = this.characterRigs.get(characterId);
    if (!nextRig) {
      nextRig = createCharacterRig(
        characterId,
        this.assetLib,
        this.isSoftwareGl
      );
      this.characterRigs.set(characterId, nextRig);
    }
    this.characterRig = nextRig;

    if (this.screen === GameScreen.Menu) {
      const isWide = (this.container.clientWidth || window.innerWidth) >= 1024;
      this.characterRig.root.position.set(isWide ? -1.35 : 0, 0, 0.75);
      this.characterRig.root.rotation.y = isWide ? 0.38 : 0.12;
      this.characterRig.bodyPivot.rotation.set(0, 0, 0);
      this.characterRig.hips.position.y = 0.78;
      if (playPreviewSpin) {
        this.spinCharacterPreview();
      }
    } else {
      this.characterRig.root.position.set(this.playerX, this.playerY, 0);
      this.characterRig.root.rotation.y = Math.PI;
    }

    this.scene.add(this.characterRig.root);
    if (playPreviewSpin && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public spinCharacterPreview(): void {
    this.characterSelectSpin = Math.PI * 2;
    const isWide = (this.container.clientWidth || window.innerWidth) >= 1024;
    this.spawnSparkleBurst(isWide ? -1.35 : 0, 1.1, 0.75, 16);
    sound.playSelect();
  }

  public startGame(): void {
    this.clearCourseObjects();

    this.score = 0;
    this.gemsCollected = 0;
    this.distanceMeters = 0;
    this.elapsedSeconds = 0;
    this.currentSpeed = computeSpeedAtTime(0);

    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.hasDoubleJumped = false;
    this.doubleJumpSpin = 0;
    this.slideTimer = 0;
    this.fastDropActive = false;
    this.spaceTapCount = 0;
    this.lastSpacePressMs = 0;
    this.bufferedJumpUntilMs = 0;
    this.shakeIntensity = 0;

    if (this.characterRig) {
      this.characterRig.root.position.set(0, 0, 0);
      this.characterRig.root.rotation.y = Math.PI;
      this.characterRig.bodyPivot.rotation.set(0, 0, 0);
      this.characterRig.hips.position.y = 0.78;
      this.characterRig.hairDynamic.rotation.set(0, 0, 0);
    }

    // Spawn a welcoming ribbon of Pink Gems across lanes right ahead of the starting line
    const starterGems: Array<{ lane: LaneIndex; z: number }> = [
      { lane: 0, z: -13 },
      { lane: 0, z: -17 },
      { lane: 1, z: -22 },
      { lane: 1, z: -26 },
    ];
    for (const sg of starterGems) {
      const { group, crystal } = createGemMesh(this.assetLib);
      const x = sg.lane * LANE_WIDTH;
      group.position.set(x, 0, sg.z);
      crystal.position.y = 0.72;
      this.scene.add(group);
      this.activeGems.push({
        lane: sg.lane,
        x,
        baseY: 0.72,
        z: sg.z,
        phase: Math.abs(sg.z) * 0.25,
        group,
        crystal,
      });
    }

    // Seed initial gentle course ahead (starting safely 35m down the runway)
    let seedZ = -35;
    while (seedZ > SPAWN_HORIZON_Z) {
      const wave = generateNextWave(0, this.currentSpeed);
      this.instantiateWaveAtZ(wave, seedZ);
      seedZ -= wave.spacingAfter;
    }
    this.distanceUntilNextWave = Math.abs(seedZ - SPAWN_HORIZON_Z) + 12;

    this.lastTimestamp = performance.now();
    this.screen = GameScreen.Playing;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    sound.playStart();
    this.emitStats(true);
    this.callbacks.onScreenChange(GameScreen.Playing);
  }

  public returnToMenu(): void {
    this.clearCourseObjects();
    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.slideTimer = 0;
    this.doubleJumpSpin = 0;

    if (this.characterRig) {
      const isWide = (this.container.clientWidth || window.innerWidth) >= 1024;
      this.characterRig.root.position.set(isWide ? -1.35 : 0, 0, 0.75);
      this.characterRig.root.rotation.y = isWide ? 0.38 : 0.12;
      this.characterRig.bodyPivot.rotation.set(0, 0, 0);
      this.characterRig.hips.position.y = 0.78;
      this.characterRig.leftLeg.rotation.set(0, 0, 0);
      this.characterRig.rightLeg.rotation.set(0, 0, 0);
      this.characterRig.hairDynamic.rotation.set(0, 0, 0);
    }

    this.lastTimestamp = performance.now();
    this.screen = GameScreen.Menu;
    this.callbacks.onScreenChange(GameScreen.Menu);
  }

  public togglePause(): void {
    if (this.screen === GameScreen.Playing) {
      this.screen = GameScreen.Paused;
      this.callbacks.onScreenChange(GameScreen.Paused);
    } else if (this.screen === GameScreen.Paused) {
      this.screen = GameScreen.Playing;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      this.lastTimestamp = performance.now();
      this.callbacks.onScreenChange(GameScreen.Playing);
    }
  }

  // Public action triggers (used by both Keyboard and optional HUD buttons)
  public moveLeft(): void {
    if (this.screen !== GameScreen.Playing) return;
    if (this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as LaneIndex;
      sound.playLaneSwitch();
    }
  }

  public moveRight(): void {
    if (this.screen !== GameScreen.Playing) return;
    if (this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as LaneIndex;
      sound.playLaneSwitch();
    }
  }

  public triggerSingleJump(): void {
    if (this.screen !== GameScreen.Playing) return;
    const now = performance.now();

    if (this.isGrounded || this.playerY < 0.14) {
      this.executeSingleJump();
    } else {
      // Buffer jump slightly before landing so rapid inputs never feel dropped
      this.bufferedJumpUntilMs = now + 150;
    }
  }

  private executeSingleJump(): void {
    this.slideTimer = 0;
    this.fastDropActive = false;
    this.isGrounded = false;
    this.hasDoubleJumped = false;
    this.playerVy = SINGLE_JUMP_VELOCITY;
    sound.playJump();
  }

  public triggerSpacePress(): void {
    if (this.screen !== GameScreen.Playing) return;
    const now = performance.now();
    const deltaMs = now - this.lastSpacePressMs;

    if (deltaMs <= DOUBLE_TAP_WINDOW_MS && this.spaceTapCount >= 1) {
      // Quick second press of Spacebar -> Perform Double Jump!
      this.triggerDirectDoubleJump();
      return;
    }

    // First Spacebar press in a double-tap sequence
    this.lastSpacePressMs = now;
    this.spaceTapCount = 1;

    if (this.isGrounded || this.playerY < 0.14) {
      // Launch into initial jump immediately so double-tapping Space from the ground feels instant!
      this.executeSingleJump();
    } else if (!this.hasDoubleJumped) {
      // Already airborne (e.g. jumped with Up Arrow): brief hang cushion while awaiting 2nd Space tap
      this.playerVy = Math.max(this.playerVy, 3.2);
    }
  }

  public triggerDirectDoubleJump(): void {
    if (this.screen !== GameScreen.Playing) return;
    if (!this.hasDoubleJumped) {
      this.slideTimer = 0;
      this.fastDropActive = false;
      this.isGrounded = false;
      this.hasDoubleJumped = true;
      this.playerY = Math.max(this.playerY, 0.35);
      this.playerVy = DOUBLE_JUMP_VELOCITY;
      this.doubleJumpSpin = Math.PI * 2;
      this.spaceTapCount = 0;
      this.lastSpacePressMs = 0;

      this.spawnSparkleBurst(this.playerX, this.playerY + 0.8, 0, 20);
      sound.playDoubleJump();
      this.callbacks.onCallout({
        id: ++this.calloutCounter,
        text: "Double Jump!",
        variant: "doubleJump",
      });
    }
  }

  public triggerSlide(): void {
    if (this.screen !== GameScreen.Playing) return;
    this.slideTimer = SLIDE_DURATION;
    if (!this.isGrounded) {
      // Fast-drop from air into slide!
      this.fastDropActive = true;
      this.playerVy = Math.min(this.playerVy, -25.0);
    }
    sound.playSlide();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
      ].includes(e.code)
    ) {
      if (this.screen === GameScreen.Playing) {
        e.preventDefault();
      }
    }

    if (e.repeat && e.code !== "ArrowDown") return;

    if (e.code === "Escape" || e.code === "KeyP") {
      if (
        this.screen === GameScreen.Playing ||
        this.screen === GameScreen.Paused
      ) {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }

    if (this.screen !== GameScreen.Playing) return;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft();
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight();
        break;
      case "ArrowUp":
      case "KeyW":
        this.triggerSingleJump();
        break;
      case "ArrowDown":
      case "KeyS":
        this.triggerSlide();
        break;
      case "Space":
        this.triggerSpacePress();
        break;
    }
  };

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private attachListeners(): void {
    window.addEventListener("keydown", this.handleKeyDown, { passive: false });
    window.addEventListener("resize", this.handleResize);
  }

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== "function") {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    // Allow up to 160ms real-time elapsed per frame (covers 80ms software-WebGL pacing)
    // and sub-step physics at <= 25ms intervals so jumps & collisions never tunnel!
    const totalDt = Math.min(Math.max(rawDt, 0.001), 0.16);

    if (this.screen === GameScreen.Playing) {
      const subSteps = Math.max(1, Math.ceil(totalDt / 0.025));
      const subDt = totalDt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        if (this.screen !== GameScreen.Playing) break;
        this.updatePlaying(subDt, now);
      }
    } else if (this.screen === GameScreen.Menu) {
      this.updateMenuShowcase(totalDt, now);
    } else if (this.screen === GameScreen.GameOver) {
      this.updateGameOverIdle(totalDt);
    }

    this.updateSparkles(totalDt);
    this.updateCamera(totalDt);

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  };

  private updateMenuShowcase(dt: number, now: number): void {
    // Gentle paradise breeze & floating glitter behind the character on the Main Menu
    this.runwayScrollOffset += dt * 0.45;
    this.textures.runwayTile.offset.y = -this.runwayScrollOffset;

    if (this.characterRig) {
      const rig = this.characterRig;
      const t = now * 0.001;
      const isWide = (this.container.clientWidth || window.innerWidth) >= 1024;

      if (this.characterSelectSpin > 0) {
        const step = Math.min(this.characterSelectSpin, dt * 11.5);
        this.characterSelectSpin -= step;
      }

      const baseYaw = isWide ? 0.38 : 0.12;
      const targetYaw = baseYaw + this.characterSelectSpin;
      rig.root.rotation.y = THREE.MathUtils.damp(
        rig.root.rotation.y,
        targetYaw,
        12,
        dt
      );
      rig.root.position.set(
        isWide ? -1.35 : 0,
        Math.abs(Math.sin(t * 2.4)) * 0.04,
        0.75
      );

      rig.hips.position.y = 0.78;
      rig.torso.rotation.x = 0.03;
      rig.torso.rotation.z = Math.sin(t * 2.2) * 0.04;
      rig.head.rotation.y = Math.sin(t * 1.5) * 0.1;
      rig.leftArm.rotation.x = Math.sin(t * 2.2) * 0.16;
      rig.leftArm.rotation.z = -0.18;
      rig.rightArm.rotation.x = -0.45 + Math.sin(t * 4.2) * 0.22;
      rig.rightArm.rotation.z = 0.35;
      rig.leftLeg.rotation.x = 0.05;
      rig.rightLeg.rotation.x = -0.05;
      rig.hairDynamic.rotation.z = Math.sin(t * 2.8) * 0.08;
    }
  }

  private updateGameOverIdle(dt: number): void {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.8);
    }
  }

  private updatePlaying(dt: number, now: number): void {
    // 1. Advance time, speed & distance
    this.elapsedSeconds += dt;
    this.currentSpeed = computeSpeedAtTime(this.elapsedSeconds);
    const stepZ = this.currentSpeed * dt;
    this.distanceMeters += stepZ;

    // Scroll runway tile texture seamlessly
    const tileWorldLength = 190 / 22;
    this.runwayScrollOffset =
      (this.runwayScrollOffset + stepZ / tileWorldLength) % 1;
    this.textures.runwayTile.offset.y = -this.runwayScrollOffset;

    // Scroll flanking outdoor trees, heart lamps & spires
    for (let i = 0; i < this.sceneryItems.length; i++) {
      const item = this.sceneryItems[i];
      item.z += stepZ;
      if (item.z > 18) {
        item.z -= 18 * 8.5;
      }
      item.mesh.position.z = item.z;
    }

    // Drift ambient glitter toward player for crisp sensation of speed
    const ambAttr = this.ambientGlitter.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    for (let i = 0; i < ambAttr.count; i++) {
      let gz = ambAttr.getZ(i) + stepZ * 0.85;
      if (gz > 10) gz -= 100;
      ambAttr.setZ(i, gz);
    }
    ambAttr.needsUpdate = true;

    // 2. Smooth Horizontal Lane Switching
    const desiredX = this.targetLane * LANE_WIDTH;
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, desiredX, 16, dt);
    const lateralVel = (this.playerX - prevX) / dt;

    // 3. Vertical Jump / Double-Jump / Gravity Kinematics
    if (!this.isGrounded) {
      this.playerY += this.playerVy * dt;
      const activeGrav = this.fastDropActive ? GRAVITY * 2.1 : GRAVITY;
      this.playerVy -= activeGrav * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isGrounded = true;
        this.hasDoubleJumped = false;
        this.doubleJumpSpin = 0;
        this.spaceTapCount = 0;

        if (this.fastDropActive) {
          this.fastDropActive = false;
          this.spawnSparkleBurst(this.playerX, 0.2, 0, 8);
        }

        if (now <= this.bufferedJumpUntilMs) {
          this.bufferedJumpUntilMs = 0;
          this.executeSingleJump();
        }
      }
    }

    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
    }

    // 4. Animate Character Rig
    if (this.characterRig) {
      const rig = this.characterRig;
      rig.root.position.set(this.playerX, this.playerY, 0);
      rig.root.rotation.y = THREE.MathUtils.damp(
        rig.root.rotation.y,
        Math.PI,
        14,
        dt
      );

      // Scale & fade ground contact shadow with jump height
      rig.contactShadow.position.y = -this.playerY + 0.018;
      const shadowScale = Math.max(0.45, 1 - this.playerY * 0.14);
      rig.contactShadow.scale.setScalar(shadowScale);

      // Bank into lane switches
      const targetBankZ = THREE.MathUtils.clamp(lateralVel * 0.028, -0.28, 0.28);
      rig.bodyPivot.rotation.z = THREE.MathUtils.damp(
        rig.bodyPivot.rotation.z,
        targetBankZ,
        14,
        dt
      );

      if (this.doubleJumpSpin > 0) {
        const spinStep = Math.min(this.doubleJumpSpin, dt * 13.5);
        this.doubleJumpSpin -= spinStep;
        rig.bodyPivot.rotation.y = this.doubleJumpSpin;
      } else {
        rig.bodyPivot.rotation.y = THREE.MathUtils.damp(
          rig.bodyPivot.rotation.y,
          0,
          14,
          dt
        );
      }

      const isSliding = this.slideTimer > 0 && this.isGrounded;

      if (isSliding) {
        // Low parkour slide under barriers!
        rig.hips.position.y = THREE.MathUtils.damp(
          rig.hips.position.y,
          0.34,
          18,
          dt
        );
        rig.torso.rotation.x = THREE.MathUtils.damp(
          rig.torso.rotation.x,
          -0.88,
          18,
          dt
        );
        rig.leftLeg.rotation.x = THREE.MathUtils.damp(
          rig.leftLeg.rotation.x,
          1.18,
          18,
          dt
        );
        rig.rightLeg.rotation.x = THREE.MathUtils.damp(
          rig.rightLeg.rotation.x,
          0.65,
          18,
          dt
        );
        rig.leftArm.rotation.x = -0.6;
        rig.rightArm.rotation.x = -0.6;
        rig.hairDynamic.rotation.x = 0.65;
      } else if (!this.isGrounded) {
        // Graceful airborne jump / double-jump pose
        rig.hips.position.y = THREE.MathUtils.damp(
          rig.hips.position.y,
          0.78,
          14,
          dt
        );
        rig.torso.rotation.x = THREE.MathUtils.damp(
          rig.torso.rotation.x,
          0.18,
          12,
          dt
        );
        rig.leftLeg.rotation.x = THREE.MathUtils.damp(
          rig.leftLeg.rotation.x,
          0.55,
          14,
          dt
        );
        rig.rightLeg.rotation.x = THREE.MathUtils.damp(
          rig.rightLeg.rotation.x,
          -0.45,
          14,
          dt
        );
        rig.leftArm.rotation.x = THREE.MathUtils.damp(
          rig.leftArm.rotation.x,
          -2.1,
          12,
          dt
        );
        rig.rightArm.rotation.x = THREE.MathUtils.damp(
          rig.rightArm.rotation.x,
          -2.1,
          12,
          dt
        );
        rig.hairDynamic.rotation.x = 0.55;
      } else {
        // Energetic forward running cycle!
        this.runCycle += dt * (this.currentSpeed * 0.72);
        const swing = Math.sin(this.runCycle);
        const bounce = Math.abs(Math.cos(this.runCycle)) * 0.075;

        rig.hips.position.y = 0.78 + bounce;
        rig.torso.rotation.x = THREE.MathUtils.damp(
          rig.torso.rotation.x,
          0.16,
          14,
          dt
        );
        rig.leftLeg.rotation.x = swing * 0.88;
        rig.rightLeg.rotation.x = -swing * 0.88;
        rig.leftArm.rotation.x = -swing * 0.78;
        rig.rightArm.rotation.x = swing * 0.78;
        rig.leftArm.rotation.z = -0.14;
        rig.rightArm.rotation.z = 0.14;
        rig.hairDynamic.rotation.x = 0.25 + Math.abs(swing) * 0.22;
        rig.hairDynamic.rotation.z = Math.cos(this.runCycle) * 0.12;
      }
    }

    // 5. Spawn Upcoming Waves at Horizon
    this.distanceUntilNextWave -= stepZ;
    if (this.distanceUntilNextWave <= 0) {
      const wave = generateNextWave(this.elapsedSeconds, this.currentSpeed);
      this.instantiateWaveAtZ(wave, SPAWN_HORIZON_Z);
      this.distanceUntilNextWave = wave.spacingAfter;
    }

    // 6. Move Gems & Check Gem Collection (+10 Points Immediately!)
    const isSliding = this.slideTimer > 0 && this.isGrounded;
    const playerBottomY = this.playerY;
    const playerTopY = this.playerY + (isSliding ? 0.72 : 1.56);

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      gem.z += stepZ;
      gem.phase += dt * 3.2;
      gem.group.position.z = gem.z;
      gem.crystal.rotation.y += dt * 2.8;
      gem.crystal.position.y = gem.baseY + Math.sin(gem.phase) * 0.08;

      const dx = Math.abs(gem.x - this.playerX);
      const dz = Math.abs(gem.z);
      const gemWorldY = gem.crystal.position.y;
      const dyOk =
        gemWorldY >= playerBottomY - 0.55 && gemWorldY <= playerTopY + 0.65;

      if (dx < 0.96 && dz < 1.05 && dyOk) {
        // Collect Pink Gem -> +10 Points!
        this.gemsCollected += 1;
        this.score += POINTS_PER_GEM;
        if (this.score > this.bestScore) {
          this.bestScore = this.score;
          try {
            window.localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
          } catch {
            // Ignore storage write error
          }
        }

        this.spawnSparkleBurst(gem.x, gemWorldY, gem.z, 12);
        sound.playGem();

        this.scene.remove(gem.group);
        this.activeGems.splice(i, 1);

        // Immediately update HUD score!
        this.emitStats(true);
        this.callbacks.onCallout({
          id: ++this.calloutCounter,
          text: `+${POINTS_PER_GEM}`,
          variant: "gem",
        });
        continue;
      }

      if (gem.z > DESPAWN_BEHIND_Z) {
        this.scene.remove(gem.group);
        this.activeGems.splice(i, 1);
      }
    }

    // 7. Move Obstacles & Check Collisions
    const playerHalfW = 0.28;
    const playerHalfD = 0.24;

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      obs.z += stepZ;
      obs.mesh.position.z = obs.z;

      const spec = OBSTACLE_SPECS[obs.type];
      const overlapX = Math.abs(obs.x - this.playerX) < spec.halfWidth + playerHalfW;
      const overlapZ = Math.abs(obs.z) < spec.halfDepth + playerHalfD;

      if (overlapX && overlapZ) {
        // Check vertical clearance (forgiving tolerance on jump/slide)
        const effectiveMaxY =
          obs.type === ObstacleType.PinkWall ? 10.0 : spec.maxY - 0.08;
        const effectiveMinY = spec.minY > 0 ? spec.minY + 0.08 : 0;

        const overlapY =
          playerBottomY < effectiveMaxY && playerTopY > effectiveMinY;

        if (overlapY) {
          this.handleCrash(spec.label);
          return;
        }
      }

      if (obs.z > DESPAWN_BEHIND_Z) {
        this.scene.remove(obs.mesh);
        this.activeObstacles.splice(i, 1);
      }
    }

    // 8. Periodic HUD telemetry sync (~15Hz for smooth distance & timer counters)
    if (now - this.lastHudSyncMs >= 65) {
      this.lastHudSyncMs = now;
      this.emitStats(false);
    }
  }

  private instantiateWaveAtZ(
    wave: ReturnType<typeof generateNextWave>,
    zCenter: number
  ): void {
    for (const obsInst of wave.obstacles) {
      const mesh = createObstacleMesh(
        obsInst.type,
        this.assetLib,
        this.isSoftwareGl
      );
      const x = obsInst.lane * LANE_WIDTH;
      mesh.position.set(x, 0, zCenter);
      this.scene.add(mesh);
      this.activeObstacles.push({
        type: obsInst.type,
        lane: obsInst.lane,
        x,
        z: zCenter,
        mesh,
      });
    }

    for (const gemInst of wave.gems) {
      const { group, crystal } = createGemMesh(this.assetLib);
      const x = gemInst.lane * LANE_WIDTH;
      const z = zCenter + gemInst.zOffset;
      group.position.set(x, 0, z);
      crystal.position.y = gemInst.y;
      this.scene.add(group);
      this.activeGems.push({
        lane: gemInst.lane,
        x,
        baseY: gemInst.y,
        z,
        phase: Math.random() * Math.PI * 2,
        group,
        crystal,
      });
    }
  }

  private handleCrash(obstacleLabel: string): void {
    this.screen = GameScreen.GameOver;
    this.shakeIntensity = 0.65;
    this.spawnSparkleBurst(this.playerX, this.playerY + 0.9, 0, 32);
    sound.playCrash();

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
      } catch {
        // Ignore storage error
      }
    }

    this.callbacks.onStatsUpdate({
      score: this.score,
      gemsCollected: this.gemsCollected,
      distanceMeters: Math.floor(this.distanceMeters),
      elapsedSeconds: this.elapsedSeconds,
      currentSpeed: this.currentSpeed,
      bestScore: this.bestScore,
      crashedObstacleLabel: obstacleLabel,
    });
    this.callbacks.onScreenChange(GameScreen.GameOver);
  }

  private updateSparkles(dt: number): void {
    let anyActive = false;
    for (let i = 0; i < this.sparkles.length; i++) {
      const sp = this.sparkles[i];
      if (!sp.active) continue;
      anyActive = true;
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        sp.active = false;
        this.sparklePositions[i * 3 + 1] = -100;
      } else {
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.z += sp.vz * dt;
        sp.vy -= 9.5 * dt;
        this.sparklePositions[i * 3] = sp.x;
        this.sparklePositions[i * 3 + 1] = sp.y;
        this.sparklePositions[i * 3 + 2] = sp.z;
      }
    }
    if (anyActive) {
      this.sparkleGeo.attributes.position.needsUpdate = true;
    }
  }

  private updateCamera(dt: number): void {
    if (this.screen === GameScreen.Menu) {
      // Showcase camera framing the selected female character on the left-center runway
      const isWide = (this.container.clientWidth || window.innerWidth) >= 1024;
      _desiredCamPos.set(isWide ? 0.35 : 0, isWide ? 1.45 : 1.75, isWide ? 4.15 : 5.1);
      _desiredLookAt.set(isWide ? 0.22 : 0, isWide ? 0.98 : 0.65, 0.5);

      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 46, 8, dt);
      this.camera.updateProjectionMatrix();
    } else {
      // Third-Person Chase Perspective showing all 3 lanes & character running ahead!
      const speedNorm = Math.min(1, (this.currentSpeed - 14.5) / 20);
      const targetFov = 58 + speedNorm * 7;
      if (Math.abs(this.camera.fov - targetFov) > 0.05) {
        this.camera.fov = THREE.MathUtils.damp(
          this.camera.fov,
          targetFov,
          5,
          dt
        );
        this.camera.updateProjectionMatrix();
      }

      _desiredCamPos.set(
        this.playerX * 0.45,
        3.85 + this.playerY * 0.28,
        6.55
      );
      _desiredLookAt.set(
        this.playerX * 0.32,
        1.35 + this.playerY * 0.2,
        -9.5
      );
    }

    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      _desiredCamPos.x,
      10,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      _desiredCamPos.y,
      10,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      _desiredCamPos.z,
      10,
      dt
    );

    if (this.shakeIntensity > 0) {
      this.camera.position.x +=
        (Math.random() - 0.5) * this.shakeIntensity * 0.45;
      this.camera.position.y +=
        (Math.random() - 0.5) * this.shakeIntensity * 0.45;
    }

    this.currentLookAt.x = THREE.MathUtils.damp(
      this.currentLookAt.x,
      _desiredLookAt.x,
      12,
      dt
    );
    this.currentLookAt.y = THREE.MathUtils.damp(
      this.currentLookAt.y,
      _desiredLookAt.y,
      12,
      dt
    );
    this.currentLookAt.z = THREE.MathUtils.damp(
      this.currentLookAt.z,
      _desiredLookAt.z,
      12,
      dt
    );

    this.camera.lookAt(this.currentLookAt);
  }

  private emitStats(immediate: boolean): void {
    if (immediate) {
      this.lastHudSyncMs = performance.now();
    }
    this.callbacks.onStatsUpdate({
      score: this.score,
      gemsCollected: this.gemsCollected,
      distanceMeters: Math.floor(this.distanceMeters),
      elapsedSeconds: this.elapsedSeconds,
      currentSpeed: this.currentSpeed,
      bestScore: this.bestScore,
    });
  }

  private clearCourseObjects(): void {
    for (const obs of this.activeObstacles) {
      this.scene.remove(obs.mesh);
    }
    this.activeObstacles = [];

    for (const gem of this.activeGems) {
      this.scene.remove(gem.group);
    }
    this.activeGems = [];
  }

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("resize", this.handleResize);

    this.clearCourseObjects();
    for (const rig of this.characterRigs.values()) {
      rig.root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    }
    this.characterRigs.clear();
    this.assetLib.dispose();
    this.textures.dispose();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
