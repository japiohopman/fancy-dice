import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Dices,
  Palette,
  Play,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

interface TopNotationBarProps {
  currentFormula: string;
  onFormulaChange: (formula: string) => void;
  onRoll: (formula: string) => void;
  isRolling: boolean;
  onSelectDice: () => void;
  onSelectPresets: () => void;
  onSelectAppearance: () => void;
  onSelectOptions: () => void;
}

/** Renders the primary navigation row and the always-visible notation/Roll controls. */
export const TopNotationBar: React.FC<TopNotationBarProps> = ({
  currentFormula,
  onFormulaChange,
  onRoll,
  isRolling,
  onSelectDice,
  onSelectPresets,
  onSelectAppearance,
  onSelectOptions,
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

  const navigationItems = [
    { label: 'Dice', Icon: Dices, onClick: onSelectDice },
    { label: 'Presets', Icon: BookOpen, onClick: onSelectPresets },
    { label: 'Appearance', Icon: Palette, onClick: onSelectAppearance },
    { label: 'Options', Icon: SlidersHorizontal, onClick: onSelectOptions },
  ];

  return (
    <header className="z-30 flex w-full shrink-0 select-none flex-col gap-1.5 border-b border-[#3d3329] bg-[#1a1613] px-3 py-1.5 shadow-lg sm:px-5">
      {/* Primary navigation: identity and section entry points. */}
      <div className="flex min-h-8 w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#a38c5e]/50 gold-gradient-bg text-amber-100 shadow-md">
            <Dices className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-[12px] font-bold leading-none tracking-wider text-shadow-gold gold-gradient-text sm:text-sm md:text-base">
              FANTASTIC DICE
            </h1>
            <p className="mt-0.5 hidden font-title text-[9px] uppercase tracking-widest text-[#8c7851] sm:block">
              3D Mobile Roller
            </p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-1.5">
          {navigationItems.map(({ label, Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              title={label}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-[#b8a47f] transition-colors hover:border-[#8c7851]/60 hover:bg-[#8c7851]/15 hover:text-[#f4ead5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b] sm:px-2.5 md:px-3"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden font-title text-[9px] font-bold uppercase tracking-wide sm:inline md:text-[10px]">
                {label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Roll controls: notation and the primary action always stay together. */}
      <form onSubmit={handleSubmit} className="flex w-full min-w-0 items-center gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center rounded-xl border border-[#3d3329] bg-[#12100e] px-2.5 shadow-inner transition-colors focus-within:border-[#a38c5e]">
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
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#a38c5e]/50 px-4 font-title text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all gold-gradient-bg hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm"
        >
          <Play className="h-3.5 w-3.5 fill-current text-amber-200" aria-hidden="true" />
          <span>{isRolling ? 'Rolling…' : 'Roll'}</span>
        </button>
      </form>
    </header>
  );
};
