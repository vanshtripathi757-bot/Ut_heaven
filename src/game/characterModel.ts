import * as THREE from 'three';
import { CharacterKinematicsState } from './rules';
import { AcademyTextureLibrary } from './textures';

export interface StudentHumanoidRig {
  root: THREE.Group;
  scaleGroup: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  headGroup: THREE.Group;
  eyelidLeft: THREE.Mesh;
  eyelidRight: THREE.Mesh;
  hairBackLeft: THREE.Group;
  hairBackRight: THREE.Group;
  hairSideLeft: THREE.Group;
  hairSideRight: THREE.Group;
  ribbonLeft: THREE.Mesh;
  ribbonRight: THREE.Mesh;
  skirtGroup: THREE.Group;
  leftShoulder: THREE.Group;
  leftForeArm: THREE.Group;
  rightShoulder: THREE.Group;
  rightForeArm: THREE.Group;
  leftHip: THREE.Group;
  leftShin: THREE.Group;
  rightHip: THREE.Group;
  rightShin: THREE.Group;
  contactShadowMesh: THREE.Mesh;
  lastStepPhase: number;
}

/**
 * Builds the 3D Anime Student Character ("Haruka Aoyama") with:
 * - Complete articulated humanoid rig (Pelvis, Torso, Neck, Head, Upper/Lower Arms, Thighs/Shins/Feet)
 * - Detailed anime facial features (sculpted chin/cheeks, dual-iris eyes with specular catchlights, eyelashes, blinking eyelids, nose, soft smile)
 * - Multi-layered anime hair (voluminous crown, 5 sculpted front/side bangs, twin articulated back hair locks)
 * - Aoyama Academy Sailor Blazer Uniform (navy blazer, white sailor collar with double stripes, crimson silk ribbon bow, 16-pleat skirt, white knee-high socks, brown leather loafers)
 */
