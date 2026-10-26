import * as THREE from "three";
import { ParadiseTextures } from "./textures";
import { CHARACTERS, CharacterId, ObstacleType } from "./types";

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hairDynamic: THREE.Group;
  contactShadow: THREE.Mesh;
}

function createHeartShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.55 * s);
  shape.bezierCurveTo(
    -0.1 * s,
    -0.45 * s,
    -0.65 * s,
    -0.05 * s,
    -0.65 * s,
    0.3 * s
  );
  shape.bezierCurveTo(-0.65 * s, 0.62 * s, -0.25 * s, 0.72 * s, 0, 0.42 * s);
  shape.bezierCurveTo(
    0.25 * s,
    0.72 * s,
    0.65 * s,
    0.62 * s,
    0.65 * s,
    0.3 * s
  );
  shape.bezierCurveTo(0.65 * s, -0.05 * s, 0.1 * s, -0.45 * s, 0, -0.55 * s);
  return shape;
}

function createStarShape(outerR = 0.5, innerR = 0.23, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = -Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Shared Geometry & Material Library so spawning gems, obstacles, and scenery props
 * never recompiles WebGL shader programs or allocates duplicate GPU buffers.
 */
export class AssetLibrary {
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  public readonly goldMat: THREE.MeshStandardMaterial;
  public readonly hotPinkMat: THREE.MeshStandardMaterial;
  public readonly blushMat: THREE.MeshStandardMaterial;
  public readonly pearlMat: THREE.MeshStandardMaterial;
  public readonly darkVelvetMat: THREE.MeshStandardMaterial;
  public readonly bagMat: THREE.MeshStandardMaterial;
  public readonly barrierBoardMat: THREE.MeshStandardMaterial;
  public readonly heartGlossMat: THREE.MeshStandardMaterial;
  public readonly mirrorMat: THREE.MeshStandardMaterial;
  public readonly bottleMat: THREE.MeshPhysicalMaterial;
  public readonly gemCrystalMat: THREE.MeshStandardMaterial;
  public readonly gemRingMat: THREE.MeshBasicMaterial;
  public readonly shadowMat: THREE.MeshBasicMaterial;
  public readonly trunkMat: THREE.MeshStandardMaterial;
  public readonly canopyMats: THREE.MeshStandardMaterial[];
  public readonly lanternMat: THREE.MeshStandardMaterial;
  public readonly spireTowerMat: THREE.MeshStandardMaterial;
  public readonly spireRoofMat: THREE.MeshStandardMaterial;

  // Shared Geometries
  public readonly unitShadowPlane: THREE.PlaneGeometry;
  public readonly gemCrystalGeo: THREE.LatheGeometry;
  public readonly gemRingGeo: THREE.RingGeometry;
  public readonly giantHeartGeo: THREE.ExtrudeGeometry;
  public readonly miniHeartGeo: THREE.ExtrudeGeometry;
  public readonly ornamentHeartGeo: THREE.ExtrudeGeometry;
  public readonly crestHeartGeo: THREE.ExtrudeGeometry;
  public readonly makeupBagGeo: THREE.ExtrudeGeometry;
  public readonly pullHeartGeo: THREE.ExtrudeGeometry;
  public readonly bowLoopGeo: THREE.ConeGeometry;
  public readonly bowKnotGeo: THREE.SphereGeometry;

  constructor(textures: ParadiseTextures, isSoftwareGl: boolean) {
    this.goldMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf5c45e,
        roughness: 0.2,
        metalness: 0.85,
      })
    );
    this.hotPinkMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xec267f,
        roughness: 0.28,
        metalness: 0.12,
      })
    );
    this.blushMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffb3d6,
        roughness: 0.55,
        metalness: 0.05,
      })
    );
    this.pearlMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff5fa,
        roughness: 0.35,
        metalness: 0.1,
      })
    );
    this.darkVelvetMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x831843,
        roughness: 0.72,
        metalness: 0.05,
      })
    );
    this.bagMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.quiltedLeather,
        roughness: 0.42,
        metalness: 0.08,
      })
    );
    this.barrierBoardMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.barrierStripe,
        roughness: 0.3,
        metalness: 0.08,
      })
    );
    this.heartGlossMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xff1f82,
        roughness: 0.14,
        metalness: 0.22,
      })
    );
    this.mirrorMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffeef7,
        roughness: 0.06,
        metalness: 0.9,
      })
    );
    this.bottleMat = this.trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xff70b5,
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: isSoftwareGl ? 0 : 1.0,
        transmission: isSoftwareGl ? 0 : 0.45,
        ior: 1.52,
        thickness: 0.7,
      })
    );
    this.gemCrystalMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xff2488,
        emissive: 0x700938,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.32,
        flatShading: true,
      })
    );
    this.gemRingMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xff8cc6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    this.shadowMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    this.trunkMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x9d5c75,
        roughness: 0.82,
        metalness: 0.02,
      })
    );
    this.canopyMats = [0xffb3d9, 0xff85c0, 0xffd6eb, 0xf472b6].map((hex) =>
      this.trackMat(
        new THREE.MeshStandardMaterial({
          color: hex,
          roughness: 0.65,
          metalness: 0.04,
        })
      )
    );
    this.lanternMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff0f8,
        emissive: 0xff66b2,
        emissiveIntensity: 0.65,
        roughness: 0.25,
      })
    );
    this.spireTowerMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfbcfe8,
        roughness: 0.45,
        metalness: 0.1,
      })
    );
    this.spireRoofMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xec4899,
        roughness: 0.3,
        metalness: 0.25,
      })
    );

    // Shared Geometries
    this.unitShadowPlane = this.trackGeo(new THREE.PlaneGeometry(1, 1));

    const pts = [
      new THREE.Vector2(0.001, -0.36),
      new THREE.Vector2(0.34, 0.08),
      new THREE.Vector2(0.22, 0.26),
      new THREE.Vector2(0.001, 0.28),
    ];
    this.gemCrystalGeo = this.trackGeo(new THREE.LatheGeometry(pts, 8));
    this.gemCrystalGeo.computeVertexNormals();

    this.gemRingGeo = this.trackGeo(new THREE.RingGeometry(0.22, 0.35, 14));

    const gh = new THREE.ExtrudeGeometry(createHeartShape(0.75), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.07,
      bevelSegments: 3,
    });
    gh.translate(0, 0, -0.14);
    this.giantHeartGeo = this.trackGeo(gh);

    this.miniHeartGeo = this.trackGeo(
      new THREE.ExtrudeGeometry(createHeartShape(0.25), {
        depth: 0.1,
        bevelEnabled: true,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelSegments: 2,
      })
    );

    const oh = new THREE.ExtrudeGeometry(createHeartShape(0.26), {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
    });
    oh.translate(0, 0, -0.04);
    this.ornamentHeartGeo = this.trackGeo(oh);

    this.crestHeartGeo = this.trackGeo(
      new THREE.ExtrudeGeometry(createHeartShape(0.42), {
        depth: 0.12,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 2,
      })
    );

    const bagShape = new THREE.Shape();
    bagShape.moveTo(-0.72, 0);
    bagShape.lineTo(0.72, 0);
    bagShape.quadraticCurveTo(0.82, 0.45, 0.62, 0.88);
    bagShape.quadraticCurveTo(0, 0.98, -0.62, 0.88);
    bagShape.quadraticCurveTo(-0.82, 0.45, -0.72, 0);
    const bgGeo = new THREE.ExtrudeGeometry(bagShape, {
      depth: 0.62,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.07,
      bevelSegments: 2,
    });
    bgGeo.translate(0, 0.08, -0.31);
    this.makeupBagGeo = this.trackGeo(bgGeo);

    this.pullHeartGeo = this.trackGeo(
      new THREE.ExtrudeGeometry(createHeartShape(0.16), {
        depth: 0.04,
        bevelEnabled: false,
      })
    );

    this.bowLoopGeo = this.trackGeo(new THREE.ConeGeometry(0.16, 0.28, 10));
    this.bowKnotGeo = this.trackGeo(new THREE.SphereGeometry(0.075, 10, 10));
  }

  public trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  public trackMat<T extends THREE.Material>(mat: T): T {
    this.materials.push(mat);
    return mat;
  }

  public makeShadow(width: number, depth: number): THREE.Mesh {
    const plane = new THREE.Mesh(this.unitShadowPlane, this.shadowMat);
    plane.rotation.x = -Math.PI / 2;
    plane.scale.set(width, depth, 1);
    plane.position.y = 0.018;
    return plane;
  }

  public makeBow(mat: THREE.Material, scale = 1): THREE.Group {
    const bow = new THREE.Group();
    const leftLoop = new THREE.Mesh(this.bowLoopGeo, mat);
    leftLoop.rotation.z = -Math.PI / 2;
    leftLoop.position.x = -0.13;

    const rightLoop = new THREE.Mesh(this.bowLoopGeo, mat);
    rightLoop.rotation.z = Math.PI / 2;
    rightLoop.position.x = 0.13;

    const knot = new THREE.Mesh(this.bowKnotGeo, this.pearlMat);
    bow.add(leftLoop, rightLoop, knot);
    bow.scale.setScalar(scale);
    return bow;
  }

  public dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
  }
}

