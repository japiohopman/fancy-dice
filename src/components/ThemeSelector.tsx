import React from 'react';
import { MaterialTheme, TableTheme } from '../types';
import { Palette, Layers } from 'lucide-react';

interface ThemeSelectorProps {
  materialTheme: MaterialTheme;
  tableTheme: TableTheme;
  onChangeMaterialTheme: (theme: MaterialTheme) => void;
  onChangeTableTheme: (theme: TableTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  materialTheme,
  tableTheme,
  onChangeMaterialTheme,
  onChangeTableTheme
}) => {
  const materials: { id: MaterialTheme; label: string; colorBg: string }[] = [
    { id: 'emerald', label: 'Emerald Gem', colorBg: 'bg-emerald-600' },
    { id: 'obsidian', label: 'Obsidian Gold', colorBg: 'bg-slate-900 border-amber-500/80' },
    { id: 'gold', label: 'Polished Gold', colorBg: 'bg-amber-500' },
    { id: 'ruby', label: 'Ruby Crimson', colorBg: 'bg-rose-600' },
    { id: 'cyber', label: 'Cyber Neon', colorBg: 'bg-cyan-500' },
    { id: 'ivory', label: 'Classic Ivory', colorBg: 'bg-amber-100 text-slate-900' },
    { id: 'galaxy', label: 'Galaxy Purple', colorBg: 'bg-purple-600' },
  ];

  const tables: { id: TableTheme; label: string; colorBg: string }[] = [
    { id: 'green', label: 'RPG Green Felt', colorBg: 'bg-emerald-900' },
    { id: 'blue', label: 'Sapphire Felt', colorBg: 'bg-blue-900' },
    { id: 'crimson', label: 'Crimson Velvet', colorBg: 'bg-rose-950' },
    { id: 'dark', label: 'Dungeon Obsidian', colorBg: 'bg-slate-950' },
    { id: 'leather', label: 'Vintage Leather', colorBg: 'bg-amber-950' },
  ];

  return (
    <div className="w-full bg-[#1f1b18]/90 backdrop-blur-md rounded-2xl p-4 border border-[#3d3329] shadow-xl flex flex-col sm:flex-row gap-4 justify-between">

      {/* 3D Dice Material Selection */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#d4c3a1] font-medium flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#8c7851]" />
          3D Dice Material:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {materials.map(m => (
            <button
              key={m.id}
              onClick={() => onChangeMaterialTheme(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                materialTheme === m.id
                  ? 'border-[#8c7851] bg-[#8c7851]/20 text-[#f4ead5] shadow-sm'
                  : 'border-[#3d3329] bg-[#1a1714] text-[#d4c3a1]/70 hover:text-[#f4ead5]'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border border-white/20 ${m.colorBg}`} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Felt Table Surface Color Selection */}
      <div className="flex flex-col gap-2 border-t sm:border-t-0 sm:border-l border-[#3d3329] pt-3 sm:pt-0 sm:pl-4">
        <span className="text-xs text-[#d4c3a1] font-medium flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#8c7851]" />
          Felt Table Color:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {tables.map(t => (
            <button
              key={t.id}
              onClick={() => onChangeTableTheme(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                tableTheme === t.id
                  ? 'border-[#8c7851] bg-[#8c7851]/20 text-[#f4ead5] shadow-sm'
                  : 'border-[#3d3329] bg-[#1a1714] text-[#d4c3a1]/70 hover:text-[#f4ead5]'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border border-white/20 ${t.colorBg}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