export function buildAnimeStudentCharacter(textures: AcademyTextureLibrary): StudentHumanoidRig {
  const root = new THREE.Group();
  root.name = 'Haruka_Aoyama_Student_Root';

  const scaleGroup = new THREE.Group();
  root.add(scaleGroup);

  // Soft radial ground contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.55, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadowMesh.position.y = 0.015;
  root.add(contactShadowMesh);

  // Shared anime-hybrid materials (cel-inspired smooth shading with calibrated roughness contrast)
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffe5d4,
    roughness: 0.68,
    metalness: 0.02,
    emissive: 0x2b130c,
    emissiveIntensity: 0.08,
  });

  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xfb7185,
    transparent: true,
    opacity: 0.28,
  });

  const navyUniformMat = new THREE.MeshStandardMaterial({
    color: 0x1b2845,
    roughness: 0.76,
    metalness: 0.06,
  });

  const whiteCollarMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.55,
    metalness: 0.02,
  });

  const crimsonRibbonMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.38,
    metalness: 0.12,
  });

  const goldButtonMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.22,
    metalness: 0.85,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x2b2438, // Deep midnight chestnut-indigo anime hair
    roughness: 0.34,
    metalness: 0.18,
  });

  const hairHighlightMat = new THREE.MeshStandardMaterial({
    color: 0x4c3f63,
    roughness: 0.25,
    metalness: 0.25,
  });

  const sockMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.65,
    metalness: 0.02,
  });

  const loaferMat = new THREE.MeshStandardMaterial({
    color: 0x3b2318,
    roughness: 0.24,
    metalness: 0.15,
  });

  // ── 1. PELVIS & 16-PLEAT ACADEMY SKIRT ───────────────────────────────────
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.86, 0);
  scaleGroup.add(pelvis);

  const skirtGroup = new THREE.Group();
  skirtGroup.position.set(0, 0.04, 0);
  pelvis.add(skirtGroup);

  // Waistband
  const waistGeo = new THREE.CylinderGeometry(0.145, 0.155, 0.05, 20);
  const waistMesh = new THREE.Mesh(waistGeo, navyUniformMat);
  waistMesh.position.y = 0.02;
  waistMesh.castShadow = true;
  skirtGroup.add(waistMesh);

  // 16 distinct box pleats around the skirt cone
  const pleatCount = 16;
  const pleatGeo = new THREE.BoxGeometry(0.058, 0.25, 0.032);
  for (let i = 0; i < pleatCount; i++) {
    const angle = (i / pleatCount) * Math.PI * 2;
    const pleat = new THREE.Mesh(pleatGeo, navyUniformMat);
    const radius = 0.165;
    pleat.position.set(Math.sin(angle) * radius, -0.1, Math.cos(angle) * radius);
    pleat.rotation.y = angle + 0.08;
    pleat.rotation.x = 0.22; // Flared A-line silhouette
    pleat.castShadow = true;
    pleat.receiveShadow = true;
    skirtGroup.add(pleat);
  }

  // White hem trim line on skirt
  const skirtHemGeo = new THREE.TorusGeometry(0.21, 0.006, 8, 28);
  skirtHemGeo.rotateX(Math.PI / 2);
  const skirtHem = new THREE.Mesh(skirtHemGeo, whiteCollarMat);
  skirtHem.position.y = -0.205;
  skirtGroup.add(skirtHem);

  // ── 2. TORSO, CHEST, SAILOR COLLAR & CRIMSON RIBBON ──────────────────────
  const torso = new THREE.Group();
  torso.position.set(0, 0.03, 0);
  pelvis.add(torso);

  const chest = new THREE.Group();
  chest.position.set(0, 0.16, 0);
  torso.add(chest);

  // Sculpted blazer torso using Lathe profile
  const blazerPoints = [
    new THREE.Vector2(0.132, -0.16),
    new THREE.Vector2(0.118, -0.02),
    new THREE.Vector2(0.138, 0.12),
    new THREE.Vector2(0.145, 0.21),
    new THREE.Vector2(0.055, 0.235),
  ];
  const blazerGeo = new THREE.LatheGeometry(blazerPoints, 24);
  blazerGeo.scale(1.04, 1, 0.76);
  const blazerMesh = new THREE.Mesh(blazerGeo, navyUniformMat);
  blazerMesh.castShadow = true;
  blazerMesh.receiveShadow = true;
  chest.add(blazerMesh);

  // White dress shirt front V-placket (-Z is forward)
  const shirtGeo = new THREE.CylinderGeometry(0.06, 0.02, 0.14, 12);
  shirtGeo.scale(1.1, 1, 0.45);
  const shirtMesh = new THREE.Mesh(shirtGeo, whiteCollarMat);
  shirtMesh.position.set(0, 0.16, -0.082);
  chest.add(shirtMesh);

  // Sailor Collar (Seifuku back flap + crisp navy/white V-collar)
  const backCollarGeo = new THREE.BoxGeometry(0.26, 0.16, 0.018);
  const backCollar = new THREE.Mesh(backCollarGeo, whiteCollarMat);
  backCollar.position.set(0, 0.14, 0.102);
  backCollar.rotation.x = 0.14;
  backCollar.castShadow = true;
  chest.add(backCollar);

  // Navy stripe on back sailor collar
  const collarStripeGeo = new THREE.BoxGeometry(0.24, 0.014, 0.021);
  const collarStripe = new THREE.Mesh(collarStripeGeo, navyUniformMat);
  collarStripe.position.set(0, 0.08, 0.112);
  collarStripe.rotation.x = 0.14;
  chest.add(collarStripe);

  // Left & Right front sailor lapels meeting neatly at the crimson bow
  const lapelGeo = new THREE.BoxGeometry(0.048, 0.15, 0.022);
  const leftLapel = new THREE.Mesh(lapelGeo, whiteCollarMat);
  leftLapel.position.set(-0.042, 0.15, -0.092);
  leftLapel.rotation.z = -0.34;
  leftLapel.rotation.x = -0.18;
  chest.add(leftLapel);

  const rightLapel = new THREE.Mesh(lapelGeo, whiteCollarMat);
  rightLapel.position.set(0.042, 0.15, -0.092);
  rightLapel.rotation.z = 0.34;
  rightLapel.rotation.x = -0.18;
  chest.add(rightLapel);

  // Gold Academy Buttons & Pocket Crest
  for (let b = 0; b < 2; b++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 12), goldButtonMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, -0.015 - b * 0.065, -0.098);
    chest.add(btn);
  }
  const crestBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.008, 6), goldButtonMat);
  crestBadge.rotation.x = Math.PI / 2;
  crestBadge.position.set(-0.072, 0.075, -0.098);
  chest.add(crestBadge);

  // Crimson Silk Bow Ribbon at Collar V-point
  const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), crimsonRibbonMat);
  bowKnot.position.set(0, 0.092, -0.106);
  chest.add(bowKnot);

  const bowLoopGeo = new THREE.ConeGeometry(0.024, 0.058, 10);
  const leftBowLoop = new THREE.Mesh(bowLoopGeo, crimsonRibbonMat);
  leftBowLoop.rotation.z = -Math.PI / 2 - 0.18;
  leftBowLoop.position.set(-0.03, 0.096, -0.106);
  chest.add(leftBowLoop);

  const rightBowLoop = new THREE.Mesh(bowLoopGeo, crimsonRibbonMat);
  rightBowLoop.rotation.z = Math.PI / 2 + 0.18;
  rightBowLoop.position.set(0.03, 0.096, -0.106);
  chest.add(rightBowLoop);

  const ribbonTailGeo = new THREE.BoxGeometry(0.022, 0.105, 0.008);
  ribbonTailGeo.translate(0, -0.05, 0);
  const ribbonLeft = new THREE.Mesh(ribbonTailGeo, crimsonRibbonMat);
  ribbonLeft.position.set(-0.012, 0.088, -0.108);
  ribbonLeft.rotation.z = 0.2;
  chest.add(ribbonLeft);

  const ribbonRight = new THREE.Mesh(ribbonTailGeo, crimsonRibbonMat);
  ribbonRight.position.set(0.012, 0.088, -0.108);
  ribbonRight.rotation.z = -0.2;
  chest.add(ribbonRight);

  // ── 3. NECK, SCULPTED ANIME HEAD, EXPRESSIVE EYES & LAYERED HAIR ─────────
  const neck = new THREE.Group();
  neck.position.set(0, 0.23, 0);
  chest.add(neck);

  const neckCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.075, 14), skinMat);
  neckCyl.position.y = 0.025;
  neck.add(neckCyl);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.06, 0);
  neck.add(headGroup);

  // Sculpted Anime Head (soft anime chin & cheeks)
  const headPoints = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.052, 0.02),
    new THREE.Vector2(0.102, 0.072),
    new THREE.Vector2(0.125, 0.14),
    new THREE.Vector2(0.124, 0.21),
    new THREE.Vector2(0.102, 0.27),
    new THREE.Vector2(0.055, 0.302),
    new THREE.Vector2(0.001, 0.31),
  ];
  const headGeo = new THREE.LatheGeometry(headPoints, 28);
  headGeo.scale(1.0, 1.0, 0.94);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Delicate Anime Nose (-Z forward)
  const noseGeo = new THREE.ConeGeometry(0.009, 0.022, 8);
  noseGeo.rotateX(-Math.PI / 2 + 0.2);
  const noseMesh = new THREE.Mesh(noseGeo, skinMat);
  noseMesh.position.set(0, 0.112, -0.118);
  headGroup.add(noseMesh);

  // Subtle Anime Smile Line
  const mouthGeo = new THREE.TorusGeometry(0.015, 0.0026, 8, 16, Math.PI * 0.78);
  mouthGeo.rotateX(Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xd96b70 });
  const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
  mouthMesh.position.set(0, 0.078, -0.111);
  headGroup.add(mouthMesh);

  // Cheek Blush Ovals
  const blushGeo = new THREE.CircleGeometry(0.02, 14);
  blushGeo.scale(1.35, 0.72, 1);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-0.066, 0.106, -0.104);
  leftBlush.rotation.y = Math.PI - 0.35;
  headGroup.add(leftBlush);

  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.066, 0.106, -0.104);
  rightBlush.rotation.y = Math.PI + 0.35;
  headGroup.add(rightBlush);

  // Large Expressive Anime Eyes (curved onto front -Z face surface)
  const eyeGeo = new THREE.PlaneGeometry(0.052, 0.058, 6, 6);
  const eyePos = eyeGeo.attributes.position;
  for (let i = 0; i < eyePos.count; i++) {
    const ex = eyePos.getX(i);
    const ey = eyePos.getY(i);
    eyePos.setZ(i, -(ex * ex + ey * ey) * 1.6);
  }
  eyeGeo.computeVertexNormals();

  const leftEyeMat = new THREE.MeshBasicMaterial({
    map: textures.animeEyeLeft,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const rightEyeMat = new THREE.MeshBasicMaterial({
    map: textures.animeEyeRight,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const leftEye = new THREE.Mesh(eyeGeo, leftEyeMat);
  leftEye.position.set(-0.046, 0.138, -0.112);
  leftEye.rotation.y = Math.PI - 0.22;
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
  rightEye.position.set(0.046, 0.138, -0.112);
  rightEye.rotation.y = Math.PI + 0.22;
  headGroup.add(rightEye);

  // Blinking Eyelids
  const eyelidGeo = new THREE.PlaneGeometry(0.054, 0.06);
  eyelidGeo.translate(0, -0.03, 0);
  const eyelidLeft = new THREE.Mesh(eyelidGeo, skinMat);
  eyelidLeft.position.set(-0.046, 0.168, -0.114);
  eyelidLeft.rotation.y = Math.PI - 0.22;
  eyelidLeft.scale.y = 0.02;
  headGroup.add(eyelidLeft);

  const eyelidRight = new THREE.Mesh(eyelidGeo, skinMat);
  eyelidRight.position.set(0.046, 0.168, -0.114);
  eyelidRight.rotation.y = Math.PI + 0.22;
  eyelidRight.scale.y = 0.02;
  headGroup.add(eyelidRight);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.044, 0.005, 0.005);
  const leftBrow = new THREE.Mesh(browGeo, hairMat);
  leftBrow.position.set(-0.048, 0.182, -0.111);
  leftBrow.rotation.z = -0.06;
  leftBrow.rotation.y = -0.22;
  headGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, hairMat);
  rightBrow.position.set(0.048, 0.182, -0.111);
  rightBrow.rotation.z = 0.06;
  rightBrow.rotation.y = 0.22;
  headGroup.add(rightBrow);

  // ── MULTI-LAYERED ANIME HAIR SCULPT ──────────────────────────────────────
  // Full cranial hair cap tilted backward so the front edge sits high on the forehead above the eyes
  const hairCrownGeo = new THREE.SphereGeometry(0.134, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.64);
  hairCrownGeo.scale(1.03, 1.05, 0.98);
  const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
  hairCrown.position.set(0, 0.182, 0.014);
  hairCrown.rotation.x = -0.34;
  hairCrown.castShadow = true;
  headGroup.add(hairCrown);

  // Specular angel-ring hair highlight band
  const haloGeo = new THREE.TorusGeometry(0.129, 0.005, 8, 24, Math.PI * 0.75);
  haloGeo.rotateX(Math.PI / 2 + 0.15);
  haloGeo.rotateZ(Math.PI * 0.62);
  const haloHighlight = new THREE.Mesh(haloGeo, hairHighlightMat);
  haloHighlight.position.set(0, 0.232, 0.006);
  headGroup.add(haloHighlight);

  // 5 Sculpted Front Bang Strands framing forehead above the eyebrows
  const bangConfigs = [
    { x: 0.0, y: 0.268, z: -0.114, rx: 0.18, rz: 0.0, w: 0.028, h: 0.088 },
    { x: -0.036, y: 0.265, z: -0.11, rx: 0.16, rz: 0.12, w: 0.032, h: 0.092 },
    { x: 0.036, y: 0.265, z: -0.11, rx: 0.16, rz: -0.12, w: 0.032, h: 0.092 },
    { x: -0.074, y: 0.255, z: -0.094, rx: 0.12, rz: 0.24, w: 0.034, h: 0.11 },
    { x: 0.074, y: 0.255, z: -0.094, rx: 0.12, rz: -0.24, w: 0.034, h: 0.11 },
  ];
  bangConfigs.forEach((b) => {
    const strandGeo = new THREE.ConeGeometry(b.w, b.h, 10);
    strandGeo.scale(1, 1, 0.42);
    strandGeo.rotateX(Math.PI);
    strandGeo.translate(0, -b.h * 0.45, 0);
    const strand = new THREE.Mesh(strandGeo, hairMat);
    strand.position.set(b.x, b.y, b.z);
    strand.rotation.set(b.rx, 0, b.rz);
    strand.castShadow = true;
    headGroup.add(strand);
  });

  // Subtle Top Ahoge (expressive anime crown hair lock)
  const ahogeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.305, 0.01),
    new THREE.Vector3(0.018, 0.348, 0.0),
    new THREE.Vector3(-0.015, 0.368, -0.015),
  ]);
  const ahogeGeo = new THREE.TubeGeometry(ahogeCurve, 10, 0.007, 6, false);
  const ahogeMesh = new THREE.Mesh(ahogeGeo, hairMat);
  headGroup.add(ahogeMesh);

  // Articulated Side Hair Locks (framing cheeks down to collarbones)
  function createHairLock(width: number, length: number, curveZ: number): THREE.Group {
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -length * 0.48, curveZ * 0.4),
      new THREE.Vector3(0, -length, curveZ),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 12, width, 8, false);
    tubeGeo.scale(1.1, 1, 0.55);
    const mesh = new THREE.Mesh(tubeGeo, hairMat);
    mesh.castShadow = true;
    g.add(mesh);

    const tipGeo = new THREE.ConeGeometry(width * 0.95, 0.07, 8);
    tipGeo.scale(1.1, 1, 0.55);
    tipGeo.rotateX(Math.PI);
    const tip = new THREE.Mesh(tipGeo, hairMat);
    tip.position.set(0, -length - 0.025, curveZ);
    g.add(tip);
    return g;
  }

  const hairSideLeft = createHairLock(0.026, 0.25, -0.018);
  hairSideLeft.position.set(-0.118, 0.21, -0.032);
  headGroup.add(hairSideLeft);

  const hairSideRight = createHairLock(0.026, 0.25, -0.018);
  hairSideRight.position.set(0.118, 0.21, -0.032);
  headGroup.add(hairSideRight);

  // Articulated Twin Flowing Back Hair Clusters
  const hairBackLeft = createHairLock(0.052, 0.42, 0.045);
  hairBackLeft.position.set(-0.068, 0.21, 0.095);
  headGroup.add(hairBackLeft);

  const hairBackRight = createHairLock(0.052, 0.42, 0.045);
  hairBackRight.position.set(0.068, 0.21, 0.095);
  headGroup.add(hairBackRight);

  // Center back hair layer
  const hairBackCenter = createHairLock(0.065, 0.39, 0.035);
  hairBackCenter.position.set(0, 0.21, 0.105);
  headGroup.add(hairBackCenter);

  // ── 4. ARMS (ROUNDED SHOULDER CAPS, UPPER ARMS, FOREARMS, HANDS) ─────────
  function createArmHierarchy(isLeft: boolean): { shoulder: THREE.Group; foreArm: THREE.Group } {
    const sign = isLeft ? -1 : 1;
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * 0.158, 0.195, 0);
    chest.add(shoulder);

    // Rounded shoulder cap so sleeve top never looks boxy
    const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), navyUniformMat);
    capMesh.castShadow = true;
    shoulder.add(capMesh);

    // Blazer sleeve & upper arm
    const upperGeo = new THREE.CylinderGeometry(0.042, 0.036, 0.22, 12);
    upperGeo.translate(0, -0.11, 0);
    const upperMesh = new THREE.Mesh(upperGeo, navyUniformMat);
    upperMesh.castShadow = true;
    shoulder.add(upperMesh);

    const foreArm = new THREE.Group();
    foreArm.position.set(0, -0.22, 0);
    shoulder.add(foreArm);

    // Lower blazer sleeve + white cuff
    const lowerGeo = new THREE.CylinderGeometry(0.037, 0.032, 0.19, 12);
    lowerGeo.translate(0, -0.095, 0);
    const lowerMesh = new THREE.Mesh(lowerGeo, navyUniformMat);
    lowerMesh.castShadow = true;
    foreArm.add(lowerMesh);

    const cuffGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.028, 12);
    const cuffMesh = new THREE.Mesh(cuffGeo, whiteCollarMat);
    cuffMesh.position.y = -0.185;
    foreArm.add(cuffMesh);

    // Sculpted Hand + Thumb
    const handGeo = new THREE.SphereGeometry(0.03, 12, 10);
    handGeo.scale(0.85, 1.25, 0.65);
    const handMesh = new THREE.Mesh(handGeo, skinMat);
    handMesh.position.set(0, -0.225, 0);
    handMesh.castShadow = true;
    foreArm.add(handMesh);

    return { shoulder, foreArm };
  }

  const leftArm = createArmHierarchy(true);
  const rightArm = createArmHierarchy(false);

  // ── 5. LEGS (HIPS, THIGHS, SHINS, KNEE-HIGH SOCKS & LOAFERS) ─────────────
  function createLegHierarchy(isLeft: boolean): { hip: THREE.Group; shin: THREE.Group } {
    const sign = isLeft ? -1 : 1;
    const hip = new THREE.Group();
    hip.position.set(sign * 0.082, -0.04, 0);
    pelvis.add(hip);

    // Upper thigh (skin)
    const thighGeo = new THREE.CylinderGeometry(0.056, 0.044, 0.38, 14);
    thighGeo.translate(0, -0.19, 0);
    const thighMesh = new THREE.Mesh(thighGeo, skinMat);
    thighMesh.castShadow = true;
    hip.add(thighMesh);

    // Knee joint sphere
    const kneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.043, 12, 10), skinMat);
    kneeMesh.position.y = -0.38;
    hip.add(kneeMesh);

    const shin = new THREE.Group();
    shin.position.set(0, -0.38, 0);
    hip.add(shin);

    // Upper calf (skin) + Knee-high white sock
    const calfSkinGeo = new THREE.CylinderGeometry(0.043, 0.041, 0.09, 14);
    calfSkinGeo.translate(0, -0.045, 0);
    const calfSkinMesh = new THREE.Mesh(calfSkinGeo, skinMat);
    shin.add(calfSkinMesh);

    const sockGeo = new THREE.CylinderGeometry(0.042, 0.032, 0.31, 14);
    sockGeo.translate(0, -0.24, 0);
    const sockMesh = new THREE.Mesh(sockGeo, sockMat);
    sockMesh.castShadow = true;
    shin.add(sockMesh);

    // Polished Brown School Loafer (heel + sole + rounded toe box + strap)
    const loaferGroup = new THREE.Group();
    loaferGroup.position.set(0, -0.41, -0.032);
    shin.add(loaferGroup);

    const shoeBodyGeo = new THREE.BoxGeometry(0.076, 0.048, 0.165);
    const shoeBody = new THREE.Mesh(shoeBodyGeo, loaferMat);
    shoeBody.position.y = 0.012;
    shoeBody.castShadow = true;
    loaferGroup.add(shoeBody);

    const toeCapGeo = new THREE.SphereGeometry(0.039, 12, 10);
    toeCapGeo.scale(1.0, 0.65, 1.25);
    const toeCap = new THREE.Mesh(toeCapGeo, loaferMat);
    toeCap.position.set(0, 0.008, -0.065);
    loaferGroup.add(toeCap);

    return { hip, shin };
  }

  const leftLeg = createLegHierarchy(true);
  const rightLeg = createLegHierarchy(false);

  return {
    root,
    scaleGroup,
    pelvis,
    torso,
    chest,
    neck,
    headGroup,
    eyelidLeft,
    eyelidRight,
    hairBackLeft,
    hairBackRight,
    hairSideLeft,
    hairSideRight,
    ribbonLeft,
    ribbonRight,
    skirtGroup,
    leftShoulder: leftArm.shoulder,
    leftForeArm: leftArm.foreArm,
    rightShoulder: rightArm.shoulder,
    rightForeArm: rightArm.foreArm,
    leftHip: leftLeg.hip,
    leftShin: leftLeg.shin,
    rightHip: rightLeg.hip,
    rightShin: rightLeg.shin,
    contactShadowMesh,
    lastStepPhase: 0,
  };
}

