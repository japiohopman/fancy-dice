import React from 'react';
import { RollHistoryEntry } from '../types';
import { History, Trash2, Trophy, AlertCircle } from 'lucide-react';

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
    <footer className="w-full h-32 bg-[#181412] border-t border-[#3d3329] px-6 py-3 flex flex-col justify-between shadow-inner z-20 shrink-0 select-none">
      {/* Top Row: Label and Clear Button */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8c7851] tracking-wider font-display">
          <History className="w-3.5 h-3.5 text-[#8c7851]" />
          <span>ROLL HISTORY TICKER</span>
        </div>

        {/* Clear History Button */}
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-2.5 py-1 rounded-lg bg-[#241e1a] hover:bg-rose-900/40 text-[#d4c3a1]/60 hover:text-rose-300 border border-[#3d3329] transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
            title="Clear history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Ticker of History Chips */}
      <div className="w-full flex-1 flex items-center min-h-0">
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {history.length === 0 ? (
            <span className="text-[11px] italic text-[#d4c3a1]/45 py-0.5">
              No dice rolled yet in this session. Staged dice, select presets, or shake your phone to roll!
            </span>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onReroll(entry.result.rawFormula)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm ${
                  entry.result.isCrit
                    ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#8c7851] shadow-md'
                    : entry.result.isFumble
                    ? 'bg-rose-900/30 text-rose-300 border-rose-800'
                    : 'bg-[#241e1a] text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]'
                }`}
                title={`Re-roll ${entry.result.rawFormula}`}
              >
                <span className="text-[#d4c3a1]/60 font-normal text-[10px]">
                  {entry.presetName ? `${entry.presetName}:` : entry.result.rawFormula}
                </span>
                <span className="text-[#8c7851]">➔</span>
                <span className="font-black text-xs text-[#f4ead5]">{entry.result.total}</span>

                {entry.result.isCrit && <Trophy className="w-3 h-3 text-[#8c7851] animate-bounce" />}
                {entry.result.isFumble && <AlertCircle className="w-3 h-3 text-rose-400" />}
              </button>
            ))
          )}
        </div>
      </div>
    </footer>
  );
};
