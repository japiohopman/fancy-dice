import React from 'react';
import { RollHistoryEntry } from '../types';
import { History, RotateCcw, Trash2, Trophy, AlertCircle, Sparkles } from 'lucide-react';

interface BottomHistoryBarProps {
  history: RollHistoryEntry[];
  onReroll: (formula: string) => void;
  onClearHistory: () => void;
}

export const BottomHistoryBar: React.FC<BottomHistoryBarProps> = ({
  history,
  onReroll,
  onClearHistory,
}) => {
  return (
    <footer className="w-full bg-[#181412] border-t border-[#3d3329] px-3 py-1.5 flex items-center justify-between gap-2 shadow-inner z-20 shrink-0 select-none h-12">
      {/* Label */}
      <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-[#8c7851]">
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-display tracking-wider">ROLL HISTORY</span>
      </div>

      {/* Ticker of History Chips */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
        {history.length === 0 ? (
          <span className="text-[11px] italic text-[#d4c3a1]/40">
            No dice rolled yet. Roll a formula or shake phone!
          </span>
        ) : (
          history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onReroll(entry.result.rawFormula)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono font-bold shrink-0 transition-all hover:scale-105 active:scale-95 ${
                entry.result.isCrit
                  ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#8c7851] shadow-sm'
                  : entry.result.isFumble
                  ? 'bg-rose-900/30 text-rose-300 border-rose-800'
                  : 'bg-[#241e1a] text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]'
              }`}
              title={`Re-roll ${entry.result.rawFormula}`}
            >
              <span className="text-[#d4c3a1]/70 font-normal text-[11px]">
                {entry.presetName ? `${entry.presetName}:` : entry.result.rawFormula}
              </span>
              <span className="text-[#8c7851]">➔</span>
              <span className="font-extrabold text-[#f4ead5]">{entry.result.total}</span>

              {entry.result.isCrit && <Trophy className="w-3 h-3 text-[#8c7851]" />}
              {entry.result.isFumble && <AlertCircle className="w-3 h-3 text-rose-400" />}
            </button>
          ))
        )}
      </div>

      {/* Clear History Button */}
      {history.length > 0 && (
        <button
          onClick={onClearHistory}
          className="p-1.5 rounded-lg bg-[#241e1a] hover:bg-rose-900/40 text-[#d4c3a1]/50 hover:text-rose-300 border border-[#3d3329] transition-colors shrink-0"
          title="Clear history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </footer>
  );
};