/**
 * Updates skeletal bone rotations, secondary hair/skirt physics, and facial blinking.
 */
export function updateCharacterAnimation(
  rig: StudentHumanoidRig,
  state: CharacterKinematicsState,
  elapsed: number,
  isFirstPerson: boolean,
  onFootstep?: (isRunning: boolean) => void
): void {
  rig.root.position.set(state.x, state.y, state.z);
  rig.root.rotation.y = state.yaw;
  rig.scaleGroup.scale.set(state.squashX, state.squashY, state.squashX);

  // Keep contact shadow anchored on the ground plane
  rig.contactShadowMesh.position.y = -state.y + 0.015;
  const shadowScale = Math.max(0.45, 1 - state.y * 0.28);
  rig.contactShadowMesh.scale.setScalar(shadowScale);

  // Hide local character mesh in First-Person mode so body/neck/hair never clip into the camera frustum
  rig.scaleGroup.visible = !isFirstPerson;
  rig.contactShadowMesh.visible = !isFirstPerson;

  // Periodic natural eye blink every ~3.8 seconds
  const blinkCycle = elapsed % 3.8;
  const blinkWeight =
    blinkCycle < 0.14 ? Math.sin((blinkCycle / 0.14) * Math.PI) : 0.02;
  rig.eyelidLeft.scale.y = Math.max(0.02, blinkWeight);
  rig.eyelidRight.scale.y = Math.max(0.02, blinkWeight);

  if (state.gait === 'jump') {
    // Expressive mid-air pose
    rig.pelvis.position.y = 0.86;
    rig.torso.rotation.x = -0.12;
    rig.leftHip.rotation.x = 0.48;
    rig.leftShin.rotation.x = -0.82;
    rig.rightHip.rotation.x = -0.28;
    rig.rightShin.rotation.x = -0.55;

    rig.leftShoulder.rotation.x = -0.55;
    rig.leftShoulder.rotation.z = 0.28;
    rig.leftForeArm.rotation.x = 0.45;
    rig.rightShoulder.rotation.x = -0.55;
    rig.rightShoulder.rotation.z = -0.28;
    rig.rightForeArm.rotation.x = 0.45;

    // Hair floats upward slightly when descending
    const airSway = Math.max(-0.1, Math.min(0.55, -state.vy * 0.06 + 0.25));
    rig.hairBackLeft.rotation.x = airSway;
    rig.hairBackRight.rotation.x = airSway;
    rig.skirtGroup.rotation.x = airSway * 0.35;
    return;
  }

  if (state.gait === 'walk' || state.gait === 'run') {
    const isRun = state.gait === 'run';
    const phase = state.gaitDistance;
    const sinP = Math.sin(phase);
    const cosP = Math.cos(phase);

    // Trigger footstep audio on zero-crossings of sin(phase)
    const stepIndex = Math.floor(phase / Math.PI);
    if (stepIndex !== rig.lastStepPhase) {
      rig.lastStepPhase = stepIndex;
      onFootstep?.(isRun);
    }

    const strideAmp = isRun ? 0.78 : 0.46;
    const kneeAmp = isRun ? 0.95 : 0.52;
    const bobAmp = isRun ? 0.048 : 0.024;

    rig.pelvis.position.y = 0.86 + Math.abs(cosP) * bobAmp;
    rig.torso.rotation.x = isRun ? -0.16 : -0.05;
    rig.torso.rotation.y = sinP * (isRun ? 0.14 : 0.08);
    rig.headGroup.rotation.y = -sinP * 0.06;

    // Left & Right Leg Swing (-X rotation swings leg forward in -Z direction)
    rig.leftHip.rotation.x = sinP * strideAmp;
    rig.rightHip.rotation.x = -sinP * strideAmp;

    rig.leftShin.rotation.x = -Math.max(0, -cosP) * kneeAmp - 0.08;
    rig.rightShin.rotation.x = -Math.max(0, cosP) * kneeAmp - 0.08;

    // Counter-swinging Arms
    const armAmp = isRun ? 0.72 : 0.38;
    rig.leftShoulder.rotation.x = -sinP * armAmp;
    rig.leftShoulder.rotation.z = 0.1;
    rig.leftForeArm.rotation.x = isRun ? 0.65 + cosP * 0.2 : 0.22;

    rig.rightShoulder.rotation.x = sinP * armAmp;
    rig.rightShoulder.rotation.z = -0.1;
    rig.rightForeArm.rotation.x = isRun ? 0.65 - cosP * 0.2 : 0.22;

    // Secondary Hair, Ribbon & Pleated Skirt Physics
    const hairTrail = (isRun ? 0.38 : 0.16) + Math.abs(sinP) * (isRun ? 0.14 : 0.06);
    rig.hairBackLeft.rotation.x = hairTrail;
    rig.hairBackRight.rotation.x = hairTrail;
    rig.hairBackLeft.rotation.z = -0.08 + cosP * 0.06;
    rig.hairBackRight.rotation.z = 0.08 + cosP * 0.06;

    rig.hairSideLeft.rotation.x = hairTrail * 0.5;
    rig.hairSideRight.rotation.x = hairTrail * 0.5;

    rig.ribbonLeft.rotation.x = -hairTrail * 0.8;
    rig.ribbonRight.rotation.x = -hairTrail * 0.8;
    rig.skirtGroup.rotation.x = isRun ? 0.12 : 0.04;
    rig.skirtGroup.rotation.z = sinP * 0.05;
    return;
  }

  // Natural Idle Breathing & Gentle Courtyard Breeze Sway
  const breath = Math.sin(elapsed * 2.1);
  const breeze = Math.sin(elapsed * 1.4) * 0.5 + Math.sin(elapsed * 2.9) * 0.25;

  rig.pelvis.position.y = 0.86 + breath * 0.006;
  rig.torso.rotation.x = breath * 0.015;
  rig.torso.rotation.y = Math.sin(elapsed * 0.7) * 0.04;
  rig.headGroup.rotation.y = Math.sin(elapsed * 0.55) * 0.06;
  rig.headGroup.rotation.z = Math.cos(elapsed * 0.8) * 0.025;

  rig.leftHip.rotation.x = 0.02;
  rig.rightHip.rotation.x = -0.02;
  rig.leftShin.rotation.x = -0.04;
  rig.rightShin.rotation.x = -0.04;

  rig.leftShoulder.rotation.x = breath * 0.025;
  rig.leftShoulder.rotation.z = 0.11;
  rig.leftForeArm.rotation.x = 0.12;

  rig.rightShoulder.rotation.x = -breath * 0.025;
  rig.rightShoulder.rotation.z = -0.11;
  rig.rightForeArm.rotation.x = 0.12;

  rig.hairBackLeft.rotation.x = 0.06 + breeze * 0.05;
  rig.hairBackRight.rotation.x = 0.06 + breeze * 0.05;
  rig.hairBackLeft.rotation.z = -0.05 + breeze * 0.04;
  rig.hairBackRight.rotation.z = 0.05 + breeze * 0.04;
  rig.hairSideLeft.rotation.z = 0.03 + breeze * 0.03;
  rig.hairSideRight.rotation.z = -0.03 + breeze * 0.03;
  rig.ribbonLeft.rotation.z = 0.22 + breeze * 0.06;
  rig.ribbonRight.rotation.z = -0.22 + breeze * 0.06;
  rig.skirtGroup.rotation.x = 0;
  rig.skirtGroup.rotation.z = breeze * 0.02;
}
