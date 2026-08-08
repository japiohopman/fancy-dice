import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RollParsedResult } from '../types';
import { Trophy, Flame, AlertCircle, Sparkles, X } from 'lucide-react';

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

      if (result.isCrit) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 }
        });
      }

      // Auto fade-out timer (2.5 seconds visible, then 0.5s fade animation)
      const timer = setTimeout(() => {
        setFading(true);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, 500);
        return () => clearTimeout(hideTimer);
      }, 2500);

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

  return (
    <div
      onClick={handleManualDismiss}
      className={`absolute inset-0 z-30 flex items-center justify-center p-3 pointer-events-auto cursor-pointer transition-all duration-500 ${
        fading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#1f1b18]/90 backdrop-blur-md border border-[#8c7851]/60 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2 max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200 select-none"
      >
        {/* Glow Effects */}
        {result.isCrit && (
          <div className="absolute inset-0 bg-[#8c7851]/20 rounded-2xl blur-xl pointer-events-none animate-pulse" />
        )}
        {result.isFumble && (
          <div className="absolute inset-0 bg-rose-900/30 rounded-2xl blur-xl pointer-events-none" />
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleManualDismiss}
          className="absolute top-2 right-2 p-1 rounded-full bg-[#2d241e] text-[#d4c3a1]/60 hover:text-[#f4ead5] transition-colors"
          title="Close result"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Status */}
        <div className="flex items-center gap-1.5 z-10">
          {result.isCrit ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8c7851]/40 text-[#f4ead5] font-bold text-[11px] border border-[#8c7851]">
              <Trophy className="w-3 h-3 text-[#8c7851]" />
              CRITICAL SUCCESS!
            </span>
          ) : result.isFumble ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-900/40 text-rose-300 font-bold text-[11px] border border-rose-800">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              CRITICAL FUMBLE!
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-[#d4c3a1]/80 font-medium tracking-widest font-display">
              <Sparkles className="w-3 h-3 text-[#8c7851]" />
              RESULT
            </span>
          )}
        </div>

        {/* Big Total */}
        <div className="flex flex-col items-center justify-center my-1 z-10">
          <span className="text-5xl sm:text-6xl font-extrabold font-display tracking-tight text-[#f4ead5] drop-shadow-md">
            {result.total}
          </span>
          <span className="text-xs font-mono text-[#8c7851] font-semibold mt-0.5">
            {result.rawFormula}
          </span>
        </div>

        {/* Compact Individual Dice Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-20 overflow-y-auto w-full pt-1 z-10">
          {result.diceGroupResults.flatMap(grp => grp.rolls).map(die => (
            <span
              key={die.id}
              className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 ${
                die.dropped
                  ? 'bg-[#1a1714] text-[#d4c3a1]/30 border-[#3d3329] line-through'
                  : die.isCrit
                  ? 'bg-[#8c7851]/40 text-[#f4ead5] border-[#8c7851]'
                  : die.isFumble
                  ? 'bg-rose-900/40 text-rose-300 border-rose-800'
                  : 'bg-[#2d241e] text-[#f4ead5] border-[#3d3329]'
              }`}
            >
              {die.text}
              {die.exploded && <Flame className="w-3 h-3 text-[#8c7851] inline" />}
            </span>
          ))}
          {result.modifier !== 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-[#2d241e] text-[#8c7851] border border-[#3d3329] text-xs font-mono font-bold">
              {result.modifier >= 0 ? `+${result.modifier}` : result.modifier}
            </span>
          )}
        </div>

        {/* Tap hint */}
        <span className="text-[9px] uppercase tracking-wider text-[#d4c3a1]/40 pt-1 z-10">
          Tap anywhere to dismiss
        </span>
      </div>
    </div>
  );
};