/**
 * Builds an articulated 3D female runner model facing +Z in local space.
 */
export function createCharacterRig(
  characterId: CharacterId,
  lib: AssetLibrary,
  isSoftwareGl: boolean
): CharacterRig {
  const profile =
    CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0];

  const root = new THREE.Group();
  const contactShadow = lib.makeShadow(1.15, 1.15);
  root.add(contactShadow);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const skinMat = new THREE.MeshStandardMaterial({
    color: profile.skinHex,
    roughness: 0.65,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: profile.hairHex,
    roughness: 0.42,
    metalness: 0.12,
  });
  const primaryMat = new THREE.MeshStandardMaterial({
    color: profile.primaryOutfitHex,
    roughness: 0.34,
    metalness: 0.08,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: profile.secondaryOutfitHex,
    roughness: 0.6,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: profile.accentHex,
    roughness: 0.22,
    metalness: 0.68,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: profile.shoeHex,
    roughness: 0.28,
    metalness: 0.2,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.05,
  });

  const hips = new THREE.Group();
  hips.position.y = 0.78;
  bodyPivot.add(hips);

  const makeLeg = (side: -1 | 1): THREE.Group => {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.14, 0, 0);

    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.082, 0.28, 6, 10),
      skinMat
    );
    thigh.position.y = -0.22;
    thigh.castShadow = !isSoftwareGl;
    legGroup.add(thigh);

    if (characterId === CharacterId.Bella) {
      const kneeSock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.084, 0.075, 0.3, 10),
        soleMat
      );
      kneeSock.position.y = -0.5;
      legGroup.add(kneeSock);

      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.083, 0.012, 6, 14),
        primaryMat
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = -0.37;
      legGroup.add(stripe);
    } else if (characterId === CharacterId.Chloe) {
      const calf = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.072, 0.25, 6, 10),
        skinMat
      );
      calf.position.y = -0.48;
      legGroup.add(calf);
      for (let r = 0; r < 2; r++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.076, 0.01, 6, 12),
          secondaryMat
        );
        rib.rotation.x = Math.PI / 2 + (r === 0 ? 0.2 : -0.2);
        rib.position.y = -0.52 - r * 0.07;
        legGroup.add(rib);
      }
    } else {
      const shortLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.105, 0.098, 0.18, 10),
        secondaryMat
      );
      shortLeg.position.y = -0.12;
      legGroup.add(shortLeg);

      const calf = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.074, 0.24, 6, 10),
        skinMat
      );
      calf.position.y = -0.46;
      legGroup.add(calf);
    }

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.7, 0.04);
    const shoeBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.11, 0.28),
      shoeMat
    );
    shoeBody.position.y = 0.01;
    shoeBody.castShadow = !isSoftwareGl;
    const shoeSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.185, 0.05, 0.3),
      soleMat
    );
    shoeSole.position.y = -0.055;
    shoeGroup.add(shoeBody, shoeSole);

    if (characterId === CharacterId.Maya) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.09, 0.1, 10),
        shoeMat
      );
      collar.position.set(0, 0.08, -0.03);
      shoeGroup.add(collar);
    }

    legGroup.add(shoeGroup);
    return legGroup;
  };

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  hips.add(leftLeg, rightLeg);

  if (characterId === CharacterId.Bella) {
    const skirtPts = [
      new THREE.Vector2(0.16, 0.08),
      new THREE.Vector2(0.28, -0.18),
      new THREE.Vector2(0.31, -0.22),
    ];
    const skirt = new THREE.Mesh(
      new THREE.LatheGeometry(skirtPts, 16),
      primaryMat
    );
    skirt.castShadow = !isSoftwareGl;
    hips.add(skirt);

    const waistBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.175, 0.18, 0.06, 14),
      secondaryMat
    );
    waistBand.position.y = 0.07;
    hips.add(waistBand);
  } else if (characterId === CharacterId.Chloe) {
    const tutu1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.39, 0.16, 16),
      primaryMat
    );
    tutu1.position.y = -0.02;
    tutu1.castShadow = !isSoftwareGl;
    const tutu2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.44, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd1e6,
        roughness: 0.7,
        metalness: 0.02,
      })
    );
    tutu2.position.y = -0.08;
    hips.add(tutu1, tutu2);
  } else {
    const shortsPelvis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.21, 0.18, 14),
      secondaryMat
    );
    shortsPelvis.position.y = -0.01;
    hips.add(shortsPelvis);
  }

  const torso = new THREE.Group();
  torso.position.y = 0.06;
  hips.add(torso);

  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.16, 0.42, 14),
    characterId === CharacterId.Maya ? primaryMat : secondaryMat
  );
  chestMesh.position.y = 0.22;
  chestMesh.castShadow = !isSoftwareGl;
  torso.add(chestMesh);

  if (characterId === CharacterId.Bella) {
    const innerTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.36, 0.35),
      primaryMat
    );
    innerTop.position.set(0, 0.22, 0.03);
    torso.add(innerTop);
  } else if (characterId === CharacterId.Chloe) {
    const frontBow = lib.makeBow(primaryMat, 0.75);
    frontBow.position.set(0, 0.06, 0.18);
    torso.add(frontBow);
  } else if (characterId === CharacterId.Maya) {
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.016, 8, 20),
      accentMat
    );
    strap.rotation.y = 0.35;
    strap.rotation.z = 0.65;
    strap.position.set(0, 0.22, 0);
    torso.add(strap);

    const starBag = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createStarShape(0.13, 0.065, 5), {
        depth: 0.05,
        bevelEnabled: false,
      }),
      accentMat
    );
    starBag.position.set(0.19, 0.05, 0.06);
    starBag.rotation.y = Math.PI / 2;
    torso.add(starBag);
  }

  const makeArm = (side: -1 | 1): THREE.Group => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.24, 0.39, 0);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 10, 10),
      primaryMat
    );
    armGroup.add(shoulder);

    const armCyl = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.058, 0.32, 6, 10),
      characterId === CharacterId.Maya ? primaryMat : skinMat
    );
    armCyl.position.y = -0.2;
    armCyl.castShadow = !isSoftwareGl;
    armGroup.add(armCyl);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 10, 10),
      skinMat
    );
    hand.position.y = -0.39;
    armGroup.add(hand);

    return armGroup;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  torso.add(leftArm, rightArm);

  const head = new THREE.Group();
  head.position.y = 0.48;
  torso.add(head);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10),
    skinMat
  );
  neck.position.y = 0.03;
  head.add(neck);

  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 18, 18),
    skinMat
  );
  headSphere.position.y = 0.22;
  headSphere.castShadow = !isSoftwareGl;
  head.add(headSphere);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x24101c,
    roughness: 0.15,
  });
  const sparkleEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushCheekMat = new THREE.MeshBasicMaterial({
    color: 0xff6fa9,
    transparent: true,
    opacity: 0.55,
  });

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), eyeMat);
    eye.scale.set(0.9, 1.25, 0.5);
    eye.position.set(side * 0.082, 0.23, 0.205);
    head.add(eye);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 6, 6),
      sparkleEyeMat
    );
    glint.position.set(side * 0.082 + 0.01, 0.245, 0.222);
    head.add(glint);

    const cheek = new THREE.Mesh(
      new THREE.CircleGeometry(0.036, 10),
      blushCheekMat
    );
    cheek.position.set(side * 0.125, 0.18, 0.205);
    cheek.rotation.y = side * 0.35;
    head.add(cheek);
  });

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.009, 6, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xe11d74, roughness: 0.25 })
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.175, 0.215);
  head.add(smile);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.242,
      16,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.62
    ),
    hairMat
  );
  hairCap.position.y = 0.23;
  hairCap.rotation.x = -0.22;
  head.add(hairCap);

  const bangs = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.046, 8, 14, Math.PI * 0.82),
    hairMat
  );
  bangs.position.set(0, 0.348, 0.115);
  bangs.rotation.x = 0.26;
  bangs.rotation.z = 0.26;
  head.add(bangs);

  const hairDynamic = new THREE.Group();
  head.add(hairDynamic);

  if (characterId === CharacterId.Bella) {
    hairDynamic.position.set(0, 0.36, -0.17);
    const ponyRoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      hairMat
    );
    const ponyTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.48, 12),
      hairMat
    );
    ponyTail.position.set(0, -0.18, -0.14);
    ponyTail.rotation.x = 0.65;
    ponyTail.castShadow = !isSoftwareGl;

    const hairBow = lib.makeBow(primaryMat, 1.05);
    hairBow.position.set(0, 0.06, 0.02);
    hairBow.rotation.y = Math.PI;

    hairDynamic.add(ponyRoot, ponyTail, hairBow);

    // Heart-shaped rose sunglasses
    const miniHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.095), {
      depth: 0.018,
      bevelEnabled: false,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xff2e88,
      roughness: 0.12,
      metalness: 0.6,
    });
    [-1, 1].forEach((side) => {
      const lens = new THREE.Mesh(miniHeartGeo, lensMat);
      lens.position.set(side * 0.082, 0.255, 0.225);
      head.add(lens);
    });
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.016, 0.016),
      soleMat
    );
    bridge.position.set(0, 0.265, 0.23);
    head.add(bridge);
  } else if (characterId === CharacterId.Chloe) {
    hairDynamic.position.set(0, 0.38, -0.02);
    const starClipGeo = new THREE.ExtrudeGeometry(
      createStarShape(0.065, 0.03, 5),
      { depth: 0.018, bevelEnabled: false }
    );

    [-1, 1].forEach((side) => {
      const bun = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 14, 14),
        hairMat
      );
      bun.position.set(side * 0.2, 0.03, -0.03);
      bun.castShadow = !isSoftwareGl;
      hairDynamic.add(bun);

      const starClip = new THREE.Mesh(starClipGeo, primaryMat);
      starClip.position.set(side * 0.18, 0.04, 0.08);
      hairDynamic.add(starClip);
    });

    const tiaraBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.018, 8, 20, Math.PI),
      lib.goldMat
    );
    tiaraBand.rotation.x = Math.PI / 2 - 0.32;
    tiaraBand.position.set(0, 0.455, 0.055);
    head.add(tiaraBand);

    const tiaraPeak = new THREE.Mesh(
      new THREE.ConeGeometry(0.062, 0.14, 4),
      lib.goldMat
    );
    tiaraPeak.position.set(0, 0.525, 0.155);
    head.add(tiaraPeak);

    const crownGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.034, 0),
      primaryMat
    );
    crownGem.position.set(0, 0.5, 0.188);
    head.add(crownGem);
  } else {
    hairDynamic.position.set(0, 0.24, -0.1);
    [-1, 1].forEach((side) => {
      const braidGroup = new THREE.Group();
      braidGroup.position.set(side * 0.2, 0, -0.04);
      for (let seg = 0; seg < 4; seg++) {
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.068 - seg * 0.008, 10, 10),
          hairMat
        );
        bead.position.set(side * seg * 0.015, -seg * 0.1, -seg * 0.02);
        braidGroup.add(bead);
      }
      const cuff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.035, 10),
        lib.goldMat
      );
      cuff.position.set(side * 0.04, -0.32, -0.06);
      braidGroup.add(cuff);
      hairDynamic.add(braidGroup);
    });

    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.252, 0.022, 8, 20, Math.PI),
      accentMat
    );
    headband.position.set(0, 0.23, 0);
    head.add(headband);

    [-1, 1].forEach((side) => {
      const earCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.055, 12),
        accentMat
      );
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(side * 0.245, 0.21, 0.01);

      const earPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.078, 0.025, 12),
        soleMat
      );
      earPad.rotation.z = Math.PI / 2;
      earPad.position.set(side * 0.22, 0.21, 0.01);
      head.add(earCup, earPad);
    });
  }

  return {
    root,
    bodyPivot,
    hips,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hairDynamic,
    contactShadow,
  };
}

