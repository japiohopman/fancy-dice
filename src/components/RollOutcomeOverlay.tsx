import React, { useEffect, useState } from 'react';
import { RollParsedResult } from '../types';
import { Trophy, Sparkles, AlertTriangle } from 'lucide-react';

interface RollOutcomeOverlayProps {
  result: RollParsedResult | null;
  isRolling: boolean;
  onDismiss?: () => void;
}

export const RollOutcomeOverlay: React.FC<RollOutcomeOverlayProps> = ({
  result,
  isRolling,
  onDismiss
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [fading, setFading] = useState<boolean>(false);

  useEffect(() => {
    if (isRolling) {
      setVisible(false);
      setFading(false);
      return;
    }

    if (result) {
      setVisible(true);
      setFading(false);

      // Auto fade-out timer (3.0 seconds visible, then 0.5s fade animation)
      const timer = setTimeout(() => {
        setFading(true);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, 500);
        return () => clearTimeout(hideTimer);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [result, isRolling]);

  if (!visible || !result || isRolling) return null;

  const handleManualDismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      setFading(false);
      if (onDismiss) onDismiss();
    }, 200);
  };

  // Helper to build friendly dice breakdown string
  const renderBreakdown = () => {
    if (!result.diceGroupResults || result.diceGroupResults.length === 0) {
      return result.rawFormula;
    }

    const groupStrings = result.diceGroupResults.map(grp => {
      if (!grp.rolls || grp.rolls.length === 0) return '';
      const rollVals = grp.rolls.map(r => {
        if (typeof r === 'object' && r !== null) {
          return r.dropped ? `(${r.text || r.value})` : (r.text || r.value);
        }
        return r;
      });
      return `[${rollVals.join(', ')}]`;
    }).filter(Boolean);

    let breakdownStr = groupStrings.join(' + ');
    if (result.modifier > 0) breakdownStr += ` + ${result.modifier}`;
    if (result.modifier < 0) breakdownStr += ` - ${Math.abs(result.modifier)}`;

    return breakdownStr || result.rawFormula;
  };

  return (
    <div
      onClick={handleManualDismiss}
      className={`absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto cursor-pointer transition-opacity duration-500 bg-black/40 backdrop-blur-xs ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`relative max-w-sm w-full mx-auto p-6 sm:p-8 rounded-3xl border-2 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center gap-3 select-none text-center transform transition-transform duration-300 scale-100 ${
          result.isCrit
            ? 'bg-[#1e1913]/95 border-[#f59e0b] shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-bounce-once'
            : result.isFumble
            ? 'bg-[#1d1212]/95 border-rose-700 shadow-[0_0_50px_rgba(225,29,72,0.3)]'
            : 'bg-[#1a1613]/95 border-[#a38c5e] shadow-[0_0_35px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Banner header for Critical Hit / Fumble */}
        {result.isCrit && (
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-title font-black text-xs uppercase tracking-widest animate-pulse">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>NATURAL 20 - CRITICAL HIT!</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        )}

        {result.isFumble && (
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-rose-900/30 border border-rose-600 text-rose-300 font-title font-black text-xs uppercase tracking-widest animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>NATURAL 1 - CRITICAL FUMBLE!</span>
          </div>
        )}

        {/* Formula display */}
        <div className="font-mono text-xs font-bold text-[#a38c5e] uppercase tracking-wider">
          {result.rawFormula}
        </div>

        {/* Grand Total Number Display */}
        <div
          className={`font-black font-display tracking-tight leading-none ${
            result.isCrit
              ? 'text-amber-300 text-shadow-crit text-7xl sm:text-8xl'
              : result.isFumble
              ? 'text-rose-500 text-shadow-fumble text-7xl sm:text-8xl'
              : 'gold-gradient-text text-shadow-gold text-7xl sm:text-8xl'
          }`}
        >
          {result.total}
        </div>

        {/* Detailed Breakdown */}
        <div className="font-mono text-xs text-[#d4c3a1]/80 max-w-xs truncate px-3 py-1 bg-[#12100e]/80 rounded-xl border border-[#3d3329]">
          Breakdown: {renderBreakdown()}
        </div>

        <span className="text-[10px] text-[#8c7851] font-title uppercase tracking-widest mt-1">
          Tap anywhere to dismiss
        </span>
      </div>
    </div>
  );
};
