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

  // Keep inputVal in sync with parent currentFormula updates (e.g. from dice picker or presets)
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
    <header className="w-full h-auto bg-[#1c1815] border-b border-[#3d3329] px-3 sm:px-4 py-2 flex flex-col gap-2 shadow-md z-30 shrink-0 select-none">
      {/* Top Row: Brand & Sound & Motion Badge */}
      <div className="flex items-center justify-between w-full">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#8c7851] flex items-center justify-center text-white shadow-md">
            <Dices className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-xs text-[#f4ead5] font-display tracking-wider leading-none">
              FANTASTIC DICE
            </h1>
            <p className="text-[8px] uppercase tracking-widest text-[#d4c3a1]/50 mt-0.5">3D Mobile Roller</p>
          </div>
        </div>

        {/* Audio & Motion Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleSound}
            className="p-1 rounded-lg bg-[#28211b] hover:bg-[#3d3329] text-[#d4c3a1] border border-[#3d3329] transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#8c7851]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 opacity-40" />
            )}
          </button>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#8c7851]/15 border border-[#8c7851]/30 text-[#f4ead5] text-[10px] font-medium">
            <Smartphone className={`w-3 h-3 text-[#8c7851] ${shakeEnabled ? 'animate-pulse' : 'opacity-40'}`} />
            <span>{shakeEnabled ? 'Shake Active' : 'Shake Off'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Notation Bar & Quick Presets & Big Roll Button */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-1.5 sm:gap-2">
        <div className="flex-1 flex items-center bg-[#141210] border border-[#3d3329] rounded-xl px-2 py-1 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#8c7851] mr-1.5 shrink-0" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              onFormulaChange(e.target.value);
            }}
            placeholder="e.g. 1d20+10 or 4d4"
            className="w-full bg-transparent text-xs font-mono text-[#f4ead5] focus:outline-none placeholder:text-[#d4c3a1]/30"
          />
        </div>

        {/* Quick notation pill chips */}
        <div className="hidden lg:flex items-center gap-1">
          {quickNotations.slice(0, 5).map((item) => (
            <button
              key={item.formula}
              type="button"
              onClick={() => handleSelectQuick(item.formula)}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                inputVal === item.formula
                  ? 'bg-[#8c7851] text-white border-[#8c7851] shadow-sm'
                  : 'bg-[#28211b] text-[#d4c3a1] border-[#3d3329] hover:border-[#8c7851]'
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
          className="px-3.5 py-1 rounded-xl bg-[#8c7851] hover:bg-[#6d5b3d] active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md transition-all disabled:opacity-50 shrink-0 font-display h-7.5"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isRolling ? 'Rolling...' : 'Roll'}</span>
        </button>
      </form>
    </header>
  );
};
