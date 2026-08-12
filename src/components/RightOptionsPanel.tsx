import React, { useState } from 'react';
import { MaterialTheme, ShakeSettings, TableTheme } from '../types';
import { Palette, Smartphone, Volume2, VolumeX, Vibrate, SlidersHorizontal, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface RightOptionsPanelProps {
  materialTheme: MaterialTheme;
  tableTheme: TableTheme;
  diceTheme: string;
  onChangeMaterialTheme: (theme: MaterialTheme) => void;
  onChangeTableTheme: (theme: TableTheme) => void;
  onChangeDiceTheme: (theme: string) => void;
  shakeSettings: ShakeSettings;
  onUpdateShakeSettings: (settings: ShakeSettings) => void;
  onRequestSensorPermission: () => Promise<boolean>;
  onSimulateShake: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const RightOptionsPanel: React.FC<RightOptionsPanelProps> = ({
  materialTheme,
  tableTheme,
  diceTheme,
  onChangeMaterialTheme,
  onChangeTableTheme,
  onChangeDiceTheme,
  shakeSettings,
  onUpdateShakeSettings,
  onRequestSensorPermission,
  onSimulateShake,
  collapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'shake'>('themes');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const diceThemeOptions: { id: string; name: string; color: string }[] = [
    { id: 'default', name: 'Standard Classic', color: 'bg-zinc-600' },
    { id: 'smooth', name: 'Smooth Plastic', color: 'bg-sky-600' },
    { id: 'wooden', name: 'Carved Wooden', color: 'bg-amber-800' },
    { id: 'rust', name: 'Rusted Metal', color: 'bg-orange-800' },
    { id: 'rock', name: 'Chiseled Stone', color: 'bg-stone-500' },
    { id: 'gemstone', name: 'Polished Gem', color: 'bg-emerald-500' },
    { id: 'gemstoneMarble', name: 'Gemstone Marble', color: 'bg-teal-500' },
    { id: 'diceOfRolling', name: 'Dice of Rolling', color: 'bg-rose-500' },
    { id: 'blueGreenMetal', name: 'Blue-Green Metal', color: 'bg-cyan-600' },
    { id: 'smooth-pip', name: 'Smooth Pips', color: 'bg-yellow-600' },
  ];

  const materialOptions: { id: MaterialTheme; name: string; color: string }[] = [
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
    { id: 'ruby', name: 'Ruby Amber', color: 'bg-amber-600' },
    { id: 'gold', name: 'Polished Gold', color: 'bg-[#f59e0b]' },
    { id: 'cyber', name: 'Cyber Neon', color: 'bg-cyan-500' },
    { id: 'obsidian', name: 'Obsidian', color: 'bg-slate-800' },
    { id: 'ivory', name: 'Ivory Bone', color: 'bg-amber-100' },
    { id: 'galaxy', name: 'Cosmic Galaxy', color: 'bg-purple-600' },
  ];

  const tableOptions: { id: TableTheme; name: string; color: string }[] = [
    { id: 'green', name: 'Emerald Felt', color: 'bg-[#064e3b]' },
    { id: 'blue', name: 'Royal Sapphire', color: 'bg-[#1e3a8a]' },
    { id: 'crimson', name: 'Velvet Crimson', color: 'bg-[#881337]' },
    { id: 'dark', name: 'Midnight Obsidian', color: 'bg-[#0f172a]' },
    { id: 'leather', name: 'Vintage Leather', color: 'bg-[#451a03]' },
  ];

  const handleGrantPermission = async () => {
    const granted = await onRequestSensorPermission();
    setPermissionGranted(granted);
  };

  if (collapsed) {
    return (
      <div className="bg-[#1c1815] border-l border-[#3d3329] w-10 flex flex-col items-center py-2 gap-3 z-20 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-[#28211b] hover:bg-[#3d3329] text-[#d4c3a1]"
          title="Expand Right Menu"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('themes'); }}
          className="p-1.5 rounded-lg text-[#d4c3a1]/70 hover:text-[#f4ead5]"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('shake'); }}
          className="p-1.5 rounded-lg text-[#d4c3a1]/70 hover:text-[#f4ead5]"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-20 right-6 z-40 w-64 bg-[#1c1815]/95 backdrop-blur-md border border-[#3d3329] rounded-2xl shadow-2xl flex flex-col select-none max-h-[calc(100vh-14rem)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Top Header & Collapse Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-[#3d3329] bg-[#171412]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeTab === 'themes'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style</span>
          </button>
          <button
            onClick={() => setActiveTab('shake')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeTab === 'shake'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Motion</span>
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-[#d4c3a1]/50 hover:text-[#f4ead5] hover:bg-[#28211b]"
          title="Close Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto gap-3 text-xs">
        {activeTab === 'themes' ? (
          <div className="flex flex-col gap-3">
            {/* Dice Material Colors */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
                Dice Material:
              </span>
              <div className="grid grid-cols-1 gap-1">
                {materialOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeMaterialTheme(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded-xl border text-xs transition-all ${
                      materialTheme === item.id
                        ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                        : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${item.color} border border-white/20`} />
                      <span>{item.name}</span>
                    </div>
                    {materialTheme === item.id && <Check className="w-3.5 h-3.5 text-[#8c7851]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Dice Skins */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#3d3329]">
              <span className="text-[10px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
                3D Dice Skin:
              </span>
              <div className="grid grid-cols-1 gap-1">
                {diceThemeOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeDiceTheme(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded-xl border text-xs transition-all ${
                      diceTheme === item.id
                        ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                        : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${item.color} border border-white/20`} />
                      <span>{item.name}</span>
                    </div>
                    {diceTheme === item.id && <Check className="w-3.5 h-3.5 text-[#8c7851]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Felt Theme */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#3d3329]">
              <span className="text-[10px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
                Table Felt:
              </span>
              <div className="grid grid-cols-1 gap-1">
                {tableOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeTableTheme(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded-xl border text-xs transition-all ${
                      tableTheme === item.id
                        ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                        : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${item.color} border border-white/20`} />
                      <span>{item.name}</span>
                    </div>
                    {tableTheme === item.id && <Check className="w-3.5 h-3.5 text-[#8c7851]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Shake Motion & Audio Controls */
          <div className="flex flex-col gap-2.5">
            {/* Permission Banner */}
            <button
              onClick={handleGrantPermission}
              className="w-full py-2 px-3 rounded-xl bg-[#8c7851]/20 hover:bg-[#8c7851]/30 border border-[#8c7851] text-[#f4ead5] text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#8c7851]" />
                <span>Calibrate Motion Sensors</span>
              </div>
              {permissionGranted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Shake Toggle */}
            <div className="flex items-center justify-between bg-[#141210] p-2 rounded-xl border border-[#3d3329]">
              <span className="text-xs text-[#d4c3a1]/80 font-medium">Shake Phone to Roll</span>
              <input
                type="checkbox"
                checked={shakeSettings.enabled}
                onChange={(e) => onUpdateShakeSettings({ ...shakeSettings, enabled: e.target.checked })}
                className="w-4 h-4 accent-[#8c7851] rounded cursor-pointer"
              />
            </div>

            {/* Sensitivity Slider */}
            <div className="flex flex-col gap-1 bg-[#141210] p-2 rounded-xl border border-[#3d3329]">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#d4c3a1]/70">Sensitivity Level:</span>
                <span className="font-mono font-bold text-[#8c7851]">{shakeSettings.sensitivity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={shakeSettings.sensitivity}
                onChange={(e) => onUpdateShakeSettings({ ...shakeSettings, sensitivity: parseInt(e.target.value) })}
                className="w-full accent-[#8c7851] cursor-pointer"
              />
            </div>

            {/* Vibration & Sound Toggles */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, vibrationEnabled: !shakeSettings.vibrationEnabled })}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  shakeSettings.vibrationEnabled
                    ? 'bg-[#8c7851]/30 border-[#8c7851] text-[#f4ead5]'
                    : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/50'
                }`}
              >
                <Vibrate className="w-3.5 h-3.5" />
                <span>Haptics</span>
              </button>

              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, soundEnabled: !shakeSettings.soundEnabled })}
                className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  shakeSettings.soundEnabled
                    ? 'bg-[#8c7851]/30 border-[#8c7851] text-[#f4ead5]'
                    : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/50'
                }`}
              >
                {shakeSettings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Sound</span>
              </button>
            </div>

            {/* Simulate Shake Test Button */}
            <button
              onClick={onSimulateShake}
              className="w-full py-2 rounded-xl bg-[#28211b] hover:bg-[#3d3329] border border-[#3d3329] text-[#f4ead5] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-1"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#8c7851]" />
              <span>Simulate Motion Roll</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
