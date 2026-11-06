/**
 * Pure kinematics, collision resolution, camera rig math, and courtyard zone definitions
 * for The School Chronicles — Phase 1 Visual Development.
 */

export type GaitState = 'idle' | 'walk' | 'run' | 'jump';
export type CameraPerspective = 'third_person' | 'first_person';
export type LightingPresetId = 'spring_morning' | 'golden_sunset' | 'sakura_twilight';

export interface CharacterKinematicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number; // Radians, 0 = facing -Z (north toward Main Academy Hall)
  speed: number;
  gait: GaitState;
  gaitDistance: number;
  stamina: number; // 0..100
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  squashX: number;
  squashY: number;
}

export interface MovementInputState {
  moveX: number; // -1 (left) to +1 (right)
  moveZ: number; // -1 (forward) to +1 (backward)
  sprintHeld: boolean;
  jumpJustPressed: boolean;
  jumpHeld: boolean;
  cameraYaw: number;
}

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY: number;
  label: string;
}

export interface CameraRigState {
  mode: CameraPerspective;
  yaw: number;
  pitch: number;
  distance: number;
  targetDistance: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  fov: number;
}

export interface LightingPreset {
  id: LightingPresetId;
  name: string;
  subtitle: string;
  sunPosition: [number, number, number];
  sunColor: number;
  sunIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  fogColor: number;
  fogDensity: number;
  skyTopColor: string;
  skyHorizonColor: string;
  exposure: number;
  lanternEmissive: number;
}

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPreset> = {
  spring_morning: {
    id: 'spring_morning',
    name: 'Spring Morning',
    subtitle: '08:15 JST · Clear Sakura Sky',
    sunPosition: [28, 42, 24],
    sunColor: 0xfff7e8,
    sunIntensity: 2.3,
    hemiSkyColor: 0x9ec5fe,
    hemiGroundColor: 0x5c6b57,
    hemiIntensity: 0.95,
    fogColor: 0xdbeafe,
    fogDensity: 0.0065,
    skyTopColor: '#3b82f6',
    skyHorizonColor: '#e0f2fe',
    exposure: 1.08,
    lanternEmissive: 0.15,
  },
  golden_sunset: {
    id: 'golden_sunset',
    name: 'Golden After-School',
    subtitle: '17:20 JST · Warm Sunset Glow',
    sunPosition: [-36, 19, 22],
    sunColor: 0xff9e5e,
    sunIntensity: 2.5,
    hemiSkyColor: 0xfdba74,
    hemiGroundColor: 0x4a3b39,
    hemiIntensity: 0.85,
    fogColor: 0xfed7aa,
    fogDensity: 0.008,
    skyTopColor: '#4338ca',
    skyHorizonColor: '#fdba74',
    exposure: 1.12,
    lanternEmissive: 1.2,
  },
  sakura_twilight: {
    id: 'sakura_twilight',
    name: 'Sakura Twilight',
    subtitle: '18:45 JST · Blue Hour & Courtyard Lamps',
    sunPosition: [-24, 14, -20],
    sunColor: 0xa5b4fc,
    sunIntensity: 1.15,
    hemiSkyColor: 0x4f46e5,
    hemiGroundColor: 0x1e293b,
    hemiIntensity: 0.75,
    fogColor: 0x1e1b4b,
    fogDensity: 0.009,
    skyTopColor: '#0f172a',
    skyHorizonColor: '#312e81',
    exposure: 1.18,
    lanternEmissive: 2.4,
  },
};

/**
 * Static architectural and prop AABB colliders in Aoyama Academy Courtyard.
 * Player spawns at (0, 0, 22) facing North (yaw = 0) on the wide main stone promenade.
 */
