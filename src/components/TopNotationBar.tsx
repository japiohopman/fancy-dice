import React from 'react';
import { ChevronDown, Menu, Play, Sparkles, X } from 'lucide-react';

interface TopNotationBarProps {
  currentFormula: string;
  onOpenDiceBuilder: () => void;
  setNotationTrigger: (element: HTMLButtonElement | null) => void;
  onRoll: (formula: string) => void;
  isRolling: boolean;
  onToggleMenu: (trigger: HTMLButtonElement) => void;
  menuOpen: boolean;
  diceBuilderOpen: boolean;
  formulaError?: string | null;
}

/** Shows the next-roll formula as a summary and opens the dedicated dice editor. */
export const TopNotationBar: React.FC<TopNotationBarProps> = ({
  currentFormula,
  onOpenDiceBuilder,
  setNotationTrigger,
  onRoll,
  isRolling,
  onToggleMenu,
  menuOpen,
  diceBuilderOpen,
  formulaError,
}) => {
  return (
    <header className="ui-chrome-bar z-30 flex w-full shrink-0 select-none items-center gap-2 border-b px-3 py-2 shadow-md sm:gap-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button
            ref={setNotationTrigger}
            type="button"
            onClick={onOpenDiceBuilder}
            aria-label={`Edit dice selection. Current roll: ${currentFormula || 'none selected'}`}
            aria-haspopup="dialog"
            aria-expanded={diceBuilderOpen}
            aria-controls="dice-builder-dialog"
            className={`ui-field flex w-full min-w-0 cursor-pointer items-center px-3 text-left ${formulaError ? 'border-rose-500/70' : ''}`}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 shrink-0 text-[#c5a66b]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm font-mono font-bold tracking-wide text-[#f4ead5]">
              {currentFormula || 'Choose dice to roll'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[#a38c5e]" aria-hidden="true" />
          </button>
          {formulaError && (
            <span role="alert" className="px-1 text-[10px] leading-tight text-rose-300">
              {formulaError}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRoll(currentFormula)}
          disabled={isRolling || !currentFormula.trim()}
          className="desktop-roll-button ui-button ui-button--primary shrink-0 px-4 uppercase tracking-wider"
        >
          <Play className="h-3.5 w-3.5 fill-current text-amber-200" aria-hidden="true" />
          <span>{isRolling ? 'Rolling…' : 'Roll'}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={(event) => onToggleMenu(event.currentTarget)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        title="Menu"
        className="ui-button ui-button--quiet shrink-0 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b]"
      >
        {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        <span className="font-title text-[10px] font-bold uppercase tracking-wider">Menu</span>
      </button>
    </header>
  );
};
