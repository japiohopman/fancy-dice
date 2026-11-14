import React, { useEffect, useRef, useState } from 'react';
import { Dices, Play, X } from 'lucide-react';
import { LeftOptionsPanel } from './LeftOptionsPanel';

interface DiceBuilderOverlayProps {
  currentFormula: string;
  formulaError?: string | null;
  isRolling: boolean;
  onFormulaChange: (formula: string) => void;
  onRoll: (formula: string) => boolean;
  onClose: () => void;
}

interface ViewportState {
  height: number;
  offsetTop: number;
}

/**
 * A focused, keyboard-aware dice editor. It floats above the table and never
 * changes the size or mount lifecycle of the DiceBox stage beneath it.
 */
export const DiceBuilderOverlay: React.FC<DiceBuilderOverlayProps> = ({
  currentFormula,
  formulaError,
  isRolling,
  onFormulaChange,
  onRoll,
  onClose,
}) => {
  const notationInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState<ViewportState>(() => ({
    height: typeof window === 'undefined' ? 640 : window.visualViewport?.height ?? window.innerHeight,
    offsetTop: typeof window === 'undefined' ? 0 : window.visualViewport?.offsetTop ?? 0,
  }));

  // The visual viewport shrinks when the mobile software keyboard opens.
  useEffect(() => {
    const visualViewport = window.visualViewport;
    const updateViewport = () => {
      setViewport({
        height: Math.round(visualViewport?.height ?? window.innerHeight),
        offsetTop: Math.round(visualViewport?.offsetTop ?? 0),
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  // Focus on mount to bring up the native keyboard on touch devices.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      notationInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Escape dismisses the builder; Tab remains trapped inside the modal.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRoll = () => {
    const formula = currentFormula.trim();
    if (!formula || isRolling) return;

    onFormulaChange(formula);
    if (onRoll(formula)) onClose();
  };

  const panelHeight = Math.min(430, Math.max(180, viewport.height - 16));
  const panelMaxHeight = Math.max(140, viewport.height - 16);

  return (
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-2"
      style={{ top: `${viewport.offsetTop}px`, height: `${viewport.height}px` }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />

      <section
        id="dice-builder-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dice-builder-title"
        tabIndex={-1}
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#a38c5e]/70 bg-[#1a1613]/[98%] shadow-2xl shadow-black/50 backdrop-blur-xl"
        style={{ height: `${panelHeight}px`, maxHeight: `${panelMaxHeight}px`, marginTop: '8px' }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#3d3329] bg-[#14100e] px-3 py-2">
          <div className="flex items-center gap-2">
            <Dices className="h-4 w-4 text-[#c5a66b]" aria-hidden="true" />
            <h2 id="dice-builder-title" className="font-title text-xs font-bold uppercase tracking-widest text-[#f4ead5]">
              Dice Builder
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRoll}
              disabled={isRolling || !currentFormula.trim()}
              className="ui-button ui-button--primary !min-h-8 !py-1.5 px-3 uppercase tracking-wider"
            >
              <Play className="h-3 w-3 fill-current text-amber-200" aria-hidden="true" />
              <span>{isRolling ? 'Rolling…' : 'Roll'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dice builder"
              className="ui-icon-button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-[#3d3329] bg-[#1a1613] px-3 py-2">
          <label className="ui-field flex min-w-0 px-3" htmlFor="dice-builder-notation">
            <Dices className="mr-2 h-3.5 w-3.5 shrink-0 text-[#c5a66b]" aria-hidden="true" />
            <input
              ref={notationInputRef}
              id="dice-builder-notation"
              type="text"
              value={currentFormula}
              onChange={(event) => onFormulaChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleRoll();
                }
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-label="Dice notation"
              aria-invalid={Boolean(formulaError)}
              aria-describedby={formulaError ? 'dice-builder-error' : 'dice-builder-hint'}
              placeholder="e.g. 1d20+5 or 4d6kh3"
              className="w-full min-w-0 bg-transparent text-sm font-mono font-bold tracking-wide text-[#f4ead5] placeholder:text-[#d4c3a1]/35 focus:outline-none"
            />
          </label>
          {formulaError ? (
            <p id="dice-builder-error" role="alert" className="px-1 pt-1 text-[10px] leading-tight text-rose-300">
              {formulaError}
            </p>
          ) : (
            <p id="dice-builder-hint" className="px-1 pt-1 text-[9px] leading-tight text-[#d4c3a1]/50">
              Edit the formula or add dice below. Your roll selection stays in sync with the top bar.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <LeftOptionsPanel
            onFormulaUpdate={onFormulaChange}
            currentFormula={currentFormula}
            activeTab="dice"
            compact
          />
        </div>
      </section>
    </div>
  );
};