export const COURTYARD_COLLIDERS: ColliderBox[] = [
  // Main Academy Building (North Wing)
  { minX: -26, maxX: -4.5, minZ: -34, maxZ: -20, maxY: 16, label: 'Academy Main Building West' },
  { minX: 4.5, maxX: 26, minZ: -34, maxZ: -20, maxY: 16, label: 'Academy Main Building East' },
  { minX: -5, maxX: 5, minZ: -34, maxZ: -23.5, maxY: 22, label: 'Academy Central Hall & Clock Tower' },

  // Covered Colonnade Pillars / Side Pavilions
  { minX: -34, maxX: -29, minZ: -18, maxZ: 14, maxY: 5, label: 'West Covered Walkway' },
  { minX: 29, maxX: 34, minZ: -18, maxZ: 14, maxY: 5, label: 'East Covered Walkway' },

  // Central Plaza Planter & Stone Lantern (at 0, 0, 0)
  { minX: -2.8, maxX: 2.8, minZ: -2.8, maxZ: 2.8, maxY: 3.5, label: 'Central Plaza Sakura Planter' },

  // Wooden Benches along the promenade
  { minX: -7.2, maxX: -5.2, minZ: 6.2, maxZ: 9.8, maxY: 1.2, label: 'West Promenade Bench South' },
  { minX: 5.2, maxX: 7.2, minZ: 6.2, maxZ: 9.8, maxY: 1.2, label: 'East Promenade Bench South' },
  { minX: -7.2, maxX: -5.2, minZ: -9.8, maxZ: -6.2, maxY: 1.2, label: 'West Promenade Bench North' },
  { minX: 5.2, maxX: 7.2, minZ: -9.8, maxZ: -6.2, maxY: 1.2, label: 'East Promenade Bench North' },

  // South Main Entrance Gate Pillars & Perimeter Walls
  { minX: -40, maxX: -4.5, minZ: 34.2, maxZ: 36.2, maxY: 4.0, label: 'South Perimeter Wall West' },
  { minX: 4.5, maxX: 40, minZ: 34.2, maxZ: 36.2, maxY: 4.0, label: 'South Perimeter Wall East' },

  // Sakura Tree Trunks
  { minX: -11.6, maxX: -10.4, minZ: 13.4, maxZ: 14.6, maxY: 6, label: 'Sakura Tree SW1' },
  { minX: 10.4, maxX: 11.6, minZ: 13.4, maxZ: 14.6, maxY: 6, label: 'Sakura Tree SE1' },
  { minX: -11.6, maxX: -10.4, minZ: 1.4, maxZ: 2.6, maxY: 6, label: 'Sakura Tree W1' },
  { minX: 10.4, maxX: 11.6, minZ: 1.4, maxZ: 2.6, maxY: 6, label: 'Sakura Tree E1' },
  { minX: -11.6, maxX: -10.4, minZ: -12.6, maxZ: -11.4, maxY: 6, label: 'Sakura Tree NW1' },
  { minX: 10.4, maxX: 11.6, minZ: -12.6, maxZ: -11.4, maxY: 6, label: 'Sakura Tree NE1' },
  { minX: -20.6, maxX: -19.4, minZ: -4.6, maxZ: -3.4, maxY: 6, label: 'Sakura Tree Outer West' },
  { minX: 19.4, maxX: 20.6, minZ: -4.6, maxZ: -3.4, maxY: 6, label: 'Sakura Tree Outer East' },
];

export const PLAYABLE_BOUNDS = {
  minX: -32,
  maxX: 32,
  minZ: -25,
  maxZ: 39,
};

export function createInitialCharacterState(): CharacterKinematicsState {
  return {
    x: 0,
    y: 0,
    z: 22,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0, // Facing North (-Z) directly toward the Main Academy Building & Clock Tower
    speed: 0,
    gait: 'idle',
    gaitDistance: 0,
    stamina: 100,
    grounded: true,
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    squashX: 1,
    squashY: 1,
  };
}

export function createInitialCameraState(): CameraRigState {
  return {
    mode: 'third_person',
    yaw: 0,
    pitch: 0.22,
    distance: 4.4,
    targetDistance: 4.4,
    currentX: 0,
    currentY: 2.4,
    currentZ: 26.4,
    lookAtX: 0,
    lookAtY: 1.35,
    lookAtZ: 22,
    fov: 55,
  };
}

