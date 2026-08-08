import React, { useState } from 'react';
import { DicePreset } from '../types';
import { BookOpen, Plus, Trash2, Shield, Heart, Zap, Sparkles } from 'lucide-react';

interface RPGPresetsProps {
  onSelectPreset: (formula: string, name?: string) => void;
}

export const RPGPresets: React.FC<RPGPresetsProps> = ({ onSelectPreset }) => {
  const [activeCategory, setActiveCategory] = useState<'D&D 5e' | 'Fate' | 'CoC' | 'Custom'>('D&D 5e');
  const [customName, setCustomName] = useState<string>('');
  const [customFormula, setCustomFormula] = useState<string>('');

  // Default Standard Presets
  const defaultPresets: DicePreset[] = [
    // D&D 5e / Pathfinder
    { id: '1', name: 'Ability Scores (4d6kh3)', category: 'D&D 5e', formula: '4d6kh3', description: 'Roll 4d6, drop lowest (Standard stat roll)' },
    { id: '2', name: 'Advantage d20', category: 'D&D 5e', formula: '2d20kh1', description: 'Roll 2d20 keep highest' },
    { id: '3', name: 'Disadvantage d20', category: 'D&D 5e', formula: '2d20kl1', description: 'Roll 2d20 keep lowest' },
    { id: '4', name: 'Fireball (8d6)', category: 'D&D 5e', formula: '8d6', description: '3rd level Fireball damage' },
    { id: '5', name: 'Greatsword Attack', category: 'D&D 5e', formula: '2d6+4', description: '2d6 weapon + 4 Strength modifier' },
    { id: '6', name: 'Healing Potion', category: 'D&D 5e', formula: '2d4+2', description: 'Standard potion of healing' },

    // Fate / Fudge
    { id: '7', name: 'Standard Fate Roll', category: 'Fate', formula: '4df', description: '4 Fudge dice (-1, 0, +1)' },
    { id: '8', name: 'Great (+4) Skill Check', category: 'Fate', formula: '4df+4', description: '4dF with Great (+4) skill bonus' },

    // Call of Cthulhu
    { id: '9', name: 'Percentile Skill Check', category: 'CoC', formula: '1d100', description: 'Roll 1d100 against skill threshold' },
    { id: '10', name: 'Sanity Loss Check', category: 'CoC', formula: '1d6', description: '1d6 Sanity Loss' },
  ];

  // Custom user presets in state
  const [customPresets, setCustomPresets] = useState<DicePreset[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('fantastic_custom_presets');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* fallback */ }
      }
    }
    return [
      { id: 'custom-1', name: 'Eldritch Blast', category: 'Custom', formula: '1d10+4', description: 'Warlock cantrip' }
    ];
  });

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customFormula.trim()) return;

    const newPreset: DicePreset = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: 'Custom',
      formula: customFormula.trim(),
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fantastic_custom_presets', JSON.stringify(updated));
    }

    setCustomName('');
    setCustomFormula('');
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fantastic_custom_presets', JSON.stringify(updated));
    }
  };

  const categories: ('D&D 5e' | 'Fate' | 'CoC' | 'Custom')[] = ['D&D 5e', 'Fate', 'CoC', 'Custom'];

  const displayedPresets = activeCategory === 'Custom'
    ? customPresets
    : defaultPresets.filter(p => p.category === activeCategory);

  return (
    <div className="w-full bg-[#1f1b18]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#3d3329] shadow-xl flex flex-col gap-4">

      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-[#3d3329] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#8c7851]" />
          <h2 className="font-semibold text-[#f4ead5] text-sm sm:text-base font-display tracking-wide">RPG QUICK PRESETS</h2>
        </div>

        <div className="flex gap-1 bg-[#1a1714] p-1 rounded-xl border border-[#3d3329] text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#8c7851] text-white shadow-sm'
                  : 'text-[#d4c3a1] hover:text-[#f4ead5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
        {displayedPresets.map(preset => (
          <div
            key={preset.id}
            onClick={() => onSelectPreset(preset.formula, preset.name)}
            className="group relative flex items-center justify-between p-3.5 rounded-xl bg-[#1a1714]/80 border border-[#3d3329] hover:border-[#8c7851] hover:bg-[#2d241e] transition-all cursor-pointer"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[#f4ead5] text-sm group-hover:text-[#8c7851] transition-colors">
                {preset.name}
              </span>
              {preset.description && (
                <span className="text-[11px] text-[#d4c3a1]/60">{preset.description}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#2d241e] border border-[#3d3329] font-mono text-xs text-[#f4ead5] font-semibold">
                {preset.formula}
              </span>

              {activeCategory === 'Custom' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustom(preset.id);
                  }}
                  className="p-1 rounded-lg bg-[#2d241e] text-[#d4c3a1] hover:text-rose-400 hover:bg-[#3d3329] transition-colors"
                  title="Delete preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {displayedPresets.length === 0 && activeCategory === 'Custom' && (
          <div className="col-span-2 py-6 text-center text-xs text-[#d4c3a1]/60">
            No custom presets saved yet. Add your favorite character attacks or spell formulas below!
          </div>
        )}
      </div>

      {/* Add Custom Formula Form */}
      {activeCategory === 'Custom' && (
        <form onSubmit={handleAddCustom} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#3d3329]">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Preset Name (e.g. Firebolt)"
            className="flex-1 bg-[#1a1714] border border-[#3d3329] rounded-xl px-3 py-2 text-xs text-[#f4ead5] focus:outline-none focus:border-[#8c7851]"
          />
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            placeholder="Formula (e.g. 2d10+3)"
            className="w-full sm:w-36 bg-[#1a1714] border border-[#3d3329] rounded-xl px-3 py-2 text-xs font-mono text-[#f4ead5] focus:outline-none focus:border-[#8c7851]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#8c7851] hover:bg-[#6d5b3d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors font-display"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </button>
        </form>
      )}
    </div>
  );
};
