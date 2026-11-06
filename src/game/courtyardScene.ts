import * as THREE from 'three';
import { AcademyTextureLibrary } from './textures';
import { LIGHTING_PRESETS, LightingPresetId } from './rules';

export interface CourtyardEnvironment {
  group: THREE.Group;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  courtyardLamps: THREE.PointLight[];
  lampGlassMeshes: THREE.Mesh[];
  windowGlassMat: THREE.MeshStandardMaterial;
  clockMinuteHand: THREE.Mesh;
  clockHourHand: THREE.Mesh;
  updateAtmosphere: (dt: number, elapsed: number) => void;
  applyLightingPreset: (presetId: LightingPresetId, scene: THREE.Scene, renderer: THREE.WebGLRenderer) => void;
}

const PETAL_COUNT = 220;
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyRot = new THREE.Euler();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _color = new THREE.Color();

export function buildAoyamaCourtyard(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  textures: AcademyTextureLibrary,
  isSoftwareGl: boolean
): CourtyardEnvironment {
  const group = new THREE.Group();
  group.name = 'Aoyama_Academy_Courtyard';
  scene.add(group);

  // ── 1. LIGHTING RIG (URP-INSPIRED WARM SUN + COOL HEMISPHERE + LAMPS) ────
  const hemiLight = new THREE.HemisphereLight(0x9ec5fe, 0x5c6b57, 0.95);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff7e8, 2.3);
  sunLight.position.set(28, 42, 24);
  sunLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const d = 38;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Subtle rim directional light for anime silhouette separation
  const rimLight = new THREE.DirectionalLight(0xc7d2fe, 0.55);
  rimLight.position.set(-22, 18, -28);
  scene.add(rimLight);

  // ── 2. SHARED PBR ARCHITECTURAL MATERIALS ────────────────────────────────
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.grassColor,
    bumpMap: textures.grassBump,
    bumpScale: 0.04,
    roughness: 0.88,
    metalness: 0.02,
  });

  const stonePathMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.stoneColor,
    bumpMap: textures.stoneBump,
    bumpScale: 0.035,
    roughness: 0.72,
    metalness: 0.05,
  });

  const stoneCurbMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3cd,
    bumpMap: textures.stoneBump,
    bumpScale: 0.02,
    roughness: 0.65,
    metalness: 0.08,
  });

  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.wallPlasterColor,
    bumpMap: textures.wallPlasterBump,
    bumpScale: 0.02,
    roughness: 0.78,
    metalness: 0.04,
  });

  const concreteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2ddd5,
    roughness: 0.62,
    metalness: 0.08,
  });

  const darkSlateRoofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.roofTileColor,
    bumpMap: textures.roofTileBump,
    bumpScale: 0.04,
    roughness: 0.48,
    metalness: 0.22,
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x27303f,
    roughness: 0.35,
    metalness: 0.72,
  });

  // Single-pass reflective architectural glass (zero multi-pass transmission stalls on mobile/desktop GPUs)
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.12,
    metalness: 0.38,
    transparent: true,
    opacity: 0.82,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.woodGrainColor,
    roughness: 0.56,
    metalness: 0.06,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e242b,
    roughness: 0.32,
    metalness: 0.84,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.88,
  });

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.barkColor,
    roughness: 0.86,
    metalness: 0.03,
  });

  // ── 3. GROUND LAWN, STONE PROMENADE & CENTRAL PLAZA ──────────────────────
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, grassMat);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // Helper to lay raised stone paving slabs with chamfered granite curbs (disjoint Y >= 0.025)
  function addPavedSection(x: number, z: number, width: number, length: number, yOffset = 0.025) {
    const slabGeo = new THREE.BoxGeometry(width, 0.04, length);
    const slab = new THREE.Mesh(slabGeo, stonePathMat);
    slab.position.set(x, yOffset, z);
    slab.receiveShadow = true;
    group.add(slab);

    // Granite border curbs along left and right edges
    const curbGeo = new THREE.BoxGeometry(0.24, 0.08, length);
    const leftCurb = new THREE.Mesh(curbGeo, stoneCurbMat);
    leftCurb.position.set(x - width / 2 - 0.12, yOffset + 0.02, z);
    leftCurb.receiveShadow = true;
    leftCurb.castShadow = true;
    group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, stoneCurbMat);
    rightCurb.position.set(x + width / 2 + 0.12, yOffset + 0.02, z);
    rightCurb.receiveShadow = true;
    rightCurb.castShadow = true;
    group.add(rightCurb);
  }

  // Main South-to-North Stone Promenade (Gate z=42 to Main Hall z=-22)
  addPavedSection(0, 21, 7.6, 36, 0.025);
  addPavedSection(0, -12, 7.6, 20, 0.025);

  // Cross-courtyard East-West Stone Walkway connecting Side Colonnades
  const crossSlab = new THREE.Mesh(new THREE.BoxGeometry(58, 0.042, 5.2), stonePathMat);
  crossSlab.position.set(0, 0.028, 0);
  crossSlab.receiveShadow = true;
  group.add(crossSlab);

  // Central Octagonal Plaza Paved Apron (y = 0.034)
  const plazaDiscGeo = new THREE.CylinderGeometry(8.8, 9.0, 0.05, 8);
  const plazaDisc = new THREE.Mesh(plazaDiscGeo, stonePathMat);
  plazaDisc.position.set(0, 0.032, 0);
  plazaDisc.rotation.y = Math.PI / 8;
  plazaDisc.receiveShadow = true;
  group.add(plazaDisc);

  // Central Plaza Raised Octagonal Stone Planter + Traditional Stone Lantern (Tōrō)
  const planterGroup = new THREE.Group();
  planterGroup.position.set(0, 0.05, 0);
  group.add(planterGroup);

  const planterBase = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.8, 0.62, 8), stoneCurbMat);
  planterBase.position.y = 0.31;
  planterBase.rotation.y = Math.PI / 8;
  planterBase.castShadow = true;
  planterBase.receiveShadow = true;
  planterGroup.add(planterBase);

  const planterCap = new THREE.Mesh(new THREE.CylinderGeometry(2.82, 2.75, 0.1, 8), concreteTrimMat);
  planterCap.position.y = 0.64;
  planterCap.rotation.y = Math.PI / 8;
  planterCap.castShadow = true;
  planterGroup.add(planterCap);

  const soilMound = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.45, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x3b6e38, roughness: 0.9 })
  );
  soilMound.position.y = 0.66;
  planterGroup.add(soilMound);

  // Traditional Japanese Commemorative Stone Lantern (Tōrō) at center of planter
  const lanternPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 0.45, 6), stoneCurbMat);
  lanternPedestal.position.y = 0.92;
  lanternPedestal.castShadow = true;
  planterGroup.add(lanternPedestal);

  const lanternShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.95, 6), stoneCurbMat);
  lanternShaft.position.y = 1.62;
  lanternShaft.castShadow = true;
  planterGroup.add(lanternShaft);

  const lanternPlatform = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.16, 6), stoneCurbMat);
  lanternPlatform.position.y = 2.16;
  lanternPlatform.castShadow = true;
  planterGroup.add(lanternPlatform);

  const lanternLightBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.38, 6),
    new THREE.MeshStandardMaterial({
      color: 0xfff3c4,
      emissive: 0xffb74d,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    })
  );
  lanternLightBox.position.y = 2.42;
  planterGroup.add(lanternLightBox);

  const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.42, 6), darkSlateRoofMat);
  lanternRoof.position.y = 2.8;
  lanternRoof.castShadow = true;
  planterGroup.add(lanternRoof);

  const lanternFinial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), stoneCurbMat);
  lanternFinial.position.y = 3.06;
  planterGroup.add(lanternFinial);

  // Sculpted Azalea Topiary Shrubs around the lantern base
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.82 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 10), shrubMat);
    shrub.scale.set(1.15, 0.72, 1.15);
    shrub.position.set(Math.cos(a) * 1.55, 0.85, Math.sin(a) * 1.55);
    shrub.castShadow = true;
    planterGroup.add(shrub);
  }

  // ── 4. AOYAMA ACADEMY MAIN BUILDING & CLOCK TOWER (NORTH LANDMARK) ───────
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(0, 0, -27);
  group.add(buildingGroup);

  // Foundation Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(52, 0.8, 13.5), stoneCurbMat);
  plinth.position.set(0, 0.4, 0);
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  buildingGroup.add(plinth);

  // Main 3-Story Building Body
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(50, 12.6, 12), wallPlasterMat);
  mainBody.position.set(0, 7.1, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  buildingGroup.add(mainBody);

  // Horizontal Cornice Mouldings between floors
  for (let floor = 1; floor <= 3; floor++) {
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(50.6, 0.32, 12.5), concreteTrimMat);
    cornice.position.set(0, 0.8 + floor * 4.2, 0);
    cornice.castShadow = true;
    buildingGroup.add(cornice);
  }

  // Pitched Japanese Kawara Slate Roof over Main Wing (pre-rotated in geometry space)
  const mainRoofGeo = new THREE.ConeGeometry(36.5, 3.8, 4);
  mainRoofGeo.rotateY(Math.PI / 4);
  mainRoofGeo.scale(1.0, 1.0, 0.25);
  const mainRoof = new THREE.Mesh(mainRoofGeo, darkSlateRoofMat);
  mainRoof.position.set(0, 15.3, 0);
  mainRoof.castShadow = true;
  buildingGroup.add(mainRoof);

  // Architectural Pilasters & Multi-Mullion Classroom Windows across 3 floors
  const windowColumns = [-21, -16.5, -12, -7.5, 7.5, 12, 16.5, 21];
  windowColumns.forEach((wx) => {
    // Vertical concrete pilaster flanking window bays
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.55, 12.6, 0.45), concreteTrimMat);
    pilaster.position.set(wx + 2.25, 7.1, 6.05);
    pilaster.castShadow = true;
    buildingGroup.add(pilaster);

    for (let fl = 0; fl < 3; fl++) {
      const wy = 2.9 + fl * 4.2;
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, wy, 6.02);

      // Outer Aluminum/Steel Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.3, 0.16), windowFrameMat);
      winGroup.add(frame);

      // Reflective/Transmissive Classroom Glass Pane
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 2.06), windowGlassMat);
      glass.position.z = 0.09;
      winGroup.add(glass);

      // Mullion Crossbars
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 0.2), windowFrameMat);
      vBar.position.z = 0.05;
      winGroup.add(vBar);

      const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.2), windowFrameMat);
      hBar.position.set(0, 0.35, 0.05);
      winGroup.add(hBar);

      // Stone Window Sill
      const sill = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.14, 0.38), concreteTrimMat);
      sill.position.set(0, -1.18, 0.12);
      winGroup.add(sill);

      buildingGroup.add(winGroup);
    }
  });

  // Central Clock Tower & Grand Entrance Portico
  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(9.6, 18.5, 13.2), wallPlasterMat);
  towerBody.position.set(0, 10.05, 0.4);
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  buildingGroup.add(towerBody);

  // Steep Pyramid Spire Roof on Clock Tower
  const towerRoofGeo = new THREE.ConeGeometry(7.6, 4.8, 4);
  towerRoofGeo.rotateY(Math.PI / 4);
  towerRoofGeo.scale(1.0, 1.0, 1.32);
  const towerRoof = new THREE.Mesh(towerRoofGeo, darkSlateRoofMat);
  towerRoof.position.set(0, 21.7, 0.4);
  towerRoof.castShadow = true;
  buildingGroup.add(towerRoof);

  const spireFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 2.2, 8), goldAccentMat);
  spireFinial.position.set(0, 24.9, 0.4);
  buildingGroup.add(spireFinial);

  // Illuminated Academy Clock Face (y = 16.2, z = 7.08)
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.14, 12, 32), goldAccentMat);
  clockRim.position.set(0, 16.2, 7.05);
  buildingGroup.add(clockRim);

  const clockDial = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfefce8,
      emissive: 0xfef08a,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
  );
  clockDial.position.set(0, 16.2, 7.04);
  buildingGroup.add(clockDial);

  // 12 Hour Markers on Clock Face
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.04), darkIronMat);
    marker.position.set(Math.sin(a) * 1.32, 16.2 + Math.cos(a) * 1.32, 7.08);
    marker.rotation.z = -a;
    buildingGroup.add(marker);
  }

  const minuteGeo = new THREE.BoxGeometry(0.07, 1.15, 0.05);
  minuteGeo.translate(0, 0.48, 0);
  const clockMinuteHand = new THREE.Mesh(minuteGeo, darkIronMat);
  clockMinuteHand.position.set(0, 16.2, 7.11);
  buildingGroup.add(clockMinuteHand);

  const hourGeo = new THREE.BoxGeometry(0.09, 0.78, 0.05);
  hourGeo.translate(0, 0.32, 0);
  const clockHourHand = new THREE.Mesh(hourGeo, darkIronMat);
  clockHourHand.position.set(0, 16.2, 7.12);
  clockHourHand.rotation.z = -Math.PI * 0.55;
  buildingGroup.add(clockHourHand);

  // Covered Entrance Portico & 4 Fluted Columns
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.55, 4.2), concreteTrimMat);
  porticoRoof.position.set(0, 5.2, 8.6);
  porticoRoof.castShadow = true;
  buildingGroup.add(porticoRoof);

  const pedimentGeo = new THREE.ConeGeometry(6.8, 1.65, 4);
  pedimentGeo.rotateY(Math.PI / 4);
  pedimentGeo.scale(1.0, 1.0, 0.46);
  const pediment = new THREE.Mesh(pedimentGeo, darkSlateRoofMat);
  pediment.position.set(0, 6.3, 8.6);
  pediment.castShadow = true;
  buildingGroup.add(pediment);

  // Gold Academy Emblem on Portico Frieze
  const crestShield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.12, 6), goldAccentMat);
  crestShield.rotation.x = Math.PI / 2;
  crestShield.position.set(0, 5.2, 10.72);
  buildingGroup.add(crestShield);

  const colPositions = [-3.8, -1.6, 1.6, 3.8];
  colPositions.forEach((cx) => {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.45, 0.68), stoneCurbMat);
    colBase.position.set(cx, 1.0, 10.2);
    buildingGroup.add(colBase);

    const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.8, 16), concreteTrimMat);
    colShaft.position.set(cx, 3.1, 10.2);
    colShaft.castShadow = true;
    buildingGroup.add(colShaft);
  });

  // Grand Stone Entrance Staircase (5 steps descending to promenade)
  for (let s = 0; s < 5; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.16, 0.6 + (4 - s) * 0.45),
      stoneCurbMat
    );
    step.position.set(0, 0.08 + s * 0.16, 11.8 - s * 0.35);
    step.receiveShadow = true;
    buildingGroup.add(step);
  }

  // Grand Double Entrance Doors
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 0.3), darkIronMat);
  doorFrame.position.set(0, 2.6, 6.95);
  buildingGroup.add(doorFrame);

  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.2), windowGlassMat);
  doorGlass.position.set(0, 2.6, 7.12);
  buildingGroup.add(doorGlass);

  // ── 5. EAST & WEST COVERED WALKWAYS (WATARI-ROUKA) ───────────────────────
  [-31.5, 31.5].forEach((sideX) => {
    const colonnade = new THREE.Group();
    colonnade.position.set(sideX, 0, -2);
    group.add(colonnade);

    // Raised walkway deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 34), stoneCurbMat);
    deck.position.y = 0.11;
    deck.receiveShadow = true;
    colonnade.add(deck);

    // Pitched slate canopy roof
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.28, 34.6), darkSlateRoofMat);
    canopy.position.y = 3.65;
    canopy.castShadow = true;
    colonnade.add(canopy);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 34.6), woodMat);
    ridge.position.y = 3.42;
    colonnade.add(ridge);

    // 7 Pairs of Support Pillars along the walkway
    for (let z = -15; z <= 15; z += 5) {
      [-1.6, 1.6].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.4, 12), concreteTrimMat);
        post.position.set(px, 1.8, z);
        post.castShadow = true;
        colonnade.add(post);
      });
    }
  });

  // ── 6. SOUTH MAIN ENTRANCE GATES & PERIMETER WALLS ───────────────────────
  const gateZ = 35.2;
  //Monumental Masonry Gate Pillars flanking the main promenade
  [-4.4, 4.4].forEach((gx, idx) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(gx, 0, gateZ);
    group.add(pillarGroup);

    const pillarBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.6, 1.35), stoneCurbMat);
    pillarBase.position.y = 0.3;
    pillarBase.castShadow = true;
    pillarGroup.add(pillarBase);

    const pillarBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.8, 1.12), wallPlasterMat);
    pillarBody.position.y = 2.0;
    pillarBody.castShadow = true;
    pillarGroup.add(pillarBody);

    const pillarCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.48, 4), darkSlateRoofMat);
    pillarCap.position.y = 3.64;
    pillarCap.rotation.y = Math.PI / 4;
    pillarCap.castShadow = true;
    pillarGroup.add(pillarCap);

    // Vertical Brass Academy Nameplate on the right gate pillar
    if (idx === 1) {
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.15, 0.06), goldAccentMat);
      plaque.position.set(0, 2.1, 0.58);
      pillarGroup.add(plaque);
    }

    // Welcomingly Swung-Open Wrought Iron Gate Wing
    const wingGroup = new THREE.Group();
    const isLeft = idx === 0;
    wingGroup.position.set(isLeft ? 0.56 : -0.56, 0.2, 0);
    // Open inward toward courtyard at 65 degrees
    wingGroup.rotation.y = isLeft ? 1.15 : -1.15;
    pillarGroup.add(wingGroup);

    const wingWidth = 3.5;
    const wingX = isLeft ? wingWidth / 2 : -wingWidth / 2;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 0.08, 0.08), darkIronMat);
    topRail.position.set(wingX, 2.35, 0);
    wingGroup.add(topRail);

    const botRail = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, 0.08, 0.08), darkIronMat);
    botRail.position.set(wingX, 0.3, 0);
    wingGroup.add(botRail);

    for (let b = 0; b < 9; b++) {
      const bx = (isLeft ? 0.35 : -0.35) + (isLeft ? 1 : -1) * b * 0.36;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.35, 6), darkIronMat);
      bar.position.set(bx, 1.35, 0);
      bar.castShadow = true;
      wingGroup.add(bar);

      const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 6), goldAccentMat);
      spearTip.position.set(bx, 2.58, 0);
      wingGroup.add(spearTip);
    }
  });

  // South Perimeter Stucco & Kawara Tile Walls
  [-22, 22].forEach((wx) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(wx, 0, gateZ);
    group.add(wallGroup);

    const wallBase = new THREE.Mesh(new THREE.BoxGeometry(34, 0.55, 0.72), stoneCurbMat);
    wallBase.position.y = 0.275;
    wallGroup.add(wallBase);

    const wallPanel = new THREE.Mesh(new THREE.BoxGeometry(34, 1.85, 0.52), wallPlasterMat);
    wallPanel.position.y = 1.45;
    wallPanel.castShadow = true;
    wallPanel.receiveShadow = true;
    wallGroup.add(wallPanel);

    const wallRoof = new THREE.Mesh(new THREE.BoxGeometry(34.4, 0.24, 0.88), darkSlateRoofMat);
    wallRoof.position.y = 2.48;
    wallRoof.castShadow = true;
    wallGroup.add(wallRoof);
  });

  // ── 7. COURTYARD WOODEN BENCHES & IRON STREETLAMPS ───────────────────────
  function createCourtyardBench(x: number, z: number, rotY: number) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;
    group.add(bench);

    // Cast-iron legs & armrests at both ends
    [-1.25, 1.25].forEach((lx) => {
      const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.08), darkIronMat);
      frontLeg.position.set(lx, 0.23, 0.22);
      frontLeg.castShadow = true;
      bench.add(frontLeg);

      const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.08), darkIronMat);
      backLeg.position.set(lx, 0.44, -0.24);
      backLeg.rotation.x = -0.14;
      backLeg.castShadow = true;
      bench.add(backLeg);

      const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.54), darkIronMat);
      armrest.position.set(lx, 0.62, 0);
      bench.add(armrest);
    });

    // 4 Varnished Cedar Seat Slats
    for (let s = 0; s < 4; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.04, 0.11), woodMat);
      slat.position.set(0, 0.46, -0.18 + s * 0.125);
      slat.castShadow = true;
      slat.receiveShadow = true;
      bench.add(slat);
    }

    // 3 Backrest Slats
    for (let b = 0; b < 3; b++) {
      const bSlat = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 0.038), woodMat);
      bSlat.position.set(0, 0.62 + b * 0.125, -0.26 - b * 0.018);
      bSlat.rotation.x = -0.14;
      bSlat.castShadow = true;
      bench.add(bSlat);
    }
  }

  // 4 Promenade Benches + 2 Plaza Garden Benches
  createCourtyardBench(-6.2, 8, Math.PI / 2);
  createCourtyardBench(6.2, 8, -Math.PI / 2);
  createCourtyardBench(-6.2, -8, Math.PI / 2);
  createCourtyardBench(6.2, -8, -Math.PI / 2);
  createCourtyardBench(-16, 4.2, 0);
  createCourtyardBench(16, 4.2, 0);

  // Courtyard Lamps (with PointLights and emissive lanterns for Sunset/Twilight)
  const courtyardLamps: THREE.PointLight[] = [];
  const lampGlassMeshes: THREE.Mesh[] = [];
  const lampCoords: [number, number][] = [
    [-5.2, 18],
    [5.2, 18],
    [-5.2, -2],
    [5.2, -2],
    [-5.2, -16],
    [5.2, -16],
  ];

  lampCoords.forEach(([lx, lz], idx) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    group.add(lamp);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.55, 10), darkIronMat);
    base.position.y = 0.275;
    base.castShadow = true;
    lamp.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.09, 3.6, 10), darkIronMat);
    pole.position.y = 2.05;
    pole.castShadow = true;
    lamp.add(pole);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xffb74d,
      emissiveIntensity: 0.25,
      roughness: 0.2,
    });
    const lanternGlobe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.44, 6), glassMat);
    lanternGlobe.position.y = 4.02;
    lamp.add(lanternGlobe);
    lampGlassMeshes.push(lanternGlobe);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 6), darkIronMat);
    cap.position.y = 4.34;
    lamp.add(cap);

    // Cap active PointLights at 4 for mobile URP efficiency
    if (idx < 4) {
      const ptLight = new THREE.PointLight(0xffb74d, 0.4, 16, 1.8);
      ptLight.position.set(lx, 3.9, lz);
      scene.add(ptLight);
      courtyardLamps.push(ptLight);
    }
  });

  // ── 8. MULTI-PART CHERRY BLOSSOM (SAKURA) TREES & INSTANCED CANOPY ───────
  const sakuraTreePositions: { x: number; z: number; scale: number; rot: number }[] = [
    { x: -11, z: 14, scale: 1.08, rot: 0.4 },
    { x: 11, z: 14, scale: 1.02, rot: 1.9 },
    { x: -11, z: 2, scale: 1.15, rot: 2.7 },
    { x: 11, z: 2, scale: 1.1, rot: 0.9 },
    { x: -11, z: -12, scale: 1.12, rot: 3.6 },
    { x: 11, z: -12, scale: 1.06, rot: 5.1 },
    { x: -20, z: -4, scale: 1.18, rot: 1.2 },
    { x: 20, z: -4, scale: 1.14, rot: 4.2 },
    // Exterior horizon boundary trees
    { x: -24, z: 22, scale: 1.22, rot: 0.8 },
    { x: 24, z: 22, scale: 1.2, rot: 2.3 },
    { x: -26, z: -18, scale: 1.25, rot: 3.1 },
    { x: 26, z: -18, scale: 1.24, rot: 1.5 },
  ];

  // Collect all blossom cluster transforms across all 12 Sakura trees into a single InstancedMesh
  const blossomClusters: { pos: THREE.Vector3; scale: THREE.Vector3; rot: THREE.Euler; colorHex: number }[] = [];
  const sakuraPalette = [0xfbcfe8, 0xf9a8d4, 0xfdf2f8, 0xf472b6, 0xfce7f3];

  sakuraTreePositions.forEach((tree, tIdx) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tree.x, 0, tree.z);
    treeGroup.rotation.y = tree.rot;
    treeGroup.scale.setScalar(tree.scale);
    group.add(treeGroup);

    // Root flare + gnarled trunk
    const trunkGeo = new THREE.CylinderGeometry(0.26, 0.44, 2.3, 10);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 1.15;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Fallen sakura petal ring around base of trunk
    const petalRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 2.1, 18),
      new THREE.MeshBasicMaterial({
        color: 0xf9a8d4,
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    petalRing.rotation.x = -Math.PI / 2;
    petalRing.position.y = 0.022;
    treeGroup.add(petalRing);

    // 5 Spreading Primary Boughs + Secondary Twigs
    const branchAngles = [0, 1.25, 2.5, 3.75, 5.0];
    branchAngles.forEach((bAngle, bIdx) => {
      const boughLen = 2.1 + (bIdx % 2) * 0.35;
      const boughGeo = new THREE.CylinderGeometry(0.1, 0.21, boughLen, 8);
      boughGeo.translate(0, boughLen / 2, 0);
      const bough = new THREE.Mesh(boughGeo, barkMat);
      bough.position.set(0, 2.05, 0);
      bough.rotation.y = bAngle;
      bough.rotation.z = 0.62 + (bIdx % 3) * 0.08;
      bough.castShadow = true;
      treeGroup.add(bough);

      // Compute world position of bough tip for blossom cloud clusters
      const tipRadius = Math.sin(0.66) * boughLen * tree.scale;
      const tipHeight = (2.05 + Math.cos(0.66) * boughLen) * tree.scale;
      const worldAngle = bAngle + tree.rot;
      const tipX = tree.x - Math.cos(worldAngle) * tipRadius;
      const tipZ = tree.z + Math.sin(worldAngle) * tipRadius;

      // 3 layered blossom puffs per branch tip + 1 central crown puff
      for (let c = 0; c < 3; c++) {
        const subAngle = worldAngle + (c - 1) * 0.55;
        const subDist = c === 0 ? 0 : 0.85 * tree.scale;
        blossomClusters.push({
          pos: new THREE.Vector3(
            tipX + Math.cos(subAngle) * subDist,
            tipHeight + (c === 0 ? 0.35 : -0.12) * tree.scale,
            tipZ + Math.sin(subAngle) * subDist
          ),
          scale: new THREE.Vector3(
            (1.38 + ((tIdx + c) % 3) * 0.18) * tree.scale,
            (0.92 + (c % 2) * 0.14) * tree.scale,
            (1.38 + ((bIdx + c) % 3) * 0.18) * tree.scale
          ),
          rot: new THREE.Euler((c * 0.3) % 1, subAngle, (bIdx * 0.2) % 1),
          colorHex: sakuraPalette[(tIdx + bIdx + c) % sakuraPalette.length],
        });
      }
    });

    // Upper central sakura crown dome
    blossomClusters.push({
      pos: new THREE.Vector3(tree.x, 4.35 * tree.scale, tree.z),
      scale: new THREE.Vector3(2.1 * tree.scale, 1.25 * tree.scale, 2.1 * tree.scale),
      rot: new THREE.Euler(0, tree.rot, 0),
      colorHex: sakuraPalette[tIdx % sakuraPalette.length],
    });
  });

  // Build InstancedMesh for all Sakura Blossom Clouds
  const blossomGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const blossomMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0.02,
    emissive: 0xf472b6,
    emissiveIntensity: 0.12,
  });
  const blossomInstanced = new THREE.InstancedMesh(blossomGeo, blossomMat, blossomClusters.length);
  blossomInstanced.castShadow = !isSoftwareGl;
  blossomInstanced.receiveShadow = true;

  blossomClusters.forEach((cl, idx) => {
    _dummyQuat.setFromEuler(cl.rot);
    _dummyMatrix.compose(cl.pos, _dummyQuat, cl.scale);
    blossomInstanced.setMatrixAt(idx, _dummyMatrix);
    _color.setHex(cl.colorHex);
    blossomInstanced.setColorAt(idx, _color);
  });
  blossomInstanced.instanceMatrix.needsUpdate = true;
  if (blossomInstanced.instanceColor) blossomInstanced.instanceColor.needsUpdate = true;
  blossomInstanced.computeBoundingSphere();
  group.add(blossomInstanced);

  // ── 9. POOLED FALLING SAKURA PETALS PARTICLE SYSTEM (ZERO-GC) ────────────
  const petalGeo = new THREE.PlaneGeometry(0.11, 0.07);
  const petalMat = new THREE.MeshBasicMaterial({
    color: 0xfbcfe8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });
  const petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, PETAL_COUNT);
  petalMesh.frustumCulled = false;
  group.add(petalMesh);

  const petalPositions = new Float32Array(PETAL_COUNT * 3);
  const petalPhases = new Float32Array(PETAL_COUNT);
  for (let i = 0; i < PETAL_COUNT; i++) {
    petalPositions[i * 3 + 0] = (Math.random() - 0.5) * 52;
    petalPositions[i * 3 + 1] = Math.random() * 8.5 + 0.3;
    petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 64;
    petalPhases[i] = Math.random() * Math.PI * 2;
    _color.setHex(sakuraPalette[i % sakuraPalette.length]);
    petalMesh.setColorAt(i, _color);
  }
  if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;

  function updateAtmosphere(dt: number, elapsed: number) {
    // Advance clock hands subtly
    clockMinuteHand.rotation.z = -elapsed * 0.02;

    // Update drifting sakura petals in-place without GC allocations
    for (let i = 0; i < PETAL_COUNT; i++) {
      const idx = i * 3;
      const phase = petalPhases[i] + elapsed * 1.4;
      petalPositions[idx + 0] += (Math.sin(phase) * 0.65 + 0.35) * dt;
      petalPositions[idx + 1] -= (0.72 + (i % 5) * 0.11) * dt;
      petalPositions[idx + 2] += Math.cos(phase * 0.8) * 0.45 * dt;

      if (petalPositions[idx + 1] < 0.05) {
        petalPositions[idx + 1] = 8.2;
        petalPositions[idx + 0] = (Math.random() - 0.5) * 50;
        petalPositions[idx + 2] = (Math.random() - 0.5) * 60;
      }

      _dummyPos.set(petalPositions[idx + 0], petalPositions[idx + 1], petalPositions[idx + 2]);
      _dummyRot.set(phase * 1.2, phase * 0.9, Math.sin(phase) * 0.8);
      _dummyQuat.setFromEuler(_dummyRot);
      _dummyScale.setScalar(1);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      petalMesh.setMatrixAt(i, _dummyMatrix);
    }
    petalMesh.instanceMatrix.needsUpdate = true;
  }

  function applyLightingPreset(presetId: LightingPresetId, targetScene: THREE.Scene, targetRenderer: THREE.WebGLRenderer) {
    const p = LIGHTING_PRESETS[presetId];
    sunLight.position.set(p.sunPosition[0], p.sunPosition[1], p.sunPosition[2]);
    sunLight.color.setHex(p.sunColor);
    sunLight.intensity = p.sunIntensity;

    hemiLight.color.setHex(p.hemiSkyColor);
    hemiLight.groundColor.setHex(p.hemiGroundColor);
    hemiLight.intensity = p.hemiIntensity;

    targetScene.background = new THREE.Color(p.fogColor);
    targetScene.fog = new THREE.FogExp2(p.fogColor, p.fogDensity);
    targetRenderer.toneMappingExposure = p.exposure;

    courtyardLamps.forEach((l) => {
      l.intensity = p.lanternEmissive * 1.1;
    });
    lampGlassMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = p.lanternEmissive;
    });
    lanternLightBox.material.emissiveIntensity = p.lanternEmissive * 0.9;
  }

  // Initialize with Spring Morning
  applyLightingPreset('spring_morning', scene, renderer);

  return {
    group,
    sunLight,
    hemiLight,
    courtyardLamps,
    lampGlassMeshes,
    windowGlassMat,
    clockMinuteHand,
    clockHourHand,
    updateAtmosphere,
    applyLightingPreset,
  };
}