export function getCurrentZoneName(x: number, z: number): string {
  if (z > 28) return 'Main Entrance Gate · South Approach';
  if (z < -15 && Math.abs(x) < 8) return 'Aoyama Main Hall Portico & Steps';
  if (z < -14) return 'North Academy Forecourt';
  if (Math.hypot(x, z) < 6.5) return 'Central Stone Lantern Plaza';
  if (x < -14) return 'West Sakura Lawn & Colonnade';
  if (x > 14) return 'East Courtyard Garden & Walkway';
  return 'Sakura Stone Promenade';
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = normalizeAngle(target - current);
  return normalizeAngle(current + diff * (1 - Math.exp(-lambda * dt)));
}

/**
 * Resolves circle-vs-AABB collision in the XZ plane so the student character slides smoothly
 * along walls, benches, and tree trunks without getting stuck.
 */
export function resolveCircleAABBCollisions(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[]
): { x: number; z: number; hit: boolean } {
  let resolvedX = Math.max(PLAYABLE_BOUNDS.minX, Math.min(PLAYABLE_BOUNDS.maxX, x));
  let resolvedZ = Math.max(PLAYABLE_BOUNDS.minZ, Math.min(PLAYABLE_BOUNDS.maxZ, z));
  let hit = false;

  for (let i = 0; i < colliders.length; i++) {
    const box = colliders[i];
    const closestX = Math.max(box.minX, Math.min(resolvedX, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(resolvedZ, box.maxZ));
    const dx = resolvedX - closestX;
    const dz = resolvedZ - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      hit = true;
      const dist = Math.sqrt(distSq);
      if (dist > 1e-5) {
        const overlap = radius - dist;
        resolvedX += (dx / dist) * overlap;
        resolvedZ += (dz / dist) * overlap;
      } else {
        // Inside box center fallback: push out along nearest edge
        const toLeft = Math.abs(resolvedX - box.minX);
        const toRight = Math.abs(box.maxX - resolvedX);
        const toTop = Math.abs(resolvedZ - box.minZ);
        const toBottom = Math.abs(box.maxZ - resolvedZ);
        const minEdge = Math.min(toLeft, toRight, toTop, toBottom);
        if (minEdge === toLeft) resolvedX = box.minX - radius;
        else if (minEdge === toRight) resolvedX = box.maxX + radius;
        else if (minEdge === toTop) resolvedZ = box.minZ - radius;
        else resolvedZ = box.maxZ + radius;
      }
    }
  }

  return { x: resolvedX, z: resolvedZ, hit };
}

/**
 * Advances student character kinematics by clamped delta time.
 */
