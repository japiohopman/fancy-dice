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
import { BookOpen, Dices, Info, Palette, Pipette, SlidersHorizontal, X } from 'lucide-react';

type MenuSection = 'dice' | 'presets' | 'themes' | 'color' | 'options' | 'about';

/** Owns dice-roll state, navigation state, themes, sensor settings, and history for the app. */
export default function App() {
  const [currentFormula, setCurrentFormula] = useState<string>('1d20');
  const [currentResult, setCurrentResult] = useState<RollParsedResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isCupShaking, setIsCupShaking] = useState<boolean>(false);

  // A single menu shell keeps navigation and section content in one predictable place.
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
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

      return Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(element => !element.closest('[hidden]'));
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
      {/* Primary navigation and always-visible dice notation controls. */}
      <TopNotationBar
        currentFormula={currentFormula}
        onFormulaChange={setCurrentFormula}
        onRoll={(f) => handleExecuteRoll(f)}
        isRolling={isRolling}
        onToggleMenu={toggleMenu}
        menuOpen={isMenuOpen}
      />

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

        <div hidden={!isMenuOpen} className="absolute inset-0 z-40 p-2 sm:p-3">
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
            className="relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#a38c5e]/50 bg-[#1a1613]/95 shadow-2xl backdrop-blur-xl"
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
                className="rounded-lg p-1.5 text-[#d4c3a1]/60 transition-colors hover:bg-[#241e1a] hover:text-[#f4ead5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b]"
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
                  className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[9px] font-title font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a66b] sm:px-3 sm:text-[10px] ${
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
              <div hidden={activeMenuSection !== 'dice' && activeMenuSection !== 'presets'} className="h-full overflow-y-auto p-2 sm:p-3">
                <LeftOptionsPanel
                  onFormulaUpdate={setCurrentFormula}
                  currentFormula={currentFormula}
                  activeTab={activeMenuSection === 'presets' ? 'presets' : 'dice'}
                />
              </div>

              <div hidden={activeMenuSection !== 'themes' && activeMenuSection !== 'color' && activeMenuSection !== 'options'} className="h-full overflow-y-auto p-2 sm:p-3">
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
                  activeTab={activeMenuSection === 'themes' ? 'theme' : activeMenuSection === 'color' ? 'color' : 'settings'}
                />
              </div>

              <div hidden={activeMenuSection !== 'about'} className="h-full overflow-y-auto p-4 sm:p-6">
                <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-[#3d3329] bg-[#12100e] p-4 shadow-inner sm:p-5">
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
