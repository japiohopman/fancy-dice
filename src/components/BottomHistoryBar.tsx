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
    <footer className="w-full h-auto bg-[#181412] border-t border-[#3d3329] px-3 sm:px-5 py-2 flex flex-col gap-1.5 shadow-xl z-20 shrink-0 select-none">
      {/* Top Row: Label and Clear Button */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-xs font-title font-bold text-[#a38c5e] tracking-wider">
          <History className="w-3.5 h-3.5 text-[#a38c5e]" />
          <span>ROLL HISTORY TICKER</span>
        </div>

        {/* Clear History Button */}
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-2.5 py-0.5 rounded-lg bg-[#241e1a] hover:bg-rose-900/40 text-[#d4c3a1]/70 hover:text-rose-300 border border-[#3d3329] transition-all flex items-center gap-1.5 text-[10px] font-title font-bold cursor-pointer"
            title="Clear session history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Ticker of History Chips */}
      <div className="w-full flex items-center min-h-0">
        <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {history.length === 0 ? (
            <span className="text-[11px] font-serif italic text-[#d4c3a1]/50 py-0.5">
              No dice rolled yet in this session. Stage dice, select presets, or shake your device to roll!
            </span>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onReroll(entry.result.rawFormula)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
                  entry.result.isCrit
                    ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#a38c5e] shadow-md'
                    : entry.result.isFumble
                    ? 'bg-rose-950/30 text-rose-300 border-rose-800'
                    : 'bg-[#241e1a] text-[#f4ead5] border-[#3d3329] hover:border-[#a38c5e]'
                }`}
                title={`Re-roll ${entry.result.rawFormula}`}
              >
                <span className="text-[#d4c3a1]/70 font-normal text-[10px]">
                  {entry.presetName ? `${entry.presetName}:` : entry.result.rawFormula}
                </span>
                <span className="text-[#a38c5e]">➔</span>
                <span className="font-black text-xs text-[#f4ead5]">{entry.result.total}</span>

                {entry.result.isCrit && <Trophy className="w-3 h-3 text-amber-300 animate-bounce" />}
                {entry.result.isFumble && <AlertCircle className="w-3 h-3 text-rose-400" />}
              </button>
            ))
          )}
        </div>
      </div>
    </footer>
  );
};
