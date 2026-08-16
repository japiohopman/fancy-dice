import React, { useState, useEffect, useRef } from 'react';
import { RollHistoryEntry, RollParsedResult, ShakeSettings, TableTheme } from './types';
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

  // Layout Collapsed States for Mobile Side Panels
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);

  // Auto-collapse side panels on small screens (< 768px)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setLeftCollapsed(true);
      setRightCollapsed(true);
    }
  }, []);

  // Customization State
  const [materialTheme, setMaterialTheme] = useState<string>('emerald');
  const [tableTheme, setTableTheme] = useState<TableTheme>('green');
  const [diceTheme, setDiceTheme] = useState<string>('default');

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
      {/* 1. TOP NOTATION & QUICK FORMULA BAR (h-32) */}
      <TopNotationBar
        currentFormula={currentFormula}
        onFormulaChange={setCurrentFormula}
        onRoll={(f) => handleExecuteRoll(f)}
        isRolling={isRolling}
        soundEnabled={shakeSettings.soundEnabled}
        onToggleSound={() => handleUpdateShakeSettings({ ...shakeSettings, soundEnabled: !shakeSettings.soundEnabled })}
        shakeEnabled={shakeSettings.enabled}
      />

      {/* 2. MIDDLE VIEWPORT (LEFT SIDEBAR (w-40) + CENTER 3D CANVAS + RIGHT SIDEBAR (w-40)) */}
      <div className="flex-1 flex w-full h-full min-h-0 relative overflow-hidden">
        {/* Left Option Menu: Dice Selectors & RPG Presets */}
        <LeftOptionsPanel
          onFormulaUpdate={setCurrentFormula}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          currentFormula={currentFormula}
        />

        {/* Center Stage: 3D Physics Dice Box Canvas with Outcome Overlay */}
        <main className="flex-1 h-full relative overflow-hidden bg-[#064e3b] shadow-inner">
          <ThreeDiceCanvas
            rollResult={currentResult}
            isRolling={isRolling}
            materialTheme={materialTheme}
            tableTheme={tableTheme}
            diceTheme={diceTheme}
            onRollComplete={handleRollComplete}
          />
        </main>

        {/* Right Option Menu: Style/Themes & Motion/Audio Settings */}
        <RightOptionsPanel
          materialTheme={materialTheme}
          tableTheme={tableTheme}
          diceTheme={diceTheme}
          onChangeMaterialTheme={setMaterialTheme}
          onChangeTableTheme={setTableTheme}
          onChangeDiceTheme={setDiceTheme}
          shakeSettings={shakeSettings}
          onUpdateShakeSettings={handleUpdateShakeSettings}
          onRequestSensorPermission={handleRequestPermission}
          onSimulateShake={handleSimulateShake}
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
        />
      </div>

      {/* 3. FOOTER ROLL HISTORY ticker (h-32) */}
      <BottomHistoryBar
        history={history}
        onReroll={(f) => handleExecuteRoll(f)}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
