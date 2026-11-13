import React, { useState, useEffect, useRef } from 'react';
import { MaterialTheme, ShakeSettings, TableTheme } from '../types';
import { AlertTriangle, Check, Vibrate, Volume2, VolumeX, Smartphone } from 'lucide-react';

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
  sensorPermissionGranted: boolean | null;
  onSimulateShake: () => void;
  activeTab: 'theme' | 'color' | 'settings';
}

/** Converts hue, saturation, and lightness values into a hexadecimal CSS color. */
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

const MATERIAL_PRESET_COLORS: Record<string, string> = {
  emerald: '#059669',
  ruby: '#d97706',
  gold: '#f59e0b',
  cyber: '#06b6d4',
  obsidian: '#1f2937',
  ivory: '#fef3c7',
  galaxy: '#7e22ce',
};

const MATERIAL_PRESET_LABELS: Record<string, string> = {
  emerald: 'Emerald',
  ruby: 'Ruby',
  gold: 'Gold',
  cyber: 'Cyber',
  obsidian: 'Obsidian',
  ivory: 'Ivory',
  galaxy: 'Galaxy',
};

/** Converts a hexadecimal CSS color into hue, saturation, and lightness values. */
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

/** Renders dice materials, custom colors, board surfaces, and device options. */
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
  sensorPermissionGranted: permissionGranted,
  onSimulateShake,
  activeTab,
}) => {
  const hasMotionSensor = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  const supportsMotionPermissionRequest =
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    }).requestPermission === 'function';

  const sensorStatus = !hasMotionSensor
    ? {
        title: 'Motion sensors unavailable',
        description: 'This browser does not expose device-motion data. The simulated shake test below is still available.',
        state: 'warning' as const,
      }
    : permissionGranted === false
      ? {
          title: 'Motion access denied',
          description: 'Allow motion access in your browser or device settings, then try again.',
          state: 'warning' as const,
        }
      : permissionGranted === true
        ? {
            title: 'Motion access granted',
            description: 'Shake-to-roll can listen for movement from this device.',
            state: 'success' as const,
          }
        : supportsMotionPermissionRequest
          ? {
              title: 'Motion permission needed',
              description: 'Grant motion access once to enable shake-to-roll on this device.',
              state: 'pending' as const,
            }
          : {
              title: 'Motion sensor detected',
              description: 'This browser does not require a separate motion permission prompt.',
              state: 'success' as const,
            };

  const sensorStatusClass = sensorStatus.state === 'warning'
    ? 'border-amber-700/50 bg-amber-950/30 text-amber-200'
    : sensorStatus.state === 'pending'
      ? 'border-[#8c7851]/60 bg-[#8c7851]/10 text-[#d4c3a1]'
      : 'border-emerald-800/50 bg-emerald-950/20 text-emerald-200';

  const activeColorHex = materialTheme.startsWith('#')
    ? materialTheme.toUpperCase()
    : (MATERIAL_PRESET_COLORS[materialTheme] || '#8c7851').toUpperCase();
  const activeColorLabel = materialTheme.startsWith('#')
    ? 'Custom color'
    : MATERIAL_PRESET_LABELS[materialTheme] || 'Selected material';

  // Keep the wheel marker responsive while coalescing expensive parent/DiceBox updates.
  const COLOR_PREVIEW_INTERVAL_MS = 32;
  const [wheelH, setWheelH] = useState<number>(140);
  const [wheelS, setWheelS] = useState<number>(100);
  const activePointerIdRef = useRef<number | null>(null);
  const wheelRectRef = useRef<DOMRect | null>(null);
  const pendingWheelColorRef = useRef<{ hue: number; saturation: number; queuedAt: number } | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const lastAppliedColorRef = useRef(activeColorHex);
  const lastDiceColorCommitAtRef = useRef(0);

  const flushPendingWheelColor = (force = false, updateLocalState = true) => {
    const pending = pendingWheelColorRef.current;
    if (!pending) return;

    pendingWheelColorRef.current = null;
    const nextColor = hslToHex(pending.hue, pending.saturation, 50).toUpperCase();
    const now = performance.now();

    if (updateLocalState) {
      setWheelH(pending.hue);
      setWheelS(pending.saturation);
    }

    // Preview the dice at most ~30 times per second while dragging; pointer-up
    // always commits the exact final value immediately.
    if (
      nextColor !== lastAppliedColorRef.current &&
      (force || now - lastDiceColorCommitAtRef.current >= COLOR_PREVIEW_INTERVAL_MS)
    ) {
      lastAppliedColorRef.current = nextColor;
      lastDiceColorCommitAtRef.current = now;
      onChangeMaterialTheme(nextColor);
    }

    performance.measure('fancy-dice:color-wheel-commit', {
      start: pending.queuedAt,
      end: performance.now(),
    });
  };

  const flushPendingWheelColorRef = useRef(flushPendingWheelColor);
  flushPendingWheelColorRef.current = flushPendingWheelColor;

  useEffect(() => {
    const hex = materialTheme.startsWith('#')
      ? materialTheme
      : MATERIAL_PRESET_COLORS[materialTheme] || '#8c7851';
    const normalizedHex = hex.toUpperCase();
    const hsl = hexToHsl(hex);
    setWheelH(hsl.h);
    setWheelS(hsl.s);
    lastAppliedColorRef.current = normalizedHex;
  }, [materialTheme]);

  // A menu can close while a pointer frame is queued. Commit its last value
  // instead of silently discarding the user's final color selection.
  useEffect(() => {
    return () => {
      if (wheelFrameRef.current !== null) {
        cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
      flushPendingWheelColorRef.current(true, false);
    };
  }, []);

  const tableOptions: { id: TableTheme; name: string; color: string }[] = [
    { id: 'green', name: 'Emerald Felt', color: 'bg-[#064e3b]' },
    { id: 'blue', name: 'Sapphire Felt', color: 'bg-[#1e3a8a]' },
    { id: 'crimson', name: 'Crimson Felt', color: 'bg-[#881337]' },
    { id: 'dark', name: 'Midnight Felt', color: 'bg-[#0f172a]' },
    { id: 'leather', name: 'Leather Felt', color: 'bg-[#451a03]' },
  ];

  /** Requests device-motion permission through App, which retains the result across menu unmounts. */
  const handleGrantPermission = async () => {
    await onRequestSensorPermission();
  };

  /** Converts a pointer position into the latest pending hue/saturation sample. */
  const handleColorPick = (clientX: number, clientY: number) => {
    const rect = wheelRectRef.current;
    if (!rect) return;

    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    const angle = Math.atan2(y, x);
    const hue = (Math.round((angle * 180) / Math.PI) + 360) % 360;
    const distance = Math.sqrt(x * x + y * y);
    const saturation = Math.min(100, Math.round((distance / (rect.width / 2)) * 100));

    pendingWheelColorRef.current = { hue, saturation, queuedAt: performance.now() };
    if (wheelFrameRef.current === null) {
      wheelFrameRef.current = requestAnimationFrame(() => {
        wheelFrameRef.current = null;
        flushPendingWheelColor();
      });
    }
  };

  /** Captures the active pointer and measures the wheel once for the whole drag. */
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (activePointerIdRef.current !== null) return;

    activePointerIdRef.current = event.pointerId;
    wheelRectRef.current = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    handleColorPick(event.clientX, event.clientY);
  };

  /** Only the pointer that started the drag may update the pending color. */
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    handleColorPick(event.clientX, event.clientY);
  };

  /** Commits the exact final color immediately, even inside the 30 Hz preview window. */
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    handleColorPick(event.clientX, event.clientY);

    if (wheelFrameRef.current !== null) {
      cancelAnimationFrame(wheelFrameRef.current);
      wheelFrameRef.current = null;
    }
    flushPendingWheelColor(true);
    activePointerIdRef.current = null;
    wheelRectRef.current = null;
  };

  /** Flushes the last valid pointer sample if the browser cancels pointer capture. */
  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (wheelFrameRef.current !== null) {
      cancelAnimationFrame(wheelFrameRef.current);
      wheelFrameRef.current = null;
    }
    flushPendingWheelColor(true);
    activePointerIdRef.current = null;
    wheelRectRef.current = null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 p-2 flex flex-col justify-between overflow-y-auto gap-2 text-[11px] no-scrollbar">
        {activeTab === 'theme' && (
          <div className="flex flex-col gap-2">
            <span className="ui-section-label">
              3D Dice Skin:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {diceThemeOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangeDiceTheme(item.id)}
                  aria-pressed={diceTheme === item.id}
                  data-selected={diceTheme === item.id}
                  className="ui-choice-button"
                >
                  <span className="truncate">{item.name}</span>
                  {diceTheme === item.id && <Check className="w-3.5 h-3.5 text-[#a38c5e] shrink-0" />}
                </button>
              ))}
            </div>
            <div className="mt-1 flex flex-col gap-2 border-t border-[#3d3329] pt-3">
              <span className="ui-section-label">
                Table Felt:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {tableOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeTableTheme(item.id)}
                    aria-pressed={tableTheme === item.id}
                    data-selected={tableTheme === item.id}
                    className="ui-choice-button"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-3 h-3 rounded-full ${item.color} border border-white/30 shrink-0 shadow-sm`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {tableTheme === item.id && <Check className="w-3.5 h-3.5 text-[#a38c5e] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'color' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full">
              <h3 className="ui-section-label">
                Custom Dice Color
              </h3>
              <p id="dice-color-help" className="mt-1 text-[10px] leading-relaxed text-[#d4c3a1]/65">
                These controls change the dice material only. Change the table felt separately under Themes.
                Your dice preview updates as soon as you choose a color.
              </p>
            </div>

            {/* Active material color is explicit for both presets and arbitrary custom HEX values. */}
            <div
              role="group"
              aria-label={`Active dice color: ${activeColorLabel}, ${activeColorHex}`}
              className="ui-inset-surface flex w-full items-center gap-3 p-3"
            >
              <span
                aria-hidden="true"
                className="h-12 w-12 shrink-0 rounded-lg border border-white/25 shadow-md"
                style={{ backgroundColor: activeColorHex }}
              />
              <div className="min-w-0 flex-1">
                <p className="ui-section-label">
                  Active dice color
                </p>
                <code className="mt-0.5 block text-sm font-bold text-[#f4ead5]">{activeColorHex}</code>
                <p className="mt-0.5 text-[10px] text-[#d4c3a1]/65">{activeColorLabel}</p>
              </div>
              <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-[#a38c5e]/70 bg-[#8c7851]/15 px-2.5 text-[10px] font-title font-bold text-[#f4ead5] transition-colors hover:bg-[#8c7851]/25 focus-within:ring-2 focus-within:ring-[#c5a66b]">
                <span>Choose</span>
                <input
                  type="color"
                  value={activeColorHex}
                  onChange={(event) => onChangeMaterialTheme(event.target.value.toUpperCase())}
                  aria-label="Choose a custom dice material color"
                  className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>
            </div>

            {/* Hue and saturation wheel; native color input above is the keyboard-accessible alternative. */}
            <div
              role="group"
              aria-label="Custom dice color wheel"
              aria-describedby="dice-color-help"
              className="w-32 h-32 rounded-full relative cursor-crosshair border-2 border-[#a38c5e]/70 shadow-lg select-none shrink-0 touch-none"
              style={{
                background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerEnd}
              onLostPointerCapture={handlePointerEnd}
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,white,transparent_100%)] opacity-70 pointer-events-none" />
              <div
                aria-hidden="true"
                className="absolute w-4 h-4 rounded-full border-2 border-white bg-black/70 shadow-md pointer-events-none transition-transform duration-75"
                style={{
                  left: 'calc(50% - 8px)',
                  top: 'calc(50% - 8px)',
                  transform: `translate(${Math.round(Math.cos((wheelH * Math.PI) / 180) * (wheelS / 100) * 58)}px, ${Math.round(Math.sin((wheelH * Math.PI) / 180) * (wheelS / 100) * 58)}px)`
                }}
              />
            </div>

            {/* Material presets retain their live DiceBox preview and expose selected state to assistive technology. */}
            <div className="grid grid-cols-2 gap-1.5 w-full border-t border-[#3d3329] pt-3">
              <p className="col-span-2 text-[9px] uppercase font-title font-bold tracking-wider text-[#8c7851]">
                Material presets
              </p>
              {materialOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeMaterialTheme(item.id)}
                  aria-label={`Use ${item.name} dice color, ${item.hex}`}
                  aria-pressed={materialTheme === item.id}
                  className="ui-choice-button"
                >
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full shrink-0 border border-white/25 shadow-sm"
                    style={{ backgroundColor: item.hex }}
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                  {materialTheme === item.id && <Check className="h-3.5 w-3.5 shrink-0 text-[#e2c58d]" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-2">
            <span className="ui-section-label">
              Device & Feedback
            </span>

            {/* Sensor availability and permission state are explicit; simulation remains usable without hardware support. */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-start gap-2 rounded-xl border p-2 ${sensorStatusClass}`}
            >
              {sensorStatus.state === 'warning'
                ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              <div className="min-w-0">
                <p className="text-[10px] font-title font-bold">{sensorStatus.title}</p>
                <p className="mt-0.5 text-[9px] leading-relaxed opacity-80">{sensorStatus.description}</p>
              </div>
            </div>

            {/* Permission request is available only when the browser exposes DeviceMotionEvent. */}
            <button
              type="button"
              onClick={handleGrantPermission}
              disabled={!hasMotionSensor || !supportsMotionPermissionRequest || permissionGranted === true}
              className="ui-button ui-button--quiet w-full min-w-0 justify-between text-[10px] disabled:cursor-not-allowed"
            >
              <span className="truncate">
                {!hasMotionSensor
                  ? 'Motion access unavailable'
                  : !supportsMotionPermissionRequest
                    ? 'No permission required'
                    : permissionGranted
                      ? 'Motion access enabled'
                      : 'Allow motion access'}
              </span>
              {permissionGranted && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </button>

            {/* Shake Phone to Roll */}
            <div className="ui-inset-surface flex items-center justify-between p-2">
              <span className="text-[10px] text-[#d4c3a1]/80 font-title font-medium truncate">Shake Roll</span>
              <input
                type="checkbox"
                checked={shakeSettings.enabled}
                onChange={(e) => onUpdateShakeSettings({ ...shakeSettings, enabled: e.target.checked })}
                aria-label="Enable shake-to-roll"
                className="w-4 h-4 accent-[#a38c5e] rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Sensitivity Slider */}
            <div className="ui-inset-surface flex flex-col gap-1 p-2">
              <div className="flex justify-between items-center text-[10px] font-title">
                <span className="text-[#d4c3a1]/70">Sensitivity:</span>
                <span className="font-mono font-bold text-[#a38c5e]">{shakeSettings.sensitivity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={shakeSettings.sensitivity}
                onChange={(e) => onUpdateShakeSettings({ ...shakeSettings, sensitivity: parseInt(e.target.value) })}
                aria-label="Shake sensitivity"
                className="w-full accent-[#a38c5e] cursor-pointer"
              />
            </div>

            {/* Haptics & Audio Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, vibrationEnabled: !shakeSettings.vibrationEnabled })}
                data-selected={shakeSettings.vibrationEnabled}
                className="ui-segment-button w-full"
                title="Haptic vibration feedback"
                aria-pressed={shakeSettings.vibrationEnabled}
              >
                <Vibrate className="w-3 h-3" />
                <span>Haptic</span>
              </button>

              <button
                onClick={() => onUpdateShakeSettings({ ...shakeSettings, soundEnabled: !shakeSettings.soundEnabled })}
                data-selected={shakeSettings.soundEnabled}
                className="ui-segment-button w-full"
                title="Roll audio feedback"
                aria-pressed={shakeSettings.soundEnabled}
              >
                {shakeSettings.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>Sound</span>
              </button>
            </div>

            {/* Manual test is independent of hardware sensor availability. */}
            <div className="mt-1 flex flex-col gap-1">
              <button
                type="button"
                onClick={onSimulateShake}
                aria-label="Test simulated shake-to-roll"
                className="ui-button ui-button--quiet w-full text-[10.5px]"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#a38c5e]" aria-hidden="true" />
                <span>Test simulated shake</span>
              </button>
              <p className="text-center text-[9px] leading-relaxed text-[#d4c3a1]/55">
                Plays the shake feedback and starts a roll without moving your device.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
