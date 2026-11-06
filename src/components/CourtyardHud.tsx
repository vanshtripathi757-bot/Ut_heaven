import React, { useRef, useState } from 'react';
import { CameraPerspective, LightingPresetId, LIGHTING_PRESETS, GaitState } from '../game/rules';

interface CourtyardHudProps {
  zoneName: string;
  gait: GaitState;
  coords: { x: number; z: number };
  cameraMode: CameraPerspective;
  lightingPreset: LightingPresetId;
  isMuted: boolean;
  staminaBarRef: React.RefObject<HTMLDivElement | null>;
  onToggleCameraMode: () => void;
  onSelectLightingPreset: (preset: LightingPresetId) => void;
  onResetSpawn: () => void;
  onFocusLandmark: (landmark: 'student' | 'clock_tower' | 'gate' | 'plaza') => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenStatusReport: () => void;
  onTouchMoveInput: (dx: number, dz: number) => void;
  onTouchSprintChange: (active: boolean) => void;
  onTouchJump: () => void;
}

export const CourtyardHud: React.FC<CourtyardHudProps> = ({
  zoneName,
  gait,
  coords,
  cameraMode,
  lightingPreset,
  isMuted,
  staminaBarRef,
  onToggleCameraMode,
  onSelectLightingPreset,
  onResetSpawn,
  onFocusLandmark,
  onToggleMute,
  onTogglePause,
  onOpenStatusReport,
  onTouchMoveInput,
  onTouchSprintChange,
  onTouchJump,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [sprintToggle, setSprintToggle] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const handleJoystickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors on synthetic touches
    }
    activePointerId.current = e.pointerId;
    updateJoystickFromEvent(e);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromEvent(e);
  };

  const handleJoystickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onTouchMoveInput(0, 0);
  };

  const updateJoystickFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(24, rect.width * 0.38);
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    onTouchMoveInput(dx / maxR, dy / maxR);
  };

  const gaitLabels: Record<GaitState, string> = {
    idle: 'STANDING',
    walk: 'WALKING',
    run: 'SPRINTING',
    jump: 'AIRBORNE',
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Row: Left Location/Vitality Cluster & Right Utility Cluster */}
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left World-Matched Academy Location & Stamina Cluster */}
        <div
          className="px-3.5 py-2.5 rounded-lg border border-slate-700/80 pointer-events-auto"
          style={{ backgroundColor: 'rgba(14, 19, 31, 0.88)' }}
        >
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#fbcfe8]">
            <span>AOYAMA ACADEMY</span>
            <span aria-hidden="true">·</span>
            <span>{LIGHTING_PRESETS[lightingPreset].name.toUpperCase()}</span>
          </div>
          <div className="text-xs sm:text-base font-semibold text-white mt-0.5">
            {zoneName}
          </div>

          {/* Stamina Bar + Tabular Coordinates */}
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400">STAMINA</span>
              <div className="w-20 sm:w-24 h-2 rounded-sm bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  ref={staminaBarRef}
                  className="h-full bg-[#f472b6] origin-left transition-none"
                  style={{ transform: 'scaleX(1)' }}
                />
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono-tabular text-slate-300">
              {gaitLabels[gait]} · X:{Math.round(coords.x)} Z:{Math.round(coords.z)}
            </span>
          </div>
        </div>

        {/* Top-Right Compact Utility Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCameraMode();
            }}
            aria-label="Toggle Camera Perspective"
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-semibold text-white hover:border-[#f472b6] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.88)' }}
          >
            {cameraMode === 'third_person' ? 'View: 3rd Person [V]' : 'View: 1st Person [V]'}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenStatusReport();
            }}
            aria-label="Open Phase 1 Implementation Status Report and Unity 6 URP Scripts"
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-400/50 text-xs font-semibold text-amber-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.88)' }}
          >
            Status &amp; Unity 6 URP [I]
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 rounded-lg border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.88)' }}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            aria-label="Pause Game"
            className="w-9 h-9 rounded-lg border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.88)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* First-Person Subtle Center Reticle */}
      {cameraMode === 'first_person' && (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/80 border border-slate-900" />
        </div>
      )}

      {/* Bottom Area: Mobile Virtual Joystick + Collapsible Unified Bottom Control Dock */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-2.5 sm:gap-4">
        {/* Mobile / Android Virtual Thumbstick & Action Pads */}
        <div className="flex items-center justify-between sm:justify-start gap-3 pointer-events-auto">
          <div
            ref={joystickBaseRef}
            onPointerDown={handleJoystickDown}
            onPointerMove={handleJoystickMove}
            onPointerUp={handleJoystickUp}
            onPointerCancel={handleJoystickUp}
            role="slider"
            aria-label="Virtual Movement Thumbstick"
            aria-valuenow={Math.round(knobOffset.x)}
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.78)', touchAction: 'none' }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-slate-500/70 flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none shrink-0"
          >
            <div className="text-[9px] font-semibold tracking-widest text-slate-400/70 pointer-events-none">
              MOVE
            </div>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#f472b6]/90 border-2 border-white shadow-md absolute pointer-events-none"
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              }}
            />
          </div>

          {/* Touch Action Buttons (Jump & Sprint Toggle) */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTouchJump();
              }}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-[#162038] border border-slate-600 text-xs font-semibold text-white active:bg-[#f472b6] active:text-slate-950"
            >
              Jump
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                const next = !sprintToggle;
                setSprintToggle(next);
                onTouchSprintChange(next);
              }}
              className={`min-h-[42px] px-4 py-2 rounded-lg border text-xs font-semibold ${
                sprintToggle
                  ? 'bg-[#f472b6] text-slate-950 border-white'
                  : 'bg-[#162038] text-slate-200 border-slate-600'
              }`}
            >
              {sprintToggle ? 'Sprint: ON' : 'Sprint: OFF'}
            </button>
          </div>
        </div>

        {/* Unified Bottom-Center Collapsible Control Dock (Visible on both Mobile & Desktop) */}
        <div className="mx-auto flex flex-col items-center pointer-events-auto max-w-full">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setDockCollapsed((prev) => !prev);
            }}
            className="px-3 py-1 rounded-t-lg border border-b-0 border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: 'rgba(14, 19, 31, 0.90)' }}
          >
            {dockCollapsed ? '▴ Show Courtyard Controls [H]' : '▾ Hide Controls [H]'}
          </button>

          {!dockCollapsed && (
            <div
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-center gap-2 sm:gap-3 shadow-2xl"
              style={{ backgroundColor: 'rgba(14, 19, 31, 0.92)' }}
            >
              {/* Lighting / Atmosphere Presets */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                {(Object.keys(LIGHTING_PRESETS) as LightingPresetId[]).map((presetKey) => {
                  const preset = LIGHTING_PRESETS[presetKey];
                  const active = lightingPreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectLightingPreset(presetKey);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#f472b6] text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Quick Courtyard Waypoint Teleport / Inspection (Visible on Mobile & Desktop) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onFocusLandmark('student');
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Inspect Character
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onFocusLandmark('plaza');
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Central Plaza
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onFocusLandmark('clock_tower');
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Main Hall Steps
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onResetSpawn();
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  South Gate Spawn [R]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacer for balanced layout on desktop */}
        <div className="hidden sm:block w-24 pointer-events-none" />
      </div>
    </div>
  );
};
