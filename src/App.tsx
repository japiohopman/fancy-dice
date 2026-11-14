import React, { useState, useEffect, useRef } from 'react';
import { DiceBoxRollResults, RollHistoryEntry, RollParsedResult, ShakeSettings, TableTheme } from './types';
import { getPendingExplosionRolls, parseAndRollFormula, updateParsedResultWithPhysicalRolls } from './lib/diceParser';
import { audioManager } from './lib/audioManager';
import { ShakeDetector } from './lib/shakeDetector';
import { ThreeDiceCanvas } from './components/ThreeDiceCanvas';
import { TopNotationBar } from './components/TopNotationBar';
import { DiceBuilderOverlay } from './components/DiceBuilderOverlay';
import { LeftOptionsPanel } from './components/LeftOptionsPanel';
import { RightOptionsPanel } from './components/RightOptionsPanel';
import { BottomHistoryBar } from './components/BottomHistoryBar';
import { BookOpen, Dices, Info, Palette, Pipette, SlidersHorizontal, X } from 'lucide-react';

type MenuSection = 'dice' | 'presets' | 'themes' | 'color' | 'options' | 'about';

/** Owns dice-roll state, navigation state, themes, sensor settings, and history for the app. */
export default function App() {
  const [currentFormula, setCurrentFormula] = useState<string>('1d20');
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RollParsedResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const isRollingRef = useRef<boolean>(false);
  const [rollError, setRollError] = useState<string | null>(null);
  const [isCupShaking, setIsCupShaking] = useState<boolean>(false);
  const [isDiceBuilderOpen, setIsDiceBuilderOpen] = useState<boolean>(false);
  const notationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previousDiceBuilderOpenRef = useRef<boolean>(false);

  // Return focus to the notation summary after the dedicated editor is dismissed.
  useEffect(() => {
    if (previousDiceBuilderOpenRef.current && !isDiceBuilderOpen) {
      notationTriggerRef.current?.focus();
    }
    previousDiceBuilderOpenRef.current = isDiceBuilderOpen;
  }, [isDiceBuilderOpen]);

  // A single menu shell keeps navigation and section content in one predictable place.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMenuMounted, setIsMenuMounted] = useState<boolean>(false);
  const [activeMenuSection, setActiveMenuSection] = useState<MenuSection>('dice');
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previousMenuOpenRef = useRef<boolean>(false);

  /** Opens or closes the unified menu and records the trigger for focus restoration. */
  const toggleMenu = (trigger: HTMLButtonElement) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }

    lastFocusedTriggerRef.current = trigger;
    setIsMenuMounted(true);
    setIsMenuOpen(true);
  };

  /** Closes the menu and returns keyboard focus to its single navigation trigger. */
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Manage keyboard dismissal, initial focus, focus trapping, and focus restoration.
  useEffect(() => {
    if (!isMenuOpen) {
      if (previousMenuOpenRef.current) {
        lastFocusedTriggerRef.current?.focus();
      }
      previousMenuOpenRef.current = false;
      return;
    }

    const dialog = menuDialogRef.current;
    const getFocusableElements = (): HTMLElement[] => {
      if (!dialog) return [];

      const focusableElements: HTMLElement[] = [];
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ).forEach((element: HTMLElement) => {
        if (!element.closest('[hidden]')) {
          focusableElements.push(element);
        }
      });
      return focusableElements;
    };

    getFocusableElements()[0]?.focus();

    const handleMenuKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog?.focus();
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

    window.addEventListener('keydown', handleMenuKeyDown);
    previousMenuOpenRef.current = true;
    return () => window.removeEventListener('keydown', handleMenuKeyDown);
  }, [isMenuOpen]);

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
  const [motionPermissionGranted, setMotionPermissionGranted] = useState<boolean | null>(null);

  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const shakeDetectorRef = useRef<ShakeDetector | null>(null);
  const hasMarkedAppReadyRef = useRef(false);
  const firstRollRequestedRef = useRef(false);
  const firstRollCompletedRef = useRef(false);

  // Expose repeatable browser Performance entries for startup and first-roll comparisons.
  useEffect(() => {
    if (hasMarkedAppReadyRef.current) return;
    hasMarkedAppReadyRef.current = true;
    performance.mark('fancy-dice:app-ready');
    performance.measure('fancy-dice:app-startup', {
      start: 0,
      end: 'fancy-dice:app-ready',
    });
  }, []);

  // Refs to capture active roll state for physical evaluation
  const activePresetNameRef = useRef<string | undefined>(undefined);
  const activeResultRef = useRef<RollParsedResult | null>(null);

  // Sync Audio Mute setting
  useEffect(() => {
    audioManager.setMuted(!shakeSettings.soundEnabled);
  }, [shakeSettings.soundEnabled]);

  // Execute Roll Logic
  /** Validates the formula before audio, state changes, or a physical DiceBox roll begin. */
  const handleExecuteRoll = (formulaToRoll?: string, presetName?: string): boolean => {
    if (isRollingRef.current) return false;

    setRollError(null);
    const formula = (formulaToRoll ?? currentFormula).trim();
    let result: RollParsedResult;

    try {
      result = parseAndRollFormula(formula);
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : 'Invalid dice formula.');
      return false;
    }

    setFormulaError(null);
    if (!firstRollRequestedRef.current && !firstRollCompletedRef.current) {
      firstRollRequestedRef.current = true;
      performance.mark('fancy-dice:first-roll-request');
    }
    setCurrentFormula(formula);
    isRollingRef.current = true;
    setIsRolling(true);

    // Play dice bounce sounds only after the formula has passed validation.
    audioManager.playDiceRollSound(4);

    // Store active context to map physical results when they land.
    activeResultRef.current = result;
    activePresetNameRef.current = presetName;

    // Trigger visual roll of the validated dice structure.
    setCurrentResult(result);
    return true;
  };

  // Shake callbacks always call the latest handler without restarting the motion listener.
  const handleExecuteRollRef = useRef(handleExecuteRoll);
  handleExecuteRollRef.current = handleExecuteRoll;

  /** Release all active roll state after DiceBox reports a failed or invalid roll. */
  const handleRollError = (error: Error) => {
    if (firstRollRequestedRef.current && !firstRollCompletedRef.current) {
      performance.clearMarks('fancy-dice:first-roll-request');
      firstRollRequestedRef.current = false;
    }
    console.error('Dice roll failed:', error);
    activeResultRef.current = null;
    activePresetNameRef.current = undefined;
    isRollingRef.current = false;
    setIsRolling(false);
    setCurrentResult(null);
    setRollError(error.message || 'The dice could not complete this roll. Please try again.');
  };

  /** Reconciles only the physical dice returned by the current DiceBox roll collection. */
  const handleRollComplete = (physicalResults: DiceBoxRollResults): string[] => {
    if (!isRollingRef.current || !activeResultRef.current) return [];

    let updatedResult: RollParsedResult;
    try {
      updatedResult = updateParsedResultWithPhysicalRolls(activeResultRef.current, physicalResults);
    } catch (error) {
      handleRollError(error instanceof Error ? error : new Error('The physical dice result was invalid.'));
      return [];
    }
    activeResultRef.current = updatedResult;

    // A natural maximum starts a new physical DiceBox wave. Do not finalize or
    // record the result until every chained explosion has physically landed.
    const followUpRolls = getPendingExplosionRolls(updatedResult);
    if (followUpRolls.length > 0) {
      return followUpRolls;
    }

    if (firstRollRequestedRef.current && !firstRollCompletedRef.current) {
      firstRollCompletedRef.current = true;
      performance.mark('fancy-dice:first-roll-complete');
      performance.measure(
        'fancy-dice:first-roll',
        'fancy-dice:first-roll-request',
        'fancy-dice:first-roll-complete'
      );
    }

    setCurrentResult(updatedResult);
    isRollingRef.current = false;
    setIsRolling(false);

    if (updatedResult.isCrit) {
      audioManager.playCritSound();
    } else if (updatedResult.isFumble) {
      audioManager.playFumbleSound();
    }

    const newEntry: RollHistoryEntry = {
      id: `history-${Date.now()}`,
      result: updatedResult,
      presetName: activePresetNameRef.current
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));

    activeResultRef.current = null;
    activePresetNameRef.current = undefined;
    return [];
  };

  // Initialize Shake Motion Detector
  useEffect(() => {
    const detector = new ShakeDetector(shakeSettings);
    shakeDetectorRef.current = detector;

    detector.setCallbacks(
      () => {
        handleExecuteRollRef.current();
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
  }, [shakeSettings]);

  /** Stores updated sensor, haptic, and audio preferences and syncs the active detector. */
  const handleUpdateShakeSettings = (newSettings: ShakeSettings) => {
    setShakeSettings(newSettings);
    if (shakeDetectorRef.current) {
      shakeDetectorRef.current.updateSettings(newSettings);
    }
  };

  /** Requests permission for device motion when the platform requires it. */
  const handleRequestPermission = async () => {
    try {
      const granted = shakeDetectorRef.current
        ? await shakeDetectorRef.current.requestPermission()
        : true;
      setMotionPermissionGranted(granted);
      return granted;
    } catch {
      setMotionPermissionGranted(false);
      return false;
    }
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
    <div className="app-shell overflow-hidden bg-[#12100e] text-[#d4c3a1] flex flex-col font-serif select-none">
      {/* Primary navigation and always-visible dice notation controls. */}
      <TopNotationBar
        currentFormula={currentFormula}
        onOpenDiceBuilder={() => setIsDiceBuilderOpen(true)}
        setNotationTrigger={(element) => {
          notationTriggerRef.current = element;
        }}
        onRoll={(f) => {
          handleExecuteRoll(f);
        }}
        isRolling={isRolling}
        onToggleMenu={toggleMenu}
        menuOpen={isMenuOpen}
        diceBuilderOpen={isDiceBuilderOpen}
        formulaError={formulaError ?? rollError}
      />

      {isDiceBuilderOpen && (
        <DiceBuilderOverlay
          currentFormula={currentFormula}
          formulaError={formulaError ?? rollError}
          isRolling={isRolling}
          onFormulaChange={(formula) => {
            setCurrentFormula(formula);
            setFormulaError(null);
            setRollError(null);
          }}
          onRoll={(formula) => handleExecuteRoll(formula)}
          onClose={() => setIsDiceBuilderOpen(false)}
        />
      )}

      {/* The menu floats above the full-width 3D table without resizing it. */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <main className="absolute inset-0 h-full w-full overflow-hidden bg-[#064e3b] shadow-inner">
          <ThreeDiceCanvas
            rollResult={currentResult}
            isRolling={isRolling}
            materialTheme={materialTheme}
            tableTheme={tableTheme}
            diceTheme={diceTheme}
            onRollComplete={handleRollComplete}
            onRollError={handleRollError}
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

        {isMenuMounted && (
        <div
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === 'menu-overlay-fade-out' && !isMenuOpen) {
              setIsMenuMounted(false);
            }
          }}
          className={`absolute inset-0 z-40 p-2 sm:p-3 ${isMenuOpen ? 'menu-overlay-enter' : 'menu-overlay-exit pointer-events-none'}`}
        >
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={closeMenu}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          />

          <div
            id="main-menu"
            ref={menuDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Fantastic Dice menu"
            tabIndex={-1}
            className={`relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#a38c5e]/50 bg-[#1a1613]/95 shadow-2xl backdrop-blur-xl ${isMenuOpen ? 'menu-panel-enter' : 'menu-panel-exit'}`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#3d3329] bg-[#14100e] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Dices className="h-4 w-4 text-[#a38c5e]" aria-hidden="true" />
                <h2 className="font-title text-xs font-bold uppercase tracking-widest text-[#f4ead5]">Menu</h2>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="ui-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Menu sections" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#3d3329] bg-[#181412] p-1.5 no-scrollbar">
              {([
                { id: 'dice', label: 'Dice', Icon: Dices },
                { id: 'presets', label: 'Presets', Icon: BookOpen },
                { id: 'themes', label: 'Themes', Icon: Palette },
                { id: 'color', label: 'Dice Color', Icon: Pipette },
                { id: 'options', label: 'Options', Icon: SlidersHorizontal },
                { id: 'about', label: 'About', Icon: Info },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveMenuSection(id)}
                  aria-current={activeMenuSection === id ? 'page' : undefined}
                  className={`ui-button flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-title font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b] sm:px-3 ${
                    activeMenuSection === id
                      ? 'gold-gradient-bg border-[#a38c5e]/60 text-white shadow-sm'
                      : 'border-transparent text-[#d4c3a1]/65 hover:border-[#8c7851]/50 hover:bg-[#241e1a] hover:text-[#f4ead5]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div hidden={activeMenuSection !== 'dice' && activeMenuSection !== 'presets'} className={`h-full overflow-y-auto p-2 sm:p-3 ${activeMenuSection === 'dice' ? 'menu-section-enter-dice' : activeMenuSection === 'presets' ? 'menu-section-enter-presets' : ''}`}>
                <LeftOptionsPanel
                  onFormulaUpdate={(formula) => {
                    setCurrentFormula(formula);
                    setFormulaError(null);
                    setRollError(null);
                  }}
                  currentFormula={currentFormula}
                  activeTab={activeMenuSection === 'presets' ? 'presets' : 'dice'}
                />
              </div>

              <div hidden={activeMenuSection !== 'themes' && activeMenuSection !== 'color' && activeMenuSection !== 'options'} className={`h-full overflow-y-auto p-2 sm:p-3 ${activeMenuSection === 'themes' ? 'menu-section-enter-themes' : activeMenuSection === 'color' ? 'menu-section-enter-color' : activeMenuSection === 'options' ? 'menu-section-enter-options' : ''}`}>
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
                  sensorPermissionGranted={motionPermissionGranted}
                  onSimulateShake={handleSimulateShake}
                  activeTab={activeMenuSection === 'themes' ? 'theme' : activeMenuSection === 'color' ? 'color' : 'settings'}
                />
              </div>

              <div hidden={activeMenuSection !== 'about'} className={`h-full overflow-y-auto p-4 sm:p-6 ${activeMenuSection === 'about' ? 'menu-section-enter-about' : ''}`}>
                <div className="ui-inset-surface mx-auto flex max-w-xl flex-col gap-3 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[#a38c5e]">
                    <Dices className="h-5 w-5" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold tracking-wide text-[#f4ead5]">Fantastic Dice</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#d4c3a1]/80">
                    A tactile 3D dice roller for tabletop role-playing games. Build custom dice formulas, use quick presets, personalize your dice and table, and roll with physical feedback.
                  </p>
                  <p className="text-[10px] font-title uppercase tracking-wider text-[#8c7851]">
                    Made for your next adventure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Compact one-row roll history. */}
      <BottomHistoryBar
        history={history}
        onReroll={(f) => handleExecuteRoll(f)}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
