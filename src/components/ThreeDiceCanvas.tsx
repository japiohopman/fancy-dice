import React, { useEffect, useRef } from 'react';
import {
  DiceBoxDieCompleteResult,
  DiceBoxInstance,
  DiceBoxRollResults,
  RollParsedResult,
  TableTheme,
} from '../types';
import { DiceBoxRollCollector, getExpectedPhysicalDiceCount } from '../lib/diceBoxRollCollector';
import { RollOutcomeOverlay } from './RollOutcomeOverlay';

interface ThreeDiceCanvasProps {
  rollResult: RollParsedResult | null;
  isRolling: boolean;
  materialTheme: string;
  tableTheme: TableTheme;
  diceTheme: string;
  onRollComplete?: (results: DiceBoxRollResults) => string[];
  onRollError?: (error: Error) => void;
}

const DICEBOX_INIT_TIMEOUT_MS = 20_000;
const DICEBOX_ROLL_TIMEOUT_MS = 20_000;

export const ThreeDiceCanvas: React.FC<ThreeDiceCanvasProps> = ({
  rollResult,
  isRolling,
  materialTheme,
  tableTheme,
  diceTheme,
  onRollComplete,
  onRollError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const initializeDiceBoxRef = useRef<(() => void) | null>(null);

  const pendingRollRef = useRef<string[] | null>(null);
  const activeRollCollectorRef = useRef<DiceBoxRollCollector | null>(null);
  const initializationTimeoutRef = useRef<number | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);
  const initializationAttemptRef = useRef(0);
  const hasMarkedDiceBoxInitRef = useRef(false);
  const hasMarkedDiceBoxModuleReadyRef = useRef(false);
  const hasMarkedDiceBoxReadyRef = useRef(false);
  const materialThemeRef = useRef(materialTheme);
  materialThemeRef.current = materialTheme;
  const diceThemeRef = useRef(diceTheme);
  diceThemeRef.current = diceTheme;

  // Keep callbacks current without recreating the DiceBox instance.
  const onRollCompleteRef = useRef<typeof onRollComplete>(onRollComplete);
  const onRollErrorRef = useRef<typeof onRollError>(onRollError);

  useEffect(() => {
    onRollCompleteRef.current = onRollComplete;
  }, [onRollComplete]);

  useEffect(() => {
    onRollErrorRef.current = onRollError;
  }, [onRollError]);

  // Map user materialTheme choice to DiceBox theme color
  const getThemeColor = (theme: string): string => {
    if (theme.startsWith('#')) return theme;
    switch (theme) {
      case 'emerald': return '#059669';
      case 'ruby': return '#d97706';
      case 'gold': return '#f59e0b';
      case 'cyber': return '#06b6d4';
      case 'obsidian': return '#1f2937';
      case 'ivory': return '#fef3c7';
      case 'galaxy': return '#7e22ce';
      default: return '#8c7851';
    }
  };

  // Map table theme to background colors
  const getTableBgClass = (theme: TableTheme): string => {
    switch (theme) {
      case 'green': return 'bg-[#064e3b]';
      case 'blue': return 'bg-[#1e3a8a]';
      case 'crimson': return 'bg-[#881337]';
      case 'dark': return 'bg-[#0f172a]';
      case 'leather': return 'bg-[#451a03]';
      default: return 'bg-[#064e3b]';
    }
  };

  // Helper to extract clean 3D dice notation array from parsed rollResult
  const getDiceNotationArray = (result: RollParsedResult | null): string[] => {
    if (!result || !result.diceGroupResults || result.diceGroupResults.length === 0) {
      return ['1d20'];
    }
    const notations = result.diceGroupResults.map(grp => {
      const type = grp.dieType === 'dfate' ? 'd6' : grp.dieType;
      return `${grp.count}${type}`;
    });
    return notations.length > 0 ? notations : ['1d20'];
  };

  const clearInitializationTimeout = () => {
    if (initializationTimeoutRef.current !== null) {
      window.clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }
  };

  const clearRollTimeout = () => {
    if (rollTimeoutRef.current !== null) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
  };

  /** Discards a failed DiceBox instance so the next user roll can create a fresh engine. */
  const invalidateDiceBox = (box?: DiceBoxInstance): boolean => {
    if (box && diceBoxRef.current !== box) return false;

    const currentBox = diceBoxRef.current;
    initializationAttemptRef.current += 1;
    clearInitializationTimeout();
    clearRollTimeout();
    activeRollCollectorRef.current = null;
    pendingRollRef.current = null;
    diceBoxRef.current = null;
    isInitializedRef.current = false;
    isInitializingRef.current = false;

    if (currentBox) {
      try {
        currentBox.clear();
      } catch {
        // Keep the original engine error; this instance is no longer reusable.
      }
    }
    return true;
  };

  /** Reports asynchronous and synchronous DiceBox failures through one recoverable path. */
  const reportRollError = (error: unknown, box?: DiceBoxInstance) => {
    if (!isMountedRef.current || !invalidateDiceBox(box)) return;
    const normalizedError = error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'The dice engine could not complete the roll.');
    console.error('DiceBox operation failed:', normalizedError);
    onRollErrorRef.current?.(normalizedError);
  };

  /** Finishes a wave only after world completion and every unique die result have arrived. */
  const finishRollWave = (
    box: DiceBoxInstance,
    collector: DiceBoxRollCollector,
    physicalResults: DiceBoxRollResults
  ) => {
    if (!isMountedRef.current || diceBoxRef.current !== box) return;
    if (activeRollCollectorRef.current !== collector) return;

    clearRollTimeout();
    activeRollCollectorRef.current = null;
    const followUpRolls = onRollCompleteRef.current?.(physicalResults) ?? [];
    if (followUpRolls.length > 0) {
      // Start chained explosions only after every callback from this physical wave has settled.
      rollDice(box, followUpRolls);
    }
  };

  /** Collects one completion per distinct DiceBox roll ID, including percentile dice. */
  const handleDieComplete = (box: DiceBoxInstance, die: DiceBoxDieCompleteResult) => {
    if (!isMountedRef.current || diceBoxRef.current !== box) return;
    const collector = activeRollCollectorRef.current;
    if (!collector) return;

    try {
      const physicalResults = collector.add(die);
      if (physicalResults && collector.isWorldComplete) {
        finishRollWave(box, collector, physicalResults);
      }
    } catch (error) {
      reportRollError(error, box);
    }
  };

  /** DiceBox's world callback can precede die callbacks in the non-WebGL renderer. */
  const handleRollWaveComplete = (box: DiceBoxInstance) => {
    if (!isMountedRef.current || diceBoxRef.current !== box) return;
    const collector = activeRollCollectorRef.current;
    if (!collector) return;

    // If physical results are still arriving, the collector completes the wave
    // when its final distinct die event arrives. The roll timeout remains active.
    const physicalResults = collector.markWorldComplete();
    if (!physicalResults) return;

    finishRollWave(box, collector, physicalResults);
  };

  /** Starts one physical wave and waits for every requested die to complete once. */
  const rollDice = (
    box: DiceBoxInstance,
    notations: string[],
    options?: { themeColor?: string }
  ) => {
    try {
      const collector = new DiceBoxRollCollector(getExpectedPhysicalDiceCount(notations));
      activeRollCollectorRef.current = collector;

      clearRollTimeout();
      rollTimeoutRef.current = window.setTimeout(() => {
        if (activeRollCollectorRef.current === collector) {
          reportRollError(
            new Error('DiceBox did not return every physical die. Please try the roll again.'),
            box
          );
        }
      }, DICEBOX_ROLL_TIMEOUT_MS);

      // DiceBox 1.1.4 can resolve this Promise early for percentile dice. The
      // distinct onDieComplete events above are the actual completion barrier.
      void Promise.resolve(box.roll(notations, options)).catch((error: unknown) => {
        if (activeRollCollectorRef.current === collector) reportRollError(error, box);
      });
    } catch (error) {
      reportRollError(error, box);
    }
  };

  // Keep the initializer lifecycle mounted while moving the engine import out of the app entry bundle.
  useEffect(() => {
    isMountedRef.current = true;
    let isDisposed = false;

    const initialize = () => {
      if (isDisposed || !isMountedRef.current || isInitializedRef.current || isInitializingRef.current) return;

      if (diceBoxRef.current) {
        try {
          diceBoxRef.current.clear();
        } catch {
          // The previous instance may already be partially disposed.
        }
        diceBoxRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';

      isInitializingRef.current = true;
      const initializationAttempt = ++initializationAttemptRef.current;
      if (!hasMarkedDiceBoxInitRef.current) {
        hasMarkedDiceBoxInitRef.current = true;
        performance.mark('fancy-dice:dicebox-init-start');
      }

      // Include the lazy module download and WASM startup in the same bounded timeout.
      initializationTimeoutRef.current = window.setTimeout(() => {
        if (isDisposed || initializationAttemptRef.current !== initializationAttempt) return;
        reportRollError(
          new Error('The dice engine did not finish loading or initializing. Check your connection and try again.')
        );
      }, DICEBOX_INIT_TIMEOUT_MS);

      const base = (import.meta as any).env.BASE_URL || '/';
      const resolvedAssetPath = `${base.endsWith('/') ? base : base + '/'}assets/dice-box/`;

      // Keep the physics engine out of the initial app bundle. Fetch it asynchronously
      // after the first render, then retain it through the existing PWA cache strategy.
      void import('@3d-dice/dice-box').then(({ default: DiceBox }) => {
        if (
          isDisposed ||
          !isMountedRef.current ||
          initializationAttemptRef.current !== initializationAttempt
        ) return;

        if (!hasMarkedDiceBoxModuleReadyRef.current) {
          hasMarkedDiceBoxModuleReadyRef.current = true;
          performance.mark('fancy-dice:dicebox-module-ready');
          performance.measure(
            'fancy-dice:dicebox-module-load',
            'fancy-dice:dicebox-init-start',
            'fancy-dice:dicebox-module-ready'
          );
        }

        let box: DiceBoxInstance;
        try {
          box = new DiceBox({
            container: '#dice-canvas-box',
            assetPath: resolvedAssetPath,
            theme: diceThemeRef.current,
            themeColor: getThemeColor(materialThemeRef.current),
            offscreen: false,
            scale: 7,
            enableShadows: true,
            shadowTransparency: 0.7,
            lightIntensity: 1.1,
          }) as unknown as DiceBoxInstance;
        } catch (error) {
          if (initializationAttemptRef.current === initializationAttempt) {
            reportRollError(error);
          }
          return;
        }

        diceBoxRef.current = box;
        try {
          void box.init().then(() => {
            if (
              isDisposed ||
              diceBoxRef.current !== box ||
              initializationAttemptRef.current !== initializationAttempt
            ) return;
            clearInitializationTimeout();
            // Theme controls may change while the lazy module or WASM is loading.
            box.updateConfig({
              theme: diceThemeRef.current,
              themeColor: getThemeColor(materialThemeRef.current),
            });
            isInitializedRef.current = true;
            isInitializingRef.current = false;

            if (!hasMarkedDiceBoxReadyRef.current) {
              hasMarkedDiceBoxReadyRef.current = true;
              performance.mark('fancy-dice:dicebox-ready');
              performance.measure(
                'fancy-dice:dicebox-ready-time',
                'fancy-dice:dicebox-init-start',
                'fancy-dice:dicebox-ready'
              );
            }

            box.onDieComplete = (die: DiceBoxDieCompleteResult) => handleDieComplete(box, die);
            box.onRollComplete = () => handleRollWaveComplete(box);

            const pendingRoll = pendingRollRef.current;
            pendingRollRef.current = null;
            if (pendingRoll) {
              rollDice(box, pendingRoll, { themeColor: getThemeColor(materialThemeRef.current) });
            }
          }).catch((error: unknown) => {
            if (
              isDisposed ||
              diceBoxRef.current !== box ||
              initializationAttemptRef.current !== initializationAttempt
            ) return;
            reportRollError(error, box);
          });
        } catch (error) {
          if (initializationAttemptRef.current === initializationAttempt) {
            reportRollError(error, box);
          }
        }
      }).catch((error: unknown) => {
        if (
          isDisposed ||
          !isMountedRef.current ||
          initializationAttemptRef.current !== initializationAttempt
        ) return;
        reportRollError(error);
      });
    };

    initializeDiceBoxRef.current = initialize;
    // The app has committed its first render; warm the engine asynchronously so
    // the initial UI does not need to wait for DiceBox's code or WASM setup.
    initialize();

    return () => {
      isDisposed = true;
      isMountedRef.current = false;
      initializationAttemptRef.current += 1;
      initializeDiceBoxRef.current = null;
      pendingRollRef.current = null;
      clearInitializationTimeout();
      clearRollTimeout();
      activeRollCollectorRef.current = null;
      if (diceBoxRef.current) {
        try {
          diceBoxRef.current.clear();
        } catch {
          // Ignore cleanup failures while unmounting.
        }
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
      diceBoxRef.current = null;
      isInitializedRef.current = false;
      isInitializingRef.current = false;
    };
  }, []);

  // Update theme color when materialTheme changes
  useEffect(() => {
    if (diceBoxRef.current && isInitializedRef.current) {
      const hexColor = getThemeColor(materialTheme);
      diceBoxRef.current.updateConfig({ themeColor: hexColor });
    }
  }, [materialTheme]);

  // Update theme when diceTheme changes
  useEffect(() => {
    if (diceBoxRef.current && isInitializedRef.current) {
      diceBoxRef.current.updateConfig({ theme: diceTheme });
    }
  }, [diceTheme]);

  // Roll dice when a new rollResult arrives and isRolling is true
  useEffect(() => {
    if (isRolling && rollResult) {
      const notations = getDiceNotationArray(rollResult);

      const box = diceBoxRef.current;
      if (box && isInitializedRef.current) {
        rollDice(box, notations, { themeColor: getThemeColor(materialTheme) });
      } else {
        // Keep one pending request while initialization runs or is retried.
        pendingRollRef.current = notations;
        if (!isInitializingRef.current) initializeDiceBoxRef.current?.();
      }
    }
  }, [rollResult, isRolling]);

  return (
    <div className={`relative w-full h-full overflow-hidden transition-colors duration-500 ${getTableBgClass(tableTheme)}`}>
      <div
        id="dice-canvas-box"
        ref={containerRef}
        className="w-full h-full [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:block cursor-grab active:cursor-grabbing"
      />

      <RollOutcomeOverlay result={rollResult} isRolling={isRolling} />
    </div>
  );
};
