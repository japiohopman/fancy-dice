import React, { useState, useEffect, useRef } from 'react';
import { Dices, SlidersHorizontal } from 'lucide-react';
import { MaterialTheme, RollHistoryEntry, RollParsedResult, ShakeSettings, TableTheme } from './types';
import { parseAndRollFormula, updateParsedResultWithPhysicalRolls } from './lib/diceParser';
import { audioManager } from './lib/audioManager';
import { ShakeDetector } from './lib/shakeDetector';
import { ThreeDiceCanvas } from './components/ThreeDiceCanvas';
import { TopNotationBar } from './components/TopNotationBar';
import { LeftOptionsPanel } from './components/LeftOptionsPanel';
import { RightOptionsPanel } from './components/RightOptionsPanel';
import { BottomHistoryBar } from './components/BottomHistoryBar';

export default function App() {
  const [currentFormula, setCurrentFormula] = useState<string>('1d20');
  const [currentResult, setCurrentResult] = useState<RollParsedResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Overlay state for minimal layout
  const [showDicePicker, setShowDicePicker] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);

  // Layout Collapsed States for Mobile Side Panels
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);

  // Customization State
  const [materialTheme, setMaterialTheme] = useState<MaterialTheme>('emerald');
  const [tableTheme, setTableTheme] = useState<TableTheme>('green');

  // Shake & Audio Settings
  const [shakeSettings, setShakeSettings] = useState<ShakeSettings>({
    enabled: true,
    sensitivity: 6,
    vibrationEnabled: true,
    soundEnabled: true,
  });

  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const shakeDetectorRef = useRef<ShakeDetector | null>(null);

  // Refs to capture active roll state for physical evaluation
  const activePresetNameRef = useRef<string | undefined>(undefined);
  const activeResultRef = useRef<RollParsedResult | null>(null);

  // Sync Audio Mute setting
  useEffect(() => {
    audioManager.setMuted(!shakeSettings.soundEnabled);
  }, [shakeSettings.soundEnabled]);

  // Execute Roll Logic
  const handleExecuteRoll = (formulaToRoll?: string, presetName?: string) => {
    if (isRolling) return;

    const formula = formulaToRoll || currentFormula || '1d20';
    setCurrentFormula(formula);
    setIsRolling(true);

    // Play dice bounce sounds
    audioManager.playDiceRollSound(4);

    // Evaluate roll formula layout using Fantastic Notation Parser
    const result = parseAndRollFormula(formula);

    // Store active context to map physical results when they land
    activeResultRef.current = result;
    activePresetNameRef.current = presetName;

    // Trigger visual roll of correct dice structure
    setCurrentResult(result);
  };

  const handleRollComplete = (physicalResults: any) => {
    if (!isRolling || !activeResultRef.current) return;

    // Map the actual physical rolling results back into our parsed structure
    const finalizedResult = updateParsedResultWithPhysicalRolls(activeResultRef.current, physicalResults);

    // Update state to render the visual outcomes and finish rolling
    setCurrentResult(finalizedResult);
    setIsRolling(false);

    // Play victory chime or fumble thud based on the actual physical roll result
    if (finalizedResult.isCrit) {
      audioManager.playCritSound();
    } else if (finalizedResult.isFumble) {
      audioManager.playFumbleSound();
    }

    // Record to history using the actual physical roll result
    const newEntry: RollHistoryEntry = {
      id: `history-${Date.now()}`,
      result: finalizedResult,
      presetName: activePresetNameRef.current
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));

    // Clear active ref
    activeResultRef.current = null;
    activePresetNameRef.current = undefined;
  };

  // Initialize Shake Motion Detector
  useEffect(() => {
    const detector = new ShakeDetector(shakeSettings);
    shakeDetectorRef.current = detector;

    detector.setCallbacks(
      () => {
        handleExecuteRoll();
      },
      () => {}
    );

    if (shakeSettings.enabled) {
      detector.start();
    }

    return () => {
      detector.stop();
    };
  }, [shakeSettings, currentFormula]);

  const handleUpdateShakeSettings = (newSettings: ShakeSettings) => {
    setShakeSettings(newSettings);
    if (shakeDetectorRef.current) {
      shakeDetectorRef.current.updateSettings(newSettings);
    }
  };

  const handleRequestPermission = async () => {
    if (shakeDetectorRef.current) {
      return await shakeDetectorRef.current.requestPermission();
    }
    return true;
  };

  const handleSimulateShake = () => {
    if (shakeDetectorRef.current) {
      shakeDetectorRef.current.triggerSimulatedShake();
    } else {
      handleExecuteRoll();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#12100e] text-[#d4c3a1] flex flex-col font-sans select-none">
      {/* 1. TOP NOTATION & QUICK FORMULA BAR */}
      <TopNotationBar
        currentFormula={currentFormula}
        onFormulaChange={setCurrentFormula}
        onRoll={(f) => handleExecuteRoll(f)}
        isRolling={isRolling}
        soundEnabled={shakeSettings.soundEnabled}
        onToggleSound={() => handleUpdateShakeSettings({ ...shakeSettings, soundEnabled: !shakeSettings.soundEnabled })}
        shakeEnabled={shakeSettings.enabled}
      />

      {/* 2. MIDDLE VIEWPORT (CENTER 3D CANVAS WITH OVERLAYS) */}
      <div className="flex-1 flex w-full h-full min-h-0 relative overflow-hidden">
        {/* Center Stage: 3D Physics Dice Box Canvas with Outcome Overlay */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#064e3b] shadow-inner">
          <ThreeDiceCanvas
            rollResult={currentResult}
            isRolling={isRolling}
            materialTheme={materialTheme}
            tableTheme={tableTheme}
            onRollComplete={handleRollComplete}
          />

          {/* Floating Toggle Buttons */}
          {/* Left Floating Button: Dice Selector */}
          <button
            onClick={() => {
              setShowDicePicker(!showDicePicker);
              setShowOptions(false);
            }}
            className={`absolute bottom-6 left-6 z-30 p-3 rounded-full border shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer font-display ${
              showDicePicker
                ? 'bg-[#8c7851] text-white border-[#8c7851]'
                : 'bg-[#1c1815]/90 hover:bg-[#28211b] border-[#8c7851]/40 text-[#f4ead5]'
            }`}
            title="Open Dice Picker"
          >
            <Dices className="w-5 h-5 text-current" />
            <span className="text-xs font-bold tracking-wider hidden sm:inline">Dice</span>
          </button>

          {/* Right Floating Button: Settings/Style */}
          <button
            onClick={() => {
              setShowOptions(!showOptions);
              setShowDicePicker(false);
            }}
            className={`absolute bottom-6 right-6 z-30 p-3 rounded-full border shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer font-display ${
              showOptions
                ? 'bg-[#8c7851] text-white border-[#8c7851]'
                : 'bg-[#1c1815]/90 hover:bg-[#28211b] border-[#8c7851]/40 text-[#f4ead5]'
            }`}
            title="Open Style & Settings"
          >
            <SlidersHorizontal className="w-5 h-5 text-current" />
            <span className="text-xs font-bold tracking-wider hidden sm:inline">Options</span>
          </button>

          {/* Absolute Overlays */}
          {showDicePicker && (
            <LeftOptionsPanel
              onRoll={(f) => {
                handleExecuteRoll(f);
                setShowDicePicker(false); // Close overlay after rolling
              }}
              isRolling={isRolling}
              collapsed={false}
              onToggleCollapse={() => setShowDicePicker(false)} // Treat toggle collapse as close in overlay mode
            />
          )}

          {showOptions && (
            <RightOptionsPanel
              materialTheme={materialTheme}
              tableTheme={tableTheme}
              onChangeMaterialTheme={setMaterialTheme}
              onChangeTableTheme={setTableTheme}
              shakeSettings={shakeSettings}
              onUpdateShakeSettings={handleUpdateShakeSettings}
              onRequestSensorPermission={handleRequestPermission}
              onSimulateShake={handleSimulateShake}
              collapsed={false}
              onToggleCollapse={() => setShowOptions(false)} // Treat toggle collapse as close in overlay mode
            />
          )}
        </main>
      </div>

      {/* 3. FOOTER ROLL HISTORY ticker */}
      <BottomHistoryBar
        history={history}
        onReroll={(f) => handleExecuteRoll(f)}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
