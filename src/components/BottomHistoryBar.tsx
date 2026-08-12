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
    <footer className="w-full h-48 bg-[#181412] border-t border-[#3d3329] px-6 py-4 flex flex-col justify-between shadow-inner z-20 shrink-0 select-none">
      {/* Top Row: Label and Clear Button */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8c7851] tracking-wider font-display">
          <History className="w-4 h-4 text-[#8c7851]" />
          <span>ROLL HISTORY TICKER</span>
        </div>

        {/* Clear History Button */}
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 rounded-xl bg-[#241e1a] hover:bg-rose-900/40 text-[#d4c3a1]/60 hover:text-rose-300 border border-[#3d3329] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Ticker of History Chips */}
      <div className="w-full flex-1 flex items-center min-h-0">
        <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {history.length === 0 ? (
            <span className="text-xs italic text-[#d4c3a1]/45 py-1">
              No dice rolled yet in this session. Staged dice, select presets, or shake your phone to roll!
            </span>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onReroll(entry.result.rawFormula)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm ${
                  entry.result.isCrit
                    ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#8c7851] shadow-md'
                    : entry.result.isFumble
                    ? 'bg-rose-900/30 text-rose-300 border-rose-800'
                    : 'bg-[#241e1a] text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]'
                }`}
                title={`Re-roll ${entry.result.rawFormula}`}
              >
                <span className="text-[#d4c3a1]/60 font-normal text-[11px]">
                  {entry.presetName ? `${entry.presetName}:` : entry.result.rawFormula}
                </span>
                <span className="text-[#8c7851]">➔</span>
                <span className="font-black text-sm text-[#f4ead5]">{entry.result.total}</span>

                {entry.result.isCrit && <Trophy className="w-3.5 h-3.5 text-[#8c7851] animate-bounce" />}
                {entry.result.isFumble && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            ))
          )}
        </div>
      </div>
    </footer>
  );
};
