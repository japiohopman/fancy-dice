import React, { useState } from 'react';
import { DieType } from '../types';
import { Dices, BookOpen, Plus, Minus, RotateCcw, Shield, Flame, Sword, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeftOptionsPanelProps {
  onRoll: (formula: string) => void;
  isRolling: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftOptionsPanel: React.FC<LeftOptionsPanelProps> = ({
  onRoll,
  isRolling,
  collapsed,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'dice' | 'presets'>('dice');

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
    { name: 'Saving Throw', formula: '1d20+4', icon: Shield, color: 'text-[#8c7851]' },
    { name: 'Ability Check', formula: '1d20+2', icon: Dices, color: 'text-[#f4ead5]' },
    { name: 'Fate (4dF)', formula: '4dF', icon: Dices, color: 'text-purple-400' },
  ];

  const handleIncrement = (type: DieType) => {
    setStagedDice(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleDecrement = (type: DieType) => {
    setStagedDice(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
  };

  const getIconSrc = (type: string) => {
    const base = (import.meta as any).env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const iconName = type === 'dfate' ? 'd6' : type === 'd100' ? 'd10' : type;
    return `${cleanBase}assets/icons/dice/${iconName}.svg`;
  };

  const handleClear = () => {
    setStagedDice({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0, dfate: 0 });
    setModifier(0);
    setAdvantage('none');
  };

  const buildAndRoll = () => {
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
      parts.push('1d20');
    }

    let formula = parts.join('+');
    if (modifier > 0) formula += `+${modifier}`;
    if (modifier < 0) formula += `${modifier}`;

    onRoll(formula);
  };

  if (collapsed) {
    return (
      <div className="bg-[#1c1815] border-r border-[#3d3329] w-10 flex flex-col items-center py-2 gap-3 z-20 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-[#28211b] hover:bg-[#3d3329] text-[#d4c3a1]"
          title="Expand Left Menu"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('dice'); }}
          className="p-1.5 rounded-lg text-[#d4c3a1]/70 hover:text-[#f4ead5]"
        >
          <Dices className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('presets'); }}
          className="p-1.5 rounded-lg text-[#d4c3a1]/70 hover:text-[#f4ead5]"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-40 bg-[#1c1815] border-r border-[#3d3329] flex flex-col z-20 shrink-0 h-full overflow-hidden select-none">
      {/* Top Header & Collapse Toggle */}
      <div className="flex items-center justify-between p-2 border-b border-[#3d3329] bg-[#171412]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dice')}
            className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all ${
              activeTab === 'dice'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <Dices className="w-3 h-3" />
            <span>Dice</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all ${
              activeTab === 'presets'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Presets</span>
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-[#d4c3a1]/50 hover:text-[#f4ead5] hover:bg-[#28211b]"
          title="Collapse Menu"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden gap-1 text-xs">
        {activeTab === 'dice' ? (
          <>
            {/* Grid of Die Selectors with SVGs */}
            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-0.5">
              {diceList.map((die) => (
                <div
                  key={die.type}
                  className={`relative flex flex-col items-center justify-between p-1 rounded-lg border transition-all ${
                    stagedDice[die.type] > 0
                      ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5]'
                      : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]'
                  }`}
                >
                  {/* Count badge at top-right */}
                  {stagedDice[die.type] > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#8c7851] text-white font-black text-[9px] flex items-center justify-center shadow">
                      {stagedDice[die.type]}
                    </span>
                  )}

                  {/* Icon Representation / Incrementor */}
                  <button
                    onClick={() => handleIncrement(die.type)}
                    className="w-full flex flex-col items-center gap-0.5 py-1 cursor-pointer"
                  >
                    <img
                      src={getIconSrc(die.type)}
                      className={`w-6 h-6 object-contain brightness-0 invert-[89%] sepia-[12%] saturate-[485%] hue-rotate-[353deg] contrast-[91%] ${
                        stagedDice[die.type] > 0 ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-75'
                      } transition-all duration-200`}
                      alt={die.label}
                    />
                    <span className="font-mono font-bold text-[9px] uppercase leading-none">{die.label}</span>
                  </button>

                  {/* Decrement / Increment Footer buttons */}
                  <div className="flex items-center justify-between w-full gap-0.5 pt-0.5 border-t border-[#3d3329]/50">
                    <button
                      onClick={() => handleDecrement(die.type)}
                      disabled={stagedDice[die.type] === 0}
                      className="flex-1 py-0.5 rounded bg-[#28211b] hover:bg-rose-950/40 text-[#d4c3a1] flex items-center justify-center text-[9px] disabled:opacity-20 transition-all active:scale-95"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrement(die.type)}
                      className="flex-1 py-0.5 rounded bg-[#8c7851]/40 hover:bg-[#8c7851] text-white flex items-center justify-center text-[9px] transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modifier & Advantage Controls */}
            <div className="flex flex-col gap-1.5 bg-[#141210] p-1.5 rounded-xl border border-[#3d3329] shrink-0">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#d4c3a1]/70">Modifier:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModifier(prev => prev - 1)}
                    className="w-4.5 h-4.5 rounded bg-[#28211b] text-[#d4c3a1] hover:text-white flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-[11px] text-[#f4ead5]">
                    {modifier >= 0 ? `+${modifier}` : modifier}
                  </span>
                  <button
                    onClick={() => setModifier(prev => prev + 1)}
                    className="w-4.5 h-4.5 rounded bg-[#28211b] text-[#d4c3a1] hover:text-white flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Advantage Radio Chips with Custom Rotated SVG Icons */}
              <div className="grid grid-cols-3 gap-0.5 pt-1 border-t border-[#3d3329]">
                <button
                  onClick={() => setAdvantage('none')}
                  className={`py-1 rounded text-[9px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    advantage === 'none'
                      ? 'bg-[#8c7851] text-white border-[#8c7851] shadow'
                      : 'bg-[#28211b] text-[#d4c3a1]/60 border-transparent hover:text-[#f4ead5]'
                  }`}
                >
                  <span>Norm</span>
                </button>
                <button
                  onClick={() => setAdvantage('advantage')}
                  className={`py-1 rounded text-[9px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    advantage === 'advantage'
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow'
                      : 'bg-[#28211b] text-[#d4c3a1]/60 border-transparent hover:text-emerald-400'
                  }`}
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
                  className={`py-1 rounded text-[9px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                    advantage === 'disadvantage'
                      ? 'bg-rose-800 text-white border-rose-700 shadow'
                      : 'bg-[#28211b] text-[#d4c3a1]/60 border-transparent hover:text-rose-400'
                  }`}
                  title="Disadvantage (Advantage Rotated 180°)"
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

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-xl bg-[#28211b] hover:bg-rose-950/30 hover:text-rose-400 text-[#d4c3a1]/70 border border-[#3d3329]"
                title="Reset staged dice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={buildAndRoll}
                disabled={isRolling}
                className="flex-1 py-1.5 rounded-xl bg-[#8c7851] hover:bg-[#6d5b3d] text-white font-bold text-[10px] uppercase tracking-wider shadow-md font-display flex items-center justify-center gap-1"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Roll Staged</span>
              </button>
            </div>
          </>
        ) : (
          /* RPG Presets Tab */
          <div className="flex flex-col gap-1 overflow-y-auto max-h-full pr-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[#d4c3a1]/50 font-bold px-1 mb-1 block">
              Quick RPG Actions:
            </span>
            {presets.map((p) => {
              const IconComp = p.icon;
              return (
                <button
                  key={p.name}
                  onClick={() => onRoll(p.formula)}
                  disabled={isRolling}
                  className="w-full flex items-center justify-between p-1.5 rounded-xl bg-[#141210] hover:bg-[#8c7851]/20 border border-[#3d3329] hover:border-[#8c7851] text-left transition-all active:scale-95 group min-w-0"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <IconComp className={`w-3 h-3 shrink-0 ${p.color}`} />
                    <span className="font-semibold text-[10px] text-[#f4ead5] truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#8c7851] font-bold shrink-0 group-hover:text-white">
                    {p.formula}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
