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

/** Owns dice-roll state, navigation state, themes, sensor settings, and history for the app. */
export default function App() {
  const [currentFormula, setCurrentFormula] = useState<string>('1d20');
  const [currentResult, setCurrentResult] = useState<RollParsedResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isCupShaking, setIsCupShaking] = useState<boolean>(false);

  // Drawer selection is independent from the 3D stage: opening a menu never changes
  // the main element's size or remounts the DiceBox canvas.
  const [activeOverlay, setActiveOverlay] = useState<'dice' | 'presets' | 'appearance' | 'options' | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'dice' | 'presets'>('dice');
  const [activeRightTab, setActiveRightTab] = useState<'theme' | 'color' | 'board' | 'settings'>('theme');
  const leftOverlayRef = useRef<HTMLDivElement>(null);
  const rightOverlayRef = useRef<HTMLDivElement>(null);
  const lastFocusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previousOverlayRef = useRef<typeof activeOverlay>(null);

  /** Opens the requested drawer and remembers the navigation button for focus restoration. */
  const openOverlay = (overlay: NonNullable<typeof activeOverlay>, trigger: HTMLButtonElement) => {
    lastFocusedTriggerRef.current = trigger;
    setActiveOverlay(overlay);
  };

  /** Closes the active drawer; focus returns to the navigation button that opened it. */
  const closeOverlay = () => {
    setActiveOverlay(null);
  };

  /** Opens the dice builder drawer. */
  const selectDiceSection = (trigger: HTMLButtonElement) => {
    setActiveLeftTab('dice');
    openOverlay('dice', trigger);
  };

  /** Opens the RPG presets drawer. */
  const selectPresetsSection = (trigger: HTMLButtonElement) => {
    setActiveLeftTab('presets');
    openOverlay('presets', trigger);
  };

  /** Opens the appearance drawer. */
  const selectAppearanceSection = (trigger: HTMLButtonElement) => {
    setActiveRightTab('theme');
    openOverlay('appearance', trigger);
  };

  /** Opens the device and interaction options drawer. */
  const selectOptionsSection = (trigger: HTMLButtonElement) => {
    setActiveRightTab('settings');
    openOverlay('options', trigger);
  };

  // Manage keyboard dismissal, initial focus, focus trapping, and focus restoration.
  useEffect(() => {
    if (!activeOverlay) {
      if (previousOverlayRef.current) {
        lastFocusedTriggerRef.current?.focus();
      }
      previousOverlayRef.current = activeOverlay;
      return;
    }

    const panel = activeOverlay === 'dice' || activeOverlay === 'presets'
      ? leftOverlayRef.current
      : rightOverlayRef.current;

    const getFocusableElements = () => panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(element => !element.hasAttribute('hidden'))
      : [];

    getFocusableElements()[0]?.focus();

    const handleOverlayKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOverlay();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleOverlayKeyDown);
    previousOverlayRef.current = activeOverlay;
    return () => window.removeEventListener('keydown', handleOverlayKeyDown);
  }, [activeOverlay]);

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
  /** Parses the requested formula and starts its physical DiceBox roll. */
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

  /** Maps landed physical dice values into the parsed result and records the completed roll. */
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
      (shakingState: boolean) => {
        setIsCupShaking(shakingState);
      }
    );

    if (shakeSettings.enabled) {
      detector.start();
    }

    return () => {
      detector.stop();
    };
  }, [shakeSettings, currentFormula]);

  /** Stores updated sensor, haptic, and audio preferences and syncs the active detector. */
  const handleUpdateShakeSettings = (newSettings: ShakeSettings) => {
    setShakeSettings(newSettings);
    if (shakeDetectorRef.current) {
      shakeDetectorRef.current.updateSettings(newSettings);
    }
  };

  /** Requests permission for device motion when the platform requires it. */
  const handleRequestPermission = async () => {
    if (shakeDetectorRef.current) {
      return await shakeDetectorRef.current.requestPermission();
    }
    return true;
  };

  /** Runs the shake-to-roll feedback sequence without requiring physical device movement. */
  const handleSimulateShake = () => {
    if (shakeDetectorRef.current) {
      shakeDetectorRef.current.triggerSimulatedShake();
    } else {
      handleExecuteRoll();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#12100e] text-[#d4c3a1] flex flex-col font-serif select-none">
      {/* 1. TOP NOTATION & QUICK FORMULA BAR (h-32) */}
      <TopNotationBar
        currentFormula={currentFormula}
        onFormulaChange={setCurrentFormula}
        onRoll={(f) => handleExecuteRoll(f)}
        isRolling={isRolling}
        onSelectDice={selectDiceSection}
        onSelectPresets={selectPresetsSection}
        onSelectAppearance={selectAppearanceSection}
        onSelectOptions={selectOptionsSection}
        activeOverlay={activeOverlay}
      />

      {/* 2. FULL-WIDTH 3D TABLE WITH DRAWERS LAYERED ABOVE IT */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <main className="absolute inset-0 h-full w-full overflow-hidden bg-[#064e3b] shadow-inner">
          <ThreeDiceCanvas
            rollResult={currentResult}
            isRolling={isRolling}
            materialTheme={materialTheme}
            tableTheme={tableTheme}
            diceTheme={diceTheme}
            onRollComplete={handleRollComplete}
          />

          {/* Cup shaking feedback remains attached to the table, beneath the drawer layer. */}
          {isCupShaking && (
            <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-[#8c7851] bg-[#1f1914]/90 px-4 py-2 shadow-2xl backdrop-blur-md">
              <span className="h-3 w-3 animate-ping rounded-full bg-amber-400" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#f4ead5]">
                Rattling Cup... Set Phone Still on Table to Roll!
              </span>
            </div>
          )}
        </main>

        {activeOverlay && (
          <div className="absolute inset-0 z-40">
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={closeOverlay}
              className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[1px]"
            />

            <div
              id="dice-overlay"
              ref={leftOverlayRef}
              hidden={activeOverlay !== 'dice' && activeOverlay !== 'presets'}
              role="dialog"
              aria-modal="true"
              aria-label={activeOverlay === 'presets' ? 'Presets menu' : 'Dice menu'}
              tabIndex={-1}
              className="overlay-panel-left pointer-events-auto absolute bottom-0 left-0 top-0 w-[min(18rem,calc(100vw-1rem))] max-w-full"
            >
              <LeftOptionsPanel
                onFormulaUpdate={setCurrentFormula}
                onClose={closeOverlay}
                currentFormula={currentFormula}
                activeTab={activeLeftTab}
                onActiveTabChange={setActiveLeftTab}
              />
            </div>

            <div
              id="appearance-overlay"
              ref={rightOverlayRef}
              hidden={activeOverlay !== 'appearance' && activeOverlay !== 'options'}
              role="dialog"
              aria-modal="true"
              aria-label={activeOverlay === 'options' ? 'Options menu' : 'Appearance menu'}
              tabIndex={-1}
              className="overlay-panel-right pointer-events-auto absolute bottom-0 right-0 top-0 w-[min(18rem,calc(100vw-1rem))] max-w-full"
            >
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
                onClose={closeOverlay}
                activeTab={activeRightTab}
                onActiveTabChange={setActiveRightTab}
              />
            </div>
          </div>
        )}
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
