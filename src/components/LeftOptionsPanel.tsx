import React, { useState, useEffect } from 'react';
import { DieType } from '../types';
import { Dices, RotateCcw, Shield, Flame, Sword, Sparkles } from 'lucide-react';

interface LeftOptionsPanelProps {
  onFormulaUpdate: (formula: string) => void;
  currentFormula: string;
  activeTab: 'dice' | 'presets';
}

/** Renders the die builder and RPG preset sections in the existing left-side panel. */
export const LeftOptionsPanel: React.FC<LeftOptionsPanelProps> = ({
  onFormulaUpdate,
  currentFormula,
  activeTab
}) => {

  // Staged counts for each die type
  const [stagedDice, setStagedDice] = useState<Record<DieType, number>>({
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, dfate: 0
  });
  const [modifier, setModifier] = useState<number>(0);
  const [advantage, setAdvantage] = useState<'none' | 'advantage' | 'disadvantage'>('none');

  const diceList: { type: DieType; label: string }[] = [
    { type: 'd4', label: 'd4' },
    { type: 'd6', label: 'd6' },
    { type: 'd8', label: 'd8' },
    { type: 'd10', label: 'd10' },
    { type: 'd12', label: 'd12' },
    { type: 'd20', label: 'd20' },
    { type: 'd100', label: 'd100' },
    { type: 'dfate', label: 'dF' },
  ];

  const presets = [
    { name: 'Attack Roll', formula: '1d20+5', icon: Sword, color: 'text-amber-400' },
    { name: 'Advantage', formula: '2d20kh1+5', icon: Sparkles, color: 'text-emerald-400' },
    { name: 'Fireball', formula: '8d6', icon: Flame, color: 'text-rose-400' },
    { name: 'Greatsword', formula: '2d6+3', icon: Sword, color: 'text-amber-300' },
    { name: 'Healing Word', formula: '1d4+3', icon: Sparkles, color: 'text-cyan-400' },
    { name: 'Saving Throw', formula: '1d20+4', icon: Shield, color: 'text-[#a38c5e]' },
    { name: 'Ability Check', formula: '1d20+2', icon: Dices, color: 'text-[#f4ead5]' },
    { name: 'Fate (4dF)', formula: '4dF', icon: Dices, color: 'text-purple-400' },
  ];

  // Sync staged dice changes to top notation bar formula in real-time
  useEffect(() => {
    const parts: string[] = [];

    if (stagedDice.d20 > 0 && advantage !== 'none') {
      if (advantage === 'advantage') parts.push('2d20kh1');
      else parts.push('2d20kl1');
    } else if (stagedDice.d20 > 0) {
      parts.push(`${stagedDice.d20}d20`);
    }

    (Object.keys(stagedDice) as DieType[]).forEach(type => {
      if (type === 'd20') return;
      const cnt = stagedDice[type];
      if (cnt > 0) parts.push(`${cnt}${type}`);
    });

    if (parts.length === 0) {
      return;
    }

    let formula = parts.join('+');
    if (modifier > 0) formula += `+${modifier}`;
    if (modifier < 0) formula += `${modifier}`;

    onFormulaUpdate(formula);
  }, [stagedDice, modifier, advantage]);

  /** Increases the staged count for the selected die type. */
  const handleIncrement = (type: DieType) => {
    setStagedDice(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  /** Decreases the staged count for the selected die type without going below zero. */
  const handleDecrement = (type: DieType) => {
    setStagedDice(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
  };

  /** Builds the base-aware asset URL for the matching die icon. */
  const getIconSrc = (type: string) => {
    const base = (import.meta as any).env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const iconName = type === 'dfate' ? 'd6' : type === 'd100' ? 'd10' : type;
    return `${cleanBase}assets/icons/dice/${iconName}.svg`;
  };

  /** Resets staged dice, modifiers, advantage state, and the active formula. */
  const handleClear = () => {
    setStagedDice({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, dfate: 0 });
    setModifier(0);
    setAdvantage('none');
    onFormulaUpdate('1d20');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 p-2 flex flex-col min-h-0 overflow-y-auto gap-2 text-xs no-scrollbar">
        {activeTab === 'dice' ? (
          <>
            {/* Grid of Die Selectors with SVGs */}
            <div className="grid grid-cols-2 gap-1.5 pr-0.5 shrink-0">
              {diceList.map((die) => (
                <div
                  key={die.type}
                  data-selected={stagedDice[die.type] > 0}
                  className="ui-choice-tile relative flex flex-col items-center justify-between p-1.5"
                >
                  {/* Count badge at top-right */}
                  {stagedDice[die.type] > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full gold-gradient-bg text-white font-mono font-black text-[10px] flex items-center justify-center border border-[#a38c5e] shadow-md">
                      {stagedDice[die.type]}
                    </span>
                  )}

                  {/* Icon Representation / Incrementor */}
                  <button
                    onClick={() => handleIncrement(die.type)}
                    className="w-full flex flex-col items-center gap-1 py-1 cursor-pointer"
                  >
                    <img
                      src={getIconSrc(die.type)}
                      className={`w-6.5 h-6.5 object-contain brightness-0 invert-[89%] sepia-[12%] saturate-[485%] hue-rotate-[353deg] contrast-[91%] ${
                        stagedDice[die.type] > 0 ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-80'
                      } transition-all duration-200`}
                      alt={die.label}
                    />
                    <span className="font-mono font-bold text-[10px] uppercase leading-none text-[#d4c3a1]">{die.label}</span>
                  </button>

                  {/* Decrement / Increment Footer buttons */}
                  <div className="flex items-center justify-between w-full gap-1 pt-1 border-t border-[#3d3329]/60">
                    <button
                      onClick={() => handleDecrement(die.type)}
                      disabled={stagedDice[die.type] === 0}
                      className="ui-stepper-button flex-1"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrement(die.type)}
                      className="ui-stepper-button flex-1"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modifier & Advantage Controls */}
            <div className="ui-inset-surface flex shrink-0 flex-col gap-1.5 p-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#d4c3a1]/80 font-title font-semibold">Modifier:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModifier(prev => prev - 1)}
                    className="ui-stepper-button h-10 w-10"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-[11px] text-[#f4ead5]">
                    {modifier >= 0 ? `+${modifier}` : modifier}
                  </span>
                  <button
                    onClick={() => setModifier(prev => prev + 1)}
                    className="ui-stepper-button h-10 w-10"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Advantage Radio Chips */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#3d3329]">
                <button
                  onClick={() => setAdvantage('none')}
                  aria-pressed={advantage === 'none'}
                  data-selected={advantage === 'none'}
                  className="ui-segment-button flex-col"
                >
                  <span>NORM</span>
                </button>
                <button
                  onClick={() => setAdvantage('advantage')}
                  aria-pressed={advantage === 'advantage'}
                  data-selected={advantage === 'advantage'}
                  className="ui-segment-button flex-col"
                  title="Advantage"
                >
                  <img
                    src={`${(import.meta as any).env.BASE_URL || '/'}assets/icons/dice/advantage.svg`}
                    alt="Advantage"
                    className={`w-3 h-3 object-contain transition-all ${
                      advantage === 'advantage' ? 'brightness-0 invert' : 'brightness-0 invert-[60%]'
                    }`}
                  />
                  <span>ADV</span>
                </button>
                <button
                  onClick={() => setAdvantage('disadvantage')}
                  aria-pressed={advantage === 'disadvantage'}
                  data-selected={advantage === 'disadvantage'}
                  className="ui-segment-button flex-col"
                  title="Disadvantage"
                >
                  <img
                    src={`${(import.meta as any).env.BASE_URL || '/'}assets/icons/dice/disadvantage.svg`}
                    alt="Disadvantage"
                    className={`w-3 h-3 object-contain transition-all ${
                      advantage === 'disadvantage' ? 'brightness-0 invert' : 'brightness-0 invert-[60%]'
                    }`}
                  />
                  <span>DIS</span>
                </button>
              </div>
            </div>

            {/* Clear Button */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClear}
                className="ui-button ui-button--quiet w-full"
                title="Reset staged dice"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Picker</span>
              </button>
            </div>
          </>
        ) : (
          /* RPG Presets Tab */
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-full pr-0.5">
            <span className="ui-section-label px-1">
              Quick RPG Actions:
            </span>
            {presets.map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.name}
                  onClick={() => onFormulaUpdate(p.formula)}
                  className="ui-choice-button group min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${p.color}`} />
                    <span className="font-title font-semibold text-[11px] text-[#f4ead5] truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[9.5px] text-[#a38c5e] font-bold shrink-0 group-hover:text-white">
                    {p.formula}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
