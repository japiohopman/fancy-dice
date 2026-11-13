import React, { useEffect, useRef } from 'react';
import DiceBox from '@3d-dice/dice-box';
import { DiceBoxInstance, DiceBoxRollResults, RollParsedResult, TableTheme } from '../types';
import { isDiceBoxRollResults } from '../lib/diceParser';
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
  const materialThemeRef = useRef(materialTheme);
  materialThemeRef.current = materialTheme;

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

  /** Reports asynchronous and synchronous DiceBox failures through one recoverable path. */
  const reportRollError = (error: unknown) => {
    if (!isMountedRef.current) return;
    pendingRollRef.current = null;
    const normalizedError = error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'The dice engine could not complete the roll.');
    console.error('DiceBox operation failed:', normalizedError);
    onRollErrorRef.current?.(normalizedError);
  };

  /** Starts one DiceBox collection and processes only the physical dice returned by it. */
  const rollDice = (
    box: DiceBoxInstance,
    notations: string[],
    options?: { themeColor?: string }
  ) => {
    try {
      void box.roll(notations, options).then((results: unknown) => {
        if (!isMountedRef.current || diceBoxRef.current !== box) return;
        if (!isDiceBoxRollResults(results)) {
          throw new Error('DiceBox returned an invalid physical roll result. Please try again.');
        }
        const followUpRolls = onRollCompleteRef.current?.(results) ?? [];
        if (followUpRolls.length > 0) {
          // Each follow-up is its own DiceBox collection and returns only its own landed dice.
          rollDice(box, followUpRolls);
        }
      }).catch(reportRollError);
    } catch (error) {
      reportRollError(error);
    }
  };

  // Initialize once, then retry initialization when a later roll arrives after an init failure.
  useEffect(() => {
    isMountedRef.current = true;
    let isDisposed = false;

    const initialize = () => {
      if (isDisposed || isInitializedRef.current || isInitializingRef.current) return;

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
      const base = (import.meta as any).env.BASE_URL || '/';
      const resolvedAssetPath = `${base.endsWith('/') ? base : base + '/'}assets/dice-box/`;

      let box: DiceBoxInstance;
      try {
        box = new DiceBox({
          container: '#dice-canvas-box',
          assetPath: resolvedAssetPath,
          theme: diceTheme,
          themeColor: getThemeColor(materialThemeRef.current),
          offscreen: false,
          scale: 7,
          enableShadows: true,
          shadowTransparency: 0.7,
          lightIntensity: 1.1,
        }) as unknown as DiceBoxInstance;
      } catch (error) {
        isInitializingRef.current = false;
        reportRollError(error);
        return;
      }

      diceBoxRef.current = box;
      try {
        void box.init().then(() => {
          if (isDisposed || diceBoxRef.current !== box) return;
          isInitializedRef.current = true;
          isInitializingRef.current = false;

          const pendingRoll = pendingRollRef.current;
          pendingRollRef.current = null;
          if (pendingRoll) {
            rollDice(box, pendingRoll, { themeColor: getThemeColor(materialThemeRef.current) });
          }
        }).catch((error: unknown) => {
          if (isDisposed || diceBoxRef.current !== box) return;
          isInitializedRef.current = false;
          isInitializingRef.current = false;
          pendingRollRef.current = null;
          try {
            box.clear();
          } catch {
            // Preserve the original initialization error.
          }
          diceBoxRef.current = null;
          reportRollError(error);
        });
      } catch (error) {
        if (diceBoxRef.current === box) diceBoxRef.current = null;
        isInitializingRef.current = false;
        pendingRollRef.current = null;
        reportRollError(error);
      }
    };

    initializeDiceBoxRef.current = initialize;
    initialize();

    return () => {
      isDisposed = true;
      isMountedRef.current = false;
      initializeDiceBoxRef.current = null;
      pendingRollRef.current = null;
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

      {/* Auto-Fading Roll Outcome Overlay in the Middle */}
      <RollOutcomeOverlay
        result={rollResult}
        isRolling={isRolling}
      />
    </div>
  );
};