/**
 * Faceted crystal pink gem (+10 points) using shared geometries & materials.
 */
export function createGemMesh(lib: AssetLibrary): {
  group: THREE.Group;
  crystal: THREE.Mesh;
} {
  const group = new THREE.Group();

  const crystal = new THREE.Mesh(lib.gemCrystalGeo, lib.gemCrystalMat);
  crystal.position.y = 0.62;
  group.add(crystal);

  const ring = new THREE.Mesh(lib.gemRingGeo, lib.gemRingMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.022;
  group.add(ring);

  group.add(lib.makeShadow(0.8, 0.8));

  return { group, crystal };
}

/**
 * Composite 5-12 part 3D Pink-Themed Obstacles using shared materials from AssetLibrary.
 */
export function createObstacleMesh(
  type: ObstacleType,
  lib: AssetLibrary,
  isSoftwareGl: boolean
): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case ObstacleType.MakeupBag: {
      group.add(lib.makeShadow(2.0, 1.3));

      const bagMesh = new THREE.Mesh(lib.makeupBagGeo, lib.bagMat);
      bagMesh.castShadow = !isSoftwareGl;
      bagMesh.receiveShadow = true;
      group.add(bagMesh);

      const zipper = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(1.26, 0.07, 0.14)),
        lib.goldMat
      );
      zipper.position.set(0, 0.98, 0);
      group.add(zipper);

      const pullHeart = new THREE.Mesh(lib.pullHeartGeo, lib.goldMat);
      pullHeart.position.set(0.45, 0.86, 0.38);
      group.add(pullHeart);

      const brushGroup = new THREE.Group();
      brushGroup.position.set(-0.32, 0.88, 0.05);
      brushGroup.rotation.z = 0.42;
      const handle = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.05, 0.04, 0.4, 10)),
        lib.goldMat
      );
      const bristles = new THREE.Mesh(
        lib.trackGeo(new THREE.SphereGeometry(0.13, 10, 10)),
        lib.blushMat
      );
      bristles.position.y = 0.24;
      bristles.scale.set(1.1, 1.25, 0.9);
      brushGroup.add(handle, bristles);
      group.add(brushGroup);

      const frontBow = lib.makeBow(lib.pearlMat, 1.15);
      frontBow.position.set(0, 0.52, 0.42);
      group.add(frontBow);
      break;
    }

    case ObstacleType.GiantHeart: {
      group.add(lib.makeShadow(1.85, 1.2));

      const base = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.62, 0.72, 0.16, 18)),
        lib.goldMat
      );
      base.position.y = 0.08;
      base.castShadow = !isSoftwareGl;
      group.add(base);

      const baseTrim = new THREE.Mesh(
        lib.trackGeo(new THREE.TorusGeometry(0.63, 0.035, 8, 22)),
        lib.pearlMat
      );
      baseTrim.rotation.x = Math.PI / 2;
      baseTrim.position.y = 0.16;
      group.add(baseTrim);

      const mainHeart = new THREE.Mesh(lib.giantHeartGeo, lib.heartGlossMat);
      mainHeart.position.y = 0.6;
      mainHeart.castShadow = !isSoftwareGl;
      group.add(mainHeart);

      [-1, 1].forEach((side) => {
        const mini = new THREE.Mesh(lib.miniHeartGeo, lib.blushMat);
        mini.position.set(side * 0.58, 0.34, 0.05);
        mini.rotation.z = -side * 0.25;
        group.add(mini);
      });
      break;
    }

    case ObstacleType.CompactPalette: {
      group.add(lib.makeShadow(1.9, 1.45));

      const caseBase = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.72, 0.75, 0.18, 20)),
        lib.goldMat
      );
      caseBase.position.y = 0.09;
      caseBase.castShadow = !isSoftwareGl;
      group.add(caseBase);

      const blushPan = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.05, 18)),
        lib.hotPinkMat
      );
      blushPan.position.y = 0.18;
      group.add(blushPan);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0.18, -0.66);
      lidPivot.rotation.x = -0.95;

      const lidOuter = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.72, 0.72, 0.09, 20)),
        lib.goldMat
      );
      lidOuter.position.set(0, 0.04, 0.66);
      lidOuter.castShadow = !isSoftwareGl;

      const mirrorFace = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.58, 0.58, 0.02, 18)),
        lib.mirrorMat
      );
      mirrorFace.position.set(0, -0.005, 0.66);
      lidPivot.add(lidOuter, mirrorFace);
      group.add(lidPivot);

      const puff = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 14)),
        lib.pearlMat
      );
      puff.position.set(0.38, 0.24, 0.25);
      puff.rotation.z = -0.15;
      group.add(puff);
      break;
    }

    case ObstacleType.PinkBarrier: {
      const postX = 1.02;
      const baseGeo = lib.trackGeo(
        new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12)
      );
      const postGeo = lib.trackGeo(
        new THREE.CylinderGeometry(0.065, 0.075, 2.35, 10)
      );
      const finialGeo = lib.trackGeo(new THREE.OctahedronGeometry(0.14, 0));

      [-1, 1].forEach((side) => {
        const shadow = lib.makeShadow(0.55, 0.55);
        shadow.position.x = side * postX;
        group.add(shadow);

        const base = new THREE.Mesh(baseGeo, lib.goldMat);
        base.position.set(side * postX, 0.06, 0);

        const post = new THREE.Mesh(postGeo, lib.goldMat);
        post.position.set(side * postX, 1.2, 0);
        post.castShadow = !isSoftwareGl;

        const finial = new THREE.Mesh(finialGeo, lib.hotPinkMat);
        finial.position.set(side * postX, 2.48, 0);

        group.add(base, post, finial);
      });

      const board = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(2.12, 0.96, 0.22)),
        lib.barrierBoardMat
      );
      board.position.set(0, 1.72, 0);
      board.castShadow = !isSoftwareGl;
      group.add(board);

      const centerBow = lib.makeBow(lib.hotPinkMat, 1.45);
      centerBow.position.set(0, 1.72, 0.15);
      group.add(centerBow);
      break;
    }

    case ObstacleType.HangingDecor: {
      const archX = 1.05;
      const pillarGeo = lib.trackGeo(
        new THREE.CylinderGeometry(0.07, 0.09, 2.95, 10)
      );
      const ringGeo = lib.trackGeo(new THREE.TorusGeometry(0.1, 0.025, 6, 12));

      [-1, 1].forEach((side) => {
        const shadow = lib.makeShadow(0.55, 0.55);
        shadow.position.x = side * archX;
        group.add(shadow);

        const pillar = new THREE.Mesh(pillarGeo, lib.pearlMat);
        pillar.position.set(side * archX, 1.475, 0);
        pillar.castShadow = !isSoftwareGl;

        const goldRing = new THREE.Mesh(ringGeo, lib.goldMat);
        goldRing.rotation.x = Math.PI / 2;
        goldRing.position.set(side * archX, 2.8, 0);

        group.add(pillar, goldRing);
      });

      const topBeam = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(2.3, 0.32, 0.32)),
        lib.hotPinkMat
      );
      topBeam.position.set(0, 2.88, 0);
      topBeam.castShadow = !isSoftwareGl;
      group.add(topBeam);

      const rosetteGeo = lib.trackGeo(new THREE.SphereGeometry(0.2, 10, 10));
      const cordGeo = lib.trackGeo(
        new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6)
      );

      [-0.62, 0, 0.62].forEach((xOffset, idx) => {
        const rosette = new THREE.Mesh(
          rosetteGeo,
          idx === 1 ? lib.pearlMat : lib.blushMat
        );
        rosette.position.set(xOffset, 2.88, 0.14);
        group.add(rosette);

        const cord = new THREE.Mesh(cordGeo, lib.goldMat);
        cord.position.set(xOffset, 2.18, 0);
        group.add(cord);

        const heartDrop = new THREE.Mesh(
          lib.ornamentHeartGeo,
          idx === 1 ? lib.hotPinkMat : lib.blushMat
        );
        heartDrop.position.set(xOffset, 1.44, 0);
        heartDrop.castShadow = !isSoftwareGl;
        group.add(heartDrop);
      });

      const valance = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(2.04, 0.95, 0.16)),
        lib.blushMat
      );
      valance.position.set(0, 2.28, 0);
      group.add(valance);
      break;
    }

    case ObstacleType.GiantMakeup: {
      group.add(lib.makeShadow(1.95, 1.35));

      const plinth = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(1.65, 0.18, 0.9)),
        lib.pearlMat
      );
      plinth.position.y = 0.09;
      plinth.castShadow = !isSoftwareGl;
      group.add(plinth);

      const lipGroup = new THREE.Group();
      lipGroup.position.set(-0.36, 0.18, 0);

      const outerCase = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(0.56, 0.82, 0.56)),
        lib.darkVelvetMat
      );
      outerCase.position.y = 0.41;
      outerCase.castShadow = !isSoftwareGl;

      const goldCollar = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.25, 0.25, 0.48, 14)),
        lib.goldMat
      );
      goldCollar.position.y = 1.06;

      const bullet = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.21, 0.22, 0.58, 14)),
        lib.hotPinkMat
      );
      bullet.position.y = 1.54;
      bullet.castShadow = !isSoftwareGl;

      const tip = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.04, 0.21, 0.22, 14)),
        lib.hotPinkMat
      );
      tip.position.y = 1.88;
      tip.rotation.x = 0.28;

      lipGroup.add(outerCase, goldCollar, bullet, tip);
      group.add(lipGroup);

      const perfGroup = new THREE.Group();
      perfGroup.position.set(0.4, 0.18, 0.04);

      const bottle = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(0.62, 1.08, 0.44)),
        lib.bottleMat
      );
      bottle.position.y = 0.54;
      bottle.castShadow = !isSoftwareGl;

      const neckGold = new THREE.Mesh(
        lib.trackGeo(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 12)),
        lib.goldMat
      );
      neckGold.position.y = 1.18;

      const stopper = new THREE.Mesh(
        lib.trackGeo(new THREE.OctahedronGeometry(0.24, 0)),
        lib.pearlMat
      );
      stopper.position.y = 1.48;

      const neckBow = lib.makeBow(lib.hotPinkMat, 0.95);
      neckBow.position.set(0, 1.15, 0.2);

      perfGroup.add(bottle, neckGold, stopper, neckBow);
      group.add(perfGroup);
      break;
    }

    case ObstacleType.PinkWall: {
      group.add(lib.makeShadow(2.2, 1.35));

      const wallBody = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(1.88, 3.45, 0.85)),
        lib.blushMat
      );
      wallBody.position.y = 1.725;
      wallBody.castShadow = !isSoftwareGl;
      wallBody.receiveShadow = true;
      group.add(wallBody);

      const inset = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(1.38, 2.7, 0.9)),
        lib.hotPinkMat
      );
      inset.position.y = 1.72;
      group.add(inset);

      const colGeo = lib.trackGeo(
        new THREE.CylinderGeometry(0.16, 0.18, 3.55, 10)
      );
      const capGeo = lib.trackGeo(new THREE.BoxGeometry(0.42, 0.18, 0.96));

      [-1, 1].forEach((side) => {
        const col = new THREE.Mesh(colGeo, lib.pearlMat);
        col.position.set(side * 0.88, 1.775, 0);
        col.castShadow = !isSoftwareGl;

        const cap = new THREE.Mesh(capGeo, lib.goldMat);
        cap.position.set(side * 0.88, 3.56, 0);
        group.add(col, cap);
      });

      const cornice = new THREE.Mesh(
        lib.trackGeo(new THREE.BoxGeometry(2.12, 0.26, 1.02)),
        lib.goldMat
      );
      cornice.position.y = 3.62;
      group.add(cornice);

      const crest = new THREE.Mesh(lib.crestHeartGeo, lib.pearlMat);
      crest.position.set(0, 1.85, 0.44);
      group.add(crest);
      break;
    }
  }

  return group;
}

