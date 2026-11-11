import React from 'react';
import { RollHistoryEntry } from '../types';
import { History, Trash2, Trophy, AlertCircle } from 'lucide-react';

interface BottomHistoryBarProps {
  history: RollHistoryEntry[];
  onReroll: (formula: string) => void;
  onClearHistory: () => void;
}

/** Displays a slim, single-row history strip beneath the dice table. */
export const BottomHistoryBar: React.FC<BottomHistoryBarProps> = ({
  history,
  onReroll,
  onClearHistory,
}) => {
  return (
    <footer className="ui-chrome-bar z-20 flex h-11 w-full shrink-0 select-none items-center gap-2 border-t px-2 sm:px-4">
      <History className="h-4 w-4 shrink-0 text-[#a38c5e]" aria-label="Roll history" />
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 no-scrollbar" aria-label="Recent rolls">
        {history.length === 0 ? (
          <span className="px-1 text-[10px] italic text-[#d4c3a1]/45">No rolls yet</span>
        ) : (
          history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onReroll(entry.result.rawFormula)}
              className={`ui-history-chip ${entry.result.isCrit ? 'ui-history-chip--critical' : entry.result.isFumble ? 'ui-history-chip--fumble' : ''}`}
              title={`Re-roll ${entry.result.rawFormula}`}
            >
              <span className="max-w-24 truncate text-[#d4c3a1]/70 font-normal">
                {entry.presetName || entry.result.rawFormula}
              </span>
              <span className="text-[#a38c5e]" aria-hidden="true">→</span>
              <span className="text-xs font-black">{entry.result.total}</span>
              {entry.result.isCrit && <Trophy className="h-3 w-3 text-amber-300" aria-label="Critical roll" />}
              {entry.result.isFumble && <AlertCircle className="h-3 w-3 text-rose-400" aria-label="Fumble" />}
            </button>
          ))
        )}
      </div>
      {history.length > 0 && (
        <button
          type="button"
          onClick={onClearHistory}
          aria-label="Clear roll history"
          title="Clear roll history"
          className="ui-icon-button ui-icon-button--danger shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b]"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </footer>
  );
};