export function stepCharacterKinematics(
  state: CharacterKinematicsState,
  input: MovementInputState,
  rawDt: number,
  colliders: ColliderBox[] = COURTYARD_COLLIDERS
): CharacterKinematicsState {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const next: CharacterKinematicsState = { ...state };

  // Normalize movement vector
  let inX = input.moveX;
  let inZ = input.moveZ;
  const mag = Math.hypot(inX, inZ);
  if (mag > 1) {
    inX /= mag;
    inZ /= mag;
  }

  const isMoving = mag > 0.06;
  const canSprint = input.sprintHeld && isMoving && (next.stamina > 5 || next.gait === 'run');
  const isSprinting = canSprint && next.stamina > 0;

  // Stamina regeneration / drain
  if (isSprinting) {
    next.stamina = Math.max(0, next.stamina - 16 * dt);
  } else {
    next.stamina = Math.min(100, next.stamina + 24 * dt);
  }

  const walkSpeed = 4.2;
  const runSpeed = 7.4;
  const targetMaxSpeed = isMoving ? (isSprinting ? runSpeed : walkSpeed) * Math.min(1, mag) : 0;

  // Compute world-space desired velocity relative to cameraYaw
  const sinYaw = Math.sin(input.cameraYaw);
  const cosYaw = Math.cos(input.cameraYaw);
  // Forward (inZ < 0) moves along (-sinYaw, -cosYaw); Right (inX > 0) moves along (cosYaw, -sinYaw)
  const worldDirX = inX * cosYaw + inZ * sinYaw;
  const worldDirZ = -inX * sinYaw + inZ * cosYaw;

  const targetVx = worldDirX * targetMaxSpeed;
  const targetVz = worldDirZ * targetMaxSpeed;

  const accelLambda = next.grounded ? 14 : 6;
  const dampFactor = 1 - Math.exp(-accelLambda * dt);
  next.vx += (targetVx - next.vx) * dampFactor;
  next.vz += (targetVz - next.vz) * dampFactor;

  next.speed = Math.hypot(next.vx, next.vz);

  // Smoothly rotate character toward movement direction
  if (next.speed > 0.25) {
    const desiredYaw = Math.atan2(-next.vx, -next.vz);
    next.yaw = dampAngle(next.yaw, desiredYaw, 14, dt);
  }

  // Jump buffering & coyote time
  if (input.jumpJustPressed) {
    next.jumpBufferTimer = 0.12;
  } else {
    next.jumpBufferTimer = Math.max(0, next.jumpBufferTimer - dt);
  }

  if (next.grounded) {
    next.coyoteTimer = 0.1;
  } else {
    next.coyoteTimer = Math.max(0, next.coyoteTimer - dt);
  }

  // Execute jump
  if (next.jumpBufferTimer > 0 && next.coyoteTimer > 0) {
    next.vy = 6.4;
    next.grounded = false;
    next.coyoteTimer = 0;
    next.jumpBufferTimer = 0;
    next.squashX = 0.86;
    next.squashY = 1.16;
  }

  // Variable jump height cut
  if (!input.jumpHeld && next.vy > 0) {
    next.vy *= Math.pow(0.45, dt * 10);
  }

  // Gravity & vertical integration
  if (!next.grounded || next.vy > 0) {
    next.vy -= 18.5 * dt;
    next.y += next.vy * dt;
    if (next.y <= 0) {
      next.y = 0;
      next.vy = 0;
      next.grounded = true;
      next.squashX = 1.18;
      next.squashY = 0.82;
    }
  }

  // Squash & stretch recovery
  const squashRecover = 1 - Math.exp(-12 * dt);
  next.squashX += (1 - next.squashX) * squashRecover;
  next.squashY += (1 - next.squashY) * squashRecover;

  // Horizontal position & collision resolution
  const rawX = next.x + next.vx * dt;
  const rawZ = next.z + next.vz * dt;
  const resolved = resolveCircleAABBCollisions(rawX, rawZ, 0.42, colliders);
  next.x = resolved.x;
  next.z = resolved.z;

  // Advance gait cycle proportional to distance traveled
  if (!next.grounded) {
    next.gait = 'jump';
  } else if (next.speed > 5.2) {
    next.gait = 'run';
    next.gaitDistance += next.speed * dt * 1.45;
  } else if (next.speed > 0.2) {
    next.gait = 'walk';
    next.gaitDistance += next.speed * dt * 1.65;
  } else {
    next.gait = 'idle';
  }

  return next;
}

/**
 * Updates Third-Person or First-Person camera rig with exponential damping and wall pull-in.
 */
