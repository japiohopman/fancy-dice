import React, { useEffect, useState } from 'react';
import { RollParsedResult } from '../types';

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

      // Auto fade-out timer (2.0 seconds visible, then 0.5s fade animation)
      const timer = setTimeout(() => {
        setFading(true);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, 500);
        return () => clearTimeout(hideTimer);
      }, 2000);

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
      className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-auto cursor-pointer transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="text-[120px] sm:text-[160px] font-black font-display text-red-600 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] select-none animate-in zoom-in-95 duration-300"
      >
        {result.total}
      </div>
    </div>
  );
};
