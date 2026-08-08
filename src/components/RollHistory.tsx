import React, { useState } from 'react';
import { RollHistoryEntry } from '../types';
import { History, BarChart2, Trash2, RotateCcw, Trophy, AlertCircle } from 'lucide-react';

interface RollHistoryProps {
  history: RollHistoryEntry[];
  onReroll: (formula: string) => void;
  onClearHistory: () => void;
}

export const RollHistory: React.FC<RollHistoryProps> = ({
  history,
  onReroll,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'stats'>('log');

  // Calculate Roll Statistics
  const totalRolls = history.length;
  const averageRoll = totalRolls > 0
    ? Math.round((history.reduce((sum, h) => sum + h.result.total, 0) / totalRolls) * 10) / 10
    : 0;

  const totalCrits = history.filter(h => h.result.isCrit).length;
  const totalFumbles = history.filter(h => h.result.isFumble).length;

  return (
    <div className="w-full bg-[#1f1b18]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#3d3329] shadow-xl flex flex-col gap-4">

      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-[#3d3329] pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#8c7851]" />
          <h2 className="font-semibold text-[#f4ead5] text-sm sm:text-base font-display tracking-wide">ROLL HISTORY</h2>
          {totalRolls > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#2d241e] text-[#d4c3a1] text-xs">
              {totalRolls}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-[#1a1714] p-1 rounded-xl border border-[#3d3329] text-xs">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'log'
                  ? 'bg-[#8c7851] text-white'
                  : 'text-[#d4c3a1] hover:text-[#f4ead5]'
              }`}
            >
              Log
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-[#8c7851] text-white'
                  : 'text-[#d4c3a1] hover:text-[#f4ead5]'
              }`}
            >
              Stats
            </button>
          </div>

          {totalRolls > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg bg-[#2d241e] text-[#d4c3a1] hover:text-rose-400 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'log' ? (
        /* History Log List */
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#d4c3a1]/60">
              No dice rolled yet in this session. Shake your phone or tap ROLL DICE!
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1a1714]/80 border border-[#3d3329] hover:border-[#8c7851] transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs text-[#f4ead5]">
                      {entry.result.rawFormula}
                    </span>
                    {entry.presetName && (
                      <span className="text-[10px] text-[#8c7851] bg-[#8c7851]/10 px-1.5 py-0.5 rounded border border-[#8c7851]/30">
                        {entry.presetName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#d4c3a1]/50">
                    {new Date(entry.result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {entry.result.isCrit && (
                      <Trophy className="w-3.5 h-3.5 text-[#8c7851]" />
                    )}
                    {entry.result.isFumble && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className={`font-mono font-bold text-base ${
                      entry.result.isCrit
                        ? 'text-[#f4ead5]'
                        : entry.result.isFumble
                        ? 'text-rose-400'
                        : 'text-[#d4c3a1]'
                    }`}>
                      {entry.result.total}
                    </span>
                  </div>

                  <button
                    onClick={() => onReroll(entry.result.rawFormula)}
                    className="p-1.5 rounded-lg bg-[#2d241e] text-[#d4c3a1] hover:text-[#f4ead5] hover:bg-[#3d3329] transition-colors"
                    title="Reroll formula"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Statistics Overview */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#3d3329] flex flex-col items-center">
            <span className="text-xs text-[#d4c3a1]/60">Total Rolls</span>
            <span className="text-2xl font-bold font-mono text-[#f4ead5]">{totalRolls}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#3d3329] flex flex-col items-center">
            <span className="text-xs text-[#d4c3a1]/60">Average Result</span>
            <span className="text-2xl font-bold font-mono text-[#8c7851]">{averageRoll}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#3d3329] flex flex-col items-center">
            <span className="text-xs text-[#d4c3a1]/60">Critical Hits</span>
            <span className="text-2xl font-bold font-mono text-[#f4ead5]">{totalCrits}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#3d3329] flex flex-col items-center">
            <span className="text-xs text-[#d4c3a1]/60">Fumbles</span>
            <span className="text-2xl font-bold font-mono text-rose-400">{totalFumbles}</span>
          </div>
        </div>
      )}
    </div>
  );
};