export function stepCameraRig(
  cam: CameraRigState,
  target: CharacterKinematicsState,
  lookDeltaX: number,
  lookDeltaY: number,
  zoomDelta: number,
  rawDt: number,
  colliders: ColliderBox[] = COURTYARD_COLLIDERS
): CameraRigState {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const next: CameraRigState = { ...cam };

  next.yaw = normalizeAngle(next.yaw - lookDeltaX);
  const minPitch = next.mode === 'first_person' ? -1.05 : -0.25;
  const maxPitch = next.mode === 'first_person' ? 1.15 : 1.15;
  next.pitch = Math.max(minPitch, Math.min(maxPitch, next.pitch + lookDeltaY));

  next.targetDistance = Math.max(2.0, Math.min(8.5, next.targetDistance + zoomDelta));

  if (next.mode === 'first_person') {
    // First-Person eye anchor slightly forward of head bone
    const eyeHeight = 1.54 * target.squashY;
    const forwardX = -Math.sin(next.yaw) * Math.cos(next.pitch);
    const forwardY = -Math.sin(next.pitch);
    const forwardZ = -Math.cos(next.yaw) * Math.cos(next.pitch);

    const eyeX = target.x - Math.sin(next.yaw) * 0.14;
    const eyeY = target.y + eyeHeight;
    const eyeZ = target.z - Math.cos(next.yaw) * 0.14;

    next.currentX = eyeX;
    next.currentY = eyeY;
    next.currentZ = eyeZ;

    next.lookAtX = next.currentX + forwardX * 10;
    next.lookAtY = next.currentY + forwardY * 10;
    next.lookAtZ = next.currentZ + forwardZ * 10;
    next.fov = 68;
    return next;
  }

  // Third-Person spring-arm follow camera with wall collision pull-in
  const anchorX = target.x;
  const anchorY = target.y + 1.38;
  const anchorZ = target.z;

  const horizDist = Math.cos(next.pitch) * next.targetDistance;
  const vertOffset = Math.sin(next.pitch) * next.targetDistance;

  const dirX = Math.sin(next.yaw) * horizDist;
  const dirZ = Math.cos(next.yaw) * horizDist;

  // Ray-sample along arm to avoid clipping inside courtyard walls/buildings
  let safeFraction = 1.0;
  const steps = 10;
  for (let s = 1; s <= steps; s++) {
    const frac = s / steps;
    const sampleX = anchorX + dirX * frac;
    const sampleY = anchorY + vertOffset * frac;
    const sampleZ = anchorZ + dirZ * frac;
    if (sampleY < 0.28) {
      safeFraction = Math.min(safeFraction, Math.max(0.25, (s - 1) / steps));
      break;
    }
    let hitWall = false;
    for (let c = 0; c < colliders.length; c++) {
      const box = colliders[c];
      if (
        sampleY < box.maxY &&
        sampleX >= box.minX - 0.25 &&
        sampleX <= box.maxX + 0.25 &&
        sampleZ >= box.minZ - 0.25 &&
        sampleZ <= box.maxZ + 0.25
      ) {
        hitWall = true;
        break;
      }
    }
    if (hitWall) {
      safeFraction = Math.max(0.28, (s - 1) / steps);
      break;
    }
  }

  const desiredDist = next.targetDistance * safeFraction;
  next.distance += (desiredDist - next.distance) * (1 - Math.exp(-16 * dt));

  const desiredCamX = anchorX + Math.sin(next.yaw) * Math.cos(next.pitch) * next.distance;
  const desiredCamY = Math.max(0.32, anchorY + Math.sin(next.pitch) * next.distance);
  const desiredCamZ = anchorZ + Math.cos(next.yaw) * Math.cos(next.pitch) * next.distance;

  const followDamp = 1 - Math.exp(-14 * dt);
  next.currentX += (desiredCamX - next.currentX) * followDamp;
  next.currentY += (desiredCamY - next.currentY) * followDamp;
  next.currentZ += (desiredCamZ - next.currentZ) * followDamp;

  next.lookAtX += (anchorX - next.lookAtX) * followDamp;
  next.lookAtY += (anchorY - next.lookAtY) * followDamp;
  next.lookAtZ += (anchorZ - next.lookAtZ) * followDamp;

  const targetFov = target.gait === 'run' ? 60 : 54;
  next.fov += (targetFov - next.fov) * (1 - Math.exp(-8 * dt));

  return next;
}
