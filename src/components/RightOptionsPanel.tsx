import React, { useState, useEffect, useRef } from 'react';
import { MaterialTheme, ShakeSettings, TableTheme } from '../types';
import { Palette, Smartphone, Volume2, VolumeX, Vibrate, Check, SlidersHorizontal, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface RightOptionsPanelProps {
  materialTheme: MaterialTheme | string;
  tableTheme: TableTheme;
  diceTheme: string;
  onChangeMaterialTheme: (theme: string) => void;
  onChangeTableTheme: (theme: TableTheme) => void;
  onChangeDiceTheme: (theme: string) => void;
  shakeSettings: ShakeSettings;
  onUpdateShakeSettings: (settings: ShakeSettings) => void;
  onRequestSensorPermission: () => Promise<boolean>;
  onSimulateShake: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Convert HSL to HEX helper
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert HEX to HSL helper
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
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
  const [activeTab, setActiveTab] = useState<'theme' | 'color' | 'board' | 'settings'>('theme');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Local state for interactive Color Wheel
  const [wheelH, setWheelH] = useState<number>(140); // default emerald hue
  const [wheelS, setWheelS] = useState<number>(100);
  const isDraggingRef = useRef<boolean>(false);

  // Load color presets or convert current materialTheme if it is a hex color
  useEffect(() => {
    if (materialTheme.startsWith('#')) {
      const hsl = hexToHsl(materialTheme);
      setWheelH(hsl.h);
      setWheelS(hsl.s);
    } else {
      // Map standard presets to HSL
      const presetColors: Record<string, string> = {
        emerald: '#059669',
        ruby: '#d97706',
        gold: '#f59e0b',
        cyber: '#06b6d4',
        obsidian: '#1f2937',
        ivory: '#fef3c7',
        galaxy: '#7e22ce',
      };
      const hex = presetColors[materialTheme] || '#8c7851';
      const hsl = hexToHsl(hex);
      setWheelH(hsl.h);
      setWheelS(hsl.s);
    }
  }, [materialTheme]);

  const diceThemeOptions = [
    { id: 'default', name: 'Classic' },
    { id: 'smooth', name: 'Plastic' },
    { id: 'wooden', name: 'Wooden' },
    { id: 'rust', name: 'Rusted' },
    { id: 'rock', name: 'Stone' },
    { id: 'gemstone', name: 'Gemstone' },
  ];

  const materialOptions = [
    { id: 'emerald', name: 'Emerald', hex: '#059669' },
    { id: 'ruby', name: 'Ruby', hex: '#d97706' },
    { id: 'gold', name: 'Gold', hex: '#f59e0b' },
    { id: 'cyber', name: 'Cyber', hex: '#06b6d4' },
    { id: 'obsidian', name: 'Obsidian', hex: '#1f2937' },
  ];

  const tableOptions: { id: TableTheme; name: string; color: string }[] = [
    { id: 'green', name: 'Emerald Felt', color: 'bg-[#064e3b]' },
    { id: 'blue', name: 'Sapphire Felt', color: 'bg-[#1e3a8a]' },
    { id: 'crimson', name: 'Crimson Felt', color: 'bg-[#881337]' },
    { id: 'dark', name: 'Midnight felt', color: 'bg-[#0f172a]' },
    { id: 'leather', name: 'Leather felt', color: 'bg-[#451a03]' },
  ];

  const handleGrantPermission = async () => {
    const granted = await onRequestSensorPermission();
    setPermissionGranted(granted);
  };

  // Color picking handler on the Color Wheel conic gradient
  const handleColorPick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Position relative to center
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);

    // Angle in radians
    let angle = Math.atan2(y, x);
    let h = Math.round((angle * 180) / Math.PI);
    if (h < 0) h += 360;

    // Distance from center
    const dist = Math.sqrt(x * x + y * y);
    const radius = rect.width / 2;
    const s = Math.min(100, Math.round((dist / radius) * 100));

    setWheelH(h);
    setWheelS(s);

    const hexColor = hslToHex(h, s, 50);
    onChangeMaterialTheme(hexColor);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    handleColorPick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      handleColorPick(e);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Calculate thumb coordinate on wheel
  const angleRad = (wheelH * Math.PI) / 180;
  const thumbDist = (wheelS / 100) * 44; // 44px is max distance inside 48px radius wheel
  const thumbX = Math.round(Math.cos(angleRad) * thumbDist);
  const thumbY = Math.round(Math.sin(angleRad) * thumbDist);

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
      </div>
    );
  }

  return (
    <aside className="w-40 bg-[#1c1815] border-l border-[#3d3329] flex flex-col z-20 shrink-0 h-full overflow-hidden select-none">
      {/* Submenu Tabs list */}
      <div className="grid grid-cols-4 gap-0.5 p-1 border-b border-[#3d3329] bg-[#171412]">
        {(['theme', 'color', 'board', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1 text-[9px] font-bold uppercase rounded transition-all ${
              activeTab === tab
                ? 'bg-[#8c7851] text-white'
                : 'text-[#d4c3a1]/60 hover:text-[#f4ead5] hover:bg-[#28211b]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="flex-1 p-2 flex flex-col justify-between overflow-y-auto gap-1.5 text-[11px]">
        {activeTab === 'theme' && (
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
              3D Dice Skin:
            </span>
            <div className="grid grid-cols-1 gap-1">
              {diceThemeOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeDiceTheme(item.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] transition-all ${
                    diceTheme === item.id
                      ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                      : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {diceTheme === item.id && <Check className="w-3 h-3 text-[#8c7851] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'color' && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-[9px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider self-start">
              Custom color picker:
            </span>

            {/* Interactive custom circular Color Wheel */}
            <div
              className="w-24 h-24 rounded-full relative cursor-crosshair border border-[#3d3329] shadow-inner select-none shrink-0"
              style={{
                background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleColorPick}
              onTouchMove={handleColorPick}
            >
              {/* Radial white-to-transparent overlay for saturation */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,white,transparent_100%)] opacity-70 pointer-events-none" />

              {/* Center thumb selector knob */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full border-2 border-white bg-black/60 shadow pointer-events-none transition-transform duration-75"
                style={{
                  left: 'calc(50% - 7px)',
                  top: 'calc(50% - 7px)',
                  transform: `translate(${thumbX}px, ${thumbY}px)`
                }}
              />
            </div>

            {/* Active Hex Display */}
            <div className="flex items-center gap-1 bg-[#141210] px-2 py-1 rounded border border-[#3d3329] w-full justify-between">
              <span className="text-[9px] text-[#d4c3a1]/50 uppercase font-mono">Picked:</span>
              <span className="font-mono text-[10px] font-bold text-[#f4ead5]">
                {materialTheme.startsWith('#') ? materialTheme.toUpperCase() : hslToHex(wheelH, wheelS, 50).toUpperCase()}
              </span>
              <span
                className="w-3.5 h-3.5 rounded border border-white/20 shadow-sm"
                style={{
                  backgroundColor: materialTheme.startsWith('#') ? materialTheme : hslToHex(wheelH, wheelS, 50)
                }}
              />
            </div>

            {/* Solid material color presets */}
            <div className="grid grid-cols-2 gap-1 w-full pt-1.5 border-t border-[#3d3329]/50">
              {materialOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeMaterialTheme(item.id)}
                  className={`flex items-center gap-1 p-1 rounded border text-[9px] transition-all truncate ${
                    materialTheme === item.id
                      ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                      : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.hex }} />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
              Board Felt:
            </span>
            <div className="grid grid-cols-1 gap-1">
              {tableOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeTableTheme(item.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] transition-all ${
                    tableTheme === item.id
                      ? 'bg-[#8c7851]/20 border-[#8c7851] text-[#f4ead5] font-bold'
                      : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/80 hover:border-[#8c7851]/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} border border-white/20 shrink-0`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {tableTheme === item.id && <Check className="w-3 h-3 text-[#8c7851] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase font-bold text-[#d4c3a1]/60 tracking-wider">
              Settings & Haptics:
            </span>

            {/* Permission button */}
            <button
              onClick={handleGrantPermission}
              className="w-full py-1.5 px-2 rounded-lg bg-[#8c7851]/20 hover:bg-[#8c7851]/30 border border-[#8c7851] text-[#f4ead5] text-[9px] font-semibold flex items-center justify-between transition-colors min-w-0"
            >
              <span className="truncate">Calibrate Sensors</span>
              {permissionGranted && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
            </button>

            {/* Shake Phone to Roll */}
            <div className="flex items-center justify-between bg-[#141210] p-1.5 rounded-lg border border-[#3d3329]">
              <span className="text-[9px] text-[#d4c3a1]/80 font-medium truncate">Shake Roll</span>
              <input
                type="checkbox"
                checked={shakeSettings.enabled}
                onChange={(e) => onUpdateShakeSettings({ ...shakeSettings, enabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#8c7851] rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Sensitivity Slider */}
            <div className="flex flex-col gap-1 bg-[#141210] p-1.5 rounded-lg border border-[#3d3329]">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-[#d4c3a1]/70">Sensitivity:</span>
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

            {/* Haptics & Audio Buttons */}
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, vibrationEnabled: !shakeSettings.vibrationEnabled })}
                className={`p-1 rounded-lg border text-[9px] font-semibold flex items-center justify-center gap-0.5 transition-all ${
                  shakeSettings.vibrationEnabled
                    ? 'bg-[#8c7851]/30 border-[#8c7851] text-[#f4ead5]'
                    : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/50'
                }`}
                title="Haptic vibration feedback"
              >
                <Vibrate className="w-3 h-3" />
                <span>Haptic</span>
              </button>

              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, soundEnabled: !shakeSettings.soundEnabled })}
                className={`p-1 rounded-lg border text-[9px] font-semibold flex items-center justify-center gap-0.5 transition-all ${
                  shakeSettings.soundEnabled
                    ? 'bg-[#8c7851]/30 border-[#8c7851] text-[#f4ead5]'
                    : 'bg-[#141210] border-[#3d3329] text-[#d4c3a1]/50'
                }`}
                title="Roll audio feedback"
              >
                {shakeSettings.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>Sound</span>
              </button>
            </div>

            {/* Simulate Roll */}
            <button
              onClick={onSimulateShake}
              className="w-full py-1.5 rounded-lg bg-[#28211b] hover:bg-[#3d3329] border border-[#3d3329] text-[#f4ead5] font-bold text-[10px] flex items-center justify-center gap-1 transition-colors mt-1"
            >
              <Smartphone className="w-3 h-3 text-[#8c7851]" />
              <span>Simulate Roll</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
