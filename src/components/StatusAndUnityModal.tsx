import React, { useState } from 'react';
import { PHASE_1_STATUS_REPORT, UNITY_6_URP_SCRIPTS, ImplementationStatusTag } from '../game/unityScripts';

interface StatusAndUnityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusAndUnityModal: React.FC<StatusAndUnityModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'unity'>('status');
  const [selectedScriptIdx, setSelectedScriptIdx] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusColorMap: Record<ImplementationStatusTag, string> = {
    COMPLETE: 'text-emerald-300',
    'IN PROGRESS': 'text-amber-300',
    BLOCKED: 'text-rose-300',
    'NOT IMPLEMENTED': 'text-slate-400',
  };

  const currentScript = UNITY_6_URP_SCRIPTS[selectedScriptIdx];

  const handleCopyCode = (filename: string, code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedFile(filename);
    window.setTimeout(() => setCopiedFile(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase1-report-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 pointer-events-auto"
      style={{ backgroundColor: 'rgba(10, 14, 24, 0.82)' }}
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 id="phase1-report-title" className="text-lg font-semibold text-white">
              The School Chronicles — Phase 1 Technical Audit &amp; Unity 6 URP Source
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Honest engineering status distinguishing Complete, In Progress, Blocked, and Not Implemented deliverables
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Phase 1 Status Report"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#0d1320] border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'status'
                ? 'bg-[#f472b6] text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            Phase 1 Implementation Status Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unity')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'unity'
                ? 'bg-[#f472b6] text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white bg-slate-800/60'
            }`}
          >
            Unity 6 URP C# &amp; HLSL Source Files (4)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'status' ? (
            <div className="space-y-4">
              {PHASE_1_STATUS_REPORT.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-[#172033] border border-slate-800/90 flex flex-col gap-1.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{item.requirement}</h3>
                    <span className={`font-mono-tabular text-xs font-semibold ${statusColorMap[item.status]}`}>
                      STATUS: {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.evidenceAndNotes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {UNITY_6_URP_SCRIPTS.map((script, idx) => (
                    <button
                      key={script.filename}
                      type="button"
                      onClick={() => setSelectedScriptIdx(idx)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono-tabular transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedScriptIdx === idx
                          ? 'bg-slate-200 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {script.filename}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(currentScript.filename, currentScript.code)}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedFile === currentScript.filename ? 'Copied to Clipboard' : `Copy ${currentScript.filename}`}
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <span className="font-mono-tabular text-slate-300">{currentScript.folder}{currentScript.filename}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{currentScript.description}</span>
              </div>

              <pre className="p-4 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-mono-tabular text-slate-200 overflow-x-auto leading-relaxed">
                <code>{currentScript.code}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