/**
 * Creates a flanking outdoor Pink Paradise scenery prop using shared materials.
 */
export function createSceneryProp(
  variant: "tree" | "lamp" | "spire",
  lib: AssetLibrary,
  isSoftwareGl: boolean
): THREE.Group {
  const group = new THREE.Group();

  if (variant === "tree") {
    const trunk = new THREE.Mesh(
      lib.trackGeo(new THREE.CylinderGeometry(0.18, 0.32, 2.1, 8)),
      lib.trunkMat
    );
    trunk.position.y = 1.05;
    trunk.castShadow = !isSoftwareGl;
    group.add(trunk);

    const offsets: [number, number, number, number][] = [
      [0, 2.55, 0, 1.15],
      [-0.65, 2.2, 0.3, 0.82],
      [0.68, 2.25, -0.25, 0.85],
      [0.15, 2.95, 0.35, 0.78],
    ];
    offsets.forEach(([ox, oy, oz, rad], idx) => {
      const puff = new THREE.Mesh(
        lib.trackGeo(new THREE.IcosahedronGeometry(rad, 1)),
        lib.canopyMats[idx % lib.canopyMats.length]
      );
      puff.position.set(ox, oy, oz);
      group.add(puff);
    });
  } else if (variant === "lamp") {
    const base = new THREE.Mesh(
      lib.trackGeo(new THREE.CylinderGeometry(0.16, 0.24, 0.25, 10)),
      lib.goldMat
    );
    base.position.y = 0.125;
    const pole = new THREE.Mesh(
      lib.trackGeo(new THREE.CylinderGeometry(0.055, 0.075, 3.1, 8)),
      lib.goldMat
    );
    pole.position.y = 1.65;
    const lantern = new THREE.Mesh(
      lib.trackGeo(new THREE.SphereGeometry(0.26, 10, 10)),
      lib.lanternMat
    );
    lantern.position.y = 3.32;
    group.add(base, pole, lantern);
  } else {
    const tower = new THREE.Mesh(
      lib.trackGeo(new THREE.CylinderGeometry(1.1, 1.4, 6.5, 10)),
      lib.spireTowerMat
    );
    tower.position.y = 3.25;
    const roof = new THREE.Mesh(
      lib.trackGeo(new THREE.ConeGeometry(1.45, 3.2, 10)),
      lib.spireRoofMat
    );
    roof.position.y = 8.1;
    group.add(tower, roof);
  }

  return group;
}
