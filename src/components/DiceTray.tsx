import React, { useState, useEffect } from 'react';
import { DieType } from '../types';
import { Dices, RotateCcw, Plus, Minus, Sparkles, Smartphone, Flame } from 'lucide-react';

interface DiceTrayProps {
  onRoll: (formula: string) => void;
  isRolling: boolean;
  onSimulateShake: () => void;
  shakeEnabled: boolean;
}

export const DiceTray: React.FC<DiceTrayProps> = ({
  onRoll,
  isRolling,
  onSimulateShake,
  shakeEnabled
}) => {
  // Staged counts for each die type
  const [stagedDice, setStagedDice] = useState<Record<DieType, number>>({
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
    dfate: 0,
  });

  const [modifier, setModifier] = useState<number>(0);
  const [advantage, setAdvantage] = useState<'none' | 'advantage' | 'disadvantage'>('none');
  const [isExploding, setIsExploding] = useState<boolean>(false);
  const [keepHighest, setKeepHighest] = useState<number | null>(null);
  const [customFormula, setCustomFormula] = useState<string>('');
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);

  // Available Die Options with Natural Tones styling
  const dieOptions: { type: DieType; label: string; sides: string; color: string }[] = [
    { type: 'd4', label: 'd4', sides: '4-sided', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'd6', label: 'd6', sides: '6-sided', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'd8', label: 'd8', sides: '8-sided', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'd10', label: 'd10', sides: '10-sided', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'd12', label: 'd12', sides: '12-sided', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'd20', label: 'd20', sides: '20-sided', color: 'bg-[#8c7851] text-white border-[#8c7851] hover:bg-[#6d5b3d] shadow-[0_0_15px_rgba(140,120,81,0.2)]' },
    { type: 'd100', label: 'd100', sides: 'Percentile', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
    { type: 'dfate', label: 'dF', sides: 'Fate / Fudge', color: 'bg-[#2d241e] hover:bg-[#8c7851]/20 text-[#f4ead5] border-[#3d3329] hover:border-[#8c7851]' },
  ];

  // Helper to build formula string from UI controls
  const buildFormulaFromControls = (): string => {
    const parts: string[] = [];

    // Check d20 advantage special handling
    if (stagedDice.d20 > 0 && advantage !== 'none') {
      if (advantage === 'advantage') {
        parts.push(`2d20kh1`);
      } else {
        parts.push(`2d20kl1`);
      }
    } else if (stagedDice.d20 > 0) {
      parts.push(`${stagedDice.d20}d20`);
    }

    // Add other staged dice
    (Object.keys(stagedDice) as DieType[]).forEach(type => {
      if (type === 'd20') return; // already handled
      const count = stagedDice[type];
      if (count > 0) {
        let dieStr = `${count}${type}`;
        if (isExploding) dieStr += '!';
        if (keepHighest !== null && count > keepHighest) dieStr += `kh${keepHighest}`;
        parts.push(dieStr);
      }
    });

    if (parts.length === 0) {
      return '1d20'; // default single d20
    }

    let formula = parts.join('+');
    if (modifier > 0) formula += `+${modifier}`;
    if (modifier < 0) formula += `${modifier}`;

    return formula;
  };

  const handleAddDie = (type: DieType) => {
    setStagedDice(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleClearStaged = () => {
    setStagedDice({
      d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, dfate: 0
    });
    setModifier(0);
    setAdvantage('none');
    setIsExploding(false);
    setKeepHighest(null);
    setCustomFormula('');
  };

  const handleRollClick = () => {
    const formulaToRoll = useCustomInput && customFormula.trim()
      ? customFormula.trim()
      : buildFormulaFromControls();
    onRoll(formulaToRoll);
  };

  const currentFormula = useCustomInput && customFormula.trim()
    ? customFormula.trim()
    : buildFormulaFromControls();

  const totalDiceStaged = (Object.values(stagedDice) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="w-full bg-[#1f1b18]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#3d3329] shadow-xl flex flex-col gap-4">

      {/* Top Header & Mode Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-[#3d3329] pb-3">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-[#8c7851]" />
          <h2 className="font-semibold text-[#f4ead5] text-sm sm:text-base font-display tracking-wide">DICE SELECTOR</h2>
          {totalDiceStaged > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#8c7851]/20 text-[#f4ead5] text-xs font-medium border border-[#8c7851]/40">
              {totalDiceStaged} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseCustomInput(!useCustomInput)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
              useCustomInput
                ? 'bg-[#8c7851] text-white border-[#8c7851]'
                : 'bg-[#2d241e] text-[#d4c3a1] border-[#3d3329] hover:text-[#f4ead5]'
            }`}
          >
            {useCustomInput ? 'Preset Selector' : 'Custom Notation'}
          </button>

          {(totalDiceStaged > 0 || modifier !== 0 || customFormula) && (
            <button
              onClick={handleClearStaged}
              className="p-1.5 rounded-lg bg-[#2d241e] text-[#d4c3a1] hover:text-rose-400 hover:bg-[#3d3329] transition-colors"
              title="Clear all selected dice"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {useCustomInput ? (
        /* Direct Notation Input Mode */
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#d4c3a1]/80 font-medium">Enter Fantastic Notation:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              placeholder="e.g. 4d6kh3 + 2, 3d6!, 2d20kh1"
              className="flex-1 bg-[#1a1714] border border-[#3d3329] focus:border-[#8c7851] rounded-xl px-4 py-2.5 text-[#f4ead5] text-sm font-mono focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-[#d4c3a1]/60">
            Supports <code className="text-[#8c7851] font-mono">kh3</code> (keep highest 3), <code className="text-[#8c7851] font-mono">!</code> (exploding), <code className="text-[#8c7851] font-mono">dF</code> (fate), and modifiers like <code className="text-[#8c7851] font-mono">+5</code>.
          </p>
        </div>
      ) : (
        /* Visual Die Buttons Grid */
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {dieOptions.map((die) => {
            const count = stagedDice[die.type];
            return (
              <button
                key={die.type}
                onClick={() => handleAddDie(die.type)}
                className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border ${die.color} hover:scale-105 active:scale-95 transition-all shadow-md group`}
              >
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8c7851] text-white font-bold text-xs flex items-center justify-center shadow">
                    {count}
                  </span>
                )}
                <span className="font-bold text-base sm:text-lg">{die.label}</span>
                <span className="text-[10px] opacity-70 group-hover:opacity-100">{die.sides}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced Modifiers & Modifiers Bar */}
      {!useCustomInput && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3d3329] text-xs">

          {/* Advantage / Disadvantage toggles */}
          <div className="flex items-center gap-1 bg-[#1a1714] p-1 rounded-xl border border-[#3d3329]">
            <span className="text-[#d4c3a1] px-2 font-medium">d20:</span>
            <button
              onClick={() => setAdvantage(advantage === 'advantage' ? 'none' : 'advantage')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                advantage === 'advantage'
                  ? 'bg-[#8c7851] text-white font-bold'
                  : 'text-[#d4c3a1] hover:text-[#f4ead5]'
              }`}
            >
              Adv
            </button>
            <button
              onClick={() => setAdvantage(advantage === 'disadvantage' ? 'none' : 'disadvantage')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                advantage === 'disadvantage'
                  ? 'bg-rose-900/80 text-rose-200 font-bold'
                  : 'text-[#d4c3a1] hover:text-[#f4ead5]'
              }`}
            >
              Disadv
            </button>
          </div>

          {/* Exploding Dice Toggle */}
          <button
            onClick={() => setIsExploding(!isExploding)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-colors ${
              isExploding
                ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#8c7851]'
                : 'bg-[#1a1714] text-[#d4c3a1] border-[#3d3329] hover:text-[#f4ead5]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#8c7851]" />
            <span>Exploding (!)</span>
          </button>

          {/* Modifier adjustment */}
          <div className="flex items-center gap-2 bg-[#1a1714] px-2 py-1 rounded-xl border border-[#3d3329]">
            <span className="text-[#d4c3a1] font-medium">Modifier:</span>
            <button
              onClick={() => setModifier(prev => prev - 1)}
              className="p-1 rounded-md bg-[#2d241e] text-[#d4c3a1] hover:bg-[#3d3329]"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[#f4ead5] w-6 text-center text-sm">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
            <button
              onClick={() => setModifier(prev => prev + 1)}
              className="p-1 rounded-md bg-[#2d241e] text-[#d4c3a1] hover:bg-[#3d3329]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">

        {/* Active Formula Preview Badge */}
        <div className="flex-1 bg-[#1a1714] rounded-xl px-4 py-2.5 border border-[#3d3329] flex items-center justify-between">
          <span className="text-xs text-[#d4c3a1]/60">Formula:</span>
          <span className="font-mono text-base font-bold text-[#f4ead5] tracking-wide">
            {currentFormula}
          </span>
        </div>

        {/* Manual Roll Button */}
        <button
          onClick={handleRollClick}
          disabled={isRolling}
          className="px-6 py-3 rounded-xl bg-[#8c7851] hover:bg-[#6d5b3d] active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#8c7851]/20 disabled:opacity-50 transition-all cursor-pointer font-display tracking-wider"
        >
          <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'Rolling...' : 'ROLL DICE'}</span>
        </button>

        {/* Shake Phone Simulator / Trigger */}
        <button
          onClick={onSimulateShake}
          className="px-4 py-3 rounded-xl bg-[#2d241e] hover:bg-[#3d3329] text-[#f4ead5] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#3d3329] transition-all"
          title="Simulate phone shake motion"
        >
          <Smartphone className="w-4 h-4 text-[#8c7851] animate-bounce" />
          <span className="hidden sm:inline">Shake Device</span>
        </button>
      </div>

      {shakeEnabled && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#d4c3a1]/80 pt-1">
          <Sparkles className="w-3.5 h-3.5 text-[#8c7851] animate-pulse" />
          <span>Shake your phone or tap device button to roll!</span>
        </div>
      )}
    </div>
  );
};
