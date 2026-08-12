import React, { useEffect, useRef } from 'react';
import DiceBox from '@3d-dice/dice-box';
import { MaterialTheme, RollParsedResult, TableTheme } from '../types';
import { RollOutcomeOverlay } from './RollOutcomeOverlay';

interface ThreeDiceCanvasProps {
  rollResult: RollParsedResult | null;
  isRolling: boolean;
  materialTheme: MaterialTheme;
  tableTheme: TableTheme;
  diceTheme: string;
  onRollComplete?: (results: any) => void;
}

export const ThreeDiceCanvas: React.FC<ThreeDiceCanvasProps> = ({
  rollResult,
  isRolling,
  materialTheme,
  tableTheme,
  diceTheme,
  onRollComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

  const pendingRollRef = useRef<string[] | null>(null);

  // Keep reference to the latest onRollComplete callback to avoid stale closure issues
  const onRollCompleteRef = useRef<typeof onRollComplete>(onRollComplete);

  useEffect(() => {
    onRollCompleteRef.current = onRollComplete;
  }, [onRollComplete]);

  // Map user materialTheme choice to DiceBox theme color
  const getThemeColor = (theme: MaterialTheme): string => {
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

  // Initialize DiceBox instance once
  useEffect(() => {
    // If we've already initialized or are currently initializing, don't trigger another one.
    if (isInitializedRef.current || isInitializingRef.current) return;

    // Ensure we start with a clean div container to avoid duplicate canvas elements
    // if React double-mounts the component during StrictMode or hot reloading.
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    isInitializingRef.current = true;

    const base = (import.meta as any).env.BASE_URL || '/';
    const resolvedAssetPath = `${base.endsWith('/') ? base : base + '/'}assets/dice-box/`;

    const box = new DiceBox({
      container: '#dice-canvas-box',
      assetPath: resolvedAssetPath,
      theme: diceTheme,
      themeColor: getThemeColor(materialTheme),
      offscreen: false, // Run in main thread for reliable rendering
      scale: 6,
      enableShadows: true,
      shadowTransparency: 0.7,
      lightIntensity: 1.1,
    });

    diceBoxRef.current = box;

    box.init().then(() => {
      isInitializedRef.current = true;
      isInitializingRef.current = false;

      box.onRollComplete = (results: any) => {
        if (onRollCompleteRef.current) onRollCompleteRef.current(results);
      };

      // Execute any roll that came in while initializing
      if (pendingRollRef.current) {
        try {
          box.roll(pendingRollRef.current, {
            themeColor: getThemeColor(materialTheme)
          });
        } catch (e) {
          console.error('Failed pending roll:', e);
        }
        pendingRollRef.current = null;
      }
    }).catch((err: any) => {
      console.error('Error initializing DiceBox:', err);
      isInitializingRef.current = false;
    });

    return () => {
      if (diceBoxRef.current) {
        try {
          diceBoxRef.current.clear();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
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

      if (diceBoxRef.current && isInitializedRef.current) {
        try {
          diceBoxRef.current.roll(notations, {
            themeColor: getThemeColor(materialTheme)
          });
        } catch (err) {
          console.error('Failed to trigger 3d-dice roll:', err);
        }
      } else {
        // Queue roll for when init finishes
        pendingRollRef.current = notations;
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

      {/* Floating 3D Physics Badge */}
      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#1a1714]/80 backdrop-blur-md text-[10px] text-[#d4c3a1] border border-[#3d3329] flex items-center gap-1.5 pointer-events-none z-10">
        <span className="w-2 h-2 rounded-full bg-[#8c7851] animate-pulse" />
        <span className="font-semibold font-display tracking-wider">3D AMMO PHYSICS</span>
      </div>

      {/* Auto-Fading Roll Outcome Overlay in the Middle */}
      <RollOutcomeOverlay
        result={rollResult}
        isRolling={isRolling}
      />
    </div>
  );
};
