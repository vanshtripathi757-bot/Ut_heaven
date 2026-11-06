import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenStatusReport: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onOpenStatusReport }) => {
  return (
    <div
      onClick={onStart}
      className="fixed inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 md:p-14 cursor-pointer"
      style={{
        background:
          'linear-gradient(90deg, rgba(10, 14, 24, 0.84) 0%, rgba(10, 14, 24, 0.58) 40%, rgba(10, 14, 24, 0.08) 70%)',
      }}
    >
      {/* Top Minimal Spec Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs tracking-wider text-white hud-stroke">
        <span>AOYAMA PRIVATE ACADEMY · TOKYO WARD 03</span>
        <span className="font-mono-tabular text-white">PHASE 1 VISUAL BUILD · URP ARCHITECTURE</span>
      </div>

      {/* Left-Third Negative Space Title Lockup */}
      <div className="max-w-xl my-auto">
        {/* Custom Inline SVG Academy Sakura Crest & Lockup */}
        <div className="flex items-center gap-3.5 sm:gap-4 mb-4 sm:mb-5">
          <svg
            viewBox="0 0 64 64"
            className="w-12 h-12 sm:w-14 sm:h-14 shrink-0"
            aria-hidden="true"
          >
            <polygon
              points="32,4 56,16 56,42 32,60 8,42 8,16"
              fill="#162038"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <polygon
              points="32,9 51,19 51,39 32,54 13,39 13,19"
              fill="none"
              stroke="#f472b6"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
            <g transform="translate(32, 31)" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1.2">
              <path d="M0,-14 C4,-10 5,-4 0,0 C-5,-4 -4,-10 0,-14 Z" />
              <path d="M0,-14 C4,-10 5,-4 0,0 C-5,-4 -4,-10 0,-14 Z" transform="rotate(72)" />
              <path d="M0,-14 C4,-10 5,-4 0,0 C-5,-4 -4,-10 0,-14 Z" transform="rotate(144)" />
              <path d="M0,-14 C4,-10 5,-4 0,0 C-5,-4 -4,-10 0,-14 Z" transform="rotate(216)" />
              <path d="M0,-14 C4,-10 5,-4 0,0 C-5,-4 -4,-10 0,-14 Z" transform="rotate(288)" />
              <circle cx="0" cy="0" r="3.2" fill="#fbbf24" stroke="none" />
            </g>
          </svg>
          <div>
            <div className="text-[11px] sm:text-xs font-medium tracking-widest text-[#fbcfe8]">
              青山学園クロニクル · PHASE 1 DELIVERABLE
            </div>
            <h1
              className="font-display text-2xl sm:text-5xl font-bold tracking-tight text-white mt-0.5"
              style={{ textWrap: 'balance' }}
            >
              The School Chronicles
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-lg mb-6 sm:mb-8">
          Explore the playable 3D Aoyama Academy courtyard featuring realistic Japanese campus
          architecture, blossoming sakura promenades, dynamic time-of-day lighting, and the
          fully rigged anime student protagonist <strong className="text-white font-semibold">Haruka Aoyama</strong> in smooth third-person or first-person perspective.
        </p>

        {/* Primary & Secondary Actions (<= 3 actions total) */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onStart();
            }}
            className="min-h-[44px] px-6 py-3 rounded-lg bg-[#f472b6] hover:bg-[#ec4899] active:scale-[0.99] text-slate-950 font-semibold text-sm tracking-wide shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Enter Academy Courtyard
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onOpenStatusReport();
            }}
            className="min-h-[44px] px-5 py-3 rounded-lg bg-[#162038]/95 hover:bg-[#1e2b4a] text-slate-100 border border-slate-600/70 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Phase 1 Status &amp; Unity 6 URP Code
          </button>
        </div>
      </div>

      {/* Flat Borderless Control Hint Line in Bottom Safe Margin */}
      <div className="text-[11px] sm:text-xs text-slate-200 tracking-wide hud-stroke">
        Tap Anywhere or Press Enter to Start · WASD / Thumbstick Move · Shift Sprint · Space Jump · Drag Screen to Orbit Camera · V 3rd/1st Person
      </div>
    </div>
  );
};
