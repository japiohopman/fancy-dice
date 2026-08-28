import React, { useState, useEffect } from 'react';
import { Dices, Volume2, VolumeX, Smartphone, Play, Sparkles } from 'lucide-react';

interface TopNotationBarProps {
  currentFormula: string;
  onFormulaChange: (formula: string) => void;
  onRoll: (formula: string) => void;
  isRolling: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  shakeEnabled: boolean;
}

export const TopNotationBar: React.FC<TopNotationBarProps> = ({
  currentFormula,
  onFormulaChange,
  onRoll,
  isRolling,
  soundEnabled,
  onToggleSound,
  shakeEnabled,
}) => {
  const [inputVal, setInputVal] = useState<string>(currentFormula || '1d20');

  // Keep inputVal in sync with parent currentFormula updates
  useEffect(() => {
    setInputVal(currentFormula);
  }, [currentFormula]);

  // Quick notation presets
  const quickNotations = [
    { label: '1d20', formula: '1d20' },
    { label: '4d4', formula: '4d4' },
    { label: '1d20+10', formula: '1d20+10' },
    { label: '4d6kh3', formula: '4d6kh3' },
    { label: '2d10+2', formula: '2d10+2' },
    { label: '8d6', formula: '8d6' },
  ];

  const handleSelectQuick = (f: string) => {
    setInputVal(f);
    onFormulaChange(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFormula = inputVal.trim() || '1d20';
    onFormulaChange(finalFormula);
    onRoll(finalFormula);
  };

  return (
    <header className="w-full h-auto bg-[#1a1613] border-b border-[#3d3329] px-3 sm:px-5 py-2 flex flex-col gap-2 shadow-lg z-30 shrink-0 select-none">
      {/* Top Row: Brand & Controls */}
      <div className="flex items-center justify-between w-full">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg gold-gradient-bg border border-[#a38c5e]/50 flex items-center justify-center text-amber-100 shadow-md">
            <Dices className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base font-display tracking-wider leading-none text-shadow-gold gold-gradient-text">
              FANTASTIC DICE
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#8c7851] font-title mt-0.5">3D Mobile Roller</p>
          </div>
        </div>

        {/* Audio & Motion Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-[#241e1a] hover:bg-[#352c26] text-[#d4c3a1] border border-[#3d3329] transition-all cursor-pointer shadow-sm"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#a38c5e]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-40" />
            )}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8c7851]/15 border border-[#8c7851]/40 text-[#f4ead5] text-[10px] font-title font-medium shadow-sm">
            <Smartphone className={`w-3.5 h-3.5 text-[#a38c5e] ${shakeEnabled ? 'animate-pulse' : 'opacity-40'}`} />
            <span>{shakeEnabled ? 'Shake Active' : 'Shake Off'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Formula Input, Quick Chips & Roll Button */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#12100e] border border-[#3d3329] focus-within:border-[#a38c5e] rounded-xl px-2.5 py-1.5 shadow-inner transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-[#a38c5e] mr-2 shrink-0" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              onFormulaChange(e.target.value);
            }}
            placeholder="e.g. 1d20+10 or 4d4"
            className="w-full bg-transparent text-xs sm:text-sm font-mono font-bold text-[#f4ead5] focus:outline-none placeholder:text-[#d4c3a1]/30 tracking-wide"
          />
        </div>

        {/* Quick notation pill chips */}
        <div className="hidden lg:flex items-center gap-1">
          {quickNotations.slice(0, 5).map((item) => (
            <button
              key={item.formula}
              type="button"
              onClick={() => handleSelectQuick(item.formula)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                inputVal === item.formula
                  ? 'bg-[#8c7851] text-white border-[#a38c5e] shadow-sm'
                  : 'bg-[#241e1a] text-[#d4c3a1] border-[#3d3329] hover:border-[#a38c5e]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Big Roll Button */}
        <button
          type="submit"
          disabled={isRolling}
          className="px-4 py-1.5 rounded-xl gold-gradient-bg hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-[#a38c5e]/50 transition-all disabled:opacity-50 shrink-0 font-title cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-200" />
          <span className="drop-shadow-sm">{isRolling ? 'Rolling...' : 'Roll'}</span>
        </button>
      </form>
    </header>
  );
};
