import React, { useState } from 'react';
import { MaterialTheme, ShakeSettings, TableTheme } from '../types';
import { Palette, Smartphone, Volume2, VolumeX, Vibrate, SlidersHorizontal, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface RightOptionsPanelProps {
  materialTheme: MaterialTheme;
  tableTheme: TableTheme;
  onChangeMaterialTheme: (theme: MaterialTheme) => void;
  onChangeTableTheme: (theme: TableTheme) => void;
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
  onChangeMaterialTheme,
  onChangeTableTheme,
  shakeSettings,
  onUpdateShakeSettings,
  onRequestSensorPermission,
  onSimulateShake,
  collapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'shake'>('themes');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

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
    <aside className="w-48 bg-[#1c1815] border-l border-[#3d3329] flex flex-col z-20 shrink-0 h-full overflow-hidden select-none">
      {/* Top Header & Collapse Toggle */}
      <div className="flex items-center justify-between p-2 border-b border-[#3d3329] bg-[#171412]">
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-[#d4c3a1]/50 hover:text-[#f4ead5] hover:bg-[#28211b]"
          title="Collapse Menu"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all ${
              activeTab === 'themes'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>Style</span>
          </button>
          <button
            onClick={() => setActiveTab('shake')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 transition-all ${
              activeTab === 'shake'
                ? 'bg-[#8c7851] text-white shadow-sm'
                : 'text-[#d4c3a1]/70 hover:text-[#f4ead5]'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Motion</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-2 flex flex-col justify-between overflow-y-auto gap-1.5 text-[11px]">
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
    </aside>
  );
};
