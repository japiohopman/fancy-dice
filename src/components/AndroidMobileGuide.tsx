import React, { useState } from 'react';
import { ShakeSettings } from '../types';
import { Smartphone, Volume2, VolumeX, Vibrate, Sliders, CheckCircle2, Download, Info } from 'lucide-react';

interface AndroidMobileGuideProps {
  shakeSettings: ShakeSettings;
  onUpdateSettings: (settings: ShakeSettings) => void;
  onRequestSensorPermission: () => Promise<boolean>;
  shakeProgress: number; // 0.0 to 1.0
}

export const AndroidMobileGuide: React.FC<AndroidMobileGuideProps> = ({
  shakeSettings,
  onUpdateSettings,
  onRequestSensorPermission,
  shakeProgress
}) => {
  const [showPwaGuide, setShowPwaGuide] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const handleRequestPermission = async () => {
    const granted = await onRequestSensorPermission();
    setPermissionGranted(granted);
  };

  return (
    <div className="w-full bg-[#1f1b18]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#3d3329] shadow-xl flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3d3329] pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#8c7851]" />
          <h2 className="font-semibold text-[#f4ead5] text-sm sm:text-base font-display tracking-wide">ANDROID & MOTION SETTINGS</h2>
        </div>

        <button
          onClick={() => setShowPwaGuide(!showPwaGuide)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#8c7851]/20 text-[#f4ead5] hover:bg-[#8c7851]/30 text-xs font-semibold border border-[#8c7851]/40 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#8c7851]" />
          <span>Install Android App</span>
        </button>
      </div>

      {/* PWA / Android Installation Guide Box */}
      {showPwaGuide && (
        <div className="p-4 rounded-xl bg-[#2d241e] border border-[#3d3329] text-xs text-[#d4c3a1] flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-[#f4ead5] text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#8c7851]" />
            <span>How to install as an Android App:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[#d4c3a1]">
            <li>Open this URL in Google Chrome or your phone browser.</li>
            <li>Tap the <strong>3 dots menu (⋮)</strong> in top right corner.</li>
            <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
            <li>Open directly from your Android app drawer with full screen, motion shake sensors, and sound!</li>
          </ol>
        </div>
      )}

      {/* Live Motion Sensor Meter */}
      <div className="flex flex-col gap-2 bg-[#1a1714] p-3.5 rounded-xl border border-[#3d3329]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#d4c3a1] font-medium flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#8c7851]" />
            Live Phone Shake Sensor:
          </span>
          <span className="font-mono text-[#f4ead5] font-bold">
            {Math.round(shakeProgress * 100)}% Intensity
          </span>
        </div>

        {/* Intensity Meter Bar */}
        <div className="w-full bg-[#2d241e] rounded-full h-3 overflow-hidden border border-[#3d3329]">
          <div
            className="bg-[#8c7851] h-full transition-all duration-75"
            style={{ width: `${Math.min(shakeProgress * 100, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-1 text-[11px] text-[#d4c3a1]/60">
          <span>Still</span>
          <span>Shake device to roll!</span>
          <span>Trigger</span>
        </div>
      </div>

      {/* Motion & Hardware Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Enable Shake Motion */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1714] border border-[#3d3329]">
          <span className="text-xs text-[#d4c3a1] font-medium">Shake to Roll</span>
          <input
            type="checkbox"
            checked={shakeSettings.enabled}
            onChange={(e) => onUpdateSettings({ ...shakeSettings, enabled: e.target.checked })}
            className="w-4 h-4 accent-[#8c7851] rounded cursor-pointer"
          />
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1714] border border-[#3d3329]">
          <div className="flex items-center gap-2">
            {shakeSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-[#8c7851]" /> : <VolumeX className="w-4 h-4 text-[#d4c3a1]/40" />}
            <span className="text-xs text-[#d4c3a1] font-medium">Sound FX</span>
          </div>
          <input
            type="checkbox"
            checked={shakeSettings.soundEnabled}
            onChange={(e) => onUpdateSettings({ ...shakeSettings, soundEnabled: e.target.checked })}
            className="w-4 h-4 accent-[#8c7851] rounded cursor-pointer"
          />
        </div>

        {/* Haptic Vibration */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1714] border border-[#3d3329]">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-[#8c7851]" />
            <span className="text-xs text-[#d4c3a1] font-medium">Haptics</span>
          </div>
          <input
            type="checkbox"
            checked={shakeSettings.vibrationEnabled}
            onChange={(e) => onUpdateSettings({ ...shakeSettings, vibrationEnabled: e.target.checked })}
            className="w-4 h-4 accent-[#8c7851] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Sensitivity Calibration Slider */}
      <div className="flex flex-col gap-1.5 bg-[#1a1714] p-3.5 rounded-xl border border-[#3d3329]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#d4c3a1] font-medium">Shake Sensitivity:</span>
          <span className="font-mono text-[#f4ead5] font-bold">
            Level {shakeSettings.sensitivity} ({shakeSettings.sensitivity > 7 ? 'Gentle' : shakeSettings.sensitivity < 4 ? 'Vigorous' : 'Medium'})
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={shakeSettings.sensitivity}
          onChange={(e) => onUpdateSettings({ ...shakeSettings, sensitivity: parseInt(e.target.value, 10) })}
          className="w-full accent-[#8c7851] cursor-pointer"
        />
      </div>

      {/* Permission Button if required */}
      <div className="flex items-center justify-between text-xs text-[#d4c3a1]/80 pt-1 border-t border-[#3d3329]">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#8c7851]" />
          Motion Sensor Status:
        </span>
        <button
          onClick={handleRequestPermission}
          className="text-xs text-[#f4ead5] hover:underline font-medium"
        >
          {permissionGranted === true ? 'Active ✓' : 'Calibrate / Grant Access'}
        </button>
      </div>
    </div>
  );
};
