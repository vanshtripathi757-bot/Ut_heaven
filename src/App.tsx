/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createInitialCharacterState,
  createInitialCameraState,
  stepCharacterKinematics,
  stepCameraRig,
  getCurrentZoneName,
  CameraPerspective,
  LightingPresetId,
  GaitState,
} from './game/rules';
import { createAcademyTextureLibrary } from './game/textures';
import { buildAnimeStudentCharacter, updateCharacterAnimation } from './game/characterModel';
import { buildAoyamaCourtyard, CourtyardEnvironment } from './game/courtyardScene';
import { soundEngine } from './game/sound';
import { TitleScreen } from './components/TitleScreen';
import { CourtyardHud } from './components/CourtyardHud';
import { StatusAndUnityModal } from './components/StatusAndUnityModal';

type AppShellState = 'title' | 'playing' | 'paused';

const LIGHTING_ORDER: LightingPresetId[] = ['spring_morning', 'golden_sunset', 'sakura_twilight'];

export default function App() {
  const initialShellState: AppShellState = (() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('title') === '1') return 'title';
    }
    return 'playing';
  })();

  const [shellState, setShellState] = useState<AppShellState>(initialShellState);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraPerspective>('third_person');
  const [lightingPreset, setLightingPreset] = useState<LightingPresetId>('spring_morning');
  const [isMuted, setIsMuted] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Throttled HUD readouts (only updated when rounded values actually change)
  const [hudZone, setHudZone] = useState('Sakura Stone Promenade');
  const [hudGait, setHudGait] = useState<GaitState>('idle');
  const [hudCoords, setHudCoords] = useState<{ x: number; z: number }>({ x: 0, z: 22 });
  const lastHudValuesRef = useRef<{ zone: string; gait: GaitState; rx: number; rz: number }>({
    zone: 'Sakura Stone Promenade',
    gait: 'idle',
    rx: 0,
    rz: 22,
  });

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const staminaBarRef = useRef<HTMLDivElement | null>(null);

  // Mutable simulation refs shared with the 60Hz loop without re-mounting WebGL
  const shellStateRef = useRef<AppShellState>(initialShellState);
  const statusModalOpenRef = useRef<boolean>(false);
  const charStateRef = useRef(createInitialCharacterState());
  const camStateRef = useRef(createInitialCameraState());
  const courtyardEnvRef = useRef<CourtyardEnvironment | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Unified input state refs
  const keysHeldRef = useRef<Set<string>>(new Set());
  const jumpJustPressedRef = useRef<boolean>(false);
  const touchMoveRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const touchSprintRef = useRef<boolean>(false);
  const pointerLookDeltaRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 0 });

  // Sync dataset.state on <body> for automated verification & accessibility
  useEffect(() => {
    shellStateRef.current = shellState;
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    statusModalOpenRef.current = statusModalOpen;
  }, [statusModalOpen]);

  const handleStartPlaying = useCallback(() => {
    keysHeldRef.current.clear();
    pointerLookDeltaRef.current = { x: 0, y: 0, zoom: 0 };
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    shellStateRef.current = 'playing';
    setShellState('playing');
    soundEngine.playUiSwitch();
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    const nextMode: CameraPerspective =
      camStateRef.current.mode === 'third_person' ? 'first_person' : 'third_person';
    camStateRef.current.mode = nextMode;
    if (nextMode === 'first_person') {
      camStateRef.current.yaw = charStateRef.current.yaw;
      camStateRef.current.pitch = 0.04;
    } else {
      camStateRef.current.pitch = 0.22;
    }
    setCameraMode(nextMode);
    soundEngine.playUiSwitch();
  }, []);

  const handleSelectLightingPreset = useCallback((preset: LightingPresetId) => {
    setLightingPreset(preset);
    if (courtyardEnvRef.current && sceneRef.current && rendererRef.current) {
      courtyardEnvRef.current.applyLightingPreset(preset, sceneRef.current, rendererRef.current);
    }
    soundEngine.playUiSwitch();
  }, []);

  const handleResetSpawn = useCallback(() => {
    charStateRef.current = createInitialCharacterState();
    camStateRef.current = {
      ...createInitialCameraState(),
      mode: camStateRef.current.mode,
    };
    setHudCoords({ x: 0, z: 22 });
    setHudZone('Sakura Stone Promenade');
    soundEngine.playUiSwitch();
  }, []);

  const handleFocusLandmark = useCallback(
    (landmark: 'student' | 'clock_tower' | 'gate' | 'plaza') => {
      const ch = charStateRef.current;
      const cam = camStateRef.current;
      cam.mode = 'third_person';
      setCameraMode('third_person');

      if (landmark === 'student') {
        cam.yaw = ch.yaw + Math.PI - 0.28;
        cam.pitch = 0.06;
        cam.targetDistance = 1.85;
        cam.distance = 1.85;
      } else if (landmark === 'plaza') {
        ch.x = 0;
        ch.y = 0;
        ch.z = 5.6;
        ch.yaw = 0;
        cam.yaw = 0.35;
        cam.pitch = 0.22;
        cam.targetDistance = 4.6;
        cam.distance = 4.6;
      } else if (landmark === 'clock_tower') {
        ch.x = 0;
        ch.y = 0;
        ch.z = -11.5;
        ch.yaw = 0;
        cam.yaw = 0;
        cam.pitch = -0.14;
        cam.targetDistance = 5.4;
        cam.distance = 5.4;
      } else if (landmark === 'gate') {
        ch.x = 0;
        ch.y = 0;
        ch.z = 30.5;
        ch.yaw = 0;
        cam.yaw = 0;
        cam.pitch = 0.2;
        cam.targetDistance = 4.8;
        cam.distance = 4.8;
      }
      const anchorY = ch.y + 1.38;
      cam.currentX = ch.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.distance;
      cam.currentY = anchorY + Math.sin(cam.pitch) * cam.distance;
      cam.currentZ = ch.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.distance;
      cam.lookAtX = ch.x;
      cam.lookAtY = anchorY;
      cam.lookAtZ = ch.z;
      soundEngine.playUiSwitch();
    },
    []
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Mount WebGLRenderer & Aoyama Academy 3D Scene once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          preserveDrawingBuffer: true,
        });
      } catch (err) {
        setWebglError(err instanceof Error ? err.message : 'WebGL initialization failed.');
        return;
      }
    }

    const initW = Math.max(320, mountEl.clientWidth || window.innerWidth || 1024);
    const initH = Math.max(240, mountEl.clientHeight || window.innerHeight || 768);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Studio RoomEnvironment reflection map wrapped in try/catch for mobile GPU resilience
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback if float render targets are unsupported on legacy mobile GPU
    }

    const camera = new THREE.PerspectiveCamera(55, initW / initH, 0.1, 180);

    // Build Procedural & Image Texture Library
    const textures = createAcademyTextureLibrary(renderer);

    // Build Aoyama Academy Courtyard Environment
    const courtyardEnv = buildAoyamaCourtyard(scene, renderer, textures, isSoftwareGl);
    courtyardEnvRef.current = courtyardEnv;

    // Build Rigged 3D Anime Student Character ("Haruka Aoyama")
    const studentRig = buildAnimeStudentCharacter(textures);
    scene.add(studentRig.root);

    // Resize listener — immediately re-render so resize never leaves a cleared buffer
    const handleResize = () => {
      const w = Math.max(320, mountEl.clientWidth || window.innerWidth || 1024);
      const h = Math.max(240, mountEl.clientHeight || window.innerHeight || 768);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);

    // Multi-touch safe Pointer Drag Orbit & Wheel Zoom on Canvas
    let lookPointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (lookPointerId !== null) return;
      lookPointerId = e.pointerId;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== lookPointerId) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      pointerLookDeltaRef.current.x += dx * 0.0055;
      pointerLookDeltaRef.current.y += dy * 0.0045;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === lookPointerId) {
        lookPointerId = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (shellStateRef.current !== 'playing') return;
      pointerLookDeltaRef.current.zoom += e.deltaY * 0.0025;
    };

    const domCanvas = renderer.domElement;
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    domCanvas.addEventListener('webglcontextlost', onContextLost);
    domCanvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    domCanvas.addEventListener('wheel', onWheel, { passive: true });

    // Animation & Simulation Loop (with software-WebGL fenceSync pacing)
    let frameId = 0;
    let lastTime = performance.now();
    let elapsedTotal = 0;
    let lastHudSync = 0;
    let lastStaminaTransform = 'scaleX(1.000)';

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      const now = performance.now();
      const rawDt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const activeShell = shellStateRef.current;

      if (activeShell === 'title') {
        elapsedTotal += rawDt;
        courtyardEnv.updateAtmosphere(rawDt, elapsedTotal);
        updateCharacterAnimation(studentRig, charStateRef.current, elapsedTotal, false);

        const sway = Math.sin(elapsedTotal * 0.45) * 0.45;
        camera.position.set(
          -1.15 + sway * 0.3,
          1.48,
          charStateRef.current.z + 2.45
        );
        camera.lookAt(-0.45, 1.42, charStateRef.current.z - 6.0);
      } else if (activeShell === 'playing' && !statusModalOpenRef.current) {
        elapsedTotal += rawDt;

        const keys = keysHeldRef.current;
        let moveX = touchMoveRef.current.x;
        let moveZ = touchMoveRef.current.z;

        if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) moveZ -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) moveZ += 1;

        if (keys.has('KeyQ')) pointerLookDeltaRef.current.x -= 1.8 * rawDt;
        if (keys.has('KeyE')) pointerLookDeltaRef.current.x += 1.8 * rawDt;

        const sprintHeld =
          keys.has('ShiftLeft') || keys.has('ShiftRight') || touchSprintRef.current;
        const jumpHeld = keys.has('Space');
        const jumpJustPressed = jumpJustPressedRef.current;
        jumpJustPressedRef.current = false;

        if (jumpJustPressed && charStateRef.current.grounded) {
          soundEngine.playJump();
        }

        charStateRef.current = stepCharacterKinematics(
          charStateRef.current,
          {
            moveX,
            moveZ,
            sprintHeld,
            jumpJustPressed,
            jumpHeld,
            cameraYaw: camStateRef.current.yaw,
          },
          rawDt
        );

        camStateRef.current = stepCameraRig(
          camStateRef.current,
          charStateRef.current,
          pointerLookDeltaRef.current.x,
          pointerLookDeltaRef.current.y,
          pointerLookDeltaRef.current.zoom,
          rawDt
        );
        pointerLookDeltaRef.current.x = 0;
        pointerLookDeltaRef.current.y = 0;
        pointerLookDeltaRef.current.zoom = 0;

        camera.position.set(
          camStateRef.current.currentX,
          camStateRef.current.currentY,
          camStateRef.current.currentZ
        );
        camera.lookAt(
          camStateRef.current.lookAtX,
          camStateRef.current.lookAtY,
          camStateRef.current.lookAtZ
        );
        if (Math.abs(camera.fov - camStateRef.current.fov) > 0.05) {
          camera.fov = camStateRef.current.fov;
          camera.updateProjectionMatrix();
        }

        const isFirstPerson = camStateRef.current.mode === 'first_person';
        updateCharacterAnimation(
          studentRig,
          charStateRef.current,
          elapsedTotal,
          isFirstPerson,
          (isRunning) => {
            const onStone =
              Math.abs(charStateRef.current.x) < 4.2 ||
              Math.abs(charStateRef.current.z) < 3.0 ||
              Math.hypot(charStateRef.current.x, charStateRef.current.z) < 9.0;
            soundEngine.playFootstep(onStone, isRunning);
          }
        );
        courtyardEnv.updateAtmosphere(rawDt, elapsedTotal);

        if (staminaBarRef.current) {
          const ratio = Math.max(0, Math.min(1, charStateRef.current.stamina / 100));
          const nextTransform = `scaleX(${ratio.toFixed(3)})`;
          if (nextTransform !== lastStaminaTransform) {
            lastStaminaTransform = nextTransform;
            staminaBarRef.current.style.transform = nextTransform;
          }
        }

        if (now - lastHudSync > 160) {
          lastHudSync = now;
          const c = charStateRef.current;
          const nextZone = getCurrentZoneName(c.x, c.z);
          const rx = Math.round(c.x);
          const rz = Math.round(c.z);
          const prev = lastHudValuesRef.current;
          if (nextZone !== prev.zone) {
            prev.zone = nextZone;
            setHudZone(nextZone);
          }
          if (c.gait !== prev.gait) {
            prev.gait = c.gait;
            setHudGait(c.gait);
          }
          if (rx !== prev.rx || rz !== prev.rz) {
            prev.rx = rx;
            prev.rz = rz;
            setHudCoords({ x: rx, z: rz });
          }
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      domCanvas.removeEventListener('webglcontextlost', onContextLost);
      domCanvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      domCanvas.removeEventListener('wheel', onWheel);
      textures.dispose();
      renderer.dispose();
    };
  }, []);

  // Global Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (shellStateRef.current === 'title' && !statusModalOpenRef.current) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartPlaying();
          return;
        }
      }

      if (e.code === 'Escape') {
        if (statusModalOpenRef.current) {
          setStatusModalOpen(false);
          return;
        }
        if (shellStateRef.current === 'playing') {
          setShellState('paused');
          return;
        }
        if (shellStateRef.current === 'paused') {
          setShellState('playing');
          return;
        }
      }

      if (e.code === 'KeyP' && !statusModalOpenRef.current && shellStateRef.current !== 'title') {
        setShellState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (e.code === 'KeyI') {
        setStatusModalOpen((prev) => !prev);
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (shellStateRef.current !== 'playing' || statusModalOpenRef.current) return;

      if (e.code === 'KeyV') {
        handleToggleCameraMode();
        return;
      }

      if (e.code === 'KeyL') {
        setLightingPreset((prev) => {
          const nextIdx = (LIGHTING_ORDER.indexOf(prev) + 1) % LIGHTING_ORDER.length;
          const nextPreset = LIGHTING_ORDER[nextIdx];
          if (courtyardEnvRef.current && sceneRef.current && rendererRef.current) {
            courtyardEnvRef.current.applyLightingPreset(
              nextPreset,
              sceneRef.current,
              rendererRef.current
            );
          }
          return nextPreset;
        });
        soundEngine.playUiSwitch();
        return;
      }

      if (e.code === 'KeyR') {
        handleResetSpawn();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        jumpJustPressedRef.current = true;
      }

      keysHeldRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onBlurOrVisibility = () => {
      keysHeldRef.current.clear();
      touchMoveRef.current = { x: 0, z: 0 };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurOrVisibility);
    document.addEventListener('visibilitychange', onBlurOrVisibility);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurOrVisibility);
      document.removeEventListener('visibilitychange', onBlurOrVisibility);
    };
  }, [
    handleStartPlaying,
    handleToggleCameraMode,
    handleResetSpawn,
    handleToggleMute,
  ]);

  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-[#0e131f] select-none">
      {/* Isolated WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="courtyard-webgl-canvas"
        style={{ touchAction: 'none' }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Fallback Banner if WebGL is disabled on device */}
      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0e131f] text-white">
          <div className="max-w-md p-6 rounded-xl bg-slate-900 border border-slate-700 text-center space-y-3">
            <h2 className="text-lg font-semibold">3D WebGL Context Unavailable</h2>
            <p className="text-xs text-slate-300">{webglError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#f472b6] text-slate-950 font-semibold text-xs"
            >
              Reload Application
            </button>
          </div>
        </div>
      )}

      {/* Title Screen Overlay */}
      {shellState === 'title' && (
        <TitleScreen
          onStart={handleStartPlaying}
          onOpenStatusReport={() => setStatusModalOpen(true)}
        />
      )}

      {/* Playing HUD Overlay */}
      {shellState === 'playing' && (
        <CourtyardHud
          zoneName={hudZone}
          gait={hudGait}
          coords={hudCoords}
          cameraMode={cameraMode}
          lightingPreset={lightingPreset}
          isMuted={isMuted}
          staminaBarRef={staminaBarRef}
          onToggleCameraMode={handleToggleCameraMode}
          onSelectLightingPreset={handleSelectLightingPreset}
          onResetSpawn={handleResetSpawn}
          onFocusLandmark={handleFocusLandmark}
          onToggleMute={handleToggleMute}
          onTogglePause={() => setShellState('paused')}
          onOpenStatusReport={() => setStatusModalOpen(true)}
          onTouchMoveInput={(dx, dz) => {
            touchMoveRef.current = { x: dx, z: dz };
          }}
          onTouchSprintChange={(active) => {
            touchSprintRef.current = active;
          }}
          onTouchJump={() => {
            jumpJustPressedRef.current = true;
          }}
        />
      )}

      {/* Pause Modal Card */}
      {shellState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10, 14, 24, 0.78)' }}
        >
          <div className="w-full max-w-md rounded-xl bg-[#111827] border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="text-xs font-semibold tracking-widest text-[#fbcfe8]">
              AOYAMA ACADEMY · SIMULATION PAUSED
            </div>
            <h2 id="pause-modal-title" className="font-display text-2xl font-bold text-white mt-1">
              Courtyard Exploration Paused
            </h2>

            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3 rounded-lg bg-[#172033] border border-slate-800">
                <div className="text-[11px] text-slate-400">CURRENT ZONE</div>
                <div className="text-xs font-semibold text-white mt-0.5 truncate">{hudZone}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#172033] border border-slate-800">
                <div className="text-[11px] text-slate-400">COORDINATES</div>
                <div className="text-xs font-mono-tabular font-semibold text-white mt-0.5">
                  X: {Math.round(hudCoords.x)}m · Z: {Math.round(hudCoords.z)}m
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShellState('playing')}
                className="w-full py-2.5 rounded-lg bg-[#f472b6] hover:bg-[#ec4899] text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Resume Exploration [Esc / P]
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetSpawn();
                  setShellState('playing');
                }}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm transition-colors cursor-pointer"
              >
                Reset to South Entrance Gate
              </button>
              <button
                type="button"
                onClick={() => setStatusModalOpen(true)}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 font-medium text-sm transition-colors cursor-pointer"
              >
                View Phase 1 Status &amp; Unity 6 URP Code
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="w-full py-2.5 rounded-lg bg-transparent hover:bg-slate-800/60 text-slate-300 font-medium text-sm border border-slate-700 transition-colors cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 1 Status Report & Unity 6 URP Source Modal */}
      <StatusAndUnityModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
    </main>
  );
}
