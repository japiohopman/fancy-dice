import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RollParsedResult } from '../types';
import { Trophy, Flame, RotateCcw, X, Share2, Sparkles, AlertCircle } from 'lucide-react';

interface RollResultModalProps {
  result: RollParsedResult | null;
  onClose: () => void;
  onReroll: () => void;
}

export const RollResultModal: React.FC<RollResultModalProps> = ({
  result,
  onClose,
  onReroll
}) => {
  if (!result) return null;

  // Trigger celebratory confetti on Natural 20 or Critical Hit
  useEffect(() => {
    if (result.isCrit) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [result]);

  const handleCopy = () => {
    if (result) {
      const summary = `Fantastic Dice Roll: ${result.rawFormula} => ${result.total}`;
      navigator.clipboard.writeText(summary);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1714]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#1f1b18] border border-[#3d3329] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">

        {/* Background Crit Ambient Glow */}
        {result.isCrit && (
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#8c7851]/20 rounded-full blur-3xl pointer-events-none" />
        )}
        {result.isFumble && (
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-900/30 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#3d3329] pb-3 z-10">
          <div className="flex items-center gap-2">
            {result.isCrit ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8c7851]/30 text-[#f4ead5] font-bold text-xs border border-[#8c7851]">
                <Trophy className="w-4 h-4 text-[#8c7851]" />
                CRITICAL SUCCESS!
              </span>
            ) : result.isFumble ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/30 text-rose-300 font-bold text-xs border border-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                CRITICAL FUMBLE!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-[#d4c3a1] font-medium font-display tracking-wider">
                <Sparkles className="w-4 h-4 text-[#8c7851]" />
                ROLL RESULT
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#2d241e] text-[#d4c3a1] hover:text-[#f4ead5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formula & Total Banner */}
        <div className="flex flex-col items-center justify-center py-4 bg-[#1a1714] rounded-2xl border border-[#3d3329] shadow-inner z-10">
          <span className="text-xs font-mono text-[#d4c3a1]/60 mb-1">{result.rawFormula}</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl sm:text-7xl font-extrabold tracking-tight font-display ${
              result.isCrit
                ? 'text-[#f4ead5]'
                : result.isFumble
                ? 'text-rose-400'
                : 'text-[#f4ead5]'
            }`}>
              {result.total}
            </span>
          </div>
        </div>

        {/* Individual Dice Breakdown */}
        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1 z-10">
          <h4 className="text-xs font-semibold text-[#d4c3a1]/70 uppercase tracking-wider">Breakdown:</h4>

          {result.diceGroupResults.map((grp, gIdx) => (
            <div key={gIdx} className="bg-[#1a1714]/80 rounded-xl p-3 border border-[#3d3329] flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#f4ead5] font-semibold">{grp.count}{grp.dieType}</span>
                <span className="text-[#d4c3a1]/60">Sum: <strong className="text-[#f4ead5]">{grp.sum}</strong></span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {grp.rolls.map((die) => (
                  <div
                    key={die.id}
                    className={`relative px-3 py-1.5 rounded-xl border font-mono font-bold text-sm flex items-center justify-center gap-1 shadow-sm ${
                      die.dropped
                        ? 'bg-[#1a1714] text-[#d4c3a1]/30 border-[#3d3329] line-through opacity-60'
                        : die.isCrit
                        ? 'bg-[#8c7851]/30 text-[#f4ead5] border-[#8c7851]'
                        : die.isFumble
                        ? 'bg-rose-900/30 text-rose-300 border-rose-800'
                        : 'bg-[#2d241e] text-[#f4ead5] border-[#3d3329]'
                    }`}
                  >
                    <span>{die.text}</span>
                    {die.exploded && <Flame className="w-3.5 h-3.5 text-[#8c7851] inline" />}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {result.modifier !== 0 && (
            <div className="flex justify-between items-center text-xs text-[#d4c3a1] bg-[#1a1714]/80 p-2.5 rounded-xl border border-[#3d3329] font-mono">
              <span>Modifier Offset</span>
              <span className="font-bold text-[#f4ead5]">
                {result.modifier >= 0 ? `+${result.modifier}` : result.modifier}
              </span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#3d3329] z-10">
          <button
            onClick={onReroll}
            className="flex-1 py-3 rounded-xl bg-[#8c7851] hover:bg-[#6d5b3d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all font-display tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reroll Formula</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-3 rounded-xl bg-[#2d241e] hover:bg-[#3d3329] text-[#f4ead5] border border-[#3d3329] transition-colors"
            title="Copy roll summary"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
