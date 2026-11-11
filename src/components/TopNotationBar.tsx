import React, { useState, useEffect } from 'react';
import { Menu, Play, Sparkles, X } from 'lucide-react';

interface TopNotationBarProps {
  currentFormula: string;
  onFormulaChange: (formula: string) => void;
  onRoll: (formula: string) => void;
  isRolling: boolean;
  onToggleMenu: (trigger: HTMLButtonElement) => void;
  menuOpen: boolean;
}

/** Places dice notation in the primary header; the visible Roll action is desktop-only. */
export const TopNotationBar: React.FC<TopNotationBarProps> = ({
  currentFormula,
  onFormulaChange,
  onRoll,
  isRolling,
  onToggleMenu,
  menuOpen,
}) => {
  const [inputVal, setInputVal] = useState<string>(currentFormula || '1d20');

  // Keep the editable value in sync with changes made elsewhere in the app.
  useEffect(() => {
    setInputVal(currentFormula);
  }, [currentFormula]);

  /** Normalizes the entered notation and submits it to the roll handler. */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalFormula = inputVal.trim() || '1d20';
    setInputVal(finalFormula);
    onFormulaChange(finalFormula);
    onRoll(finalFormula);
  };

  return (
    <header className="z-30 flex w-full shrink-0 select-none items-center gap-2 border-b border-[#3d3329] bg-[#1a1613] px-3 py-2 shadow-lg sm:gap-3 sm:px-5">
      {/* The notation field now occupies the old brand/logo position. */}
      <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center rounded-xl border border-[#3d3329] bg-[#12100e] px-2.5 shadow-inner transition-colors focus-within:border-[#a38c5e] sm:px-3">
          <Sparkles className="mr-2 h-3.5 w-3.5 shrink-0 text-[#a38c5e]" aria-hidden="true" />
          <input
            type="text"
            value={inputVal}
            onChange={(event) => {
              setInputVal(event.target.value);
              onFormulaChange(event.target.value);
            }}
            aria-label="Dice notation"
            placeholder="e.g. 1d20+5 or 4d6kh3"
            autoComplete="off"
            spellCheck={false}
            className="w-full min-w-0 bg-transparent text-xs font-mono font-bold tracking-wide text-[#f4ead5] placeholder:text-[#d4c3a1]/30 focus:outline-none sm:text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={isRolling}
          className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#a38c5e]/50 px-4 font-title text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all gold-gradient-bg hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
        >
          <Play className="h-3.5 w-3.5 fill-current text-amber-200" aria-hidden="true" />
          <span>{isRolling ? 'Rolling…' : 'Roll'}</span>
        </button>
      </form>

      <button
        type="button"
        onClick={(event) => onToggleMenu(event.currentTarget)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        title="Menu"
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#8c7851]/50 bg-[#241e1a] px-3 text-[#d4c3a1] transition-colors hover:border-[#a38c5e] hover:bg-[#8c7851]/20 hover:text-[#f4ead5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b]"
      >
        {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        <span className="font-title text-[9px] font-bold uppercase tracking-wider sm:text-[10px]">Menu</span>
      </button>
    </header>
  );
};
